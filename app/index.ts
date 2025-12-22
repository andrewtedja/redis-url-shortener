import { Hono } from "hono";
import { redis } from "bun";
import { toBase62 } from "./utils";

/**
 * Plan: bikin base62 converter for id => code (key)
 * KV: code (key) -> url (value)
 * use namespace for everything
 * API: create short url + redirect to original url from code
 * use INCR buat idnya (url:counter)
 * url:counter, url:${code} url:${code}:clicks
 */

// SELF NOTES
// 302 itu temporary (ask server every req)
// 301 itu permanent (browser caches redirect forever)
// Kenapa make 302? -> biar bisa ganti destination, track clicks, etc
// click:  curl -L http://localhost:3000/1
// docker exec -it url-shortener-project-redis-1 redis-cli

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
