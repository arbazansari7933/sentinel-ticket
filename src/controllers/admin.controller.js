import { validateCreateShow } from "../validators/admin.validator.js"
import { createShow } from "../services/admin.service.js";
export const createShowController = async (req, res) => {
    try {
        validateCreateShow(req.body);
        const result = await createShow(req.body);
        return res.status(201).json(result);
        // return res.status(200).json({
        //     success: true,
        //     message: "Validation passed",
        // });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}