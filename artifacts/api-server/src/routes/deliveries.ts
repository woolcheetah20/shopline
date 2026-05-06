import { Router, type IRouter } from "express";
import { db, deliveryRequestsTable, ordersTable, shopsTable, driversTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateDeliveryRequestBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const DISCLAIMER = "Shopline is not responsible for missing or damaged items during delivery. Shop owners are responsible for verifying driver trustworthiness before engaging their services.";

const router: IRouter = Router();

async function enrichDelivery(delivery: typeof deliveryRequestsTable.$inferSelect) {
  const [order] = await db.select({ orderNumber: ordersTable.orderNumber })
    .from(ordersTable).where(eq(ordersTable.id, delivery.orderId));
  const [shop] = await db.select({ name: shopsTable.name })
    .from(shopsTable).where(eq(shopsTable.id, delivery.shopId));
  let driverName = null;
  if (delivery.driverId) {
    const [driverUser] = await db.select({ name: usersTable.name })
      .from(driversTable)
      .leftJoin(usersTable, eq(driversTable.userId, usersTable.id))
      .where(eq(driversTable.id, delivery.driverId));
    driverName = (driverUser as { name?: string })?.name ?? null;
  }
  return {
    ...delivery,
    orderNumber: order?.orderNumber ?? "",
    shopName: shop?.name ?? "",
    driverName,
    disclaimer: DISCLAIMER,
  };
}

router.get("/deliveries", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.userId, userId));
  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.ownerId, userId));

  let deliveries: (typeof deliveryRequestsTable.$inferSelect)[] = [];
  if (driver) {
    deliveries = await db.select().from(deliveryRequestsTable).where(eq(deliveryRequestsTable.driverId, driver.id));
  } else if (shop) {
    deliveries = await db.select().from(deliveryRequestsTable).where(eq(deliveryRequestsTable.shopId, shop.id));
  }

  const enriched = await Promise.all(deliveries.map(enrichDelivery));
  res.json(enriched);
});

router.post("/deliveries", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateDeliveryRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, parsed.data.orderId));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const [shop] = await db.select().from(shopsTable).where(
    and(eq(shopsTable.id, order.shopId), eq(shopsTable.ownerId, req.user!.userId))
  );
  if (!shop) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [delivery] = await db.insert(deliveryRequestsTable).values({
    orderId: parsed.data.orderId,
    shopId: shop.id,
    pickupAddress: shop.address,
    deliveryAddress: parsed.data.deliveryAddress,
    fee: parsed.data.fee ?? null,
    note: parsed.data.note ?? null,
    status: "pending",
  }).returning();

  const enriched = await enrichDelivery(delivery);
  res.status(201).json(enriched);
});

router.post("/deliveries/:deliveryId/accept", requireAuth, async (req, res): Promise<void> => {
  const deliveryId = parseInt(Array.isArray(req.params.deliveryId) ? req.params.deliveryId[0] : req.params.deliveryId, 10);
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.userId, req.user!.userId));
  if (!driver) {
    res.status(403).json({ error: "Must be registered as a driver" });
    return;
  }
  const [delivery] = await db.update(deliveryRequestsTable)
    .set({ driverId: driver.id, status: "accepted" })
    .where(and(eq(deliveryRequestsTable.id, deliveryId), eq(deliveryRequestsTable.status, "pending")))
    .returning();
  if (!delivery) {
    res.status(404).json({ error: "Delivery not found or not available" });
    return;
  }
  const enriched = await enrichDelivery(delivery);
  res.json(enriched);
});

router.post("/deliveries/:deliveryId/complete", requireAuth, async (req, res): Promise<void> => {
  const deliveryId = parseInt(Array.isArray(req.params.deliveryId) ? req.params.deliveryId[0] : req.params.deliveryId, 10);
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.userId, req.user!.userId));
  if (!driver) {
    res.status(403).json({ error: "Must be registered as a driver" });
    return;
  }
  const [delivery] = await db.update(deliveryRequestsTable)
    .set({ status: "completed" })
    .where(and(eq(deliveryRequestsTable.id, deliveryId), eq(deliveryRequestsTable.driverId, driver.id)))
    .returning();
  if (!delivery) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }
  await db.update(driversTable).set({ totalDeliveries: driver.totalDeliveries + 1 }).where(eq(driversTable.id, driver.id));
  const enriched = await enrichDelivery(delivery);
  res.json(enriched);
});

export default router;
