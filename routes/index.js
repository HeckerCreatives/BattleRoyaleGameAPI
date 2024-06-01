const routers = app => {
    console.log("Routers are all available");

    app.use("/auth", require("./auth"))
    app.use("/characters", require("./playercharactersettings"))
    app.use("/inbox", require("./inbox"))
}

module.exports = routers