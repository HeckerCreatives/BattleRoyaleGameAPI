const { default: mongoose } = require("mongoose");
const Usergamedetails = require("../models/Usergamedetails");

exports.addXP = async (userId, amount) => {
    try {
        const ownerId = mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : userId;

        const result = await Usergamedetails.findOneAndUpdate(
            { owner: ownerId },
            { $inc: { xp: amount } },
            { new: true }
        );

        if (!result) {
            throw new Error(`Usergamedetails not found for user ${userId}`);
        }

        return result.xp;
    } catch (err) {
        console.error(`Error adding XP for user ${userId}: ${err}`);
        throw err;
    }
};
