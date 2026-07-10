import { confirmBooking, cleanupFailedPayment} from "./booking.service.js";

export async function paymentConfirmService(data) {
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const paymentSuccess = Math.random() < 0.9;

    if (!paymentSuccess) {
        await cleanupFailedPayment(data);
        return {
            success: false,
            message: "Payment failed",
        };
    }
    const bookingResult = await confirmBooking(data);

    return {
        success: true,
        message: "Payment successful",
        data: bookingResult.data,
    };

}
