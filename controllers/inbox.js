const { default: mongoose } = require("mongoose");
const Inbox = require("../models/Inbox")
const {getdaysago, getdatetime} = require("../utils/datetime")

exports.getinboxlist = async (req, res) => {
    const {id, username} = req.user

    const messages = await Inbox.find({owner: new mongoose.Types.ObjectId(id)})
    .sort({'createdAt': -1})   
    .then(data => data)
    .catch(err => {
        console.log(`Server error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server please try again later"})
    });

    if (messages.length <= 0){
        return res.json({message: "success", data: {inbox: []}})
    }

    const inboxdata = []

    messages.forEach(data => {
        const {_id, type, rewards, title, description, status, createdAt} = data
        inboxdata.push({
            id: _id,
            type: type,
            rewards: rewards,
            title: title,
            daysago: getdaysago(createdAt),
            datetime: getdatetime(createdAt),
            status: status,
            description: description
        })
    })

    return res.json({message: "success", data: inboxdata})
}

exports.openmessage = async (req, res) => {
    const {id, username} = req.user
    const {itemid} = req.body

    await Inbox.findOneAndUpdate({_id: new mongoose.Types.ObjectId(itemid)}, {status: "opened"})
    .catch(err => {
        console.log(`Server error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server please try again later"})
    });

    return res.json({message: "success"})
}