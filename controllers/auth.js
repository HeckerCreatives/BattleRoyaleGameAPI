const Users = require("../models/Users")

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
const Energy = require("../models/Energy")

const encrypt = async password => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}


exports.register = async (req, res) => {
    
    const { username, password, email, country } = req.body;

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

    const user = await Users.create({ username: username, password: password, gametoken: "", webtoken: "", bandate: "", banreason: "", status: "active" })
    .then(data => data)
    .catch(err => {
        console.log(`Uh oh... there's a problem encountered while creating user login for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem in registering account. Please try again." })
    })
    await Userdetails.create({ owner: new mongoose.Types.ObjectId(user._id), email: email, country: country, profilepicture: "" })
    .catch(async (err)=> {
        console.log(`There's a problem creating user details for ${username} Error: ${err}`)
        
        await Users.findOneAndDelete({ username: username})

        return res.status(400).json({ message: "bad-request", data: "There's a problem in registering account. Please try again."})
    })

    await Usergamedetails.create({ owner: new mongoose.Types.ObjectId(user._id), kill: 0, death: 0, level: 1, xp: 0})
    .catch(async (err)=> {
        console.log(`There's a problem creating user details for ${username} Error: ${err}`)
        
        await Users.findOneAndDelete({ username: username})
        await Userdetails.findOneAndDelete({owner: new mongoose.Types.ObjectId(user._id)})

        return res.status(400).json({ message: "bad-request", data: "There's a problem in registering account. Please try again."})
    })

    await Leaderboard.create({ owner: new mongoose.Types.ObjectId(user._id), amount: 0})
    .catch(async (err)=> {
        console.log(`There's a problem creating user details for ${username} Error: ${err}`)
        
        await Users.findOneAndDelete({ username: username})
        await Usergamedetails.findOneAndDelete({owner: new mongoose.Types.ObjectId(user._id)})

        return res.status(400).json({ message: "bad-request", data: "There's a problem in registering account. Please try again."})
    })

    await PlayerCharacterSetting.create({ owner: new mongoose.Types.ObjectId(user._id), hairstyle: 0, haircolor: 0, clothingcolor: 0, skincolor: 0})
    .catch(async (err)=> {
        console.log(`There's a problem creating user details for ${username} Error: ${err}`)
        
        await Users.findOneAndDelete({ username: username })
        await Usergamedetails.findOneAndDelete({owner: new mongoose.Types.ObjectId(user._id)})
        await Leaderboard.findOneAndDelete({owner: new mongoose.Types.ObjectId(user._id)})

        return res.status(400).json({ message: "bad-request", data: "There's a problem in registering account. Please try again."})
    })

    const walletListData = ["credits", "token"]
    const walletBulkWrite = walletListData.map(walletData => ({
        insertOne: {
            document: { owner: user._id, type: walletData, value: "0" }
        }
    }));

    await Wallets.bulkWrite(walletBulkWrite)
    .catch(async (err)=> {
        console.log(`There's a problem creating user details for ${username} Error: ${err}`)
        
        await Users.findOneAndDelete({ username: username })
        await Usergamedetails.findOneAndDelete({owner: new mongoose.Types.ObjectId(user._id)})
        await Leaderboard.findOneAndDelete({owner: new mongoose.Types.ObjectId(user._id)})
        await PlayerCharacterSetting.findOneAndDelete({owner: new mongoose.Types.ObjectId(user._id)})

        return res.status(400).json({ message: "bad-request", data: "There's a problem in registering account. Please try again."})
    })

    await Energy.create({owner: new mongoose.Types.ObjectId(user._id), energy: 10}).catch(async (err)=> {
        console.log(`There's a problem creating user details for ${username} Error: ${err}`)
        
        await Users.findOneAndDelete({ username: username })
        await Usergamedetails.findOneAndDelete({owner: new mongoose.Types.ObjectId(user._id)})
        await Leaderboard.findOneAndDelete({owner: new mongoose.Types.ObjectId(user._id)})
        await PlayerCharacterSetting.findOneAndDelete({owner: new mongoose.Types.ObjectId(user._id)})

        return res.status(400).json({ message: "bad-request", data: "There's a problem in registering account. Please try again."})
    })

    return res.json({ message: "success" })

}

exports.authlogin = async(req, res) => {
    const { username, password } = req.query;

    Users.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } })
    .then(async user => {
        if (user && (await user.matchPassword(password))){
            if (user.status != "active"){
                return res.status(401).json({ message: 'failed', data: `Your account had been ${user.status}! Please contact support for more details.` });
            }

            if (user.gametoken != ''){
                return res.status(401).json({ message: 'failed', data: `Your account is currently logged in on another device! Please logout first and login again` });
            }
console.log("1")
            const maintenancedata = await Maintenance.findOne({type: "fullgame"})
            .then(data => data)
            .catch(err => {
                console.log(`There's a problem getting maintenance data ${err}`)
                return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details." })
            })
            console.log(maintenancedata)
console.log("2")
            if (maintenancedata.value != "0"){
                return res.status(400).json({ message: "bad-request", data: "The game is currently under maintenance! Please check our website for more details and try again later." })
            }

console.log("3")
            const token = await encrypt(privateKey)
console.log("4")

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