const { default: mongoose } = require("mongoose");
const Ads = require("../models/Ads")
const { QuestProgresses, Quest } = require("../models/Quest")
const energyUtils = require("../utils/energy");
const xpUtils = require("../utils/xp");
const leaderboardUtils = require("../utils/leaderboard");

exports.getadsdata = async (req, res) => {
    const {id} = req.user

    const now = new Date();

    // Create next midnight
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // next 12:00 AM

    const diffMs = midnight - now; // difference in milliseconds

    let tempads = await Ads.find({owner: new mongoose.Types.ObjectId(id)})

    if (tempads.length <= 0){
        await Ads.create({owner: new mongoose.Types.ObjectId(id), itemid: "ENG-004", itemname: "Energy +10", type: "ENERGY", isClaimed: false})

        tempads.push({owner: new mongoose.Types.ObjectId(id), itemid: "ENG-004", itemname: "Energy +10", type: "ENERGY", isClaimed: false})
    }

    return res.json({message: "success", data: {
        time: Math.floor(diffMs / 1000),
        ads: tempads
    }})
}

exports.givereward = async (req, res) => {
    const {id} = req.user
    const {adsid, type, itemid} = req.body

    // Energy reward
    if (type === "energy") {
        let toadd = 0

        switch (itemid) {
            case "ENG-004":
                toadd = 10;
            break;
        }

        await energyUtils.updateEnergy(id, toadd);
    }

    // Mark ad as claimed if adsid is provided
    if (adsid) {
        await Ads.findOneAndUpdate({_id: new mongoose.Types.ObjectId(adsid)}, {isClaimed: true})
    }

    // Track watch ads quest progress
    const watchAdsQuests = await Quest.find({ type: "WATCH_ADS" })
    if (watchAdsQuests.length > 0) {
        const midnight = new Date()
        midnight.setHours(0, 0, 0, 0)

        for (const watchAdsQuest of watchAdsQuests) {
            let questProgress = await QuestProgresses.findOne({
                owner: new mongoose.Types.ObjectId(id),
                quest: watchAdsQuest._id,
                createdAt: { $gte: midnight }
            })

            if (questProgress) {
                questProgress.progress += 1
                if (questProgress.progress >= watchAdsQuest.target) {
                    questProgress.isCompleted = true
                }
                await questProgress.save()
            }
        }
    }

    return res.json({message: "success"})
}