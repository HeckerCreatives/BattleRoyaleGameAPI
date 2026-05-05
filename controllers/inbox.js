const { default: mongoose } = require("mongoose");
const Inbox = require("../models/Inbox")
const {getdaysago, getdatetime} = require("../utils/datetime")
const { grantRewardsToPlayer } = require("../utils/rewards")

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
        return res.json({message: "success", data: []})
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
    const {id} = req.user
    const {itemid} = req.body

    if (!mongoose.Types.ObjectId.isValid(itemid)) {
        return res.status(400).json({ message: "failed", data: "Invalid inbox item id." })
    }

    try {
        const ownerId = new mongoose.Types.ObjectId(id)
        const inboxItemId = new mongoose.Types.ObjectId(itemid)

        const message = await Inbox.findOne({
            _id: inboxItemId,
            owner: ownerId
        })

        if (!message) {
            return res.status(404).json({ message: "failed", data: "Inbox message not found." })
        }

        if (String(message.status || "").toLowerCase() === "opened") {
            return res.json({
                message: "success",
                data: {
                    rewardsreceived: [],
                    alreadyopened: true
                }
            })
        }

        const rewardsToGrant = Array.isArray(message.rewards) ? message.rewards : []

        await grantRewardsToPlayer(id, rewardsToGrant)

        await Inbox.findOneAndUpdate(
            { _id: inboxItemId, owner: ownerId },
            { status: "opened" }
        )

        return res.json({
            message: "success",
            data: {
                rewardsreceived: rewardsToGrant,
                alreadyopened: false
            }
        })
    } catch (err) {
        console.log(`Server error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server please try again later"})
    }
}