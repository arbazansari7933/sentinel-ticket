import express from "express";
import adminRoutes from "./routes/admin.routes.js"
import showRoutes from "./routes/show.routes.js"
import bookingRoutes from "./routes/booking.routes.js"
import paymentRoutes from "./routes/payment.routes.js"
import { releaseExpiredSeatHolds } from "./services/expiry.service.js";

const app = express();

app.use(express.json());

app.use("/admin", adminRoutes);
app.use("/shows", showRoutes);
app.use("/bookings", bookingRoutes);
app.use("/payment", paymentRoutes)


app.get("/", (req, res) => {
  res.send("SentinelTicket API is running ");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is healthy"
  });
});

setInterval(async () => {
    try {
        await releaseExpiredSeatHolds();
    } catch (error) {
        console.error("Seat expiry cleanup failed:", error);
    }
}, 30 * 1000);

export default app;