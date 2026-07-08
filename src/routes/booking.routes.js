import express from "express";
import { confirmBookingController, holdSeatsController } from "../controllers/booking.controller.js";

const router = express.Router();

router.post("/hold", holdSeatsController);
router.post("/confirm", confirmBookingController)
export default router;