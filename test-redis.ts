import { redis } from "bun";

console.log("Testing REDIS connection =======>\n");

await redis.set("test-key", "Hello Redis!");
console.log("   SET test-key");

const value = await redis.get("test-key");
console.log(`   GET test-key: ${value}`);

const exists = await redis.exists("test-key");
console.log(`   EXISTS test-key: ${exists}`);

//delele test
await redis.del("test-key");
console.log("   DEL test-key");

const gone = await redis.get("test-key");
console.log(`   Verify deleted: ${gone}`);

console.log("\n ALL TESTS PASSED");
