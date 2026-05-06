import { Router, type IRouter } from "express";
import { db, usersTable, shopsTable, ordersTable, productsTable } from "@workspace/db";
import { eq, count, sum, desc } from "drizzle-orm";
import { requireAdmin, requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Bootstrap: make the requesting user admin if no admin exists yet
router.post("/admin/bootstrap", requireAuth, async (req, res): Promise<void> => {
  const admins = await db.select().from(usersTable).where(eq(usersTable.isAdmin, true));
  if (admins.length > 0) {
    res.status(403).json({ error: "Admin already exists. Contact the current admin." });
    return;
  }
  const [user] = await db.update(usersTable)
    .set({ isAdmin: true })
    .where(eq(usersTable.id, req.user!.userId))
    .returning();
  res.json({ message: "You are now admin. Please log out and log back in.", user: { id: user.id, name: user.name, isAdmin: user.isAdmin } });
});

// List all users
router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    phone: usersTable.phone,
    role: usersTable.role,
    activeRole: usersTable.activeRole,
    isAdmin: usersTable.isAdmin,
    isBanned: usersTable.isBanned,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users);
});

// Ban or unban a user
router.patch("/admin/users/:userId", requireAdmin, async (req, res): Promise<void> => {
  const userId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId, 10);
  const { isBanned, isAdmin } = req.body as { isBanned?: boolean; isAdmin?: boolean };

  if (userId === req.user!.userId) {
    res.status(400).json({ error: "Cannot modify your own admin status" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (typeof isBanned === "boolean") updates.isBanned = isBanned;
  if (typeof isAdmin === "boolean") updates.isAdmin = isAdmin;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, name: user.name, isBanned: user.isBanned, isAdmin: user.isAdmin });
});

// Platform stats for admin
router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [totalUsers] = await db.select({ count: count() }).from(usersTable);
  const [totalShops] = await db.select({ count: count() }).from(shopsTable);
  const [totalOrders] = await db.select({ count: count() }).from(ordersTable);
  const [totalProducts] = await db.select({ count: count() }).from(productsTable);
  const [totalRevenue] = await db.select({ sum: sum(ordersTable.totalAmount) }).from(ordersTable);
  const [bannedUsers] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.isBanned, true));

  res.json({
    totalUsers: totalUsers.count,
    totalShops: totalShops.count,
    totalOrders: totalOrders.count,
    totalProducts: totalProducts.count,
    totalRevenue: Number(totalRevenue.sum ?? 0),
    bannedUsers: bannedUsers.count,
  });
});

export default router;
