import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable, productsTable, shopsTable, usersTable } from "@workspace/db";
import { eq, and, or, desc } from "drizzle-orm";
import { CreateOrderBody, UpdateOrderStatusBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function generateOrderNumber(): string {
  return "SL-" + Math.floor(1000 + Math.random() * 9000).toString();
}

async function enrichOrder(order: typeof ordersTable.$inferSelect) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const [shop] = await db.select({
    name: shopsTable.name,
    address: shopsTable.address,
    phone: shopsTable.phone,
    whatsapp: shopsTable.whatsapp,
  }).from(shopsTable).where(eq(shopsTable.id, order.shopId));
  const [buyer] = await db.select({ name: usersTable.name, phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, order.buyerId));
  return {
    ...order,
    shopName: shop?.name ?? "",
    shopAddress: shop?.address ?? "",
    shopPhone: shop?.phone ?? null,
    shopWhatsapp: shop?.whatsapp ?? null,
    buyerName: buyer?.name ?? "",
    buyerPhone: buyer?.phone ?? "",
    items: items.map(i => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      imageUrl: i.imageUrl,
    })),
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const { role, status } = req.query as Record<string, string>;
  const userId = req.user!.userId;

  let conditions: ReturnType<typeof eq>[] = [];

  if (role === "seller") {
    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.ownerId, userId));
    if (!shop) { res.json([]); return; }
    conditions.push(eq(ordersTable.shopId, shop.id));
  } else {
    conditions.push(eq(ordersTable.buyerId, userId));
  }
  if (status) conditions.push(eq(ordersTable.status, status));

  const orders = conditions.length > 0
    ? await db.select().from(ordersTable).where(and(...conditions)).orderBy(desc(ordersTable.createdAt))
    : await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));

  const enriched = await Promise.all(orders.map(enrichOrder));
  res.json(enriched);
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { shopId, fulfillmentType, note, deliveryAddress, items } = parsed.data;
  if (!items || items.length === 0) {
    res.status(400).json({ error: "Order must have at least one item" });
    return;
  }

  let totalAmount = 0;
  const resolvedItems = [];
  for (const item of items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) {
      res.status(400).json({ error: `Product ${item.productId} not found` });
      return;
    }
    totalAmount += product.price * item.quantity;
    resolvedItems.push({ ...item, product });
  }

  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
  const [order] = await db.insert(ordersTable).values({
    orderNumber: generateOrderNumber(),
    buyerId: req.user!.userId,
    shopId,
    status: "pending",
    fulfillmentType,
    totalAmount,
    note: note ?? null,
    deliveryAddress: deliveryAddress ?? null,
    expiresAt,
  }).returning();

  await db.insert(orderItemsTable).values(
    resolvedItems.map(i => ({
      orderId: order.id,
      productId: i.productId,
      productName: i.product.name,
      quantity: i.quantity,
      unitPrice: i.product.price,
      imageUrl: i.product.imageUrl ?? null,
    }))
  );

  const enriched = await enrichOrder(order);
  res.status(201).json(enriched);
});

router.get("/orders/:orderId", requireAuth, async (req, res): Promise<void> => {
  const orderId = parseInt(Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId, 10);
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const enriched = await enrichOrder(order);
  res.json(enriched);
});

router.patch("/orders/:orderId/status", requireAuth, async (req, res): Promise<void> => {
  const orderId = parseInt(Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId, 10);
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.status === "cancelled") {
    const [order] = await db.update(ordersTable)
      .set({ status: "cancelled" })
      .where(and(eq(ordersTable.id, orderId), or(eq(ordersTable.buyerId, req.user!.userId))))
      .returning();
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    const enriched = await enrichOrder(order);
    res.json(enriched);
    return;
  }

  const [order] = await db.update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, orderId))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const enriched = await enrichOrder(order);
  res.json(enriched);
});

export default router;
