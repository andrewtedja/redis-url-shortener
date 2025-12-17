import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello Honos~!");
});

export default app;
