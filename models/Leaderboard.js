const mongoose = require("mongoose");

const leaderboardSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users"
        },
        amount: {
            type: Number
        }
    },
    {
        timestamps: true
    }
)

leaderboardSchema.index({ amount: -1, updatedAt: -1 });
leaderboardSchema.index({ owner: 1 }, { unique: true });

const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema)
module.exports = Leaderboard