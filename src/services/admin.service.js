import pool from "../config/db.js";
import { insertShow, bulkInsertSeats } from "../repositories/show.repository.js";
import { generateSeats } from "../utils/seatGenerator.js";
export async function createShow(showData) {
    const client = await pool.connect()
    try {
        await client.query("BEGIN");

        //insert show
        const show = await insertShow(client, showData);

        // Generate seats
        const seats=generateSeats(
            showData.rows,
            showData.seatsPerRow
        );
        
        // bulk insert seats
        await bulkInsertSeats(client, show.id, seats);

        await client.query("COMMIT");

        return {
            success: true,
            message: "Show created successfully",
            data: show,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();

    }
}