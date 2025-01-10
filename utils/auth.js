const Users = require("../models/Users")

exports.userlogout = async (username) => {
    console.log(`logging out ${username}`)
    await Users.findOneAndUpdate({ username: { $regex: new RegExp('^' + username + '$', 'i') } }, {gametoken: ""})
    .catch(err => {
        console.log(`There's a problem logging out your account. Error ${err}`)
    })
    console.log(`success logout ${username}`)
}