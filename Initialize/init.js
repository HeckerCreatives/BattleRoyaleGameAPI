const Users = require("../models/Users")
const Guest = require("../models/Guest")
const { Quest } = require("../models/Quest")

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
    },
    {
        questid: "QUEST-007",
        title: "Watch Ads",
        description: "Watch 1 ads.",
        type: "WATCH_ADS",
        target: 1,
        rewards: [{ type: "exp", amount: 30 }],
        isSkippable: false,
        isActive: true
    }
]

exports.gameserverinit = async (username) => {
    // console.log(`logging out all users at init`)
    // await Users.updateMany({}, { $set: { gametoken: "" } })
    // .catch(err => {
    //     console.log(`There's a problem logging out your account. Error ${err}`)
    // })
    // console.log(`success logout all user at init`)

    const guestnumbers = await Guest.find()

    if (guestnumbers.length <= 0){
        console.log(`Starting create guest number instance`)

        await Guest.create({count: 1})

        
        console.log(`done guest number instance creation`)
    }

    const questCount = await Quest.countDocuments()

    if (questCount <= 0) {
        console.log(`Seeding default quests...`)
        await Quest.insertMany(defaultQuests)
        console.log(`Done seeding default quests`)
    }
}