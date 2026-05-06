import { Router, type IRouter } from "express";
import { db, shopsTable, reviewsTable, usersTable } from "@workspace/db";
import { eq, like, avg, count, and, sql, or } from "drizzle-orm";
import { CreateShopBody, UpdateShopBody, CreateReviewBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 7);
}

async function enrichShop(shop: typeof shopsTable.$inferSelect) {
  const reviews = await db.select({ avg: avg(reviewsTable.rating), count: count() })
    .from(reviewsTable).where(eq(reviewsTable.shopId, shop.id));
  return {
    ...shop,
    averageRating: reviews[0]?.avg ? Number(reviews[0].avg) : null,
    totalReviews: reviews[0]?.count ?? 0,
  };
}

router.get("/shops", async (req, res): Promise<void> => {
  const { category, search } = req.query as Record<string, string>;
  let query = db.select().from(shopsTable);

  const conditions = [];
  if (category) conditions.push(eq(shopsTable.category, category));
  if (search) conditions.push(
    or(
      like(shopsTable.name, `%${search}%`),
      like(shopsTable.description, `%${search}%`)
    )
  );

  const shops = conditions.length > 0
    ? await db.select().from(shopsTable).where(and(...conditions))
    : await db.select().from(shopsTable);

  const enriched = await Promise.all(shops.map(enrichShop));
  res.json(enriched);
});

router.post("/shops", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateShopBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const slug = generateSlug(parsed.data.name);
  const [shop] = await db.insert(shopsTable).values({
    ...parsed.data,
    ownerId: req.user!.userId,
    shareableSlug: slug,
  }).returning();

  const enriched = await enrichShop(shop);
  res.status(201).json(enriched);
});

router.get("/shops/my", requireAuth, async (req, res): Promise<void> => {
  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.ownerId, req.user!.userId));
  if (!shop) {
    res.status(404).json({ error: "No shop found" });
    return;
  }
  const enriched = await enrichShop(shop);
  res.json(enriched);
});

router.get("/shops/:shopId", async (req, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId, 10);
  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, shopId));
  if (!shop) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }
  const enriched = await enrichShop(shop);
  res.json(enriched);
});

router.patch("/shops/:shopId", requireAuth, async (req, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId, 10);
  const parsed = UpdateShopBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== null && v !== undefined) updateData[k] = v;
  }
  const [shop] = await db.update(shopsTable).set(updateData).where(
    and(eq(shopsTable.id, shopId), eq(shopsTable.ownerId, req.user!.userId))
  ).returning();
  if (!shop) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }
  const enriched = await enrichShop(shop);
  res.json(enriched);
});

router.get("/shops/:shopId/reviews", async (req, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId, 10);
  const reviews = await db.select({
    review: reviewsTable,
    buyer: { name: usersTable.name },
  }).from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.buyerId, usersTable.id))
    .where(eq(reviewsTable.shopId, shopId));

  res.json(reviews.map(r => ({
    ...r.review,
    buyerName: r.buyer?.name ?? "Anonymous",
    tags: r.review.tags ?? [],
  })));
});

router.post("/shops/:shopId/reviews", requireAuth, async (req, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId, 10);
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  const [review] = await db.insert(reviewsTable).values({
    shopId,
    buyerId: req.user!.userId,
    orderId: parsed.data.orderId,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
    tags: parsed.data.tags ?? [],
  }).returning();

  res.status(201).json({
    ...review,
    buyerName: user?.name ?? "Anonymous",
    tags: review.tags ?? [],
  });
});

export default router;
