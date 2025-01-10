const Users = require("../models/Users")

exports.gameserverinit = async (username) => {
    console.log(`logging out all users at init`)
    await Users.updateMany({}, { $set: { gametoken: "" } })
    .catch(err => {
        console.log(`There's a problem logging out your account. Error ${err}`)
    })
    console.log(`success logout all user at init`)
}