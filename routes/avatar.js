const router = require("express").Router()
const { getavatar, saveavatar } = require("../controllers/avatar")
const { protectplayer } = require("../middleware/middleware")

router
    .get("/getavatar", protectplayer, getavatar)
    .post("/saveavatar", protectplayer, saveavatar)
    
module.exports = router;
