import { Hono } from "hono";
import { redis } from "bun";
import { toBase62 } from "./utils";
import { getConnInfo } from "hono/bun";

const app = new Hono();

// c: context (req, res)

// ================== Health Check ==================
app.get("/", (c) => {
	return c.json({ message: "URL Shortener API", status: "running" });
});

// ================== [POST] /shorten ==================
app.post("/shorten", async (c) => {
	const body = await c.req.json();
	const { url, expiresIn } = body;

	const ip = "127.0.0.1";

	// const connInfo = getConnInfo(c);
	// const ip = connInfo.remote.address || "unknown";

	const rateLimitKey = `ratelimit:${ip}`;
	const requestCount = await redis.incr(rateLimitKey);

	// Validation
	if (!url || typeof url !== "string") {
		return c.json({ error: "URL IS REQUIRED " }, 400);
	}

	if (
		expiresIn !== undefined &&
		(typeof expiresIn !== "number" || expiresIn <= 0)
	) {
		return c.json(
			{ error: "expiresIn must be a positive number (seconds)" },
			400
		);
	}

	// Counter and TTL
	const id = await redis.incr("url:counter");
	const shortCode = toBase62(id);

	if (expiresIn) {
		await redis.set(`url:${shortCode}`, url);
		await redis.set(`url:${shortCode}:clicks`, "0");
		await redis.expire(`url:${shortCode}`, expiresIn);
		await redis.expire(`url:${shortCode}:clicks`, expiresIn);
	} else {
		//no expire
		await redis.set(`url:${shortCode}`, url);
		await redis.set(`url:${shortCode}:clicks`, "0");
	}

	// Rate limit
	if (requestCount === 1) {
		await redis.expire(rateLimitKey, 60);
	}

	if (requestCount > 10) {
		return c.json({ error: "Too many requests. Try again later." }, 429);
	}

	return c.json({
		shortCode,
		shortUrl: `http://localhost:3000/${shortCode}`,
		originalUrl: url,
		expiresIn: expiresIn || null,
	});
});

// ================== [GET] /stats/:code ==================
app.get("/stats/:code", async (c) => {
	const code = c.req.param("code");

	const [url, clicks] = await Promise.all([
		redis.get(`url:${code}`),
		redis.get(`url:${code}:clicks`),
	]);
	if (!url) {
		return c.json({ error: "SHORT URL NOT FOUND" }, 404);
	}
	return c.json({
		shortCode: code,
		originalUrl: url,
		clicks: clicks ? parseInt(clicks) : 0,
	});
});

// ================== TESTER ENDPOINT ==================
app.get("/perf-test", async (c) => {
	await redis.set("perf:ping", "ok");

	// Redis query
	const redisStart = performance.now();
	await redis.get("perf-ping");
	const redisTime = performance.now() - redisStart;

	// External API
	const apiStart = performance.now();
	await fetch("https://api.github.com/users/github");
	const apiTime = performance.now() - apiStart;

	return c.json({
		redis: `${redisTime.toFixed(2)}ms`,
		externalAPI: `${apiTime.toFixed(2)}ms`,
		speedup: `${(apiTime / redisTime).toFixed(0)}x faster`,
	});
});

// ================== [GET] /:code ==================
app.get("/:code", async (c) => {
	const code = c.req.param("code");

	const url = await redis.get(`url:${code}`);
	if (!url) {
		return c.json({ error: "SHORT URL NOT FOUND" }, 404);
	}

	await redis.incr(`url:${code}:clicks`);

	return c.redirect(url, 302);
});

export default app;
