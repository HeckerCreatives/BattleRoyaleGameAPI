const router = require("express").Router()
const { getadsdata, givereward } = require("../controllers/ads")
const { protectplayer } = require("../middleware/middleware")

router
    .get("/getadsdata", protectplayer, getadsdata)
    .post("/givereward", protectplayer, givereward)
    
module.exports = router;
