import request from "supertest";
import app from "../app.js";

describe("Health API", () => {


    test("GET /health should return server status", async () => {

        const responce = await request(app).get("/health");

        expect(responce.statusCode).toBe(200);
        expect(responce.body).toEqual({
            status: "OK",
            message: "Server is healthy"
        })

    });
});