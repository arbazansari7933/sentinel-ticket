import pool from "../config/db.js";
import { getSeats } from "../controllers/show.controllers.js";
import { getAllShowsRepository , getOneShowRepository, getSeatsRepository } from "../repositories/show.repository.js";
export async function getAllShows() {
    //console.log("Services Reached");
    
    const client = await pool.connect()
    try {
        const shows= await getAllShowsRepository(client);
       // console.log("Shows: ", shows);
        return shows;
    } finally{
        client.release();
    }
}
export async function getOneShowService(show_id) {
    
    const client = await pool.connect()
    try {
        await getOneShowRepository(client, show_id);
    } finally{
        client.release();
    }

}

export async function getSeatsService(show_id) {
    
    const client = await pool.connect()
    try {
        await getSeatsRepository(client, show_id);
    } finally{
        client.release();
    }

}
