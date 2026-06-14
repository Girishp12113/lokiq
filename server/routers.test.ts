import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user?: Partial<AuthenticatedUser>): TrpcContext {
  const defaultUser: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    phone: "9876543210",
    loginMethod: "manus",
    role: "user",
    address: null,
    city: "Hyderabad",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: user ? { ...defaultUser, ...user } : defaultUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createContext({ role: "admin", openId: "admin-user-123", id: 99 });
}

function createProviderContext(): TrpcContext {
  return createContext({ role: "provider", openId: "provider-user-123", id: 50 });
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns the current user for authenticated requests", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.openId).toBe("test-user-123");
    expect(result?.name).toBe("Test User");
  });

  it("returns null for unauthenticated requests", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and returns success", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalledWith(
      COOKIE_NAME,
      expect.objectContaining({ maxAge: -1 })
    );
  });
});

describe("services.list", () => {
  it("returns a list of services (public endpoint)", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.services.list();
    expect(Array.isArray(result)).toBe(true);
    // Should have our 3 seeded services
    expect(result.length).toBeGreaterThanOrEqual(3);
    const names = result.map(s => s.name);
    expect(names).toContain("Electrician");
    expect(names).toContain("Plumber");
    expect(names).toContain("AC Repair");
  });
});

describe("services.getById", () => {
  it("returns a specific service by ID", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.services.getById({ id: 1 });
    expect(result).toBeDefined();
    expect(result?.name).toBe("Electrician");
  });

  it("returns undefined for non-existent service", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.services.getById({ id: 9999 });
    expect(result).toBeUndefined();
  });
});

describe("admin.stats", () => {
  it("rejects non-admin users", async () => {
    const ctx = createContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("returns stats for admin users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.stats();
    expect(result).toHaveProperty("totalBookings");
    expect(result).toHaveProperty("totalProviders");
    expect(result).toHaveProperty("completionRate");
    expect(result).toHaveProperty("avgRating");
    expect(result).toHaveProperty("pendingBookings");
  });
});

describe("admin.allBookings", () => {
  it("rejects non-admin users", async () => {
    const ctx = createContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.allBookings()).rejects.toThrow();
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.allBookings()).rejects.toThrow();
  });
});

describe("providers.byService", () => {
  it("returns providers for a given service (public)", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.providers.byService({ serviceId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("bookings.create", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.bookings.create({
        serviceId: 1,
        address: "Test Address",
        issueDescription: "Test issue",
      })
    ).rejects.toThrow();
  });

  it("creates a booking for authenticated users", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bookings.create({
      serviceId: 1,
      address: "123 Test Street, Hyderabad",
      issueDescription: "My fan is not working and there are sparks from the switch",
    });
    expect(result).toHaveProperty("bookingId");
    expect(result.bookingId).toMatch(/^LKQ-/);
  });
});

describe("bookings.myBookings", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.bookings.myBookings()).rejects.toThrow();
  });

  it("returns bookings for authenticated users", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bookings.myBookings();
    expect(Array.isArray(result)).toBe(true);
  });
});
