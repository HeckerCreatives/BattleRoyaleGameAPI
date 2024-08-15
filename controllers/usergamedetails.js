const { default: mongoose } = require("mongoose")
const Usergamedetails = require("../models/Usergamedetails")

exports.getusergamedetails = async (req, res) => {
    const {id, username} = req.user
    
    const usergamedata = await Usergamedetails.findOne({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the user game details for ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem getting the user game details"})
    })

    const data = {
        kill: usergamedata.kill,
        death: usergamedata.death,
        level: usergamedata.level,
        xp: usergamedata.xp
    }

    return res.json({message: "success", data: data})
}