import { getAllShows, getOneShowService , getSeatsService} from "../services/show.service.js"
export const getShows = async (req, res) => {
    //console.log("Controller reahced");
    
    try {
        const shows = await getAllShows();
        //console.log("Shows from repository:", shows);
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
        await getOneShowService(show_id);
        //console.log("Shows from repository:", shows);
        return res.status(200).json({
            success: true,
            message: "fetched successfully",
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
        await getSeatsService(show_id);
        //console.log("Shows from repository:", shows);
        return res.status(200).json({
            success: true,
            message: "fetched successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}