import express from "express";
import { holdSeatsController } from "../controllers/booking.controller.js";

const router = express.Router();

router.post("/hold", holdSeatsController);

export default router;