export function validatePayment(data) {
    const {
        userId,
        showId,
        seatIds,
    } = data;

    if (!userId) {
        throw new Error("User ID is required.");
    }

    if (!showId) {
        throw new Error("Show ID is required.");
    }

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
        throw new Error("At least one seat is required.");
    }
}