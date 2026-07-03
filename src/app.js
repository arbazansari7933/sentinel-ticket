import express from "express";
import adminRoutes from "./routes/admin.routes.js"
import showRoutes from "./routes/show.routes.js"
const app = express();

app.use(express.json());

app.use("/admin", adminRoutes);
app.use("/shows", showRoutes);

app.get("/", (req, res) => {
  res.send("SentinelTicket API is running ");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is healthy"
  });
});

export default app;