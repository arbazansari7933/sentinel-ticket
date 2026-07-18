import pool from "../config/db.js";

export async function updateSeatsToTemporaryLocked(showId, seatIds) {

    const query = `
    UPDATE seats
    SET status='temporary_locked',
    locked_at=CURRENT_TIMESTAMP
    WHERE show_id=$1
    AND id = ANY($2)
    AND status = 'available'
    RETURNING *`;

    const result = await pool.query(query, [showId, seatIds]);

    return result.rows;
}

export async function updateSeatsToAvailable(client, showId, seatIds) {

    const query = `
    UPDATE seats
    SET status='available',
    locked_at=NULL
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
    SET status='booked',
    locked_at=NULL
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
    } = bookingData;

    const query = `
    INSERT INTO bookings
    (user_id, show_id, payment_status, booking_status, total_amount)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *`;

    const values = [
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

    const values = [];
    const placeholders = [];

    seatIds.forEach((seatId, index) => {
        values.push(bookingId, seatId, ticketPrice);
        placeholders.push(
            `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`
        );
    });

    const query = `
    INSERT INTO booking_seats (booking_id, seat_id, seat_price)
    VALUES ${placeholders.join(",")}
    RETURNING *`;

    const result = await client.query(query, values);
    return result.rows;
}

export async function releaseExpiredSeat() {

    const query = `
    UPDATE seats
    SET status='available'
    WHERE status = 'temporary_locked'
    AND locked_at < NOW() - INTERVAL '10 minutes'
    RETURNING *`;

    const result = await pool.query(query);

    return result.rows;
}

//read only repositories:
export async function getSeatStatus(showId, seatIds) {

    const query = `
    SELECT id, status, locked_at
    FROM seats
    WHERE show_id=$1
    AND id = ANY($2);
    `;

    const result = await pool.query(query, [showId, seatIds]);

    return result.rows;
}

export async function updateSeatStatus(client, showId, seatIds, status) {
    const query = `
        UPDATE seats
        SET status = $3::seat_status,
        locked_at = CASE
        WHEN $3::seat_status = 'available'::seat_status THEN NULL
        ELSE locked_at
        END
        WHERE show_id=$1
        AND id = ANY($2)
        RETURNING *;
    `;

    const result = await client.query(query, [showId, seatIds, status]);

    return result.rows;
}