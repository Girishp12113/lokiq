import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { MobileNav } from "@/components/MobileNav";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Loader2, XCircle, Star, MapPin, Phone } from "lucide-react";

const statusSteps = [
  { key: "pending", label: "Booking Submitted", icon: Clock },
  { key: "assigned", label: "Provider Assigned", icon: AlertCircle },
  { key: "in_progress", label: "In Progress", icon: Loader2 },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
];

const statusOrder = ["pending", "assigned", "in_progress", "completed", "cancelled"];

export default function BookingDetail() {
  const params = useParams<{ id: string }>();
  const { data: bookingData, isLoading } = trpc.bookings.getById.useQuery(
    { bookingId: params.id || "" },
    { enabled: !!params.id }
  );
  const { data: existingReview } = trpc.reviews.getByBooking.useQuery(
    { bookingId: bookingData?.booking?.id || 0 },
    { enabled: !!bookingData?.booking?.id && bookingData?.booking?.status === "completed" }
  );
  const createReview = trpc.reviews.create.useMutation();
  const utils = trpc.useUtils();

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [showReview, setShowReview] = useState(false);

  const handleSubmitReview = async () => {
    if (!bookingData?.booking?.providerId || rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    try {
      await createReview.mutateAsync({
        bookingId: bookingData.booking.id,
        providerId: bookingData.booking.providerId,
        rating,
        reviewText: reviewText || undefined,
      });
      toast.success("Review submitted! Thank you.");
      setShowReview(false);
      utils.reviews.getByBooking.invalidate({ bookingId: bookingData.booking.id });
    } catch (e: any) {
      toast.error(e.message || "Failed to submit review");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border/50">
          <div className="container flex items-center h-14">
            <Skeleton className="w-24 h-6" />
          </div>
        </header>
        <div className="container py-6 space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="font-heading text-lg font-semibold mb-2">Booking Not Found</h2>
          <Link href="/bookings"><Button variant="outline">Back to Bookings</Button></Link>
        </Card>
      </div>
    );
  }

  const { booking, service, customer } = bookingData;
  const currentStepIndex = statusOrder.indexOf(booking.status);
  const isCancelled = booking.status === "cancelled";

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14">
          <Link href="/bookings">
            <Button variant="ghost" size="sm" className="mr-2"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="font-heading text-lg font-semibold">Booking Details</h1>
        </div>
      </header>

      <div className="container py-6 space-y-4">
        {/* Booking Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold">{service.name}</h3>
              <span className="text-xs font-mono text-muted-foreground">{booking.bookingId}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{booking.issueDescription}</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span className="line-clamp-1">{booking.address}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Booked on {new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </Card>
        </motion.div>

        {/* Status Timeline */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-4">Status</h3>
            {isCancelled ? (
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-red-700">This booking has been cancelled</span>
              </div>
            ) : (
              <div className="space-y-4">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const StepIcon = step.icon;
                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? "bg-[#10B981] text-white" : "bg-muted text-muted-foreground"} ${isCurrent ? "ring-2 ring-[#10B981]/30" : ""}`}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        {index < statusSteps.length - 1 && (
                          <div className={`w-0.5 h-6 mt-1 ${isCompleted && index < currentStepIndex ? "bg-[#10B981]" : "bg-border"}`} />
                        )}
                      </div>
                      <div className="pt-1">
                        <p className={`text-sm font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-[#10B981] mt-0.5">Current status</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Review Section */}
        {booking.status === "completed" && booking.providerId && !existingReview && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-5">
              {!showReview ? (
                <div className="text-center">
                  <h3 className="font-heading font-semibold mb-2">How was the service?</h3>
                  <p className="text-sm text-muted-foreground mb-4">Rate your experience to help others</p>
                  <Button className="bg-[#1E40AF]" onClick={() => setShowReview(true)}>Leave a Review</Button>
                </div>
              ) : (
                <div>
                  <h3 className="font-heading font-semibold mb-4">Rate the Service</h3>
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setRating(star)} className="transition-transform active:scale-90">
                        <Star className={`w-8 h-8 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Share your experience (optional)..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="mb-4"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowReview(false)}>Cancel</Button>
                    <Button className="flex-1 bg-[#1E40AF]" onClick={handleSubmitReview} disabled={createReview.isPending}>
                      {createReview.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {existingReview && (
          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-2">Your Review</h3>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`w-4 h-4 ${star <= existingReview.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
              ))}
            </div>
            {existingReview.reviewText && <p className="text-sm text-muted-foreground">{existingReview.reviewText}</p>}
          </Card>
        )}
      </div>

      <MobileNav />
    </div>
  );
}
