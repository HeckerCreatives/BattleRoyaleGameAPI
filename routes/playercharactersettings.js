const router = require("express").Router()
const { getcharactersetting, savecharactersetting } = require("../controllers/Playercharactersettings")
const { protectplayer } = require("../middleware/middleware")

router
    .get("/getcharactersetting", protectplayer, getcharactersetting)
    .post("/savecharactersetting", protectplayer, savecharactersetting)
    
module.exports = router;
