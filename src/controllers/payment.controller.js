import { paymentConfirmService } from "../services/payment.service.js";
import { validatePayment } from "../validators/payment.validator.js";
export async function paymentConfirm(req, res) {
    try {
        validatePayment(req.body);
        const result = await paymentConfirmService(req.body);
        return res.status(200).json(result);
        

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}