import app from "./app/index";

const PORT = process.env.PORT || 3000;

console.log(`Server starting on port ${PORT}...`);

export default {
	port: PORT,
	fetch: app.fetch,
};
