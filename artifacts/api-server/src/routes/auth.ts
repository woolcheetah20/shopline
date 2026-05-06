import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody, SwitchRoleBody } from "@workspace/api-zod";
import { signToken, requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function userResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    activeRole: user.activeRole,
    isAdmin: user.isAdmin,
    isBanned: user.isBanned,
    createdAt: user.createdAt,
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, phone, password, role } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (existing.length > 0) {
    res.status(409).json({ error: "Phone number already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    name,
    phone,
    passwordHash,
    role,
    activeRole: role,
  }).returning();

  const token = signToken({ userId: user.id, phone: user.phone, activeRole: user.activeRole, isAdmin: user.isAdmin });
  res.status(201).json({ user: userResponse(user), token });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phone, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (!user) {
    res.status(401).json({ error: "Invalid phone or password" });
    return;
  }

  if (user.isBanned) {
    res.status(403).json({ error: "Your account has been suspended. Contact support." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid phone or password" });
    return;
  }

  const token = signToken({ userId: user.id, phone: user.phone, activeRole: user.activeRole, isAdmin: user.isAdmin });
  res.json({ user: userResponse(user), token });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  if (user.isBanned) {
    res.status(403).json({ error: "Account suspended" });
    return;
  }
  res.json(userResponse(user));
});

router.post("/auth/switch-role", requireAuth, async (req, res): Promise<void> => {
  const parsed = SwitchRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db.update(usersTable)
    .set({ activeRole: parsed.data.role, role: parsed.data.role })
    .where(eq(usersTable.id, req.user!.userId))
    .returning();

  const token = signToken({ userId: user.id, phone: user.phone, activeRole: user.activeRole, isAdmin: user.isAdmin });
  res.json({ user: userResponse(user), token });
});

export default router;
