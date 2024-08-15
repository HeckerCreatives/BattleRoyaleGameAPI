const router = require("express").Router()
const { getleaderboard } = require("../controllers/leaderboard")
const { protectplayer } = require("../middleware/middleware")

router
    .get("/getleaderboard", protectplayer, getleaderboard)
    
module.exports = router;
