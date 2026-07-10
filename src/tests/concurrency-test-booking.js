import axios from "axios";

const URL = "http://localhost:3000/payment/pay";

const showId = "c296494b-9cf0-48a4-8b94-1c10cbf540c0";
const seatIds = [
    "470850fa-8253-4801-a176-333fc74a32f6"
];

async function concurrencyTest() {

    const requests = [];

    for (let i = 1; i <= 1000; i++) {

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

        if (result.status === "fulfilled") {

            if (result.value.data.success) {

                success++;
                console.log(`Request ${index + 1}: ✅ ${result.value.data.message}`);

            } else {

                failed++;
                console.log(`Request ${index + 1}: ❌ ${result.value.data.message}`);
                console.log( result.reason.response?.data || result.reason.message );

            }

        } else {

            failed++;
            console.log(`Request ${index + 1}: ❌ ${result.reason.message}`);

        }

    });

    console.log("\n======================================");

    console.log(`Total Requests : ${results.length}`);
    console.log(`Success        : ${success}`);
    console.log(`Failed         : ${failed}`);

    console.log("======================================\n");

}

concurrencyTest();