import sequelize from "../config/database.js";

// Import your models
import Cart from "./Cart.js";
import Admin from "./Admin.js";
import User from "./Users.js";
import Category from "./Category.js";
import Order from "./Orders.js";
import Product from "./Products.js";
import OrderItem from "./OrderItems.js";
import ProductImage from "./ProductImage.js";
import Review from "./Reviews.js";
import Wishlist from "./Wishlist.js";
import Address from "./Address.js";
import Payment from "./Payment.js";
import CartItem from "./CartItems.js";
import emailCheck from "./EmailCheck.js";
import OAuthAccount from "./OAuthAccounts.js";
import Vendor from "./Vendors.js"; 
import ReferralEvent from "./EventReferral.js";

// Attach models
const models = {
  Cart,
  Admin,
  User,
  Category,
  Order,
  Product,
  OrderItem,
  ProductImage,
  Review,
  Wishlist,
  Address,
  Payment,
  CartItem,
  emailCheck,
  OAuthAccount,
  Vendor, 
  ReferralEvent
};

// ===== Relations =====

// Users ↔ Cart (one-to-many)
User.hasMany(Cart, { foreignKey: "userId", as: "carts" });
Cart.belongsTo(User, { foreignKey: "userId", as: "user" });

// Users ↔ Orders (one-to-many)
User.hasMany(Order, { foreignKey: "userId", as: "orders" });
Order.belongsTo(User, { foreignKey: "userId", as: "user" });

// Orders ↔ OrderItems (one-to-many)
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });

// Products ↔ OrderItems (one-to-many)
Product.hasMany(OrderItem, { foreignKey: "productId", as: "orderItems" });
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

// Orders ↔ Payment (one-to-one)
Order.hasOne(Payment, { foreignKey: "orderId", as: "payment" });
Payment.belongsTo(Order, { foreignKey: "orderId", as: "order" });

// Categories ↔ Products (one-to-many)
Category.hasMany(Product, { foreignKey: "categoryId", as: "products" });
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

// Products ↔ ProductImages (one-to-many)
Product.hasMany(ProductImage, { foreignKey: "productId", as: "images" });
ProductImage.belongsTo(Product, { foreignKey: "productId", as: "product" });

// Users ↔ Wishlist ↔ Products (many-to-many)
User.belongsToMany(Product, { through: Wishlist, foreignKey: "userId" });
Product.belongsToMany(User, { through: Wishlist, foreignKey: "productId" });
Wishlist.belongsTo(Product, { foreignKey: "productId" });
Product.hasMany(Wishlist, { foreignKey: "productId" });

// Users ↔ Reviews ↔ Products (one-to-many both sides)
User.hasMany(Review, { foreignKey: "userId", as: "reviews" });
Review.belongsTo(User, { foreignKey: "userId", as: "user" });

Product.hasMany(Review, { foreignKey: "productId", as: "reviews" });
Review.belongsTo(Product, { foreignKey: "productId", as: "product" });

// Users ↔ Addresses (one-to-many)
User.hasMany(Address, { foreignKey: "userId", as: "addresses" });
Address.belongsTo(User, { foreignKey: "userId", as: "user" });

// CartItems ↔ Products (many-to-one)
Cart.hasMany(CartItem, { foreignKey: "cartId" });
CartItem.belongsTo(Cart, { foreignKey: "cartId" });

Product.hasMany(CartItem, { foreignKey: "productId" });
CartItem.belongsTo(Product, { foreignKey: "productId" });

// Verify Email
User.hasOne(emailCheck, { foreignKey: "userId", as: "emailCheck" });
emailCheck.belongsTo(User, { foreignKey: "userId", as: "user" });

// One User can have multiple OAuth accounts (Google, GitHub, Apple, etc.)
User.hasMany(OAuthAccount, {
  foreignKey: "userId",
  as: "oauthAccounts",
  onDelete: "CASCADE", // delete OAuthAccounts when User is deleted
});

OAuthAccount.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// ===== Vendor Relations =====

// Vendors ↔ Products (one-to-many)
Vendor.hasMany(Product, { foreignKey: "vendorId", as: "products" });
Product.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendor" });

// User self-referral relationship
User.belongsTo(User, { 
  as: 'referrer', 
  foreignKey: 'referredBy' 
});
User.hasMany(User, { 
  as: 'referrals', 
  foreignKey: 'referredBy' 
});

// Referral events
User.hasMany(ReferralEvent, { 
  foreignKey: 'referrerId', 
  as: 'referralEvents' 
});
ReferralEvent.belongsTo(User, { 
  foreignKey: 'referrerId', 
  as: 'referrer' 
});
ReferralEvent.belongsTo(User, { 
  foreignKey: 'refereeId', 
  as: 'referee' 
});

// Build db object
const db = {
  connection: sequelize,
  models: models
};

export { db, models };