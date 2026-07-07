import { updateSeatStatus } from "../repositories/booking.repository.js";
import { acquireLock, releaseLock } from "./lock.service.js";
export async function holdSeats(data) {
    try {
        const {
        userId,
        showId,
        seatIds,
    }=data;
    //1: try to aquire redis lock
    const lockResult = await acquireLock(userId, showId, seatIds);

    //2: if locking failed clean up and return
    if(!lockResult.success){
        if(lockResult.lockedSeatIds?.length > 0){
            await releaseLock(lockResult.lockedSeatIds);
        }

        return {
            success: false,
            message: "Unable to hold selected seats (Redis)",
        };
    }
    //3: update postgres seats status 
    const result = await updateSeatStatus(showId, seatIds);
    //4: return response
    return {
            success: true,
            message: "Seats marked (temporary_locked) successfully",
            data: result,
        };
    } catch (error) {
        throw error;

    }
}

