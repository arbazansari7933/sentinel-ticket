import axios from "axios";

const URL = "http://localhost:3000/bookings/hold";

const showId = "c296494b-9cf0-48a4-8b94-1c10cbf540c0";
const seatIds = [
    "165a5771-3d85-468d-b818-3714a19d0e0a"
];

async function concurrencyTest() {

    const requests = [];

    for (let i = 1; i <= 10000; i++) {

        requests.push(
            axios.post(URL, {
                userId: `550e8400-e29b-41d4-a716-446655440000`,
                showId,
                seatIds
            })
        );

    }

    const results = await Promise.allSettled(requests);

    let success = 0;
    let failed = 0;

    console.log("\n========== CONCURRENCY TEST ==========\n");



    results.forEach((result, index) => {
        console.log(`Request ${index + 1}`);

        if (result.status === "fulfilled") {
            console.log(result.value.data);
        } else {
            console.log(result.reason.response?.data || result.reason.message);
        }

        console.log("----------------");
    });

console.log("\n======================================");

console.log(`Total Requests : ${results.length}`);
console.log(`Success        : ${success}`);
console.log(`Failed         : ${failed}`);

console.log("======================================\n");

}

concurrencyTest();