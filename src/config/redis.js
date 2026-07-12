import Redis from "ioredis";

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    lazyConnect: process.env.NODE_ENV === "test"
});

redis.on("connect", () => {
    console.log("Connected to Redis");
});

redis.on("error", (error) => {
    console.error("Redis Connection Error:", error.message);
});

export default redis;