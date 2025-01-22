const routers = app => {
    console.log("Routers are all available");

    app.use("/auth", require("./auth"))
    app.use("/characters", require("./playercharactersettings"))
    app.use("/inbox", require("./inbox"))
    app.use("/leaderboard", require("./leaderboard"))
    app.use("/sociallinks", require("./sociallinks"))
    app.use("/usergamedetail", require("./usergamedetails"))
}

module.exports = routers