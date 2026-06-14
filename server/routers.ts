import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertUser({ openId: ctx.user.openId, ...input });
        return { success: true };
      }),
  }),

  services: router({
    list: publicProcedure.query(async () => {
      return db.getAllServices();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getServiceById(input.id);
      }),
  }),

  providers: router({
    byService: publicProcedure
      .input(z.object({ serviceId: z.number() }))
      .query(async ({ input }) => {
        return db.getProvidersByService(input.serviceId);
      }),
    myProfile: protectedProcedure.query(async ({ ctx }) => {
      return db.getProviderByUserId(ctx.user.id);
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getProviderById(input.id);
      }),
    register: protectedProcedure
      .input(z.object({
        serviceId: z.number(),
        experienceYears: z.number().optional(),
        bio: z.string().optional(),
        city: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createProvider({
          userId: ctx.user.id,
          serviceId: input.serviceId,
          experienceYears: input.experienceYears,
          bio: input.bio,
          city: input.city,
        });
        return { success: true };
      }),
    updateAvailability: protectedProcedure
      .input(z.object({ availability: z.enum(["available", "busy", "offline"]) }))
      .mutation(async ({ ctx, input }) => {
        const provider = await db.getProviderByUserId(ctx.user.id);
        if (!provider) throw new Error("Provider not found");
        await db.updateProviderAvailability(provider.id, input.availability);
        return { success: true };
      }),
    reviews: publicProcedure
      .input(z.object({ providerId: z.number() }))
      .query(async ({ input }) => {
        return db.getReviewsByProvider(input.providerId);
      }),
  }),

  bookings: router({
    create: protectedProcedure
      .input(z.object({
        serviceId: z.number(),
        address: z.string(),
        lat: z.string().optional(),
        lng: z.string().optional(),
        issueDescription: z.string(),
        preferredTime: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const bookingId = `LKQ-${nanoid(8).toUpperCase()}`;
        
        // AI Classification
        let aiClassification: string | undefined;
        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a service classification assistant. Classify the customer issue into exactly one of: Electrician, Plumber, AC Repair. Return ONLY the category name, nothing else." },
              { role: "user", content: input.issueDescription },
            ],
          });
          const rawContent = response?.choices?.[0]?.message?.content;
          const content = typeof rawContent === 'string' ? rawContent.trim() : undefined;
          if (content && ["Electrician", "Plumber", "AC Repair"].includes(content)) {
            aiClassification = content;
          }
        } catch (e) {
          console.warn("AI classification failed:", e);
        }

        await db.createBooking({
          bookingId,
          customerId: ctx.user.id,
          serviceId: input.serviceId,
          address: input.address,
          lat: input.lat,
          lng: input.lng,
          issueDescription: input.issueDescription,
          preferredTime: input.preferredTime,
          aiClassification,
        });

        // Notify owner/admin about new booking
        try {
          const service = await db.getServiceById(input.serviceId);
          await notifyOwner({
            title: `New Booking: ${bookingId}`,
            content: `New ${service?.name || "service"} booking from ${ctx.user.name || "Customer"}.\nIssue: ${input.issueDescription.substring(0, 100)}\nAddress: ${input.address.substring(0, 100)}`,
          });
        } catch (e) {
          console.warn("Owner notification failed:", e);
        }

        return { bookingId, aiClassification };
      }),
    myBookings: protectedProcedure.query(async ({ ctx }) => {
      return db.getBookingsByCustomer(ctx.user.id);
    }),
    providerBookings: protectedProcedure.query(async ({ ctx }) => {
      const provider = await db.getProviderByUserId(ctx.user.id);
      if (!provider) return [];
      return db.getBookingsByProvider(provider.id);
    }),
    getById: protectedProcedure
      .input(z.object({ bookingId: z.string() }))
      .query(async ({ input }) => {
        return db.getBookingById(input.bookingId);
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        bookingId: z.string(),
        status: z.enum(["pending", "assigned", "in_progress", "completed", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateBookingStatus(input.bookingId, input.status);
        return { success: true };
      }),
  }),

  reviews: router({
    create: protectedProcedure
      .input(z.object({
        bookingId: z.string(),
        providerId: z.number(),
        rating: z.number().min(1).max(5),
        reviewText: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createReview({
          bookingId: input.bookingId,
          customerId: ctx.user.id,
          providerId: input.providerId,
          rating: input.rating,
          reviewText: input.reviewText,
        });
        return { success: true };
      }),
    getByBooking: protectedProcedure
      .input(z.object({ bookingId: z.string() }))
      .query(async ({ input }) => {
        return db.getReviewByBooking(input.bookingId);
      }),
  }),

  admin: router({
    stats: adminProcedure.query(async () => {
      return db.getAdminStats();
    }),
    allBookings: adminProcedure.query(async () => {
      return db.getAllBookings();
    }),
    allProviders: adminProcedure.query(async () => {
      return db.getAllProviders();
    }),
    assignProvider: adminProcedure
      .input(z.object({
        bookingId: z.string(),
        providerId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.assignProviderToBooking(input.bookingId, input.providerId);
        return { success: true };
      }),
    verifyProvider: adminProcedure
      .input(z.object({ providerId: z.number() }))
      .mutation(async ({ input }) => {
        await db.verifyProvider(input.providerId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
