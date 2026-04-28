const { default: mongoose } = require("mongoose");
const Ads = require("../models/Ads")
const { QuestProgresses } = require("../models/Quest")
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
    if (type == "energy"){
        let toadd = 0

        switch (itemid) {
            case "ENG-004":
                toadd = 10;
            break;
        }

        await energyUtils.updateEnergy(id, toadd);
    }

    // Quest skip reward
    if (type === "questskip"){ 
        const ad = await Ads.findById(new mongoose.Types.ObjectId(adsid))

        if (ad && ad.questProgressId) {
            const progress = await QuestProgresses.findOne({
                _id: ad.questProgressId,
                owner: new mongoose.Types.ObjectId(id)
            }).populate("quest")

            if (progress && !progress.isClaimed && !progress.isSkipped) {
                for (const reward of progress.quest.rewards) {
                    if (reward.type === "exp") await xpUtils.addXP(id, reward.amount)
                    if (reward.type === "leaderboard") await leaderboardUtils.addPoints(id, reward.amount)
                    if (reward.type === "energy") await energyUtils.updateEnergy(id, reward.amount)
                }

                progress.isSkipped = true
                progress.isCompleted = true
                progress.isClaimed = true
                await progress.save()
            }
        }
    }

    await Ads.findOneAndUpdate({_id: new mongoose.Types.ObjectId(adsid)}, {isClaimed: true})

    return res.json({message: "success"})
}