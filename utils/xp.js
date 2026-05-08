const { default: mongoose } = require("mongoose");
const Usergamedetails = require("../models/Usergamedetails");

exports.addXP = async (userId, amount) => {
    try {
        const ownerId = mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : userId;

        const user = await Usergamedetails.findOne({ owner: ownerId });

        if (!user) {
            throw new Error(`Usergamedetails not found for user ${userId}`);
        }

        const xpAmount = Number(amount);
        if (!Number.isFinite(xpAmount)) {
            throw new Error(`Invalid XP amount: ${amount}`);
        }

        const totalxp = Math.max(0, Number(user.xp || 0) + xpAmount);
        const currentLevel = Math.max(1, Number(user.level || 1));

        // O(1) level-up computation to avoid iterative loops:
        // xp to gain k levels from level L is:
        // 80 * (L + (L+1) + ... + (L+k-1)) = 40 * k * (2L + k - 1)
        // Solve quadratic for maximum integer k where requiredXp <= totalxp.
        const b = (2 * currentLevel) - 1;
        const k = Math.max(
            0,
            Math.floor((-b + Math.sqrt((b * b) + (totalxp / 10))) / 2)
        );

        const spentxp = 40 * k * ((2 * currentLevel) + k - 1);
        const newlevel = currentLevel + k;
        const newxp = totalxp - spentxp;

        const result = await Usergamedetails.findOneAndUpdate(
            { owner: ownerId },
            { $set: { xp: Math.floor(newxp), level: Math.floor(newlevel) } },
            { new: true }
        );

        return result.xp;
    } catch (err) {
        console.error(`Error adding XP for user ${userId}: ${err}`);
        throw err;
    }
};
