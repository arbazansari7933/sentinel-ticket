import pool from "../config/db.js";

export async function updateSeatStatus(showId, seatIds) {
    console.log("we are at update status function (repository file): ",showId, seatIds);

    const query = `UPDATE seats
    SET status='temporary_locked'
    WHERE show_id=$1
    AND id = ANY($2)
    RETURNING *`;

    console.log("Query is: ", query);
    

    const result = await pool.query(query, [showId, seatIds]);
    console.log(" PSQL result: ", result);
    

    return result.rows;
}