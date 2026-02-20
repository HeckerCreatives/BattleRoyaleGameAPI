const router = require("express").Router()
const { getleaderboard, updateuserleaderboard, getkillleaderboard, getdeathleaderboard, getlevelleaderboard } = require("../controllers/leaderboard")
const { protectplayer } = require("../middleware/middleware")

router
    .get("/getleaderboard", protectplayer, getleaderboard)
    .get("/getkillleaderboard", protectplayer, getkillleaderboard)
    .get("/getdeathleaderboard", protectplayer, getdeathleaderboard)
    .get("/getlevelleaderboard", protectplayer, getlevelleaderboard)
    .post("/updateuserleaderboard", updateuserleaderboard)
    
module.exports = router;
