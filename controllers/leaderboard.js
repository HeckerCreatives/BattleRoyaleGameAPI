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
    let  {id, username, amount } = req.body

    
    id = req.body.id.join('')
    username = req.body.username.join('')

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

exports.getplaytimeleaderboard = async (req, res) => {
    const {id, username} = req.user
    const lbdata = await Usergamedetails.find({playtime: {$gt: 0}})
    .populate({
        path: "owner",
        select: "username"
    })
    .limit(50)
    .sort({playtime: -1, updatedAt: -1})
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
        const {owner, playtime} = tempdata

        data.leaderboard[tempindex] = {
            user: owner.username,
            amount: playtime
        };
        tempindex++;
    })

    return res.json({message: "success", data: data})
}

exports.getmatchesleaderboard = async (req, res) => {
    const {id, username} = req.user
    const lbdata = await Usergamedetails.find({losses: {$gt: 0}})
    .populate({
        path: "owner",
        select: "username"
    })
    .limit(50)
    .sort({losses: -1, updatedAt: -1})
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
        const {owner, losses} = tempdata

        data.leaderboard[tempindex] = {
            user: owner.username,
            amount: losses
        };
        tempindex++;
    })

    return res.json({message: "success", data: data})
}

exports.getwinsleaderboard = async (req, res) => {
    const {id, username} = req.user
    const lbdata = await Usergamedetails.find({wins: {$gt: 0}})
    .populate({
        path: "owner",
        select: "username"
    })
    .limit(50)
    .sort({wins: -1, updatedAt: -1})
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
        const {owner, wins} = tempdata

        data.leaderboard[tempindex] = {
            user: owner.username,
            amount: wins
        };
        tempindex++;
    })

    return res.json({message: "success", data: data})
}



exports.getleaderboard = async (req, res) => {
    const {id, username} = req.user
    const { page, limit, filter, type } = req.query;

    const leaderboardType = type || 'points';
    const pageLimit = parseInt(limit) || 50;
    const currentPage = parseInt(page) || 1;
    const skip = (currentPage - 1) * pageLimit;

    let lbdata, totalDocuments, amountField;

    // Fetch leaderboard data based on type
    switch(leaderboardType) {
        case 'kills':
            lbdata = await Usergamedetails.find({ kill: { $gt: 0 } })
                .populate({ path: "owner", select: "username" })
                .limit(pageLimit).skip(skip)
                .sort({ kill: -1, updatedAt: -1 });
            totalDocuments = await Usergamedetails.countDocuments({ kill: { $gt: 0 } });
            amountField = 'kill';
            break;

        case 'deaths':
            lbdata = await Usergamedetails.find({ death: { $gt: 0 } })
                .populate({ path: "owner", select: "username" })
                .limit(pageLimit).skip(skip)
                .sort({ death: -1, updatedAt: -1 });
            totalDocuments = await Usergamedetails.countDocuments({ death: { $gt: 0 } });
            amountField = 'death';
            break;

        case 'levels':
            lbdata = await Usergamedetails.find()
                .populate({ path: "owner", select: "username" })
                .limit(pageLimit).skip(skip)
                .sort({ level: -1, updatedAt: -1 });
            totalDocuments = await Usergamedetails.countDocuments();
            amountField = 'level';
            break;

        case 'playtime':
            lbdata = await Usergamedetails.find({ playtime: { $gt: 0 } })
                .populate({ path: "owner", select: "username" })
                .limit(pageLimit).skip(skip)
                .sort({ playtime: -1, updatedAt: -1 });
            totalDocuments = await Usergamedetails.countDocuments({ playtime: { $gt: 0 } });
            amountField = 'playtime';
            break;

        case 'matches':
            lbdata = await Usergamedetails.find({ losses: { $gt: 0 } })
                .populate({ path: "owner", select: "username" })
                .limit(pageLimit).skip(skip)
                .sort({ losses: -1, updatedAt: -1 });
            totalDocuments = await Usergamedetails.countDocuments({ losses: { $gt: 0 } });
            amountField = 'losses';
            break;

        case 'wins':
            lbdata = await Usergamedetails.find({ wins: { $gt: 0 } })
                .populate({ path: "owner", select: "username" })
                .limit(pageLimit).skip(skip)
                .sort({ wins: -1, updatedAt: -1 });
            totalDocuments = await Usergamedetails.countDocuments({ wins: { $gt: 0 } });
            amountField = 'wins';
            break;

        case 'points':
        default:
            // lbdata = await Leaderboard.find()
            //     .populate({ path: "usergamedetails" })
            //     .populate({ path: "owner", select: "username" })
            //     .limit(pageLimit).skip(skip)
            //     .sort({ amount: -1, updatedAt: -1 });

            lbdata = await Leaderboard.aggregate([
                {
                    $lookup: {
                        from: "usergamedetails",
                        localField: "owner",
                        foreignField: "owner",
                        as: "usergamedetails"
                    }
                },
                { $unwind: "$usergamedetails" },
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner"
                    }
                },
                { $unwind: "$owner" }
            ]);
            
            totalDocuments = await Leaderboard.countDocuments();
            amountField = 'amount';
            break;
    }

    const getUserStats = await Usergamedetails.findOne({ owner: new mongoose.Types.ObjectId(id) })
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the user's stats for the leaderboard. Error: ${err}`)
        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details." })
    })

    const userStats = {
        totalWins: getUserStats?.wins || 0,
        totalMatches: getUserStats?.losses || 0,
        playTime: getUserStats?.playtime || 0
    }

    if (!lbdata || lbdata.length <= 0){
        return res.json({message: "success", data: {
            leaderboard: {},
            userStats
        }})
    }

    // Calculate pagination
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    // Build leaderboard response
    const leaderboard = {};
    lbdata.forEach((entry, index) => {
        let matchStats = {
            totalWins: 0,
            totalMatches: 0,
            playTime: 0
        };

        if (type === 'points') {
            matchStats.totalWins = entry.usergamedetails?.wins || 0;
            matchStats.totalMatches = entry.usergamedetails?.losses || 0;
            matchStats.playTime = entry.usergamedetails?.playtime || 0; 
        } else {
            matchStats.totalWins = entry.wins || 0;
            matchStats.totalMatches = entry.losses || 0;
            matchStats.playTime = entry.playtime || 0;
        }
        
        leaderboard[index] = {
            user: entry.owner.username,
            amount: entry[amountField],
            totalWins: matchStats.totalWins,
            totalMatches: matchStats.totalMatches,
            playTime: matchStats.playTime
        };
    });

    return res.json({
        message: "success", 
        data: {
            leaderboard,
            pagination: {
                totalDocuments,
                totalPages,
                currentPage,
                hasNextPage,
                hasPrevPage
            },
            userStats
        }
    })
}