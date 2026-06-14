import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended for Lokiq with phone, role (customer/provider/admin), and address.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "provider"]).default("user").notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }).default("Hyderabad"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Services table - Electrician, Plumber, AC Repair
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  startingPrice: int("startingPrice"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Providers table - service professionals
 */
export const providers = mysqlTable("providers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  serviceId: int("serviceId").notNull(),
  experienceYears: int("experienceYears").default(0),
  aadhaarVerified: int("aadhaarVerified").default(0),
  isVerified: int("isVerified").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalJobs: int("totalJobs").default(0),
  completedJobs: int("completedJobs").default(0),
  availability: mysqlEnum("availability", ["available", "busy", "offline"]).default("available"),
  bio: text("bio"),
  city: varchar("city", { length: 100 }).default("Hyderabad"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Provider = typeof providers.$inferSelect;
export type InsertProvider = typeof providers.$inferInsert;

/**
 * Bookings table - service requests from customers
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: varchar("bookingId", { length: 20 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  serviceId: int("serviceId").notNull(),
  providerId: int("providerId"),
  status: mysqlEnum("status", ["pending", "assigned", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  address: text("address").notNull(),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  issueDescription: text("issueDescription").notNull(),
  preferredTime: varchar("preferredTime", { length: 100 }),
  aiClassification: varchar("aiClassification", { length: 50 }),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Reviews table - customer ratings for providers
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  customerId: int("customerId").notNull(),
  providerId: int("providerId").notNull(),
  rating: int("rating").notNull(),
  reviewText: text("reviewText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Provider documents table - verification documents
 */
export const providerDocuments = mysqlTable("provider_documents", {
  id: int("id").autoincrement().primaryKey(),
  providerId: int("providerId").notNull(),
  documentType: varchar("documentType", { length: 50 }).notNull(),
  fileUrl: text("fileUrl"),
  verified: int("verified").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProviderDocument = typeof providerDocuments.$inferSelect;
export type InsertProviderDocument = typeof providerDocuments.$inferInsert;
