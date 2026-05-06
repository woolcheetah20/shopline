import { Router, type IRouter } from "express";
import { db, productsTable, shopsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateProductBody, UpdateProductBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/shops/:shopId/products", async (req, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId, 10);
  const { status } = req.query as Record<string, string>;

  let products;
  if (status) {
    products = await db.select().from(productsTable).where(
      and(eq(productsTable.shopId, shopId), eq(productsTable.stockStatus, status))
    );
  } else {
    products = await db.select().from(productsTable).where(eq(productsTable.shopId, shopId));
  }
  res.json(products);
});

router.post("/shops/:shopId/products", requireAuth, async (req, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId, 10);
  const [shop] = await db.select().from(shopsTable).where(
    and(eq(shopsTable.id, shopId), eq(shopsTable.ownerId, req.user!.userId))
  );
  if (!shop) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db.insert(productsTable).values({
    ...parsed.data,
    shopId,
    currency: parsed.data.currency ?? "GHS",
  }).returning();

  res.status(201).json(product);
});

router.patch("/shops/:shopId/products/:productId", requireAuth, async (req, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId, 10);
  const productId = parseInt(Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId, 10);

  const [shop] = await db.select().from(shopsTable).where(
    and(eq(shopsTable.id, shopId), eq(shopsTable.ownerId, req.user!.userId))
  );
  if (!shop) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== null && v !== undefined) updateData[k] = v;
  }

  const [product] = await db.update(productsTable).set(updateData).where(
    and(eq(productsTable.id, productId), eq(productsTable.shopId, shopId))
  ).returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(product);
});

router.delete("/shops/:shopId/products/:productId", requireAuth, async (req, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId, 10);
  const productId = parseInt(Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId, 10);

  const [shop] = await db.select().from(shopsTable).where(
    and(eq(shopsTable.id, shopId), eq(shopsTable.ownerId, req.user!.userId))
  );
  if (!shop) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(productsTable).where(
    and(eq(productsTable.id, productId), eq(productsTable.shopId, shopId))
  );

  res.json({ success: true });
});

export default router;
