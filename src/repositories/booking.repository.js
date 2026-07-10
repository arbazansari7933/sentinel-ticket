import pool from "../config/db.js";

export async function updateSeatsToTemporaryLocked(showId, seatIds) {

    const query = `
    UPDATE seats
    SET status='temporary_locked'
    WHERE show_id=$1
    AND id = ANY($2)
    RETURNING *`;    

    const result = await pool.query(query, [showId, seatIds]);    

    return result.rows;
}

export async function updateSeatsToAvailable(client, showId, seatIds) {

    const query = `
    UPDATE seats
    SET status='available'
    WHERE show_id=$1
    AND id = ANY($2)
    RETURNING *`;    

    const result = await client.query(query, [showId, seatIds]);    

    return result.rows;
}

export async function getSeatsForUpdate(client, showId, seatIds) {
    const query = `
    SELECT *
    FROM seats
    WHERE show_id=$1
    AND id = ANY($2)
    FOR UPDATE`;

    const result = await client.query(query, [showId, seatIds]);
    return result.rows;
}

export async function updateSeatsToBooked(client, showId, seatIds) {
    const query = `
    UPDATE seats
    SET status='booked'
    WHERE show_id=$1
    AND id = ANY($2)
    AND status = 'temporary_locked'
    RETURNING *`; 

    const result = await client.query(query, [showId, seatIds]);    

    return result.rows;
}
export async function createBooking(client, bookingData) {
    const {
        user_id,
        show_id,
        payment_status,
        booking_status,
        total_amount,
    }=bookingData;

    const query=`
    INSERT INTO bookings
    (user_id, show_id, payment_status, booking_status, total_amount)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *`;

    const values=[
        user_id,
        show_id,
        payment_status,
        booking_status,
        total_amount
    ]

    const result = await client.query(query, values);

    return result.rows[0];
}
export async function createBookingSeats(client, bookingId, seatIds, ticketPrice) {

    const values=[];
    const placeholders=[];

    seatIds.forEach((seatId, index) => {
        values.push(bookingId, seatId, ticketPrice);
        placeholders.push(
            `($${index*3+1}, $${index*3+2}, $${index*3+3})`
        );
    });

    const query=`
    INSERT INTO booking_seats (booking_id, seat_id, seat_price)
    VALUES ${placeholders.join(",")}
    RETURNING *`;

    const result = await client.query(query, values);
    return result.rows;
}