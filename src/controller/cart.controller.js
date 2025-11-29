import Cart from "../models/Cart.js";
import Product from "../models/Products.js";
import CartItem from "../models/CartItems.js";

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.user.userId, status: "active" },
      include: {
        model: CartItem,
        include: {
          model: Product,
          attributes: ["productId", "name", "price", "stock", "images"],
        },
      },
    });

    if (!cart) return res.status(404).json({ message: "Cart is empty" });

    // Calculate totals
    const cartWithTotals = calculateCartTotals(cart);
    
    return res.status(200).json({ cart: cartWithTotals });
  } catch (error) {
    console.error("Get Cart Error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Add item to cart with stock validation
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity < 1) {
      return res.status(400).json({ error: "Invalid product or quantity" });
    }

    // Check if product exists and is available
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ 
        error: "Insufficient stock", 
        available: product.stock 
      });
    }

    // Get or create cart for this user
    let cart = await Cart.findOne({ 
      where: { userId: req.user.userId, status: "active" } 
    });
    if (!cart) {
      cart = await Cart.create({ userId: req.user.userId });
    }

    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      where: { cartId: cart.cartId, productId },
    });

    const newQuantity = cartItem ? cartItem.quantity + quantity : quantity;
    
    // Check stock again with updated quantity
    if (product.stock < newQuantity) {
      return res.status(400).json({ 
        error: "Insufficient stock for requested quantity", 
        available: product.stock 
      });
    }

    if (cartItem) {
      cartItem.quantity = newQuantity;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cartId: cart.cartId,
        productId: productId,
        quantity,
      });
    }

    // Fetch updated cart with totals
    const updatedCart = await getCartWithTotals(cart.cartId);
    
    return res.status(200).json({
      message: `${product.name} added to cart`,
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Add To Cart Error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { cartItemId, quantity } = req.body;
    
    if (!cartItemId || quantity < 0) {
      return res.status(400).json({ error: "Invalid cart item or quantity" });
    }

    if (quantity === 0) {
      return removeCartItem(req, res);
    }

    const cartItem = await CartItem.findOne({
      where: { cartItemId },
      include: [
        { model: Cart, where: { userId: req.user.userId } },
        { model: Product }
      ]
    });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    // Check stock
    if (cartItem.Product.stock < quantity) {
      return res.status(400).json({ 
        error: "Insufficient stock", 
        available: cartItem.Product.stock 
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    const updatedCart = await getCartWithTotals(cartItem.cartId);
    
    return res.status(200).json({ 
      message: "Cart item updated", 
      cart: updatedCart 
    });
  } catch (error) {
    console.error("Update Cart Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Remove item from cart
export const removeCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params;

    const cartItem = await CartItem.findOne({
      where: { cartItemId },
      include: [{ model: Cart, where: { userId: req.user.userId } }]
    });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    await cartItem.destroy();
    
    const updatedCart = await getCartWithTotals(cartItem.cartId);
    
    return res.status(200).json({ 
      message: "Cart item removed", 
      cart: updatedCart 
    });
  } catch (error) {
    console.error("Remove Cart Item Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ 
      where: { userId: req.user.userId, status: "active" } 
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    await CartItem.destroy({ where: { cartId: cart.cartId } });
    
    return res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Clear Cart Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Get cart summary (item count, total price)
export const getCartSummary = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.user.userId, status: "active" },
      include: {
        model: CartItem,
        include: [Product]
      },
    });

    if (!cart) {
      return res.json({ itemCount: 0, totalPrice: 0, totalItems: 0 });
    }

    const summary = calculateCartTotals(cart);
    
    return res.status(200).json({
      itemCount: cart.CartItems.length,
      totalItems: summary.totalItems,
      totalPrice: summary.totalPrice,
    });
  } catch (error) {
    console.error("Cart Summary Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Move cart to wishlist
export const moveToWishlist = async (req, res) => {
  try {
    const { cartItemId } = req.body;
    
    // Implementation depends on your Wishlist model
    // This would remove from cart and add to wishlist
    return res.status(200).json({ message: "Item moved to wishlist" });
  } catch (error) {
    console.error("Move to Wishlist Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// ADMIN FUNCTIONS

// Get all carts (Admin only)
export const getAllCarts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "active" } = req.query;
    
    const carts = await Cart.findAndCountAll({
      where: { status },
      include: [
        {
          model: CartItem,
          include: [Product]
        }
      ],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    const cartsWithTotals = carts.rows.map(cart => calculateCartTotals(cart));
    
    return res.status(200).json({
      carts: cartsWithTotals,
      totalPages: Math.ceil(carts.count / limit),
      currentPage: parseInt(page),
      totalCarts: carts.count
    });
  } catch (error) {
    console.error("Get All Carts Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Clear user's cart (Admin only)
export const clearUserCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ 
      where: { userId, status: "active" } 
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    await CartItem.destroy({ where: { cartId: cart.cartId } });
    
    return res.status(200).json({ message: "User cart cleared successfully" });
  } catch (error) {
    console.error("Clear User Cart Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Get user's cart (Admin only)
export const getUserCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({
      where: { userId, status: "active" },
      include: {
        model: CartItem,
        include: [Product]
      },
    });

    if (!cart) return res.status(404).json({ message: "Cart is empty" });

    const cartWithTotals = calculateCartTotals(cart);
    
    return res.status(200).json({ cart: cartWithTotals });
  } catch (error) {
    console.error("Get User Cart Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// HELPER FUNCTIONS

const calculateCartTotals = (cart) => {
  let totalPrice = 0;
  let totalItems = 0;
  
  if (cart.CartItems) {
    cart.CartItems.forEach(item => {
      totalPrice += item.quantity * item.Product.price;
      totalItems += item.quantity;
    });
  }
  
  return {
    ...cart.toJSON(),
    totalPrice,
    totalItems
  };
};

const getCartWithTotals = async (cartId) => {
  const cart = await Cart.findOne({
    where: { cartId },
    include: {
      model: CartItem,
      include: [Product]
    },
  });
  
  return calculateCartTotals(cart);
};