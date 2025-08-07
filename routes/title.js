const { getcharactertitles, earnTitle, setTitleEquipped } = require("../controllers/title");
const { protectplayer } = require("../middleware/middleware");



const router = require("express").Router();

router
    .get("/gettitles", protectplayer, getcharactertitles)
    .post("/equipunequip", protectplayer, setTitleEquipped)
    .post("/earntitle", protectplayer, earnTitle);

module.exports = router;