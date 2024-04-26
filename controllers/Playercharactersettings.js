const { default: mongoose } = require("mongoose")
const PlayerCharacterSetting = require("../models/Playercharactersettings")

exports.getcharactersetting = async (req, res) => {
    const {id} = req.user

    const settings = await PlayerCharacterSetting.findOne({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(() => res.status(400).json({ message: "bad-request", data: "There's a problem registering your account. Please try again." }))

    return res.json({message: "success", data: {
        hairstyle: settings.hairstyle, 
        haircolor: settings.haircolor, 
        clothingcolor: settings.clothingcolor, 
        skincolor: settings.skincolor
    }})
}

exports.savecharactersetting = async (req, res) => {
    const {id} = req.user
    const {hairstyle, haircolor, clothingcolor, skincolor} = req.body

    await PlayerCharacterSetting.findOneAndUpdate({owner: new mongoose.Types.ObjectId(id)}, {hairstyle: hairstyle, haircolor: haircolor, clothingcolor: clothingcolor, skincolor: skincolor})
    .catch(() => res.status(400).json({ message: "bad-request", data: "There's a problem registering your account. Please try again." }))

    return res.json({message: "success"});
}