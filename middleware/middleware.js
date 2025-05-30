const Users = require("../models/Users")
const Staffusers = require("../models/Staffusers")
const Maintenance = require("../models/Maintenance")
const fs = require('fs');
const path = require("path");
const publicKey = fs.readFileSync(path.resolve(__dirname, "../keys/public-key.pem"), 'utf-8');
const jsonwebtokenPromisified = require('jsonwebtoken-promisified');

const verifyJWT = async (token) => {
    try {
        const decoded = await jsonwebtokenPromisified.verify(token, publicKey, { algorithms: ['RS256'] });
        return decoded;
    } catch (error) {
        console.error('Invalid token:', error.message);
        throw new Error('Invalid token');
    }
};

exports.protectplayer = async (req, res, next) => {
    const token = req.headers.authorization

    if (!token){
        return res.status(300).json({ message: 'Unauthorized', data: "You are not authorized to view this page. Please login the right account to view the page." });
    }

    try{
        if (!token.startsWith("Bearer")){
            return res.status(300).json({ message: 'Unauthorized', data: "You are not authorized to view this page. Please login the right account to view the page." });
        }

        const maintenancedata = await Maintenance.findOne({type: "fullgame"})
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem getting maintenance data ${err}`)
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details." })
        })

        if (maintenancedata.value != "0"){
            return res.status(405).json({ message: "bad-request", data: "The game is currently under maintenance! Please check our website for more details and try again later." })
        }

        const headerpart = token.split(' ')[1]

        const decodedToken = await verifyJWT(headerpart);

        if (decodedToken.auth != "player"){
            return res.status(300).json({ message: 'Unauthorized', data: "You are not authorized to view this page. Please login the right account to view the page." });
        }

        const user = await Users.findOne({username: decodedToken.username})
        .then(data => data)

        if (!user){
            return res.status(300).json({ message: 'Unauthorized', data: "You are not authorized to view this page. Please login the right account to view the page." });
        }

        if (user.status != "active"){
            return res.status(405).json({ message: 'failed', data: `Your account had been ${user.status}! Please contact support for more details.` });
        }

        req.user = decodedToken;
        next();
    }
    catch(ex){
        return res.status(300).json({ message: 'Unauthorized', data: "You are not authorized to view this page. Please login the right account to view the page." });
    }
}