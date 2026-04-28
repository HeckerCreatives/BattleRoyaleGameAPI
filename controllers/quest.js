const { default: mongoose } = require("mongoose");
const { Quest, QuestProgresses } = require("../models/Quest");
const Ads = require("../models/Ads");
const xpUtils = require("../utils/xp");
const leaderboardUtils = require("../utils/leaderboard");
const energyUtils = require("../utils/energy");
const { getsecondsuntilmidnight } = require("../utils/datetime");

const defaultQuests = [
    {
        questid: "QUEST-001",
        title: "Participate in Normal Match",
        description: "Play a normal match.",
        type: "MATCH",
        target: 1,
        rewards: [{ type: "exp", amount: 50 }],
        isSkippable: true,
        isActive: true
    },
    {
        questid: "QUEST-002",
        title: "Win 1 Match",
        description: "Win a normal match.",
        type: "WIN",
        target: 1,
        rewards: [{ type: "exp", amount: 100 }],
        isSkippable: true,
        isActive: true
    },
    {
        questid: "QUEST-003",
        title: "Kill 1 Player",
        description: "Eliminate 1 player in a match.",
        type: "KILL",
        target: 1,
        rewards: [{ type: "leaderboard", amount: 5 }],
        isSkippable: true,
        isActive: true
    },
    {
        questid: "QUEST-004",
        title: "Kill 5 Players",
        description: "Eliminate 5 players in a match.",
        type: "KILL",
        target: 5,
        rewards: [{ type: "leaderboard", amount: 15 }],
        isSkippable: true,
        isActive: true
    },
    {
        questid: "QUEST-005",
        title: "Kill 10 Players",
        description: "Eliminate 10 players in a match.",
        type: "KILL",
        target: 10,
        rewards: [{ type: "leaderboard", amount: 30 }],
        isSkippable: true,
        isActive: true
    },
    {
        questid: "QUEST-006",
        title: "Use Item",
        description: "Use 1 item in a match.",
        type: "USE_ITEM",
        target: 1,
        rewards: [{ type: "exp", amount: 25 }, { type: "leaderboard", amount: 5 }],
        isSkippable: true,
        isActive: true
    }
]

exports.getquests = async (req, res) => {
    const { id } = req.user

    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    // Ensure quests are seeded
    const questCount = await Quest.countDocuments()
    if (questCount === 0) {
        await Quest.insertMany(defaultQuests)
    }

    const activeQuests = await Quest.find({ isActive: true })

    let todayProgress = await QuestProgresses.find({
        owner: new mongoose.Types.ObjectId(id),
        createdAt: { $gte: midnight }
    }).populate("quest")

    const existingQuestIds = new Set(todayProgress.map(p => p.quest._id.toString()))

    const toCreate = activeQuests
        .filter(q => !existingQuestIds.has(q._id.toString()))
        .map(q => ({
            owner: new mongoose.Types.ObjectId(id),
            quest: q._id,
            progress: 0,
            isCompleted: false,
            isClaimed: false,
            isSkipped: false
        }))

    if (toCreate.length > 0) {
        const created = await QuestProgresses.insertMany(toCreate)
        const createdPopulated = await QuestProgresses.find({
            _id: { $in: created.map(c => c._id) }
        }).populate("quest")
        todayProgress = [...todayProgress, ...createdPopulated]
    }

    const quests = todayProgress.map(progress => {
        const questData = progress.toObject()
        if (progress.quest.isSkippable) {
            questData.adsUsed = progress.isSkipped
        }
        return questData
    })

    return res.json({
        message: "success",
        data: {
            resettime: getsecondsuntilmidnight(),
            quests
        }
    })
}

exports.claimreward = async (req, res) => {
    const { id } = req.user
    const { questProgressId } = req.body

    const progress = await QuestProgresses.findOne({
        _id: new mongoose.Types.ObjectId(questProgressId),
        owner: new mongoose.Types.ObjectId(id)
    }).populate("quest")

    if (!progress) {
        return res.status(404).json({ message: "failed", data: "Quest progress not found." })
    }

    if (!progress.isCompleted) {
        return res.status(400).json({ message: "failed", data: "Quest is not yet completed." })
    }

    if (progress.isClaimed) {
        return res.status(400).json({ message: "failed", data: "Reward has already been claimed." })
    }

    if (progress.isSkipped) {
        return res.status(400).json({ message: "failed", data: "Quest has been skipped." })
    }

    for (const reward of progress.quest.rewards) {
        if (reward.type === "exp") await xpUtils.addXP(id, reward.amount)
        if (reward.type === "leaderboard") await leaderboardUtils.addPoints(id, reward.amount)
        if (reward.type === "energy") await energyUtils.updateEnergy(id, reward.amount)
    }

    progress.isClaimed = true
    await progress.save()

    return res.json({ message: "success" })
}

exports.skipquest = async (req, res) => {
    const { id } = req.user
    const { questProgressId } = req.body

    const progress = await QuestProgresses.findOne({
        _id: new mongoose.Types.ObjectId(questProgressId),
        owner: new mongoose.Types.ObjectId(id)
    }).populate("quest")

    if (!progress) {
        return res.status(404).json({ message: "failed", data: "Quest progress not found." })
    }

    if (!progress.quest.isSkippable) {
        return res.status(400).json({ message: "failed", data: "This quest cannot be skipped." })
    }

    if (progress.isCompleted) {
        return res.status(400).json({ message: "failed", data: "Quest is already completed. Claim your reward instead." })
    }

    if (progress.isSkipped) {
        return res.status(400).json({ message: "failed", data: "Quest has already been skipped." })
    }

    if (progress.isClaimed) {
        return res.status(400).json({ message: "failed", data: "Quest reward has already been claimed." })
    }

    // Get the pre-created QUEST_SKIP ad
    const ad = await Ads.findOne({
        questProgressId: progress._id,
        owner: new mongoose.Types.ObjectId(id),
        type: "QUEST_SKIP",
        isClaimed: false
    })

    if (!ad) {
        return res.status(500).json({ message: "failed", data: "Quest skip ad not found." })
    }

    return res.json({ message: "success", data: { adsid: ad._id } })
}
