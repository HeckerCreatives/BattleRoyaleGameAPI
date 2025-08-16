const Users = require("../models/Users")
const Version = require("../models/Version");

const bcrypt = require('bcrypt');
const jsonwebtokenPromisified = require('jsonwebtoken-promisified');
const path = require("path");
const fs = require('fs')

const privateKey = fs.readFileSync(path.resolve(__dirname, "../keys/private-key.pem"), 'utf-8');
const { default: mongoose } = require("mongoose");
const Wallets = require("../models/Wallets");
const PlayerCharacterSetting = require("../models/Playercharactersettings");
const Leaderboard = require("../models/Leaderboard");
const Usergamedetails = require("../models/Usergamedetails");
const Userdetails = require("../models/Userdetails");
const Maintenance = require("../models/Maintenance")
const Energy = require("../models/Energy");
const { Titles, CharacterTitles } = require("../models/Titles");
const Inventory = require("../models/Inventory");

const encrypt = async password => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}


exports.register = async (req, res) => {
    
    const { username, password, email, country, appversion } = req.body;

    if (!appversion){
        return res.status(400).json({ message: 'Bad Request', data: "App version is required." });
    }

    const gameversion = await Version.findOne({ isActive: true })
    
    if (!gameversion) {
        return res.status(500).json({ message: 'Internal Server Error', data: "There's a problem with the server. Please try again later." });
    }

    if (appversion != gameversion.version){
        return res.status(400).json({ message: 'Bad Request', data: `Your app version is outdated! Please update your app to the latest version (${gameversion.version}) to continue.` });
    }

    if(!email || !username || !password || !country){
        return res.status(400).json({ message: "failed", data: "Please enter all user details."})
    }
    if(username.length < 6 || username.length > 15){
        return res.status(400).json({ message: "failed", data: "Minimum of 5 and maximum of 15 characters only for username! Please try again."})
    }
    if(password.length < 5 || password.length > 20){
        return res.status(400).json({ message: "failed", data: "Minimum of 5 and maximum of 20 characters only for password! Please try again."})
    }
    
    const usernameExists = await Users.findOne({ username: { $regex: `^${username}$`, $options: 'i' } })
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem encountered while searching for user: ${username} Error: ${err}`)
    })
    const usernameRegex = /^[a-zA-Z0-9]+$/;

    if(!usernameRegex.test(username)){
        return res.status(400).json({ message: "failed", data: "Special characters or spaces in username are not allowed."})
    }
    if(usernameExists){
        return res.status(400).json({ message: "bad-request", data: "Username has already been used."})
    }
    const emailExists = await Userdetails.findOne({
        email: { $regex: `^${email}$`, $options: 'i' } })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem encountered while searching for email: ${email} Error: ${err}`);
        });

    if(emailExists){
        return res.status(400).json({ message: "bad-request", data: "Email has already been used."})
    }

    // Start transaction session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Create main user account
        const user = await Users.create([{ 
            username: username, 
            password: password, 
            gametoken: "", 
            webtoken: "", 
            bandate: "", 
            banreason: "", 
            status: "active" 
        }], { session });

        const userId = new mongoose.Types.ObjectId(user[0]._id);

        // Get default title data
        const titlesdata = await Titles.findOne({ index: "TITLE-000" }).session(session);
        if (!titlesdata) {
            throw new Error("Default title data not found");
        }

        // Create all user-related documents in parallel within the transaction
        await Promise.all([
            // User details
            Userdetails.create([{ 
                owner: userId, 
                email: email, 
                country: country, 
                profilepicture: "" 
            }], { session }),

            // User game details
            Usergamedetails.create([{ 
                owner: userId, 
                kill: 0, 
                death: 0, 
                level: 1, 
                xp: 0 
            }], { session }),

            // Leaderboard entry
            Leaderboard.create([{ 
                owner: userId, 
                amount: 0 
            }], { session }),

            // Player character settings
            PlayerCharacterSetting.create([{ 
                owner: userId, 
                hairstyle: 0, 
                haircolor: 0, 
                clothingcolor: 0, 
                skincolor: 0 
            }], { session }),

            // Energy
            Energy.create([{ 
                owner: userId, 
                energy: 20
            }], { session }),

            // Character titles
            CharacterTitles.create([{ 
                owner: userId, 
                title: titlesdata._id 
            }], { session }),

            // Default title in inventory
            Inventory.create([{ 
                owner: userId, 
                itemid: titlesdata.index, 
                itemname: titlesdata.name, 
                quantity: 1, 
                type: "title", 
                isEquipped: true, 
            }], { session }),

            // Default wallet
            Wallets.create([{ 
                owner: userId, 
                type: "coins", 
                amount: 0 
            }], { session })
        ]);

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        console.log(`Successfully created user account for ${username}`);
        return res.json({ message: "success" });

    } catch (err) {
        // Rollback the transaction
        await session.abortTransaction();
        session.endSession();

        console.log(`Error creating user account for ${username}: ${err.message}`);
        return res.status(400).json({ 
            message: "bad-request", 
            data: "There's a problem in registering account. Please try again." 
        });
    }

}

exports.authlogin = async(req, res) => {
    const { username, password, appversion } = req.query;

    if (!appversion){
        return res.status(400).json({ message: 'Bad Request', data: "App version is required." });
    }

    const gameversion = await Version.findOne({ isActive: true })

    if (!gameversion) {
        return res.status(500).json({ message: 'Internal Server Error', data: "There's a problem with the server. Please try again later." });
    }

    if (appversion != gameversion.version){
        return res.status(400).json({ message: 'Bad Request', data: `Your app version is outdated! Please update your app to the latest version (${gameversion.version}) to continue.` });
    }

    Users.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } })
    .then(async user => {
        if (user && (await user.matchPassword(password))){
            if (user.status != "active"){
                return res.status(401).json({ message: 'failed', data: `Your account had been ${user.status}! Please contact support for more details.` });
            }

            if (user.gametoken != ''){
                return res.status(401).json({ message: 'failed', data: `Your account is currently logged in on another device! Please logout first and login again` });
            }

            const maintenancedata = await Maintenance.findOne({type: "fullgame"})
            .then(data => data)
            .catch(err => {
                console.log(`There's a problem getting maintenance data ${err}`)
                return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details." })
            })

            if (maintenancedata.value != "0"){
                return res.status(400).json({ message: "bad-request", data: "The game is currently under maintenance! Please check our website for more details and try again later." })
            }

            const token = await encrypt(privateKey)

            const payload = { id: user._id, username: user.username, status: user.status, token: token, auth: "player" }

            let jwtoken = ""

            try {
                jwtoken = await jsonwebtokenPromisified.sign(payload, privateKey, { algorithm: 'RS256' });
            } catch (error) {
                console.error('Error signing token:', error.message);
                return res.status(500).json({ error: 'Internal Server Error', data: "There's a problem signing in! Please contact customer support for more details! Error 004" });
            }
console.log("5")
            return res.json({message: "success", data: {
                auth: "player",
                token: jwtoken
            }})
        }
        else{
            return res.json({ message: "failedlogin", data: "Your account does not exist! Please put your correct credentials and try again." })
        }
    })
    .catch(err => res.status(400).json({ message: "bad-request", data: "There's a problem with your account! Please contact customer support for more details. error code: " + err }))
}

exports.checkuserlogin = async (req, res) => {
    const { username, password } = req.query;

    Users.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } })
    .then(async user => {
        if (user && (await user.matchPassword(password))){
            if (user.status != "active"){
                return res.status(401).json({ message: 'failed', data: `Your account had been ${user.status}! Please contact support for more details.` });
            }
            return res.json({message: "success", data: "canlogin"})
        }
        else{
            return res.status(400).json({message: "failed", data: "No active user data found! Please check username and password"})
        }
    })
    .catch(err => res.status(400).json({ message: "bad-request", data: "There's a problem with your account! Please contact customer support for more details. error code: " + err }))
}