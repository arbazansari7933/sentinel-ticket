export function validateBooking(data) {
    const {
        userId,
        showId,
        seatIds,
    }=data;
    if (!userId) {
        throw new Error("UserID is required");
    }
    if (!showId) {
        throw new Error("ShowID is required");
    }
    if(!seatIds) {
        throw new Error("SeatsID is required");
    }
    if(!Array.isArray(seatIds)){
        throw new Error("Seats IDs must be an array");
    }
    if(seatIds.length===0){
        throw new Error("At least one seat must be selected");
    }

}