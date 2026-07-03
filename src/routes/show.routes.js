import { Router } from "express";
import { getShows, getOneShow, getSeats} from "../controllers/show.controller.js";
const router = Router();

router.get("/", getShows);
router.get("/:show_id", getOneShow);
router.get("/:show_id/seats", getSeats);
export default router;