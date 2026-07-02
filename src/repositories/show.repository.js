import pool from "../config/db.js"
export async function insertShow(client, showData) {

    const {
        movieName,
        hallName,
        ticketPrice,
        rows,
        seatsPerRow,
        startsAt,
        endsAt
    } = showData;

    const query=`
    INSERT INTO shows
    (movie_name, hall_name, ticket_price, starts_at, ends_at)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *;
    `;

    const values = [
        movieName,
        hallName,
        ticketPrice,
        startsAt,
        endsAt
    ];

    const result = await client.query(query, values);

    return result.rows[0];
}
export async function bulkInsertSeats(client, showId, seats) {
    const values=[];
    const placeholders=[];

    seats.forEach((seat, index)=> {
        values.push(showId, seat.seatLabel);
        placeholders.push(
            `($${index*2+1}, $${index*2+2})`
        );
    });

    const query = `
        INSERT INTO seats (show_id, seat_label)
        VALUES ${placeholders.join(",")}
        RETURNING *;
    `;

    const result = client.query(query, values);

    return result.rows;
    
}