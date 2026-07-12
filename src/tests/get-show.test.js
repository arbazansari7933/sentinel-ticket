import request from "supertest";
import app from "../app.js";

describe("GetShows API", () => {


    test("GET / should return all available shows", async () => {

        const response = await request(app).get("/shows");
        // console.log(response.statusCode);
        // console.log(response.body);
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("fetched successfully");
        expect(Array.isArray(response.body.data)).toBe(true);

    });
});