const Version = require("../models/Version");


exports.getActiveVersion = async (req, res) => {
    const data = await Version.findOne({ isActive: true })
        .sort({ releaseDate: -1 })
        .exec()
        .catch(err => {
            console.log(`Error fetching active version: ${err}`);
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please try again later." });
        });

    if (!data) {
        return res.status(404).json({ message: "not-found", data: "No active version found." });
    }

    return res.status(200).json({
        message: "success",
        data: {
            id: data._id,
            version: data.version,
            description: data.description,
            releaseDate: data.releaseDate,
            isActive: data.isActive
        }
    });
}
