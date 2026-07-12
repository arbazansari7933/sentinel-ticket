import dotenv from "dotenv";
import app from "./app.js";
import pool from "./config/db.js";
import { releaseExpiredSeat } from "./repositories/booking.repository.js";

dotenv.config({
    path: process.env.NODE_ENV === "test"
        ? ".env.test"
        : ".env"
});

const PORT = process.env.PORT || 3000;

async function connectDB() {
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL");
    client.release();
  } catch (error) {
    console.error("Database connection failed");
    console.error(error.message);
    process.exit(1);
  }
}
await connectDB();
setInterval(async () => {
    try {
        await releaseExpiredSeatHolds();
    } catch (error) {
        console.error("Seat expiry cleanup failed:", error);
    }
}, 30 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});