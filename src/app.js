import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("SentinelTicket API is running 🚀");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is healthy"
  });
});

export default app;