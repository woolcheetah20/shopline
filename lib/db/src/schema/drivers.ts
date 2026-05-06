import { pgTable, text, serial, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const driversTable = pgTable("drivers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  vehicleType: text("vehicle_type").notNull(),
  vehicleDescription: text("vehicle_description"),
  isAvailable: boolean("is_available").notNull().default(true),
  totalDeliveries: integer("total_deliveries").notNull().default(0),
  rating: real("rating"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const deliveryRequestsTable = pgTable("delivery_requests", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  shopId: integer("shop_id").notNull(),
  driverId: integer("driver_id"),
  pickupAddress: text("pickup_address").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  status: text("status").notNull().default("pending"),
  fee: real("fee"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDriverSchema = createInsertSchema(driversTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof driversTable.$inferSelect;
export type DeliveryRequest = typeof deliveryRequestsTable.$inferSelect;
