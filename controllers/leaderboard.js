const { default: mongoose } = require("mongoose");
const Leaderboard = require("../models/Leaderboard");

exports.getleaderboard = async (req, res) => {
    const {id, username} = req.user

    const lbdata = await Leaderboard.find()
    .populate({
        path: "owner",
        select: "username"
    })
    .limit(10)
    .sort({amount: -1})
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

    }

    lbdata.forEach(tempdata => {
        const {owner, amount} = tempdata

        data[tempindex] = {
            user: owner.username,
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