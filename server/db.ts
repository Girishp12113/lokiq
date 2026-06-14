import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, services, providers, bookings, reviews, providerDocuments } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone", "address", "city"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      (values as any)[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ SERVICES ============

export async function getAllServices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(services);
}

export async function getServiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result[0];
}

// ============ PROVIDERS ============

export async function getProvidersByService(serviceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    provider: providers,
    user: users,
  }).from(providers)
    .innerJoin(users, eq(providers.userId, users.id))
    .where(and(eq(providers.serviceId, serviceId), eq(providers.isVerified, 1)));
}

export async function getProviderByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(providers).where(eq(providers.userId, userId)).limit(1);
  return result[0];
}

export async function getProviderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    provider: providers,
    user: users,
  }).from(providers)
    .innerJoin(users, eq(providers.userId, users.id))
    .where(eq(providers.id, id)).limit(1);
  return result[0];
}

export async function getAllProviders() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    provider: providers,
    user: users,
    service: services,
  }).from(providers)
    .innerJoin(users, eq(providers.userId, users.id))
    .innerJoin(services, eq(providers.serviceId, services.id));
}

export async function createProvider(data: { userId: number; serviceId: number; experienceYears?: number; bio?: string; city?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(providers).values(data);
  // Update user role to provider
  await db.update(users).set({ role: "provider" }).where(eq(users.id, data.userId));
}

export async function verifyProvider(providerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(providers).set({ isVerified: 1, aadhaarVerified: 1 }).where(eq(providers.id, providerId));
}

export async function updateProviderAvailability(providerId: number, availability: "available" | "busy" | "offline") {
  const db = await getDb();
  if (!db) return;
  await db.update(providers).set({ availability }).where(eq(providers.id, providerId));
}

// ============ BOOKINGS ============

export async function createBooking(data: {
  bookingId: string;
  customerId: number;
  serviceId: number;
  address: string;
  lat?: string;
  lng?: string;
  issueDescription: string;
  preferredTime?: string;
  aiClassification?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(bookings).values(data);
}

export async function getBookingsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    booking: bookings,
    service: services,
  }).from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.customerId, customerId))
    .orderBy(desc(bookings.createdAt));
}

export async function getBookingsByProvider(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    booking: bookings,
    service: services,
    customer: users,
  }).from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(users, eq(bookings.customerId, users.id))
    .where(eq(bookings.providerId, providerId))
    .orderBy(desc(bookings.createdAt));
}

export async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    booking: bookings,
    service: services,
    customer: users,
  }).from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(users, eq(bookings.customerId, users.id))
    .orderBy(desc(bookings.createdAt));
}

export async function getBookingById(bookingId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    booking: bookings,
    service: services,
    customer: users,
  }).from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(users, eq(bookings.customerId, users.id))
    .where(eq(bookings.bookingId, bookingId))
    .limit(1);
  return result[0];
}

export async function assignProviderToBooking(bookingId: string, providerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(bookings).set({ providerId, status: "assigned" }).where(eq(bookings.bookingId, bookingId));
  // Increment provider's totalJobs
  await db.update(providers).set({ totalJobs: sql`${providers.totalJobs} + 1` }).where(eq(providers.id, providerId));
}

export async function updateBookingStatus(bookingId: string, status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) return;
  const updateData: any = { status };
  if (status === "completed") {
    updateData.completedAt = new Date();
  }
  await db.update(bookings).set(updateData).where(eq(bookings.bookingId, bookingId));
  
  // If completed, increment provider's completedJobs
  if (status === "completed") {
    const booking = await db.select().from(bookings).where(eq(bookings.bookingId, bookingId)).limit(1);
    if (booking[0]?.providerId) {
      await db.update(providers).set({ completedJobs: sql`${providers.completedJobs} + 1` }).where(eq(providers.id, booking[0].providerId));
    }
  }
}

// ============ REVIEWS ============

export async function createReview(data: { bookingId: number; customerId: number; providerId: number; rating: number; reviewText?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(reviews).values(data);
  
  // Update provider's average rating
  const providerReviews = await db.select().from(reviews).where(eq(reviews.providerId, data.providerId));
  const avgRating = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
  await db.update(providers).set({ rating: avgRating.toFixed(2) }).where(eq(providers.id, data.providerId));
}

export async function getReviewsByProvider(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    review: reviews,
    customer: users,
  }).from(reviews)
    .innerJoin(users, eq(reviews.customerId, users.id))
    .where(eq(reviews.providerId, providerId))
    .orderBy(desc(reviews.createdAt));
}

export async function getReviewByBooking(bookingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reviews).where(eq(reviews.bookingId, bookingId)).limit(1);
  return result[0];
}

// ============ ADMIN STATS ============

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalBookings: 0, totalProviders: 0, completionRate: 0, avgRating: 0, pendingBookings: 0 };
  
  const allBookings = await db.select().from(bookings);
  const allProviders = await db.select().from(providers);
  const completedBookings = allBookings.filter(b => b.status === "completed");
  const pendingBookings = allBookings.filter(b => b.status === "pending");
  
  const allReviews = await db.select().from(reviews);
  const avgRating = allReviews.length > 0 
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
    : 0;
  
  return {
    totalBookings: allBookings.length,
    totalProviders: allProviders.length,
    completionRate: allBookings.length > 0 ? Math.round((completedBookings.length / allBookings.length) * 100) : 0,
    avgRating: Number(avgRating.toFixed(1)),
    pendingBookings: pendingBookings.length,
  };
}
