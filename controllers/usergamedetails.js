const { default: mongoose } = require("mongoose")
const Usergamedetails = require("../models/Usergamedetails")
const Leaderboard = require("../models/Leaderboard")
const Maintenance = require("../models/Maintenance")
const Energy = require("../models/Energy")
const Matchhistory = require("../models/Matchhistory")
const ActiveEffects = require("../models/ActiveEffects")
const {getsecondsuntilmidnight} = require("../utils/datetime")

exports.getusergamedetails = async (req, res) => {
    const {id, username} = req.user
    
    const usergamedata = await Usergamedetails.findOne({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the user game details for ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem getting the user game details"})
    })

    //  step 1: get the leaderboard user amount

    const lbvalue = await Leaderboard.findOne({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the user value leaderboard`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server. Please try again later"})
    })

    //  step 2: get the real rank of user

    const rankvalue = await Leaderboard.countDocuments({amount: {$gte: lbvalue.amount}})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the user rank leaderboard`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server. Please try again later"})
    })

    const energyval = await Energy.findOne({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the user value energy`)
        
        return res.status(400).json({message: "bad-request", data: "There's a problem with the server. Please try again later"})
    })

    console.log(usergamedata)

    const data = {
        kill: usergamedata.kill,
        death: usergamedata.death,
        level: usergamedata.level,
        xp: usergamedata.xp,
        playtime: usergamedata.playtime,
        win: usergamedata.wins ?? 0,
        loss: usergamedata.losses ?? 0,
        userrank: rankvalue,
        energy: energyval.energy,
        leaderboard: lbvalue.amount,
        energyresettime: getsecondsuntilmidnight()
    }

    return res.json({message: "success", data: data})
}

exports.updateusergamedetails = async (req, res) => {

    const {id, username} = req.user

    const { kill, death, rank, playtime, win, loss } = req.body

    console.log(`playtime: ${playtime}    user: ${username}`)

    const usergamedata = await Usergamedetails.findOne({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the user game details for ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem getting the user game details"})
    })

    let level = usergamedata.level

    // Calculate base XP
    let xpearned = ((parseInt(level) / 2) * 3) + (((100 - parseInt(rank) + 1) / 100) * 20) + 
    (parseInt(kill) * ((parseInt(level)/ 4) + 1))

    // Check for active XP effects
    await ActiveEffects.updateMany(
        { 
            owner: new mongoose.Types.ObjectId(id),
            expiresAt: { $lt: new Date() },
            isActive: true
        },
        { isActive: false }
    );

    const activeXPEffect = await ActiveEffects.findOne({
        owner: new mongoose.Types.ObjectId(id),
        type: "potion",
        isActive: true,
        expiresAt: { $gt: new Date() }
    });

    // Apply XP multiplier if active
    if (activeXPEffect) {
        xpearned *= activeXPEffect.multiplier;
    }

    let newxp = usergamedata.xp + xpearned
    let newlevel = level
    let expneeded = 80 * level
    let newKills = usergamedata.kill + kill
    let newDeaths = usergamedata.death + death
    let newPlaytime = usergamedata.playtime + playtime
    let newWin = usergamedata.win + win
    let newLoss = usergamedata.loss + loss

    if (newxp >= expneeded){
        newlevel = level + 1
        newxp = newxp - expneeded
    }

   const data =  await Usergamedetails.findOneAndUpdate(
        {
            owner: new mongoose.Types.ObjectId(id)
        },
        {
            $set: {
                kill: parseInt(newKills),
                death: parseInt(newDeaths),
                level: parseInt(newlevel),
                xp: parseInt(newxp),
                playtime: parseInt(newPlaytime),
                wins: parseInt(newWin),
                losses: parseInt(newLoss)
            }
        }
    )
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem updating the user game details for ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem updating the user game details"})
    })

    await Matchhistory.create({owner: new mongoose.Types.ObjectId(id), kill: kill, placement: rank})
    .catch(err => {
        console.log(`There's a problem creating the user match game history for ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem updating the user match game history"})
    })

    const responseData = {
        ...data.toObject(),
        xpEarned: Math.floor(xpearned),
        multiplierApplied: activeXPEffect ? activeXPEffect.multiplier : 1,
        effectName: activeXPEffect ? activeXPEffect.itemname : null
    };

    return res.json({message: "success", data: responseData})

}

exports.checkingamemaintenance = async (req, res) => {
    const {id} = req.user

    const maintenancedata = await Maintenance.findOne({type: "ingame"})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting maintenance data ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details." })
    })

    if (maintenancedata.value != "0"){
        return res.status(400).json({ message: "bad-request", data: "The in-game map is currently under maintenance! Please check our website for more details and try again later." })
    }

    return res.json({message: "success"})
}

exports.useenergy = async (req, res) => {
    const {id, username} = req.user

    await Energy.findOneAndUpdate({owner: new mongoose.Types.ObjectId(id), energy: {$gt: 0}}, {$inc: { energy: -2}})

    return res.json({message: "success"})
}

exports.refundenergy = async (req, res) => {
    const {id, username} = req.user

    const energydata = await Energy.findOne({owner: new mongoose.Types.ObjectId(id)})

    if (!energydata){
        return res.status(400).json({ message: "failed", data: "There's a problem with your account. Please contact customer support for more details" })
    }

    if (energydata.energy < 10){
        await Energy.findOneAndUpdate({owner: new mongoose.Types.ObjectId(id)}, {$inc: { energy: 1}})
    }

    return res.json({message: "success"})
}

exports.getmatchhistory = async (req, res) => {
    const {id, username} = req.user;

    const {limit} = req.query
    
    const tempdata = await Matchhistory.find({owner: new mongoose.Types.ObjectId(id)})
    .limit(limit)
    .sort({createdAt: -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting match history data ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details." })
    })
    const finaldata = {}
    let index = 0

    tempdata.forEach(data => {
        const {kill, placement, createdAt} = data

        const formattedDate = createdAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: '2-digit'
        });

        finaldata[index] = {
            kill: kill,
            placement: placement,
            date: formattedDate
        }

        index++
    })

    return res.json({message: "success", data: finaldata})
}