const Users = require("../models/Users")
const Guest = require("../models/Guest")

exports.gameserverinit = async (username) => {
    // console.log(`logging out all users at init`)
    // await Users.updateMany({}, { $set: { gametoken: "" } })
    // .catch(err => {
    //     console.log(`There's a problem logging out your account. Error ${err}`)
    // })
    // console.log(`success logout all user at init`)

    const guestnumbers = await Guest.find()

    if (guestnumbers.length <= 0){
        console.log(`Starting create guest number instance`)

        await Guest.create({count: 1})

        
        console.log(`done guest number instance creation`)
    }
}