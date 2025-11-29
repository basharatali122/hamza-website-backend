import Wishlist from "../models/Wishlist.js";
import Product from "../models/Products.js";

export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const wishlistItems = await Wishlist.findAll({
      where: { userId },
      include: [{ model: Product }],
    });
    return res.status(200).json({ wishlist: wishlistItems });
  } catch (error) {
    console.error("Get Wishlist Error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    const existing = await Wishlist.findOne({ where: { userId, productId } });
    if (existing) return res.status(400).json({ error: "Product already in wishlist" });

    const wishlistItem = await Wishlist.create({ userId, productId });
    return res.status(200).json({ message: "Product added to wishlist", wishlistItem });
  } catch (error) {
    console.error("Add to Wishlist Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { wishlistId } = req.params;
    const wishlistItem = await Wishlist.findByPk(wishlistId);
    if (!wishlistItem) return res.status(404).json({ error: "Item not found in wishlist" });

    await wishlistItem.destroy();
    return res.status(200).json({ message: "Product removed from wishlist" });
  } catch (error) {
    console.error("Remove from Wishlist Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};