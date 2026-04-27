const routers = app => {
    console.log("Routers are all available");

    app.use("/auth", require("./auth"))
    app.use("/characters", require("./playercharactersettings"))
    app.use("/inbox", require("./inbox"))
    app.use("/leaderboard", require("./leaderboard"))
    app.use("/marketplace", require("./marketplace"))
    app.use("/season", require("./season"))
    app.use("/sociallinks", require("./sociallinks"))
    app.use("/title", require("./title"))
    app.use("/usergamedetail", require("./usergamedetails"))
    app.use("/ads", require("./ads"))
    app.use("/avatar", require("./avatar"))
}

module.exports = routers