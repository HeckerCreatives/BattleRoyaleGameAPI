const router = require("express").Router()
const { getusergamedetails, updateusergamedetails, checkingamemaintenance, useenergy, refundenergy, getmatchhistory } = require("../controllers/usergamedetails")
const { protectplayer } = require("../middleware/middleware")

router
    .get("/getusergamedetails", protectplayer, getusergamedetails)
    .get("/checkingamemaintenance", protectplayer, checkingamemaintenance)
    .get("/getmatchhistory", protectplayer, getmatchhistory)
    .post("/updateusergamedetails", protectplayer, updateusergamedetails)
    .post("/useenergy", protectplayer, useenergy)
    .post("/refundenergy", protectplayer, refundenergy)
    
module.exports = router;
