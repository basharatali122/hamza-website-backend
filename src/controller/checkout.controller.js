import "dotenv/config";
import Stripe from "stripe";
import config from "../config/config.js"; 
import Order from "../models/Orders.js";
import OrderItem from "../models/OrderItems.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import Payment from "../models/Payment.js";
import Cart from "../models/Cart.js";
import CartItems from "../models/CartItems.js";
import Products from "../models/Products.js";
import Orders from "../models/Orders.js";
import OrderItems from "../models/OrderItems.js";
import  sequelize  from "../config/database.js";

const stripe = new Stripe(config.stripeSecretKey);

export const createPaymentIntent = async (req, res) => {
  try {
    const { cart, shipping } = req.body;

    if (!cart || cart.length === 0)
      return res.status(400).json({ error: "Cart is empty" });

    // Calculate total amount in cents
    const totalAmount = cart.reduce((acc, item) => {
      return acc + Number(item.product.price) * item.quantity;
    }, 0);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // cents
      currency: "usd",
      metadata: {
        shippingName: shipping.fullName,
        shippingEmail: shipping.email,
      },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe Payment Intent Error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const confirmOrder = async (req, res) => {
  try {
    const { cart, shipping, paymentIntentId, userId } = req.body;

    // Create order
    const order = await Order.create({
      userId,
      totalAmount: cart.reduce(
        (acc, item) => acc + Number(item.product.price) * item.quantity,
        0
      ),
      shippingAddress: JSON.stringify(shipping),
      paymentStatus: "Paid",
      paymentIntentId,
    });

    // Create order items
    for (const item of cart) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.product.productId,
        quantity: item.quantity,
        price: item.product.price,
      });
    }

    res.status(200).json({ message: "Order confirmed", order });
  } catch (error) {
    console.error("Confirm Order Error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Modified checkout process with wallet integration
export const processCheckout = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const userId = req.user.id;
    const { 
      shipping_address_id, 
      payment_method, // 'zindigi', 'wallet', 'mixed'
      use_wallet_balance = false,
      card_details // For zindigi payment
    } = req.body;
    
    // Get cart total
    const cart = await Cart.findOne({
      where: { user_id: userId },
      include: [{ model: CartItems, include: [Products] }]
    });
    
    if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }
    
    let totalAmount = 0;
    cart.CartItems.forEach(item => {
      totalAmount += parseFloat(item.Product.price) * item.quantity;
    });
    
    // Get wallet if user wants to use wallet balance
    let wallet = null;
    let walletAmountUsed = 0;
    let remainingAmount = totalAmount;
    
    if (use_wallet_balance || payment_method === 'wallet' || payment_method === 'mixed') {
      wallet = await Wallet.findOne({ 
        where: { user_id: userId },
        transaction: t 
      });
      
      if (wallet) {
        const totalWalletBalance = parseFloat(wallet.balance) + parseFloat(wallet.bonus_balance);
        
        if (payment_method === 'wallet') {
          // Pay entirely with wallet
          if (totalWalletBalance < totalAmount) {
            await t.rollback();
            return res.status(400).json({
              success: false,
              message: 'Insufficient wallet balance'
            });
          }
          walletAmountUsed = totalAmount;
          remainingAmount = 0;
        } else if (payment_method === 'mixed') {
          // Use wallet + gateway
          walletAmountUsed = Math.min(totalWalletBalance, totalAmount);
          remainingAmount = totalAmount - walletAmountUsed;
        }
      }
    }
    
    // Create order
    const order = await Orders.create({
      user_id: userId,
      shipping_address_id,
      total_amount: totalAmount,
      order_status: 'pending',
      payment_status: 'pending'
    }, { transaction: t });
    
    // Create order items
    for (const item of cart.CartItems) {
      await OrderItems.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.Product.price,
        subtotal: parseFloat(item.Product.price) * item.quantity
      }, { transaction: t });
    }
    
    // Process wallet payment
    if (walletAmountUsed > 0) {
      // Deduct from wallet
      let remaining = walletAmountUsed;
      
      if (parseFloat(wallet.balance) >= remaining) {
        wallet.balance = parseFloat(wallet.balance) - remaining;
      } else {
        const balanceUsed = parseFloat(wallet.balance);
        remaining -= balanceUsed;
        wallet.balance = 0;
        wallet.bonus_balance = parseFloat(wallet.bonus_balance) - remaining;
      }
      
      await wallet.save({ transaction: t });
      
      // Create wallet transaction
      await Transaction.create({
        user_id: userId,
        transaction_type: 'purchase',
        amount: walletAmountUsed,
        payment_method: 'wallet',
        order_id: order.id,
        status: 'completed',
        transaction_id: `PUR-${Date.now()}-${userId}`,
        description: `Payment for order #${order.id}`
      }, { transaction: t });
    }
    
    // Process gateway payment if needed
    let zindigiTransaction = null;
    if (remainingAmount > 0 && payment_method !== 'wallet') {
      // Call Zindigi payment gateway
      try {
        zindigiTransaction = await processZindigiPayment({
          amount: remainingAmount,
          order_id: order.id,
          user_id: userId,
          card_details
        });
        
        if (zindigiTransaction.status !== 'success') {
          throw new Error('Payment failed');
        }
        
        // Create gateway transaction
        await Transaction.create({
          user_id: userId,
          transaction_type: 'purchase',
          amount: remainingAmount,
          payment_method: 'zindigi',
          order_id: order.id,
          zindigi_transaction_id: zindigiTransaction.transaction_id,
          payment_gateway_response: zindigiTransaction,
          status: 'completed',
          transaction_id: `PUR-${Date.now()}-${userId}-GW`,
          description: `Gateway payment for order #${order.id}`
        }, { transaction: t });
        
      } catch (paymentError) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Payment failed',
          error: paymentError.message
        });
      }
    }
    
    // Create payment record
    await Payment.create({
      order_id: order.id,
      payment_method: payment_method,
      amount_paid: totalAmount,
      wallet_amount_used: walletAmountUsed,
      gateway_amount: remainingAmount,
      payment_status: 'completed',
      zindigi_response: zindigiTransaction
    }, { transaction: t });
    
    // Update order status
    order.payment_status = 'paid';
    order.order_status = 'confirmed';
    await order.save({ transaction: t });
    
    // Clear cart
    await CartItems.destroy({ where: { cart_id: cart.id }, transaction: t });
    
    await t.commit();
    
    return res.status(200).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        order_id: order.id,
        total_amount: totalAmount,
        wallet_used: walletAmountUsed,
        gateway_paid: remainingAmount,
        order_status: order.order_status
      }
    });
    
  } catch (error) {
    await t.rollback();
    console.error('Checkout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process checkout'
    });
  }
}

// Zindigi payment processing method
export const processZindigiPayment = async (paymentData) => {
  // This will be implemented in Phase 3
  // For now, return mock response
  return {
    status: 'success',
    transaction_id: `ZINDIGI-${Date.now()}`,
    amount: paymentData.amount,
    message: 'Payment successful'
  };
}

export default {
  createPaymentIntent,
  confirmOrder,
  processCheckout,
  processZindigiPayment
};