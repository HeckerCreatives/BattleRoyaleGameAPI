const { default: mongoose } = require("mongoose")
const Avatar = require("../models/Avatar")

exports.getavatar = async (req, res) => {
    const {id} = req.user

    let tempavatar = await Avatar.findOne({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)

    if (!tempavatar){
        tempavatar = await Avatar.create({owner: new mongoose.Types.ObjectId(id), equipid: "AVATAR1"})
        .then(data => data)
    }

    return res.json({message: "success", data: tempavatar.equipid})
}

exports.saveavatar = async (req, res) => {
    const {id} = req.user
    const {avatarid} = req.body

    await Avatar.findOneAndUpdate({owner: new mongoose.Types.ObjectId(id)}, {equipid: avatarid})
    .then(data => data)

    return res.json({message: "success"})
}