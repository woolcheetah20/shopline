import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable, productsTable, shopsTable } from "@workspace/db";
import { eq, and, gte, desc, count, sum, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/stats/seller", requireAuth, async (req, res): Promise<void> => {
  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.ownerId, req.user!.userId));
  if (!shop) {
    res.json({
      ordersThisWeek: 0, ordersThisMonth: 0, totalOrders: 0, pendingOrders: 0,
      totalProducts: 0, topProducts: [], recentOrders: [],
    });
    return;
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [weekResult] = await db.select({ count: count() }).from(ordersTable)
    .where(and(eq(ordersTable.shopId, shop.id), gte(ordersTable.createdAt, weekAgo)));

  const [monthResult] = await db.select({ count: count() }).from(ordersTable)
    .where(and(eq(ordersTable.shopId, shop.id), gte(ordersTable.createdAt, monthAgo)));

  const [totalResult] = await db.select({ count: count() }).from(ordersTable)
    .where(eq(ordersTable.shopId, shop.id));

  const [pendingResult] = await db.select({ count: count() }).from(ordersTable)
    .where(and(eq(ordersTable.shopId, shop.id), eq(ordersTable.status, "pending")));

  const [productCountResult] = await db.select({ count: count() }).from(productsTable)
    .where(eq(productsTable.shopId, shop.id));

  const topProductsRaw = await db.select({
    productId: orderItemsTable.productId,
    productName: orderItemsTable.productName,
    imageUrl: orderItemsTable.imageUrl,
    orderCount: count(),
  }).from(orderItemsTable)
    .leftJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(eq(ordersTable.shopId, shop.id))
    .groupBy(orderItemsTable.productId, orderItemsTable.productName, orderItemsTable.imageUrl)
    .orderBy(desc(count()))
    .limit(5);

  const recentOrders = await db.select().from(ordersTable)
    .where(eq(ordersTable.shopId, shop.id))
    .orderBy(desc(ordersTable.createdAt))
    .limit(5);

  const enrichedOrders = await Promise.all(recentOrders.map(async (order) => {
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    return { ...order, shopName: shop.name, buyerName: "", buyerPhone: "", items };
  }));

  res.json({
    ordersThisWeek: weekResult.count,
    ordersThisMonth: monthResult.count,
    totalOrders: totalResult.count,
    pendingOrders: pendingResult.count,
    totalProducts: productCountResult.count,
    topProducts: topProductsRaw.map(p => ({
      productId: p.productId,
      productName: p.productName,
      orderCount: p.orderCount,
      imageUrl: p.imageUrl ?? null,
    })),
    recentOrders: enrichedOrders,
  });
});

router.get("/stats/buyer", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const [totalResult] = await db.select({ count: count() }).from(ordersTable)
    .where(eq(ordersTable.buyerId, userId));

  const [completedResult] = await db.select({ count: count() }).from(ordersTable)
    .where(and(eq(ordersTable.buyerId, userId), eq(ordersTable.status, "picked_up")));

  const recentOrders = await db.select().from(ordersTable)
    .where(eq(ordersTable.buyerId, userId))
    .orderBy(desc(ordersTable.createdAt))
    .limit(5);

  const enrichedOrders = await Promise.all(recentOrders.map(async (order) => {
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    const [shop] = await db.select({ name: shopsTable.name }).from(shopsTable).where(eq(shopsTable.id, order.shopId));
    return { ...order, shopName: shop?.name ?? "", buyerName: "", buyerPhone: "", items };
  }));

  const uniqueShops = new Set(recentOrders.map(o => o.shopId));

  res.json({
    totalOrders: totalResult.count,
    completedOrders: completedResult.count,
    favouriteShops: uniqueShops.size,
    recentOrders: enrichedOrders,
  });
});

export default router;
