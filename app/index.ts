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

	const ip = c.req.header("x-forwarded-for") || "127.0.0.1";
	const rateLimitKey = `ratelimit:${ip}`;

	// sliding window limiter
	const now = Date.now();
	const windowS = 60;
	const windowMs = windowS * 1000;
	const windowStart = now - windowMs;
	const maxRequests = 10;

	// remove timestamp older than 60s
	await redis.send("ZREMRANGEBYSCORE", [
		rateLimitKey,
		"0",
		windowStart.toString(),
	]);

	// curr request in window
	const currentCount = (await redis.send("ZCARD", [rateLimitKey])) as number;

	if (currentCount >= maxRequests) {
		const oldestTimestamps = (await redis.send("ZRANGE", [
			rateLimitKey,
			"0",
			"0",
			"WITHSCORES",
		])) as string[];
		const oldestTimestamp = oldestTimestamps[1]
			? parseInt(oldestTimestamps[1])
			: now - windowMs;
		const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

		return c.json(
			{
				error: "Too many requests",
				retryAfter: `${retryAfter} seconds`,
				limit: maxRequests,
				window: windowS.toString() + " seconds",
			},
			429
		);
	}

	// add current req timestamp
	await redis.send("ZADD", [rateLimitKey, now.toString(), now.toString()]);
	await redis.expire(rateLimitKey, 120); // 2 menit

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

	return c.json({
		shortCode,
		shortUrl: `http://localhost:3000/${shortCode}`,
		originalUrl: url,
		expiresIn: expiresIn || null,
		rateLimitRemaining: maxRequests - currentCount - 1,
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
