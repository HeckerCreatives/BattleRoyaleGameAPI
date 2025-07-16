const router = require("express").Router()
const { getcurrentseason } = require("../controllers/season")
const { protectplayer } = require("../middleware/middleware")

router
    .get("/getcurrentseason", protectplayer, getcurrentseason)
    
module.exports = router;
