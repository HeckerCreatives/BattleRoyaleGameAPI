const { default: mongoose } = require("mongoose");
const { QuestProgresses } = require("../models/Quest");

const updateQuestProgress = async (userId, type, amount) => {
    if (!amount || amount <= 0) return;

    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    const todayProgress = await QuestProgresses.find({
        owner: new mongoose.Types.ObjectId(userId),
        isCompleted: false,
        isSkipped: false,
        createdAt: { $gte: midnight }
    }).populate("quest");

    const matching = todayProgress.filter(p => p.quest.type === type);

    for (const progress of matching) {
        progress.progress += amount;
        if (progress.progress >= progress.quest.target) {
            progress.progress = progress.quest.target;
            progress.isCompleted = true;
        }
        await progress.save();
    }
};

module.exports = { updateQuestProgress };
