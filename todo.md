# Lokiq MVP - Project TODO

## Database & Schema
- [x] Create services table (Electrician, Plumber, AC Repair)
- [x] Create providers table with verification fields
- [x] Create bookings table with status tracking
- [x] Create reviews table (1-5 stars + text)
- [x] Create provider_documents table
- [x] Extend users table with phone, role (customer/provider/admin), address fields

## Authentication & Roles
- [x] Manus OAuth login flow (phone OTP handled via Manus login portal)
- [x] Role-based access control (Customer, Provider, Admin)
- [x] Protected routes per role (page-level guards)
- [x] User profile page with role display and navigation

## Customer Features
- [x] Landing/home page with hero section and trust indicators
- [x] Service category cards (Electrician, Plumber, AC Repair)
- [x] Multi-step booking flow (service → address → issue → confirmation)
- [x] Google Maps Places API autocomplete in address step
- [x] Booking confirmation with booking ID
- [x] Customer bookings dashboard with status badges
- [x] Booking detail page with status timeline (Pending → Assigned → In Progress → Completed → Cancelled)

## Provider Features
- [x] Provider dashboard with pending/active/completed jobs
- [x] Accept & Start / Decline job actions
- [x] Update job status (start, mark complete)
- [x] Provider info card with rating and completed jobs count
- [x] Provider onboarding form

## Admin Features
- [x] Admin dashboard with metrics overview (total bookings, providers, completion rate, rating)
- [x] Booking management with status badges
- [x] Manual provider assignment to pending bookings
- [x] Provider verification queue with verify action

## AI & Intelligence
- [x] AI-powered service classification from issue description (LLM-based)

## Notifications & Alerts
- [x] Owner notification on every new booking (via notifyOwner in booking create)

## Ratings & Reviews
- [x] 1-5 star rating system
- [x] Short text review
- [x] Review prompt shown on booking detail when job is completed

## Design & UX
- [x] Trust Blue #1E40AF and Emerald #10B981 brand colors
- [x] Poppins + Inter typography
- [x] Mobile-first responsive layout
- [x] Framer Motion animations throughout
- [x] Skeleton loaders on every page
- [x] Empty states with icons and CTAs
- [x] Error states via toast notifications
- [x] Success states with animations (booking confirmation, provider registration)
- [x] Bottom navigation for mobile (Home, Bookings, Profile)

## Testing
- [x] Vitest unit tests for core procedures (16 tests passing)
- [x] Booking creation test with AI classification
- [x] Auth flow test (me, logout)
- [x] Admin access control tests
- [x] Services list and getById tests

## Bug Fixes
- [x] Fix login loop: redirect using origin from base64 state param instead of hardcoded "/"
- [x] Fix useAuth localStorage side effect: move localStorage.setItem from useMemo to useEffect
- [x] Fix missing role guards: add role-based redirect in AdminDashboard and ProviderDashboard
- [x] Fix role display bug: show "customer" when role is "user" in Profile.tsx badge
- [x] Fix review bookingId type mismatch: change z.number() to z.string() in reviews.create
