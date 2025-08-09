const { getmarketplaceitems, buymarketplaceitem, sellitem, getuserinventory, useitem, equiptitle, getuserwallets, getactiveeffects, gettransactionhistory, addwallet, addpoints } = require("../controllers/marketplace");
const { protectplayer } = require("../middleware/middleware");

const router = require("express").Router();


router
    .get("/items", protectplayer, getmarketplaceitems)  // Get all marketplace items
    .post("/buy", protectplayer, buymarketplaceitem)    // Buy an item
    .post("/sell", protectplayer, sellitem)             // Sell an item (disabled)
    .get("/inventory", protectplayer, getuserinventory) // Get user inventory
    .post("/use", protectplayer, useitem)               // Use consumable item
    .post("/equip", protectplayer, equiptitle)          // Equip/unequip title
    .get("/wallets", protectplayer, getuserwallets)     // Get user wallet balances
    .get("/effects", protectplayer, getactiveeffects)  // Get active effects
    .get("/transactions", protectplayer, gettransactionhistory) // Get transaction history

    .post("/wallets/add", protectplayer, addwallet)
    .post("/leaderboard/add", protectplayer, addpoints);
module.exports = router;
