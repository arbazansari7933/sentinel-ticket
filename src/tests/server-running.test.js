import request from "supertest";
import app from "../app.js";

describe("Server API", () => {


    test("GET / should return server is running...", async () => {

        const response = await request(app).get("/");

        expect(response.statusCode).toBe(200);
        expect(response.text).toBe("SentinelTicket API is running")

    });
});