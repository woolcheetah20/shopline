import { Router, type IRouter } from "express";
import { db, driversTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterDriverBody, UpdateDriverAvailabilityBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

async function enrichDriver(driver: typeof driversTable.$inferSelect) {
  const [user] = await db.select({ name: usersTable.name, phone: usersTable.phone })
    .from(usersTable).where(eq(usersTable.id, driver.userId));
  return {
    ...driver,
    name: user?.name ?? "",
    phone: user?.phone ?? "",
  };
}

router.post("/drivers/register", requireAuth, async (req, res): Promise<void> => {
  const parsed = RegisterDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const existing = await db.select().from(driversTable).where(eq(driversTable.userId, req.user!.userId));
  if (existing.length > 0) {
    res.status(409).json({ error: "Already registered as driver" });
    return;
  }
  const [driver] = await db.insert(driversTable).values({
    userId: req.user!.userId,
    vehicleType: parsed.data.vehicleType,
    vehicleDescription: parsed.data.vehicleDescription ?? null,
    isAvailable: true,
    totalDeliveries: 0,
  }).returning();
  const enriched = await enrichDriver(driver);
  res.status(201).json(enriched);
});

router.get("/drivers/me", requireAuth, async (req, res): Promise<void> => {
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.userId, req.user!.userId));
  if (!driver) {
    res.status(404).json({ error: "No driver profile found" });
    return;
  }
  const enriched = await enrichDriver(driver);
  res.json(enriched);
});

router.patch("/drivers/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateDriverAvailabilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.isAvailable !== null && parsed.data.isAvailable !== undefined) updateData.isAvailable = parsed.data.isAvailable;
  if (parsed.data.vehicleType !== null && parsed.data.vehicleType !== undefined) updateData.vehicleType = parsed.data.vehicleType;
  if (parsed.data.vehicleDescription !== null && parsed.data.vehicleDescription !== undefined) updateData.vehicleDescription = parsed.data.vehicleDescription;

  const [driver] = await db.update(driversTable).set(updateData)
    .where(eq(driversTable.userId, req.user!.userId)).returning();
  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }
  const enriched = await enrichDriver(driver);
  res.json(enriched);
});

router.get("/drivers/available", requireAuth, async (_req, res): Promise<void> => {
  const drivers = await db.select().from(driversTable).where(eq(driversTable.isAvailable, true));
  const enriched = await Promise.all(drivers.map(enrichDriver));
  res.json(enriched);
});

export default router;
