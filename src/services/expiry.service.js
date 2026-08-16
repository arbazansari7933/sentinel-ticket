import { releaseExpiredSeat } from "../repositories/booking.repository.js";

export async function releaseExpiredSeatHolds() {
    const releaseSeats = await releaseExpiredSeat();
    if(releaseSeats.length>0){
        console.log(`Released ${releaseSeats.length} expired seat(s).`);
        
    }
    return releaseSeats;
}
