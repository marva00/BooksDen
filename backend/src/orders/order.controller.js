const mongoose = require("mongoose");
const Order = require("./order.model");

const isAdminRequest = (req) => req?.user?.role === "admin";
const normalizeEmail = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");

const buildOrderTimeline = (status = "pending") => {
  const flow = ["pending", "processing", "shipped", "delivered"];
  const resolvedStatus = (status || "pending").toLowerCase();
  const index = flow.indexOf(resolvedStatus);
  const currentIndex = index >= 0 ? index : 0;
  return flow.map((step, i) => ({
    step,
    done: i <= currentIndex,
    current: i === currentIndex,
  }));
};

const createAOrder = async (req, res) => {
  try {
    if (!req?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const requestedUserId = req.body?.userId ? String(req.body.userId) : "";
    const authenticatedUserId = String(req.user.id);
    if (requestedUserId && requestedUserId !== authenticatedUserId && !isAdminRequest(req)) {
      return res.status(403).json({ message: "You can only create orders for your own account." });
    }

    const fallbackEmail = normalizeEmail(req.user?.username);
    const requestedEmail = normalizeEmail(req.body?.email);
    if (
      requestedEmail &&
      fallbackEmail &&
      requestedEmail !== fallbackEmail &&
      !isAdminRequest(req)
    ) {
      return res.status(403).json({ message: "You can only create orders using your own account email." });
    }

    const orderPayload = {
      ...req.body,
      userId: authenticatedUserId,
      email: requestedEmail || fallbackEmail,
    };

    const newOrder = new Order(orderPayload);
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error creating order", error);
    res.status(400).json({ message: error?.message || "Failed to create order" });
  }
};

const getOrderByEmail = async (req, res) => {
  try {
    const requestedEmail = normalizeEmail(req.params?.email);
    if (!requestedEmail) {
      return res.status(400).json({ message: "A valid email is required." });
    }

    const authenticatedEmail = normalizeEmail(req.user?.username);
    if (!isAdminRequest(req) && requestedEmail !== authenticatedEmail) {
      return res.status(403).json({ message: "You can only view your own orders." });
    }

    const orders = await Order.find({ email: requestedEmail }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
}

const getOrderByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "User id is required." });
    }

    if (!isAdminRequest(req) && String(req.user?.id) !== String(userId)) {
      return res.status(403).json({ message: "You can only view your own orders." });
    }

    const orders = await Order.find({ userId: String(userId) }).sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders by userId", error);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
}

const getOrderTrackingById = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const query = isAdminRequest(req)
      ? { _id: orderId }
      : { _id: orderId, userId: String(req.user?.id) };

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const itemsCount = Array.isArray(order.items)
      ? order.items.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0)
      : 0;

    return res.status(200).json({
      orderId: order._id,
      status: order.status,
      totalPrice: order.totalPrice,
      itemsCount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      timeline: buildOrderTimeline(order.status),
    });
  } catch (error) {
    console.error("Error tracking order by id", error);
    return res.status(500).json({ message: "Failed to track order." });
  }
};

module.exports = {
  createAOrder,
  getOrderByEmail,
  getOrderByUserId,
  getOrderTrackingById,
};
