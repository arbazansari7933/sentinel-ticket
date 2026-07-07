import redis from "../config/redis";

const LOCK_EXPIRY = 600;
export async function acquireLock(userId, showId, seatIds) {
    const lockedSeatIds=[];
    for (const seatId of seatIds) {
        const key = `show: ${showId}: seat: ${seatId}`;
        const result = await redis.set(key, userId, "EX", LOCK_EXPIRY, "NX");
        //if lock failed 
        if(result===null){
            return {
                success: false,
                lockedSeatIds,
                failedSeatId: seatId,
            }
        }
        //lock aquired
        lockedSeatIds.push(seatId);

        return {
            success: true,
            lockedSeatIds,
        }
        
    }
}

export async function releaseLock() {
    
}

export async function getLockOwner() {
    
}