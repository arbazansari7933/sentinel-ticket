import redis from "../config/redis.js";

const LOCK_EXPIRY = 600;
export async function acquireLock(userId, showId, seatIds) {
    const lockedSeatIds=[];
    //console.log("At lock service file ");
    
    for (const seatId of seatIds) {
        //console.log("Inside Loop", seatId);

        const key = `show:${showId}:seat:${seatId}`;
        //console.log("after key, here is key: ", key);
        const result = await redis.set(key, userId, "EX", LOCK_EXPIRY, "NX");
       console.log("SET:", key, result);

const value = await redis.get(key);
console.log("GET:", value);

const ttl = await redis.ttl(key);
console.log("TTL:", ttl);
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
    }
    return {
        success: true,
        lockedSeatIds,
    }
}

export async function releaseLock(lockedSeatIds, showId) {
    const keys=[];
    for (const lockedSeatId of lockedSeatIds) {
        keys.push(`show:${showId}:seat:${lockedSeatId}`);
    }
    console.log("Deleting key:", keys);
    await redis.del(...keys);

    return {
        success: true,
    };
}

export async function getLockOwner(showId, seatId) {

    
}