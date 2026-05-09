const mongoose = require("mongoose");

const userGameDetailsSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users"
        },
        kill: {
            type: Number
        },
        death: {
            type: Number
        },
        level: {
            type: Number
        },
        xp: {
            type: Number
        },
        wins: {
            type: Number
        },
        losses: {
            type: Number
        },
        playtime: {
            type: Number,
            default: 0 // in seconds
        }
    },
    {
        timestamps: true
    }
)

userGameDetailsSchema.index({ owner: 1 }, { unique: true });
userGameDetailsSchema.index({ kill: -1, updatedAt: -1 });
userGameDetailsSchema.index({ death: -1, updatedAt: -1 });
userGameDetailsSchema.index({ level: -1 });
userGameDetailsSchema.index({ playtime: -1, updatedAt: -1 });
userGameDetailsSchema.index({ wins: -1, updatedAt: -1 });
userGameDetailsSchema.index({ losses: -1, updatedAt: -1 });

const Usergamedetails = mongoose.model("Usergamedetails", userGameDetailsSchema)
module.exports = Usergamedetails