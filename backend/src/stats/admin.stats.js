const mongoose = require("mongoose");
const express = require("express");
const Order = require("../orders/order.model");
const Book = require("../books/book.model");
const User = require("../users/user.model");
const verifyAdminToken = require("../middleware/verifyAdminToken");
const router = express.Router();

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered"];
const SALES_RANGE_OPTIONS = new Set(["7d", "30d", "3m", "1y"]);
const CATEGORY_PERIOD_OPTIONS = new Set([
    "current-month",
    "last-month",
    "spring",
    "summer",
    "autumn",
    "winter",
    "all",
]);

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toPositiveInt = (value, fallback, max = 100) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(max, Math.floor(parsed));
};

const startOfDay = (date) => {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
};

const addDays = (date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
};

const addMonths = (date, months) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
};

const formatDateKey = (date) => date.toISOString().slice(0, 10);

const formatMonthKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getWeekStart = (date) => {
    const next = startOfDay(date);
    const day = next.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    next.setDate(next.getDate() + diff);
    return next;
};

const getSalesRangeConfig = (rangeValue = "30d") => {
    const range = SALES_RANGE_OPTIONS.has(rangeValue) ? rangeValue : "30d";
    const end = new Date();
    const today = startOfDay(end);

    if (range === "7d") {
        const start = addDays(today, -6);
        const previousStart = addDays(start, -7);
        return { range, start, end, previousStart, previousEnd: start, granularity: "day", steps: 7 };
    }

    if (range === "3m") {
        const start = addMonths(today, -3);
        const previousStart = addMonths(start, -3);
        return { range, start, end, previousStart, previousEnd: start, granularity: "week", steps: 13 };
    }

    if (range === "1y") {
        const start = addMonths(today, -11);
        start.setDate(1);
        const previousStart = addMonths(start, -12);
        return { range, start, end, previousStart, previousEnd: start, granularity: "month", steps: 12 };
    }

    const start = addDays(today, -29);
    const previousStart = addDays(start, -30);
    return { range, start, end, previousStart, previousEnd: start, granularity: "day", steps: 30 };
};

const getSeriesLabels = ({ start, granularity, steps }) => {
    return Array.from({ length: steps }, (_item, index) => {
        if (granularity === "month") {
            return formatMonthKey(addMonths(start, index));
        }
        if (granularity === "week") {
            return formatDateKey(addDays(getWeekStart(start), index * 7));
        }
        return formatDateKey(addDays(start, index));
    });
};

const getBucketKey = (date, granularity) => {
    if (granularity === "month") return formatMonthKey(date);
    if (granularity === "week") return formatDateKey(getWeekStart(date));
    return formatDateKey(date);
};

const sumOrderItems = (order) => {
    if (Array.isArray(order.items) && order.items.length > 0) {
        return order.items.map((item) => ({
            productId: item.productId,
            title: item.title || "",
            quantity: Math.max(1, Number(item.quantity) || 1),
            revenue: Math.max(0, Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1),
        }));
    }

    const productIds = Array.isArray(order.productIds) ? order.productIds : [];
    if (productIds.length === 0) return [];
    const fallbackPrice = Math.max(0, Number(order.totalPrice) || 0) / productIds.length;
    return productIds.map((productId) => ({
        productId,
        title: "",
        quantity: 1,
        revenue: fallbackPrice,
    }));
};

const getMonthBounds = (monthOffset = 0) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1);
    return { start, end };
};

const getCategoryPeriodBounds = (period = "current-month") => {
    const normalized = CATEGORY_PERIOD_OPTIONS.has(period) ? period : "current-month";
    if (normalized === "all") return {};
    if (normalized === "last-month") return getMonthBounds(-1);
    if (normalized === "current-month") return getMonthBounds(0);

    const now = new Date();
    const year = now.getFullYear();
    const seasonMonths = {
        spring: [2, 5],
        summer: [5, 8],
        autumn: [8, 11],
        winter: [11, 14],
    };
    const [startMonth, endMonth] = seasonMonths[normalized] || seasonMonths.spring;
    const startYear = normalized === "winter" && now.getMonth() < 2 ? year - 1 : year;
    return {
        start: new Date(startYear, startMonth, 1),
        end: new Date(startYear, endMonth, 1),
    };
};

const buildOrderDateQuery = (start, end) => {
    if (!start && !end) return {};
    const createdAt = {};
    if (start) createdAt.$gte = start;
    if (end) createdAt.$lt = end;
    return { createdAt };
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getLast12MonthKeys = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    return Array.from({ length: 12 }, (_item, index) => {
        const date = addMonths(start, index);
        return {
            key: formatMonthKey(date),
            label: date.toLocaleString("en-US", { month: "short" }),
        };
    });
};

const buildSeasonalInsights = (orders = [], bookMap = new Map()) => {
    const monthYearRevenue = new Map();
    const last12Months = getLast12MonthKeys();
    const categoryMonthStats = new Map();
    const categories = new Set();

    for (const order of orders) {
        const createdAt = new Date(order.createdAt);
        if (Number.isNaN(createdAt.getTime())) continue;

        const monthIndex = createdAt.getMonth();
        const yearMonthKey = `${createdAt.getFullYear()}-${String(monthIndex + 1).padStart(2, "0")}`;
        const revenue = Number(order.totalPrice) || 0;
        monthYearRevenue.set(yearMonthKey, (monthYearRevenue.get(yearMonthKey) || 0) + revenue);

        if (last12Months.some((month) => month.key === yearMonthKey)) {
            for (const item of sumOrderItems(order)) {
                const book = item.productId ? bookMap.get(String(item.productId)) : null;
                const category = (book?.category || "uncategorized").toString().trim() || "uncategorized";
                categories.add(category);

                const categoryKey = `${category}:${yearMonthKey}`;
                const current = categoryMonthStats.get(categoryKey) || 0;
                categoryMonthStats.set(categoryKey, current + item.revenue);
            }
        }
    }

    const revenueByMonth = MONTH_LABELS.map((label, monthIndex) => {
        const matchingValues = [...monthYearRevenue.entries()]
            .filter(([key]) => Number(key.slice(5, 7)) === monthIndex + 1)
            .map((entry) => entry[1]);

        const historicalAverage =
            matchingValues.length > 0
                ? matchingValues.reduce((sum, value) => sum + value, 0) / matchingValues.length
                : 0;

        return {
            month: label,
            monthIndex,
            historicalAverage,
        };
    });

    const maxAverage = Math.max(1, ...revenueByMonth.map((item) => item.historicalAverage));
    const heatmap = revenueByMonth.map((item) => ({
        ...item,
        intensity: Math.min(1, Math.max(0.12, item.historicalAverage / maxAverage)),
    }));

    const sortedCategories = [...categories].sort().slice(0, 5);

    return {
        heatmap,
        monthlyCategoryTrends: {
            labels: last12Months.map((month) => month.label),
            categories: sortedCategories,
            series: sortedCategories.map((category) => ({
                category,
                data: last12Months.map((month) => categoryMonthStats.get(`${category}:${month.key}`) || 0),
            })),
        },
    };
};

const buildOrderTimeline = (status = "pending") => {
    const resolvedStatus = (status || "pending").toLowerCase();
    const currentIndex = Math.max(0, ORDER_STATUSES.indexOf(resolvedStatus));
    return ORDER_STATUSES.map((step, index) => ({
        step,
        done: index <= currentIndex,
        current: index === currentIndex,
    }));
};

const buildOrderSearchQuery = (searchTerm = "") => {
    const normalizedSearch = (searchTerm || "").toString().trim();
    if (!normalizedSearch) return [];

    const safeRegex = new RegExp(escapeRegex(normalizedSearch), "i");
    const conditions = [{ name: safeRegex }, { email: safeRegex }];

    if (mongoose.Types.ObjectId.isValid(normalizedSearch)) {
        conditions.push({ _id: normalizedSearch });
    }

    const numericPhone = Number(normalizedSearch);
    if (Number.isFinite(numericPhone)) {
        conditions.push({ phone: numericPhone });
    }

    return conditions;
};

router.get("/", verifyAdminToken, async (_req, res) => {
    try {
        const [
            totalOrders,
            totalBooks,
            totalUsers,
            pendingOrders,
            lowStockBooks,
            totalSalesAggregate,
            trendingBooksAggregate,
            monthlySales,
            recentOrders,
        ] = await Promise.all([
            Order.countDocuments(),
            Book.countDocuments(),
            User.countDocuments(),
            Order.countDocuments({ status: "pending" }),
            Book.countDocuments({ stock: { $lte: 5 } }),
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: "$totalPrice" },
                    },
                },
            ]),
            Book.aggregate([{ $match: { trending: true } }, { $count: "trendingBooksCount" }]),
            Order.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        totalSales: { $sum: "$totalPrice" },
                        totalOrders: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            Order.find({}, { name: 1, email: 1, totalPrice: 1, status: 1, createdAt: 1 })
                .sort({ createdAt: -1 })
                .limit(6),
        ]);

        return res.status(200).json({
            totalOrders,
            totalSales: totalSalesAggregate[0]?.totalSales || 0,
            trendingBooks: trendingBooksAggregate[0]?.trendingBooksCount || 0,
            totalBooks,
            totalUsers,
            pendingOrders,
            lowStockBooks,
            monthlySales,
            recentOrders,
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return res.status(500).json({ message: "Failed to fetch admin stats" });
    }
});

router.get("/sales-analytics", verifyAdminToken, async (req, res) => {
    try {
        const rangeConfig = getSalesRangeConfig((req.query.range || "30d").toString());
        const categoryPeriod = (req.query.categoryPeriod || "current-month").toString();
        const categoryBounds = getCategoryPeriodBounds(categoryPeriod);
        const currentMonthBounds = getMonthBounds(0);

        const [monthOrders, rangeOrders, categoryOrders, allOrders, books] = await Promise.all([
            Order.find(buildOrderDateQuery(currentMonthBounds.start, currentMonthBounds.end)).lean(),
            Order.find(buildOrderDateQuery(rangeConfig.previousStart, rangeConfig.end)).lean(),
            Order.find(buildOrderDateQuery(categoryBounds.start, categoryBounds.end)).lean(),
            Order.find({}).lean(),
            Book.find(
                {},
                {
                    title: 1,
                    name: 1,
                    author: 1,
                    brand: 1,
                    category: 1,
                    stock: 1,
                    newPrice: 1,
                    price: 1,
                }
            ).lean(),
        ]);

        const bookMap = new Map(books.map((book) => [String(book._id), book]));
        const seasonalInsights = buildSeasonalInsights(allOrders, bookMap);

        const monthRevenue = monthOrders.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);
        const monthOrderCount = monthOrders.length;
        const monthProductStats = new Map();

        for (const order of monthOrders) {
            for (const item of sumOrderItems(order)) {
                const key = String(item.productId || item.title || "unknown");
                const current = monthProductStats.get(key) || {
                    productId: item.productId,
                    title: item.title,
                    unitsSold: 0,
                };
                current.unitsSold += item.quantity;
                if (!current.title && item.title) current.title = item.title;
                monthProductStats.set(key, current);
            }
        }

        const bestSeller = [...monthProductStats.values()].sort((a, b) => b.unitsSold - a.unitsSold)[0];
        const bestSellerBook = bestSeller?.productId ? bookMap.get(String(bestSeller.productId)) : null;

        const labels = getSeriesLabels(rangeConfig);
        const previousLabels = getSeriesLabels({
            start: rangeConfig.previousStart,
            granularity: rangeConfig.granularity,
            steps: rangeConfig.steps,
        });
        const currentSalesByBucket = new Map(labels.map((label) => [label, 0]));
        const previousSalesByBucket = new Map(previousLabels.map((label) => [label, 0]));

        for (const order of rangeOrders) {
            const createdAt = new Date(order.createdAt);
            const revenue = Number(order.totalPrice) || 0;
            if (createdAt >= rangeConfig.start && createdAt <= rangeConfig.end) {
                const key = getBucketKey(createdAt, rangeConfig.granularity);
                currentSalesByBucket.set(key, (currentSalesByBucket.get(key) || 0) + revenue);
            } else if (createdAt >= rangeConfig.previousStart && createdAt < rangeConfig.previousEnd) {
                const key = getBucketKey(createdAt, rangeConfig.granularity);
                previousSalesByBucket.set(key, (previousSalesByBucket.get(key) || 0) + revenue);
            }
        }

        const topProductStats = new Map();
        for (const order of rangeOrders.filter((order) => new Date(order.createdAt) >= rangeConfig.start)) {
            for (const item of sumOrderItems(order)) {
                const key = String(item.productId || item.title || "unknown");
                const book = item.productId ? bookMap.get(String(item.productId)) : null;
                const current = topProductStats.get(key) || {
                    productId: item.productId || "",
                    title: book?.title || book?.name || item.title || "Unknown Book",
                    author: book?.author || book?.brand || "Unknown Author",
                    category: book?.category || "uncategorized",
                    unitsSold: 0,
                    revenueGenerated: 0,
                    stockRemaining: Number(book?.stock ?? 0),
                };
                current.unitsSold += item.quantity;
                current.revenueGenerated += item.revenue;
                topProductStats.set(key, current);
            }
        }

        const categoryStats = new Map();
        for (const order of categoryOrders) {
            for (const item of sumOrderItems(order)) {
                const book = item.productId ? bookMap.get(String(item.productId)) : null;
                const category = (book?.category || "uncategorized").toString().trim() || "uncategorized";
                const current = categoryStats.get(category) || {
                    category,
                    unitsSold: 0,
                    revenueGenerated: 0,
                };
                current.unitsSold += item.quantity;
                current.revenueGenerated += item.revenue;
                categoryStats.set(category, current);
            }
        }

        return res.status(200).json({
            filters: {
                range: rangeConfig.range,
                categoryPeriod: CATEGORY_PERIOD_OPTIONS.has(categoryPeriod) ? categoryPeriod : "current-month",
                granularity: rangeConfig.granularity,
            },
            kpis: {
                totalRevenueThisMonth: monthRevenue,
                totalOrdersThisMonth: monthOrderCount,
                averageOrderValue: monthOrderCount > 0 ? monthRevenue / monthOrderCount : 0,
                bestSellingBook: {
                    title: bestSellerBook?.title || bestSellerBook?.name || bestSeller?.title || "No sales yet",
                    unitsSold: bestSeller?.unitsSold || 0,
                },
            },
            salesOverTime: {
                labels,
                current: labels.map((label) => currentSalesByBucket.get(label) || 0),
                previous: previousLabels.map((label) => previousSalesByBucket.get(label) || 0),
            },
            topSellingProducts: [...topProductStats.values()].sort((a, b) => b.unitsSold - a.unitsSold),
            categoryPerformance: [...categoryStats.values()].sort(
                (a, b) => b.revenueGenerated - a.revenueGenerated
            ),
            seasonalInsights,
        });
    } catch (error) {
        console.error("Error fetching sales analytics:", error);
        return res.status(500).json({ message: "Failed to fetch sales analytics." });
    }
});

router.get("/orders", verifyAdminToken, async (req, res) => {
    try {
        const page = toPositiveInt(req.query.page, 1, 10000);
        const limit = toPositiveInt(req.query.limit, 20, 100);
        const status = (req.query.status || "").toString().trim().toLowerCase();
        const search = (req.query.search || "").toString().trim();

        const query = {};
        if (ORDER_STATUSES.includes(status)) {
            query.status = status;
        }

        const searchConditions = buildOrderSearchQuery(search);
        if (searchConditions.length > 0) {
            query.$or = searchConditions;
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Order.countDocuments(query),
        ]);

        return res.status(200).json({
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error) {
        console.error("Error fetching admin orders:", error);
        return res.status(500).json({ message: "Failed to fetch orders." });
    }
});

router.get("/orders/:orderId", verifyAdminToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order id." });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        return res.status(200).json({
            order,
            timeline: buildOrderTimeline(order.status),
        });
    } catch (error) {
        console.error("Error fetching admin order details:", error);
        return res.status(500).json({ message: "Failed to fetch order details." });
    }
});

router.patch("/orders/:orderId/status", verifyAdminToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order id." });
        }

        const nextStatus = (req.body?.status || "").toString().trim().toLowerCase();
        if (!ORDER_STATUSES.includes(nextStatus)) {
            return res.status(400).json({
                message: `Invalid status. Allowed values: ${ORDER_STATUSES.join(", ")}.`,
            });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status: nextStatus },
            { new: true, runValidators: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found." });
        }

        return res.status(200).json({
            message: "Order status updated successfully.",
            order: updatedOrder,
            timeline: buildOrderTimeline(updatedOrder.status),
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({ message: "Failed to update order status." });
    }
});

router.get("/users", verifyAdminToken, async (req, res) => {
    try {
        const role = (req.query.role || "").toString().trim().toLowerCase();
        const search = (req.query.search || "").toString().trim();

        const query = {};
        if (role === "admin" || role === "user") {
            query.role = role;
        }
        if (search) {
            query.username = { $regex: escapeRegex(search), $options: "i" };
        }

        const [users, orderAggregates] = await Promise.all([
            User.find(query).select("_id username role").sort({ username: 1 }),
            Order.aggregate([
                {
                    $group: {
                        _id: "$userId",
                        totalOrders: { $sum: 1 },
                        totalSpent: { $sum: "$totalPrice" },
                    },
                },
            ]),
        ]);

        const orderStatsByUser = new Map(
            orderAggregates.map((entry) => [String(entry._id), entry])
        );

        const usersWithStats = users.map((user) => {
            const userData = user.toObject();
            const stats = orderStatsByUser.get(String(userData._id));
            return {
                ...userData,
                totalOrders: stats?.totalOrders || 0,
                totalSpent: stats?.totalSpent || 0,
            };
        });

        return res.status(200).json(usersWithStats);
    } catch (error) {
        console.error("Error fetching admin users:", error);
        return res.status(500).json({ message: "Failed to fetch users." });
    }
});

router.patch("/users/:userId/role", verifyAdminToken, async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user id." });
        }

        if (String(req.user?.id) === String(userId)) {
            return res.status(400).json({ message: "You cannot change your own role." });
        }

        const nextRole = (req.body?.role || "").toString().trim().toLowerCase();
        if (nextRole !== "admin" && nextRole !== "user") {
            return res.status(400).json({ message: "Invalid role value." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        user.role = nextRole;
        await user.save();

        return res.status(200).json({
            message: "User role updated successfully.",
            user: {
                _id: user._id,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Error updating user role:", error);
        return res.status(500).json({ message: "Failed to update user role." });
    }
});

router.delete("/users/:userId", verifyAdminToken, async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user id." });
        }

        if (String(req.user?.id) === String(userId)) {
            return res.status(400).json({ message: "You cannot delete your own account." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.role === "admin") {
            return res
                .status(400)
                .json({ message: "Deleting admin accounts is disabled from dashboard." });
        }

        await User.findByIdAndDelete(userId);
        return res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ message: "Failed to delete user." });
    }
});

module.exports = router;
