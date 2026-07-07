export function validateBooking(data) {
    const {
        userId,
        showId,
        seatsIds,
    }=data;
    if (!userId) {
        throw new Error("UserID is required");
    }
    if (!showId) {
        throw new Error("ShowID is required");
    }
    if(!seatsIds) {
        throw new Error("SeatsID is required");
    }
    if(!Array.isArray(seatsIds)){
        throw new Error("Seats IDs must be an array");
    }
    if(seatsIds.length===0){
        throw new Error("At least one seat must be selected");
    }

}