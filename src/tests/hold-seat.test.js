import request from "supertest";
import app from "../app.js";
import { getSeatStatus, updateSeatStatus } from "../repositories/booking.repository.js";
import { resetSeat } from "./helpers/resetSeat.js";
import pool from "../config/db.js";
import redis from "../config/redis.js";

describe("Hold Seat API", () => {

    const body = {
        userId: "550e8400-e29b-41d4-a716-446655440000",
        showId: "c296494b-9cf0-48a4-8b94-1c10cbf540c0",
        seatIds: [
            "e8234f56-3f19-4c38-94de-9db5d924376b"
        ]
    };

    beforeEach(async () => {
        await resetSeat(body.showId, body.seatIds);
    });

    test("should hold available seat successfully", async () => {

        // call API
        const response = await request(app)
            .post("/bookings/hold")
            .send(body);

        // verify API response
        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Hold Successfully");
        expect(response.body.data).toHaveLength(1);
        // verify PostgreSQL
        const seats = await getSeatStatus(body.showId, body.seatIds);

        expect(seats).toHaveLength(1);
        expect(seats[0].status).toBe("temporary_locked");
        expect(seats[0].locked_at).not.toBeNull();

        //verify redis lock 
        const key = `show:${body.showId}:seat:${body.seatIds[0]}`;
        const lockedUserId = await redis.get(key);
        expect(lockedUserId).toBe(body.userId);
    });
    test("should reject already locked seat", async () => {

        const user1 = {
            userId: "550e8400-e29b-41d4-a716-446655440000",
            showId: body.showId,
            seatIds: body.seatIds
        };

        const user2 = {
            userId: "550e8400-e29b-41d4-a716-446655440001",
            showId: body.showId,
            seatIds: body.seatIds
        };

        // user 1 locks the seat
        const firstResponse = await request(app)
            .post("/bookings/hold")
            .send(user1);

        expect(firstResponse.statusCode).toBe(201);

        // user 2 tries to lock the same seat
        const secondResponse = await request(app)
            .post("/bookings/hold")
            .send(user2);

        expect(secondResponse.statusCode).toBe(400);
        expect(secondResponse.body.success).toBe(false);
        expect(secondResponse.body.message).toBe("Failed to hold seats");

    });

    test("should not hold booked seat", async () => {

        try {
            await updateSeatStatus(pool, body.showId, body.seatIds, "booked");
        } catch (error) {
            console.error(error);
            throw error;
        }
        // call API
        const response = await request(app)
            .post("/bookings/hold")
            .send(body);

        console.log(response.body, response.statusCode);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Failed to hold seats");
    });

});