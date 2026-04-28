const router = require("express").Router()
const { getquests, claimreward, skipquest } = require("../controllers/quest")
const { protectplayer } = require("../middleware/middleware")

router
    .get("/getquests", protectplayer, getquests)
    .post("/claimreward", protectplayer, claimreward)
    .post("/skipquest", protectplayer, skipquest)

module.exports = router;
