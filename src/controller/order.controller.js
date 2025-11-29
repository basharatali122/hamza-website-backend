import { models } from "../models/index.js";
const { Order, OrderItem, Product, ProductImage, Payment } = models;

export const createOrder = async (req, res) => {
  try {
    const userId = req.user?.userId || req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { items, shippingAddress } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * parseFloat(item.price),
      0
    );

    const order = await Order.create({
      userId,
      status: "pending",
      totalAmount,
      shippingAddress: JSON.stringify(shippingAddress || {}),
    });

    const orderItems = await Promise.all(
      items.map((item) =>
        OrderItem.create({
          orderId: order.orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: parseFloat(item.price),
        })
      )
    );

    const payment = await Payment.create({
      orderId: order.orderId,
      amount: totalAmount,
      status: "pending",
      method: "cod",
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
      items: orderItems,
      payment,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;

    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              include: [
                { model: ProductImage, as: "images" },
              ],
            },
          ],
        },
        {
          model: Payment,
          as: "payment",
        },
      ],
    });

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Get User Orders Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const order = await Order.findOne({
      where: { orderId: orderId, userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error("Get Order By ID Error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{ 
        model: OrderItem, 
        as: "items", 
        include: [{
          model: Product, 
          as: "product"
        }]
      }],
    });
    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Get All Orders Error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const order = await Order.findOne({ where: { orderId, userId } });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ error: "Cannot cancel non-pending order" });
    }

    order.status = "cancelled";
    await order.save();

    return res.status(200).json({ message: "Order cancelled", order });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};