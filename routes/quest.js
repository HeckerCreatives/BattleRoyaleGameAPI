const router = require("express").Router()
const { getquests, claimreward, skipquest, updateprogress } = require("../controllers/quest")
const { protectplayer } = require("../middleware/middleware")

router
    .get("/getquests", protectplayer, getquests)
    .post("/claimreward", protectplayer, claimreward)
    .post("/skipquest", protectplayer, skipquest)
    .post("/updateprogress", protectplayer, updateprogress)

module.exports = router;
