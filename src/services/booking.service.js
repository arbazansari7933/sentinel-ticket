import { createBooking, createBookingSeats, getSeatsForUpdate, updateSeatStatus, updateSeatsToBooked } from "../repositories/booking.repository.js";
import { getOneShowRepository } from "../repositories/show.repository.js";
import { acquireLock, releaseLock, verifyLockOwnership } from "./lock.service.js";
export async function holdSeats(data) {

    const {
        userId,
        showId,
        seatIds,
    } = data;
    //1: try to aquire redis lock
    const lockResult = await acquireLock(userId, showId, seatIds);

    //2: if locking failed clean up and return    
    if (!lockResult.success) {

        return {
            success: false,
            message: "Unable to hold selected seats (Redis)",
        };
    }
    //3: update postgres seats status 
    const updateSeats = await updateSeatStatus(showId, seatIds);

    //4: verify & return response
    if (updateSeats.length !== seatIds.length) {

        await releaseLock(lockResult.lockedSeatIds, showId);
        return {
            success: false,
            message: "Failed to hold all the selected seats",
        };

    }
    //5: success
    return {
        success: true,
        message: "Seats marked (temporary_locked) successfully",
        data: updateSeats,
    };

}

export async function confirmBooking(data) {
    const {
        userId,
        showId,
        seatIds,
    } = data;
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const isLockOwner = await verifyLockOwnership(userId, showId, seatIds);

        if (!isLockOwner) {
            return {
                success: false,
                message: "Seat lock not found or does not belong to this user.",
            };
        }

        const seats = await getSeatsForUpdate(client, showId, seatIds);
        if (seats.length !== seatIds.length) {
            return {
                success: false,
                message: "One or more seats not found.",
            };
        }
        for (const seat of seats) {
            if (seat.status !== "temporary_locked") {
                return {
                    success: false,
                    message: "One or more seats are not temporarily locked.",
                };
            }
        }

        const bookedSeats = await updateSeatsToBooked(client, showId, seatIds);
        if (bookedSeats.length !== seatIds.length) {
            throw new Error("One or more seats not booked.");
        }
        const show = getOneShowRepository(client , showId);
        const totalAmount = seatIds.length*show.ticket_price;

        const bookingData={
        user_id: userId,
        show_id: showId,
        payment_status: "paid",
        booking_status: "confirmed",
        total_amount: totalAmount,
        };

        const booking = await createBooking(client, bookingData);

        await createBookingSeats(client, booking.id, seatIds, show.ticket_price);


        await client.query("COMMIT");

        return {
            success: true,
            message: "Ticket booked successfully",
            data: show,
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();

    }
}


