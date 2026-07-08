import { holdSeats } from "../services/booking.service.js";
import { validateBooking } from "../validators/booking.validator.js";

export const holdSeatsController=async(req, res)=>{
    try {
        validateBooking(req.body);
        const result = await holdSeats(req.body);
        if(!result.success){
            return res.status(400).json({
            success: false,
            message: "Failed to hold seats",
            });
        }
        return res.status(201).json({
            success: true,
            message: "Hold Successfully",
            data: result,
        })
    } catch (error) {
        const isValidationError =
            error.message.includes("required") ||
            error.message.includes("invalid");

        return res.status(isValidationError ? 400 : 500).json({
            success: false,
            message: error.message,
        });
    }

}