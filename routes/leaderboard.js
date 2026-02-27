const router = require("express").Router()
const { getleaderboard, updateuserleaderboard, getkillleaderboard, getdeathleaderboard, getlevelleaderboard, getplaytimeleaderboard, getmatchesleaderboard, getwinsleaderboard } = require("../controllers/leaderboard")
const { protectplayer } = require("../middleware/middleware")

router
    .get("/getleaderboard", protectplayer, getleaderboard)
    .get("/getkillleaderboard", protectplayer, getkillleaderboard)
    .get("/getdeathleaderboard", protectplayer, getdeathleaderboard)
    .get("/getlevelleaderboard", protectplayer, getlevelleaderboard)
    .get("/getplaytimeleaderboard", protectplayer, getplaytimeleaderboard)
    .get("/getmatchesleaderboard", protectplayer, getmatchesleaderboard)
    .get("/getwinsleaderboard", protectplayer, getwinsleaderboard)
    .post("/updateuserleaderboard", updateuserleaderboard)
    
module.exports = router;
