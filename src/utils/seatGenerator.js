export function generateSeats(rows, seatsPerRow) {
    const seats = [];
    for (let i = 1; i <= rows; i++) {
        const rowLabel = String.fromCharCode(64 + i);
        for (let j = 1; j <= seatsPerRow; j++) {
            seats.push({
                seatLabel: `${rowLabel}${j}`
            });
        }
    }
    return seats
}