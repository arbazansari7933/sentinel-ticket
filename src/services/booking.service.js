import { createBooking, createBookingSeats, getSeatsForUpdate, updateSeatsToTemporaryLocked, updateSeatsToAvailable, updateSeatsToBooked } from "../repositories/booking.repository.js";
import { getOneShowRepository } from "../repositories/show.repository.js";
import { acquireLock, releaseLock, verifyLockOwnership } from "./lock.service.js";
import pool from "../config/db.js";
export async function holdSeats(data) {
    let lockResult;

    const {
        userId,
        showId,
        seatIds,
    } = data;
    try {
        //1: try to aquire redis lock
        lockResult = await acquireLock(userId, showId, seatIds);

        //2: if locking failed clean up and return    
        if (!lockResult.success) {
            return {
                success: false,
                message: "Unable to acquire seat lock.",
            };
        }
        //3: update postgres seats status 
        const updateSeats = await updateSeatsToTemporaryLocked(showId, seatIds);

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
    } catch (error) {
        if (lockResult?.lockedSeatIds?.length > 0) {
            await releaseLock(lockResult.lockedSeatIds, showId);
        } 
        throw error;

    }

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
               console.log("we are here");

            throw new Error("Lock not found");
               console.log("we are here");

        }


        const seats = await getSeatsForUpdate(client, showId, seatIds);
        if (seats.length !== seatIds.length) {
            throw new Error("Seats not found");
        }

        for (const seat of seats) {
            if (seat.status !== "temporary_locked") {
                throw new Error("One or more seats are not temporarily locked.");
            }

        }

        const bookedSeats = await updateSeatsToBooked(client, showId, seatIds);
        if (bookedSeats.length !== seatIds.length) {
            throw new Error("One or more seats not booked.");
        }


        const show = await getOneShowRepository(client, showId);
        const totalAmount = seatIds.length * show.ticket_price;

        const bookingData = {
            user_id: userId,
            show_id: showId,
            payment_status: "completed",
            booking_status: "confirmed",
            total_amount: totalAmount,
        };

        const booking = await createBooking(client, bookingData);

        const bookingSeats = await createBookingSeats(client, booking.id, seatIds, show.ticket_price);

        if (bookingSeats.length !== seatIds.length) {
            throw new Error("Failed to create booking seats.");
        }

        await client.query("COMMIT");

        await releaseLock(seatIds, showId);

        return {
            success: true,
            message: "Ticket booked successfully",
            data: {
                booking,
                bookingSeats
            }
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();

    }
}

export async function cleanupFailedPayment(data) {

    const {
        showId,
        seatIds,
    } = data;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const availableSeats = await updateSeatsToAvailable(
            client,
            showId,
            seatIds
        );
        if (availableSeats.length !== seatIds.length) {
            throw new Error("Failed to release all seats.");
        }

        await client.query("COMMIT");

        await releaseLock(seatIds, showId);

        return {
            success: true,
            message: "Seat hold released successfully.",
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}


