const { default: mongoose } = require("mongoose");
const Ads = require("../models/Ads")
const energyUtils = require("../utils/energy");

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

    let toadd = 0

    switch (itemid) {
        case "ENG-004":
            toadd = 10;
        break;
    }

    if (type == "energy"){
        await energyUtils.updateEnergy(id, toadd);
    }

    await Ads.findOneAndUpdate({_id: new mongoose.Types.ObjectId(adsid)}, {isClaimed: true})

    return res.json({message: "success"})
}