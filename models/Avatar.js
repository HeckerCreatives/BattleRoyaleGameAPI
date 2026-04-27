const mongoose = require("mongoose");

const avatarSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true
        },
        equipid: {
            type: String,
            required: true  // AVATAR1, AVATAR2, AVATAR3
        },
    },
    {
        timestamps: true,
    }
);

const Avatar = mongoose.model("Avatar", avatarSchema);

module.exports = Avatar;
