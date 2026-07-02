export function validateCreateShow(data) {
    const {
        movieName,
        hallName,
        ticketPrice,
        rows,
        seatsPerRow,
        startsAt,
        endsAt
    } = data;

    if (!movieName) {
        throw new Error("Movie name is required");
    }
    if (!hallName) {
        throw new Error("Hall name is required");
    }
    if (!ticketPrice || ticketPrice <= 0) {
        throw new Error("Ticket price must be greater than 0");
    }
    if (!rows || rows <= 0) {
        throw new Error("Rows must be greater than 0");
    }

    if (!seatsPerRow || seatsPerRow <= 0) {
        throw new Error("Seats per row must be greater than 0");
    }

    if (!startsAt || !endsAt) {
        throw new Error("Show timings are required");
    }
}