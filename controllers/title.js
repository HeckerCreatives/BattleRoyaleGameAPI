const { CharacterTitles, Titles } = require("../models/Titles")
const mongoose = require("mongoose");


exports.getcharactertitles = async (req, res) => {
    const { id } = req.user

    const characterTitles = await CharacterTitles.find({ owner: new mongoose.Types.ObjectId(id) })
        .then(data => data)
        .catch(err => {
            console.error(`Error fetching character titles: ${err.message}`);
            return res.status(500).json({ message: 'bad-request', data: "There's a problem with the server. Please try again later." });
        });

    const titles = await Titles.find({})
        .then(data => data)
        .catch(err => {
            console.error(`Error fetching titles: ${err.message}`);
            return res.status(500).json({ message: 'bad-request', data: "There's a problem with the server. Please try again later." });
        })

    if (!titles || titles.length === 0) {
        return res.status(200).json({ message: 'success', data: {} });
    }

    
    const formattedData = titles.reduce((acc, title) => {
        const characterTitle = characterTitles.find(ct => ct.title.toString() === title._id.toString());
        acc[title._id.toString()] = {
            id: title._id,
            index: title.index,
            name: title.name,
            description: title.description,
            isOwned: !!characterTitle,
            isEquipped: characterTitle ? characterTitle.isEquipped : false,
        };
        return acc;
    }, {});

    res.status(200).json({ message: 'success', data: formattedData });
}
exports.setTitleEquipped = async (req, res) => {
    const { id } = req.user;
    const { index, equipped } = req.body;

    if (typeof index === "undefined" || typeof equipped === "undefined") {
        return res.status(400).json({ message: 'Bad Request', data: "Title index and equipped status are required." });
    }

    const title = await Titles.findOne({ index })
        .then(data => data)
        .catch(err => {
            console.error(`Error fetching title: ${err.message}`);
            return res.status(500).json({ message: 'Internal Server Error', data: "There's a problem with the server. Please try again later." });
        });

    if (!title) {
        return res.status(404).json({ message: 'bad-request', data: "Title not found." });
    }
    const characterTitle = await CharacterTitles.findOne({ owner: new mongoose.Types.ObjectId(id), title: title._id })
        .then(data => data)
        .catch(err => {
            console.error(`Error fetching character title: ${err.message}`);
            return res.status(500).json({ message: 'bad-request', data: "There's a problem with the server. Please try again later." });
        });

    if (!characterTitle) {
        return res.status(404).json({ message: 'bad-request', data: "Character title not found." });
    }

    characterTitle.isEquipped = !!equipped;

    await characterTitle.save()
        .then(async () => {
            if (equipped) {
                await CharacterTitles.updateMany(
                    { owner: new mongoose.Types.ObjectId(id), _id: { $ne: characterTitle._id } },
                    { isEquipped: false }
                );
            }
            return res.status(200).json({ 
                message: "success", 
                data: characterTitle 
            });
        })
        .catch(err => {
            console.error(`Error saving character title: ${err.message}`);
            return res.status(400).json({ message: 'bad-request', data: "There's a problem with the server. Please try again later." });
        });
}

exports.earnTitle = async (req, res) => {
    const { id } = req.user
    const { index } = req.body

    if (!index) {
        return res.status(400).json({ message: 'bad-request', data: "Title ID is required." });
    }

    const title = await Titles.findOne({ index })
        .then(data => data)
        .catch(err => {
            console.error(`Error fetching title: ${err.message}`);
            return res.status(400).json({ message: 'bad-request', data: "There's a problem with the server. Please try again later." });
        });

    if (!title) {
        return res.status(404).json({ message: 'bad-request', data: "Title not found." });
    }

    const existingCharacterTitle = await CharacterTitles.findOne({ owner: new mongoose.Types.ObjectId(id), title: title._id })
        .then(data => data)
        .catch(err => {
            console.error(`Error checking existing character title: ${err.message}`);
            return res.status(500).json({ message: 'Internal Server Error', data: "There's a problem with the server. Please try again later." });
        });

    if (existingCharacterTitle) {
        return res.status(400).json({ message: 'bad-request', data: "You already own this title." });
    }

    const characterTitle = new CharacterTitles({
        owner: new mongoose.Types.ObjectId(id),
        title: title._id,
        isEquipped: false
    });

    await characterTitle.save()
        .then(() => {
            return res.status(201).json({ message: 'success', data: characterTitle });
        })
        .catch(err => {
            console.error(`Error saving character title: ${err.message}`);
            return res.status(400).json({ message: 'bad-request', data: "There's a problem with the server. Please try again later." });
        });
}