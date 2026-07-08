import { updateSeatStatus } from "../repositories/booking.repository.js";
import { acquireLock, releaseLock } from "./lock.service.js";
export async function holdSeats(data) {

    const {
        userId,
        showId,
        seatIds,
    } = data;
    //1: try to aquire redis lock
    const lockResult = await acquireLock(userId, showId, seatIds);

    //2: if locking failed clean up and return
    console.log("Redis response: ", lockResult.success);
    
    if (!lockResult.success) {

        return {
            success: false,
            message: "Unable to hold selected seats (Redis)",
        };
    }
    //3: update postgres seats status 
    const updateSeats = await updateSeatStatus(showId, seatIds);
    //4: verify & return response
            console.log("we are at length check", updateSeats.length , seatIds.length);

    if (updateSeats.length !== seatIds.length) {
        
        await releaseLock(lockResult.lockedSeatIds, showId);
        return {
            success: false,
            message: "Failed to hold all the selected seats",
        };

    }
    //5: success
    return {
        success: true,
        message: "Seats marked (temporary_locked) successfully",
        data: updateSeats,
    };

}

