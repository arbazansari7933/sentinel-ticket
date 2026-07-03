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

    const result = await client.query(query, values);

    return result.rows;
    
}

export async function getAllShowsRepository(client) {
    //console.log("Repo Reached");

    const query=`
    SELECT id, 
    movie_name, 
    hall_name,
    ticket_price, 
    starts_at,
    ends_at 
    FROM shows
    WHERE starts_at >= CURRENT_TIMESTAMP
    ORDER BY starts_at ASC;
    `;

    const result = await client.query(query);
    //console.log("Repo result: ", result.rows);

    return result.rows;

}

export async function getOneShowRepository(client, show_id) {

    const query = `
    SELECT id, movie_name, ticket_price
    FROM shows
    WHERE id=$1;
    `;

    const result = await client.query(query, [show_id]);
    return result.rows;
    //console.log("Show: ", result.rows);
}

export async function getSeatsRepository(client, show_id) {

    const query=`
    SELECT *
    FROM seats 
    WHERE show_id=$1;
    `;

    const result = await client.query(query, [show_id]);
    //console.log("Show: ", result.rows);
    return result.rows
}



