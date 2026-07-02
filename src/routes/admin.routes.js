import { Router } from "express";
import { createShowController } from "../controllers/admin.controller.js";

const router = Router();

router.post("/shows", createShowController);

export default router;