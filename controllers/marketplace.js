const { default: mongoose } = require("mongoose");
const Marketplace = require("../models/Marketplace");
const Inventory = require("../models/Inventory");
const Wallets = require("../models/Wallets");
const Energy = require("../models/Energy");
const Leaderboard = require("../models/Leaderboard");
const Transaction = require("../models/Transaction");
const ActiveEffects = require("../models/ActiveEffects");
const walletUtils = require("../utils/wallet");
const energyUtils = require("../utils/energy");
const leaderboardUtils = require("../utils/leaderboard");
const inventoryUtils = require("../utils/inventory");

exports.getmarketplaceitems = async (req, res) => {
    const { id, username } = req.user;

    try {
        const items = await Marketplace.find({})
            .sort({ type: 1, itemid: 1 })
            .then(data => data)
            .catch(err => {
                console.log(`Error getting marketplace items: ${err}`);
                throw err;
            });

        if (!items || items.length === 0) {
            return res.json({ message: "success", data: [] });
        }

        // Get user wallets to show affordable items
        const walletMap = await walletUtils.getAllWallets(id);

        const formattedItems = items.reduce((obj, item) => {
            obj[item.itemid] = {
                itemid: item.itemid,
                itemname: item.itemname,
                description: item.description,
                amount: parseInt(item.amount),
                currency: item.currency,
                type: item.type,
                consumable: item.consumable === "1",
                canAfford: (walletMap[item.currency] || 0) >= parseInt(item.amount)
            };
            return obj;
        }, {});
        return res.json({ message: "success", data: formattedItems });
    } catch (err) {
        console.log(`Error getting marketplace items for ${username}: ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem getting marketplace items." });
    }
};

// Buy marketplace item
exports.buymarketplaceitem = async (req, res) => {
    const { id, username } = req.user;
    const { itemid, quantity = 1 } = req.body;

    if (!itemid) {
        return res.status(400).json({ message: "failed", data: "Item ID is required." });
    }

    if (quantity < 1) {
        return res.status(400).json({ message: "failed", data: "Quantity must be at least 1." });
    }

    try {
        // Get item details
        const item = await Marketplace.findOne({ itemid });
        if (!item) {
            return res.status(404).json({ message: "failed", data: "Item not found." });
        }

        const totalCost = parseInt(item.amount) * quantity;

        // Check user wallet
        let currentWalletAmount = 0;

        if (item.currency === "coins") {
            currentWalletAmount = await walletUtils.checkWallet(id, item.currency.toUpperCase());
        } else if (item.currency === "points") {
            currentWalletAmount = await leaderboardUtils.checkPoints(id);
        } else {
            return res.status(400).json({ message: "failed", data: "Invalid currency type." });
        }

        if (currentWalletAmount < totalCost) {
            return res.status(400).json({ message: "failed", data: `Insufficient ${item.currency.toLowerCase()}. You need ${totalCost} ${item.currency.toLowerCase()}.` });
        }

        // For titles, check if already owned

        const itemType = item.type.toLowerCase();
        const itemCurrency = item.currency.toLowerCase();

        if (itemType === "title") {
            const existingTitle = await Inventory.findOne({
                owner: new mongoose.Types.ObjectId(id),
                itemid: item.itemid
            });
            if (existingTitle) {
                return res.status(400).json({ message: "failed", data: "You already own this title." });
            }
        }

        // Start transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Deduct from wallet
            if (itemCurrency === "coins") {
            await walletUtils.updateWallet(id, itemCurrency, -totalCost, session);
            } else if (itemCurrency === "points") {
            await leaderboardUtils.addPoints(id, -totalCost, session);
            } else {
                return res.status(400).json({ message: "failed", data: "Invalid currency type." });
            }

            // Add to inventory
            if (itemType === "title") {
                // Titles are not stackable
                await Inventory.create([{
                    owner: new mongoose.Types.ObjectId(id),
                    itemid: item.itemid,
                    itemname: item.itemname,
                    type: itemType,
                    quantity: 1,
                    isEquipped: false
                }], { session });
            } else {
                // Check if item already exists in inventory
                const existingItem = await Inventory.findOne({
                    owner: new mongoose.Types.ObjectId(id),
                    itemid: item.itemid
                }).session(session);

                if (existingItem) {
                    // Update quantity
                    await Inventory.findOneAndUpdate(
                        { owner: new mongoose.Types.ObjectId(id), itemid: item.itemid },
                        { $inc: { quantity: quantity } },
                        { session }
                    );
                } else {
                    // Create new inventory item
                    await Inventory.create([{
                        owner: new mongoose.Types.ObjectId(id),
                        itemid: item.itemid,
                        itemname: item.itemname,
                        type: itemType,
                        quantity: quantity,
                        isEquipped: false
                    }], { session });
                }
            }

            // Create transaction record
            await Transaction.create([{
                owner: new mongoose.Types.ObjectId(id),
                type: "purchase",
                action: "buy",
                itemid: item.itemid,
                itemname: item.itemname,
                amount: totalCost,
                currency: itemCurrency,
                description: `Purchased ${quantity}x ${item.itemname}`
            }], { session });

            await session.commitTransaction();
            session.endSession();

            return res.json({ 
                message: "success", 
            });

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }

    } catch (err) {
        console.log(`Error buying item ${itemid} for ${username}: ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem purchasing the item." });
    }
};

// Get user inventory
exports.getuserinventory = async (req, res) => {
    const { id, username } = req.user;

    try {
        const inventory = await Inventory.find({ owner: new mongoose.Types.ObjectId(id) })
            .sort({ type: 1, itemname: 1 })
            .then(data => data)
            .catch(err => {
                console.log(`Error getting inventory for ${username}: ${err}`);
                throw err;
            });

        const formattedInventory = inventory.reduce((obj, item) => {
            obj[item.itemid] = {
                itemid: item.itemid,
                itemname: item.itemname,
                type: item.type,
                quantity: item.quantity,
                isEquipped: item.isEquipped,
                canUse: item.type !== "title" && item.quantity > 0,
                canEquip: item.type === "title",
                canSell: false // Disable selling for now
            };
            return obj;
        }, {});
        return res.json({ message: "success", data: formattedInventory });
    } catch (err) {
        console.log(`Error getting inventory for ${username}: ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your inventory." });
    }
};

// Use item (for consumables like energy and potions)
exports.useitem = async (req, res) => {
    const { id, username } = req.user;
    const { itemid, quantity = 1 } = req.body;

    if (!itemid) {
        return res.status(400).json({ message: "failed", data: "Item ID is required." });
    }

    if (quantity < 1) {
        return res.status(400).json({ message: "failed", data: "Quantity must be at least 1." });
    }

    try {
        // Get item from inventory
        const inventoryItem = await Inventory.findOne({
            owner: new mongoose.Types.ObjectId(id),
            itemid: itemid
        });

        if (!inventoryItem) {
            return res.status(404).json({ message: "failed", data: "Item not found in your inventory." });
        }

        if (inventoryItem.quantity < quantity) {
            return res.status(400).json({ message: "failed", data: `You don't have enough ${inventoryItem.itemname}. You have ${inventoryItem.quantity}.` });
        }

        if (inventoryItem.type === "title") {
            return res.status(400).json({ message: "failed", data: "Titles cannot be used. Use equip/unequip instead." });
        }

        // Start transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Get marketplace item data to determine consumable value
            const marketItem = await Marketplace.findOne({ itemid: itemid });
            if (!marketItem) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: "failed", data: "Item configuration not found." });
            }

            // Apply item effects
            const invType = inventoryItem.type.toLowerCase();
            if (invType === "energy") {
                // Add energy based on consumable value from marketplace data
                const energyToAdd = parseInt(marketItem.consumable) * quantity;
                // Update energy using utility function (automatically caps at 20)
                await energyUtils.updateEnergy(id, energyToAdd, session);
            } else if (invType === "potion") {
                // Check if user already has an active XP potion
                const existingEffect = await ActiveEffects.findOne({
                    owner: new mongoose.Types.ObjectId(id),
                    type: "potion",
                    isActive: true,
                    expiresAt: { $gt: new Date() }
                }).session(session);
                if (existingEffect) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ message: "failed", data: "You already have an active XP potion effect." });
                }
                // Use multiplier from marketplace data consumable field
                const multiplier = parseInt(marketItem.consumable);
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
                await ActiveEffects.create([{
                    owner: new mongoose.Types.ObjectId(id),
                    itemid: itemid,
                    itemname: inventoryItem.itemname,
                    type: "potion",
                    multiplier: multiplier,
                    expiresAt: expiresAt,
                    isActive: true
                }], { session });
            }

            // Reduce quantity in inventory
            if (inventoryItem.quantity === quantity) {
                // Remove item completely if quantity reaches 0
                await Inventory.findOneAndDelete({
                    owner: new mongoose.Types.ObjectId(id),
                    itemid: itemid
                }, { session });
            } else {
                // Reduce quantity
                await Inventory.findOneAndUpdate(
                    { owner: new mongoose.Types.ObjectId(id), itemid: itemid },
                    { $inc: { quantity: -quantity } },
                    { session }
                );
            }

            // Create transaction record
            await Transaction.create([{
                owner: new mongoose.Types.ObjectId(id),
                type: "use",
                action: "use",
                itemid: itemid,
                itemname: inventoryItem.itemname,
                amount: 0,
                currency: "none",
                description: `Used ${quantity}x ${inventoryItem.itemname}`
            }], { session });

            await session.commitTransaction();
            session.endSession();

            return res.json({ 
                message: "success", 
            });

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }

    } catch (err) {
        console.log(`Error using item ${itemid} for ${username}: ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem using the item." });
    }
};

// Equip/Unequip title
exports.equiptitle = async (req, res) => {
    const { id, username } = req.user;
    const { itemid, equip = true } = req.body;

    if (!itemid) {
        return res.status(400).json({ message: "failed", data: "Item ID is required." });
    }

    try {
        // Get title from inventory
        const titleItem = await Inventory.findOne({
            owner: new mongoose.Types.ObjectId(id),
            itemid: itemid,
            type: "title"
        });

        if (!titleItem) {
            return res.status(404).json({ message: "failed", data: "Title not found in your inventory." });
        }

        // Start transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (equip) {
                // Unequip all other titles first
                await Inventory.updateMany(
                    { owner: new mongoose.Types.ObjectId(id), type: "title" },
                    { isEquipped: false },
                    { session }
                );
                // Equip this title
                await Inventory.findOneAndUpdate(
                    { owner: new mongoose.Types.ObjectId(id), itemid: itemid },
                    { isEquipped: true },
                    { session }
                );
            } else {
                // Unequip title
                await Inventory.findOneAndUpdate(
                    { owner: new mongoose.Types.ObjectId(id), itemid: itemid },
                    { isEquipped: false },
                    { session }
                );
            }
            // Create transaction record
            await Transaction.create([{
                owner: new mongoose.Types.ObjectId(id),
                type: "use",
                action: equip ? "equip" : "unequip",
                itemid: itemid,
                itemname: titleItem.itemname,
                amount: 0,
                currency: "none",
                description: `${equip ? "Equipped" : "Unequipped"} ${titleItem.itemname}`
            }], { session });

            await session.commitTransaction();
            session.endSession();

            return res.json({ 
                message: "success", 
            });

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }

    } catch (err) {
        console.log(`Error ${equip ? "equipping" : "unequipping"} title ${itemid} for ${username}: ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the title action." });
    }
};

// Get user wallets
exports.getuserwallets = async (req, res) => {
    const { id, username } = req.user;

    try {
        // Get all wallets using utility
        const walletData = await walletUtils.getAllWallets(id);


        // Get leaderboard points using utility
        const userPoints = await leaderboardUtils.checkPoints(id);
        
        // Ensure we have both points and coins
        const response = {
            points: userPoints,
            coins: walletData.coins || 0
        };

        return res.json({ message: "success", data: response });
    } catch (err) {
        console.log(`Error getting wallets for ${username}: ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your wallet information." });
    }
};

// Get active effects
exports.getactiveeffects = async (req, res) => {
    const { id, username } = req.user;

    try {
        // Clean up expired effects first
        await ActiveEffects.updateMany(
            { 
                owner: new mongoose.Types.ObjectId(id),
                expiresAt: { $lt: new Date() },
                isActive: true
            },
            { isActive: false }
        );

        const activeEffects = await ActiveEffects.find({
            owner: new mongoose.Types.ObjectId(id),
            isActive: true,
            expiresAt: { $gt: new Date() }
        }).sort({ expiresAt: 1 });

        const formattedEffects = activeEffects.reduce((obj, effect) => {
            obj[effect.itemid] = {
                itemid: effect.itemid,
                itemname: effect.itemname,
                type: effect.type,
                multiplier: effect.multiplier,
                expiresAt: effect.expiresAt,
                timeRemaining: Math.max(0, Math.floor((effect.expiresAt - new Date()) / 1000))
            };
            return obj;
        }, {});
        return res.json({ message: "success", data: formattedEffects });
    } catch (err) {
        console.log(`Error getting active effects for ${username}: ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your active effects." });
    }
};

// Get transaction history
exports.gettransactionhistory = async (req, res) => {
    const { id, username } = req.user;
    const { page = 0, limit = 20 } = req.query;

    try {
        const transactions = await Transaction.find({ owner: new mongoose.Types.ObjectId(id) })
            .sort({ createdAt: -1 })
            .skip(parseInt(page) * parseInt(limit))
            .limit(parseInt(limit))
            .then(data => data)
            .catch(err => {
                console.log(`Error getting transaction history for ${username}: ${err}`);
                throw err;
            });

        const formattedTransactions = transactions.reduce((obj, transaction) => {
            obj[transaction._id] = {
                id: transaction._id,
                type: transaction.type,
                action: transaction.action,
                itemname: transaction.itemname,
                amount: transaction.amount,
                currency: transaction.currency,
                description: transaction.description,
                date: transaction.createdAt
            };
            return obj;
        }, {});
        return res.json({ message: "success", data: formattedTransactions });
    } catch (err) {
        console.log(`Error getting transaction history for ${username}: ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your transaction history." });
    }
};

// Sell item (disabled for now but structure ready)
exports.sellitem = async (req, res) => {
    
    const { id, username } = req.user;
    const { itemid, quantity = 1 } = req.body;
    
    const item = await Marketplace.findOne({ itemid });
    const sellprice = (item.amount * 0.5) * quantity;


    switch (item.currency){
        case "coins":
            await walletUtils.updateWallet(id, "coins", sellprice);
          break;

        case "points":
            await leaderboardUtils.addPoints(id, sellprice);
            break;

        default:
            return res.status(400).json({ message: "bad-request", data: "Invalid currency type." });
    }

    await inventoryUtils.removeItem(id, itemid, quantity);

    const transaction = new Transaction({
        owner: new mongoose.Types.ObjectId(id),
        type: "sale",
        action: "sell",
        itemid: item.itemid,
        itemname: item.itemname,
        amount: sellprice,
        currency: item.currency,
        description: `Sold ${quantity}x ${item.itemname} for ${sellprice} ${item.currency}.`,
    });

    await transaction.save();

    return res.json({ message: "success", data: { coins: sellprice } });
};



exports.addwallet = async (req, res) => {
    const { id, username } = req.user;
    const { amount, currency } = req.body;

    try {
        const currencyLower = currency.toLowerCase();
        await walletUtils.updateWallet(id, currencyLower, amount);

        return res.json({ message: "success", data: { [currencyLower]: amount } });
    } catch (err) {
        console.log(`Error adding wallet for ${username}: ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem adding to your wallet." });
    }
}

exports.addpoints = async (req, res) => {
    const { id, username } = req.user
    const { amount } = req.body;

    try {
        await leaderboardUtils.addPoints(id, amount);
        return res.json({ message: "success", data: { points: amount } });
    } catch (err) {
        console.log(`Error adding points for ${username}: ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem adding points to your wallet." });
    }
}