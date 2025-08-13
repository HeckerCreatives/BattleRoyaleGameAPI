const { default: mongoose } = require("mongoose");
const Leaderboard = require("../models/Leaderboard");
const Usergamedetails = require("../models/Usergamedetails")

exports.getleaderboard = async (req, res) => {
    const {id, username} = req.user

    const lbdata = await Leaderboard.find()
    .populate({
        path: "owner",
        select: "username"
    })
    .limit(50)
    .sort({amount: -1, updatedAt: -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the leaderboard`)
    })

    if (lbdata.length <= 0){
        return res.json({message: "success", data: {
            leaderboard: {}
        }})
    }

    let tempindex = 0;

    const data = {
        leaderboard: {}
    }

    lbdata.forEach(tempdata => {
        const {owner, amount} = tempdata

        data.leaderboard[tempindex] = {
            user: owner?.username || "Unknown",
            amount: amount
        };

        tempindex++;
    })

    return res.json({message: "success", data: data})
}


exports.updateuserleaderboard = async (req, res) => {
    const {id, username} = req.user

    const  { amount } = req.body

   await Leaderboard.findOneAndUpdate(
    {
        owner: new mongoose.Types.ObjectId(id),
    },
    {
        $inc: {
            amount: parseInt(amount)
        }
    })
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem updating the leaderboard data for user: ${username}. Error: ${err}`)
        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details." })
    })

    return res.json({ message: "success" })
}

exports.getkillleaderboard = async (req, res) => {
    const {id, username} = req.user

    const lbdata = await Usergamedetails.find({kill: {$gt: 0}})
    .populate({
        path: "owner",
        select: "username"
    })
    .limit(50)
    .sort({kill: -1, updatedAt: -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the leaderboard`)
    })

    if (lbdata.length <= 0){
        return res.json({message: "success", data: {
            leaderboard: {}
        }})
    }

    let tempindex = 0;

    const data = {
        leaderboard: {}
    }

    lbdata.forEach(tempdata => {
        const {owner, kill} = tempdata

        data.leaderboard[tempindex] = {
            user: owner.username,
            amount: kill
        };

        tempindex++;
    })

    return res.json({message: "success", data: data})
}

exports.getdeathleaderboard = async (req, res) => {
    const {id, username} = req.user

    const lbdata = await Usergamedetails.find({death: {$gt: 0}})
    .populate({
        path: "owner",
        select: "username"
    })
    .limit(50)
    .sort({death: -1, updatedAt: -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the leaderboard`)
    })

    if (lbdata.length <= 0){
        return res.json({message: "success", data: {
            leaderboard: {}
        }})
    }

    let tempindex = 0;

    const data = {
        leaderboard: {}
    }

    lbdata.forEach(tempdata => {
        const {owner, death} = tempdata

        data.leaderboard[tempindex] = {
            user: owner.username,
            amount: death
        };

        tempindex++;
    })

    return res.json({message: "success", data: data})
}

exports.getlevelleaderboard = async (req, res) =>{
    const {id, username} = req.user

    const lbdata = await Usergamedetails.find()
    .populate({
        path: "owner",
        select: "username"
    })
    .limit(50)
    .sort({level: -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the leaderboard`)
    })

    if (lbdata.length <= 0){
        return res.json({message: "success", data: {
            leaderboard: {}
        }})
    }

    let tempindex = 0;

    const data = {
        leaderboard: {}
    }

    lbdata.forEach(tempdata => {
        const {owner, level} = tempdata

        data.leaderboard[tempindex] = {
            user: owner.username,
            amount: level
        };

        tempindex++;
    })

    return res.json({message: "success", data: data})
}