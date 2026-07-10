import express from "express";
import { paymentConfirm } from "../controllers/payment.controller.js";
const router = express.Router();

router.post("/pay", paymentConfirm);

export default router;