const { default: mongoose } = require("mongoose");
const Leaderboard = require("../models/Leaderboard");
const Energy = require("../models/Energy")
const Usergamedetails = require("../models/Usergamedetails")
const Matchhistory = require("../models/Matchhistory")
const cache = require("../utils/cache")

const LB_CACHE_TTL = 60_000; // 60 seconds

exports.updateuserleaderboard = async (req, res) => {
    let  {id, username, amount } = req.body

    
    id = req.body.id.join('')
    username = req.body.username.join('')

    const tempenergy = await Energy.findOne({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the user energy details for ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem getting the user energy details"})
    })
    
    if (tempenergy.energy <= 0){
        amount = 0;
    }

    console.log()

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

    cache.delByPrefix('lb:points');
    return res.json({ message: "success" })
}

exports.getkillleaderboard = async (req, res) => {
    const cacheKey = 'lb:kills:simple';
    let cached = cache.get(cacheKey);

    if (!cached) {
        const lbdata = await Usergamedetails.find({ kill: { $gt: 0 } })
            .populate({ path: "owner", select: "username" })
            .sort({ kill: -1, updatedAt: -1 })
            .limit(50)
            .lean();

        if (!lbdata || lbdata.length === 0)
            return res.json({ message: "success", data: { leaderboard: {} } });

        const leaderboard = {};
        lbdata.forEach((entry, i) => { leaderboard[i] = { user: entry.owner.username, amount: entry.kill }; });

        cached = { leaderboard };
        cache.set(cacheKey, cached, LB_CACHE_TTL);
    }

    return res.json({ message: "success", data: cached });
}

exports.getdeathleaderboard = async (req, res) => {
    const cacheKey = 'lb:deaths:simple';
    let cached = cache.get(cacheKey);

    if (!cached) {
        const lbdata = await Usergamedetails.find({ death: { $gt: 0 } })
            .populate({ path: "owner", select: "username" })
            .sort({ death: -1, updatedAt: -1 })
            .limit(50)
            .lean();

        if (!lbdata || lbdata.length === 0)
            return res.json({ message: "success", data: { leaderboard: {} } });

        const leaderboard = {};
        lbdata.forEach((entry, i) => { leaderboard[i] = { user: entry.owner.username, amount: entry.death }; });

        cached = { leaderboard };
        cache.set(cacheKey, cached, LB_CACHE_TTL);
    }

    return res.json({ message: "success", data: cached });
}

exports.getlevelleaderboard = async (req, res) => {
    const cacheKey = 'lb:levels:simple';
    let cached = cache.get(cacheKey);

    if (!cached) {
        const lbdata = await Usergamedetails.find()
            .populate({ path: "owner", select: "username" })
            .sort({ level: -1 })
            .limit(50)
            .lean();

        if (!lbdata || lbdata.length === 0)
            return res.json({ message: "success", data: { leaderboard: {} } });

        const leaderboard = {};
        lbdata.forEach((entry, i) => { leaderboard[i] = { user: entry.owner.username, amount: entry.level }; });

        cached = { leaderboard };
        cache.set(cacheKey, cached, LB_CACHE_TTL);
    }

    return res.json({ message: "success", data: cached });
}

exports.getplaytimeleaderboard = async (req, res) => {
    const cacheKey = 'lb:playtime:simple';
    let cached = cache.get(cacheKey);

    if (!cached) {
        const lbdata = await Usergamedetails.find({ playtime: { $gt: 0 } })
            .populate({ path: "owner", select: "username" })
            .sort({ playtime: -1, updatedAt: -1 })
            .limit(50)
            .lean();

        if (!lbdata || lbdata.length === 0)
            return res.json({ message: "success", data: { leaderboard: {} } });

        const leaderboard = {};
        lbdata.forEach((entry, i) => { leaderboard[i] = { user: entry.owner.username, amount: entry.playtime }; });

        cached = { leaderboard };
        cache.set(cacheKey, cached, LB_CACHE_TTL);
    }

    return res.json({ message: "success", data: cached });
}

exports.getmatchesleaderboard = async (req, res) => {
    const cacheKey = 'lb:matches:simple';
    let cached = cache.get(cacheKey);

    if (!cached) {
        const lbdata = await Matchhistory.aggregate([
            { $group: { _id: "$owner", amount: { $sum: 1 } } },
            { $sort: { amount: -1 } },
            { $limit: 50 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            { $unwind: "$owner" },
            { $project: { amount: 1, "owner.username": 1 } }
        ]);

        if (!lbdata || lbdata.length === 0)
            return res.json({ message: "success", data: { leaderboard: {} } });

        const leaderboard = {};
        lbdata.forEach((entry, i) => { leaderboard[i] = { user: entry.owner.username, amount: entry.amount }; });

        cached = { leaderboard };
        cache.set(cacheKey, cached, LB_CACHE_TTL);
    }

    return res.json({ message: "success", data: cached });
}

exports.getwinsleaderboard = async (req, res) => {
    const cacheKey = 'lb:wins:simple';
    let cached = cache.get(cacheKey);

    if (!cached) {
        const lbdata = await Usergamedetails.find({ wins: { $gt: 0 } })
            .populate({ path: "owner", select: "username" })
            .sort({ wins: -1, updatedAt: -1 })
            .limit(50)
            .lean();

        if (!lbdata || lbdata.length === 0)
            return res.json({ message: "success", data: { leaderboard: {} } });

        const leaderboard = {};
        lbdata.forEach((entry, i) => { leaderboard[i] = { user: entry.owner.username, amount: entry.wins }; });

        cached = { leaderboard };
        cache.set(cacheKey, cached, LB_CACHE_TTL);
    }

    return res.json({ message: "success", data: cached });
}

exports.getleaderboard = async (req, res) => {
    const { id } = req.user;
    const { page, limit, type } = req.query;

    const leaderboardType = type || 'points';
    const pageLimit = parseInt(limit) || 50;
    const currentPage = parseInt(page) || 1;
    const skip = (currentPage - 1) * pageLimit;

    const cacheKey = `lb:${leaderboardType}:${currentPage}:${pageLimit}`;

    // userStats is always fetched live — it's per-user and cheap with the owner index
    const userStatsPromise = Usergamedetails
        .findOne({ owner: new mongoose.Types.ObjectId(id) })
        .lean();

    let cached = cache.get(cacheKey);

    if (!cached) {
        let lbPromise, countPromise, amountField;

        switch (leaderboardType) {
            case 'kills':
                lbPromise = Usergamedetails.find({ kill: { $gt: 0 } })
                    .populate({ path: "owner", select: "username" })
                    .sort({ kill: -1, updatedAt: -1 }).skip(skip).limit(pageLimit).lean();
                countPromise = Usergamedetails.countDocuments({ kill: { $gt: 0 } });
                amountField = 'kill';
                break;

            case 'deaths':
                lbPromise = Usergamedetails.find({ death: { $gt: 0 } })
                    .populate({ path: "owner", select: "username" })
                    .sort({ death: -1, updatedAt: -1 }).skip(skip).limit(pageLimit).lean();
                countPromise = Usergamedetails.countDocuments({ death: { $gt: 0 } });
                amountField = 'death';
                break;

            case 'levels':
                lbPromise = Usergamedetails.find()
                    .populate({ path: "owner", select: "username" })
                    .sort({ level: -1 }).skip(skip).limit(pageLimit).lean();
                countPromise = Usergamedetails.countDocuments();
                amountField = 'level';
                break;

            case 'playtime':
                lbPromise = Usergamedetails.find({ playtime: { $gt: 0 } })
                    .populate({ path: "owner", select: "username" })
                    .sort({ playtime: -1, updatedAt: -1 }).skip(skip).limit(pageLimit).lean();
                countPromise = Usergamedetails.countDocuments({ playtime: { $gt: 0 } });
                amountField = 'playtime';
                break;

            case 'matches':
                lbPromise = Usergamedetails.find({ losses: { $gt: 0 } })
                    .populate({ path: "owner", select: "username" })
                    .sort({ losses: -1, updatedAt: -1 }).skip(skip).limit(pageLimit).lean();
                countPromise = Usergamedetails.countDocuments({ losses: { $gt: 0 } });
                amountField = 'losses';
                break;

            case 'wins':
                lbPromise = Usergamedetails.find({ wins: { $gt: 0 } })
                    .populate({ path: "owner", select: "username" })
                    .sort({ wins: -1, updatedAt: -1 }).skip(skip).limit(pageLimit).lean();
                countPromise = Usergamedetails.countDocuments({ wins: { $gt: 0 } });
                amountField = 'wins';
                break;

            case 'points':
            default:
                lbPromise = Leaderboard.aggregate([
                    { $sort: { amount: -1, updatedAt: -1 } },
                    { $skip: skip },
                    { $limit: pageLimit },
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
                    { $unwind: "$owner" },
                    {
                        $project: {
                            amount: 1,
                            "owner.username": 1,
                            "usergamedetails.wins": 1,
                            "usergamedetails.losses": 1,
                            "usergamedetails.playtime": 1
                        }
                    }
                ]);
                countPromise = Leaderboard.countDocuments();
                amountField = 'amount';
                break;
        }

        const [lbdata, totalDocuments] = await Promise.all([lbPromise, countPromise]);

        if (!lbdata || lbdata.length === 0) {
            const getUserStats = await userStatsPromise;
            return res.json({ message: "success", data: {
                leaderboard: {},
                userStats: {
                    totalWins: getUserStats?.wins || 0,
                    totalMatches: getUserStats?.losses || 0,
                    playTime: getUserStats?.playtime || 0
                }
            }});
        }

        const totalPages = Math.ceil(totalDocuments / pageLimit);
        const isPoints = leaderboardType === 'points';
        const leaderboard = {};

        lbdata.forEach((entry, index) => {
            leaderboard[index] = {
                user: entry.owner.username,
                amount: entry[amountField],
                totalWins: isPoints ? (entry.usergamedetails?.wins || 0) : (entry.wins || 0),
                totalMatches: isPoints ? (entry.usergamedetails?.losses || 0) : (entry.losses || 0),
                playTime: isPoints ? (entry.usergamedetails?.playtime || 0) : (entry.playtime || 0)
            };
        });

        cached = {
            leaderboard,
            pagination: {
                totalDocuments,
                totalPages,
                currentPage,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1
            }
        };

        cache.set(cacheKey, cached, LB_CACHE_TTL);
    }

    const getUserStats = await userStatsPromise;
    const userStats = {
        totalWins: getUserStats?.wins || 0,
        totalMatches: getUserStats?.losses || 0,
        playTime: getUserStats?.playtime || 0
    };

    return res.json({
        message: "success",
        data: { ...cached, userStats }
    });
}