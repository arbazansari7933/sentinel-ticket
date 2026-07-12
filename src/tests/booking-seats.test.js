import request from "supertest";
import app from "../app.js";
import { resetSeat } from "./helpers/resetSeat.js";
import { getSeatStatus } from "../repositories/booking.repository.js";
import redis from "../config/redis.js";

describe("Payment API", () => {

    const body = {
        userId: "550e8400-e29b-41d4-a716-446655440000",
        showId: "c296494b-9cf0-48a4-8b94-1c10cbf540c0",
        seatIds: [
            "b7facf11-128e-49c4-82b7-8d09c1bd8a93"
        ]
    };

    beforeEach(async () => {
        await resetSeat(body.showId, body.seatIds);
    });

    test("should confirm booking after successful payment", async () => {

        // arrange: hold the seat first
        const holdResponse = await request(app)
            .post("/bookings/hold")
            .send(body);

        expect(holdResponse.statusCode).toBe(201);

        // act
        const paymentResponse = await request(app)
            .post("/payment/pay")
            .send(body);

        // assert API
        expect(paymentResponse.statusCode).toBe(200);
        expect(paymentResponse.body.success).toBe(true);
        expect(paymentResponse.body.message).toBe("Payment successful");

        // assert PostgreSQL
        const seats = await getSeatStatus(body.showId, body.seatIds);

        expect(seats[0].status).toBe("booked");

        // assert Redis
        const key = `show:${body.showId}:seat:${body.seatIds[0]}`;
        const lock = await redis.get(key);

        expect(lock).toBeNull();

    });

});