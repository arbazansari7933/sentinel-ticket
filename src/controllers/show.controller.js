import { getAllShows, getOneShowService , getSeatsService} from "../services/show.service.js"
export const getShows = async (req, res) => {
    
    try {
        const shows = await getAllShows();
        return res.status(200).json({
            success: true,
            message: "fetched successfully",
            data: shows,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export const getOneShow = async (req, res) => {
    
    try {
        const {show_id}=req.params;
        const show = await getOneShowService(show_id);

        return res.status(200).json({
            success: true,
            message: "fetched successfully",
            data: show,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
export const getSeats = async (req, res) => {
    
    try {
        const {show_id}=req.params;
        const seat = await getSeatsService(show_id);

        return res.status(200).json({
            success: true,
            message: "fetched successfully",
            data: seat,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}