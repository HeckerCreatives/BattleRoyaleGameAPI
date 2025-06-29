const { default: mongoose } = require("mongoose")
const Usergamedetails = require("../models/Usergamedetails")
const Leaderboard = require("../models/Leaderboard")
const Maintenance = require("../models/Maintenance")
const Energy = require("../models/Energy")
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

    const data = {
        kill: usergamedata.kill,
        death: usergamedata.death,
        level: usergamedata.level,
        xp: usergamedata.xp,
        userrank: rankvalue,
        energy: energyval,
        leaderboard: lbvalue,
        energyresettime: getsecondsuntilmidnight()
    }

    return res.json({message: "success", data: data})
}

exports.updateusergamedetails = async (req, res) => {

    const {id, username} = req.user

    const { kill, death, rank } = req.body
    const usergamedata = await Usergamedetails.findOne({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the user game details for ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem getting the user game details"})
    })

    let level = usergamedata.level


    let xpearned = ((parseInt(level) / 2) * 3) + (((100 - parseInt(rank) + 1) / 100) * 20) + 
    (parseInt(kill) * ((parseInt(level)/ 4) + 1))

    let newxp = usergamedata.xp + xpearned

    let newlevel = level

    let expneeded = 80 * level

    let newKills = usergamedata.kill + kill
    let newDeaths = usergamedata.death + death

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
                xp: parseInt(newxp)
            }
        }
    )
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem updating the user game details for ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem updating the user game details"})
    })


    return res.json({message: "success", data: data})

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