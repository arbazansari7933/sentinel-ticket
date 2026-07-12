import pool from "../../config/db.js";
import redis from "../../config/redis.js";
import { releaseLock } from "../../services/lock.service.js";
import { updateSeatsToAvailable } from "../../repositories/booking.repository.js";

export async function resetSeat(showId, seatIds) {

    // reset PostgreSQL
    await updateSeatsToAvailable(pool, showId, seatIds);
    // reset redis
    releaseLock(seatIds, showId)


}