const { default: mongoose } = require("mongoose");
const Season = require("../models/Season");

exports.getcurrentseason = async (req, res) => {
    const {id, username} = req.user

    const currentSeason = await Season.findOne({ status: "active" })
    .then(data => data)
    .catch(err => {
        console.log(`Error getting current season: ${err}`);
        return null;
    });

    return res.json({message: "success", data: currentSeason.title})
};
