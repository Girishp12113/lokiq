import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Phone, User, CheckCircle2 } from "lucide-react";

export default function ProviderJobDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: bookingData, isLoading } = trpc.bookings.getById.useQuery(
    { bookingId: params.id || "" },
    { enabled: !!params.id }
  );
  const updateStatus = trpc.bookings.updateStatus.useMutation();
  const utils = trpc.useUtils();

  const handleStatusUpdate = async (status: "in_progress" | "completed") => {
    if (!params.id) return;
    try {
      await updateStatus.mutateAsync({ bookingId: params.id, status });
      toast.success(status === "completed" ? "Job marked as completed!" : "Job started!");
      utils.bookings.getById.invalidate({ bookingId: params.id });
      utils.bookings.providerBookings.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border/50">
          <div className="container flex items-center h-14"><Skeleton className="w-32 h-6" /></div>
        </header>
        <div className="container py-6 space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="font-heading text-lg font-semibold mb-2">Job Not Found</h2>
          <Link href="/provider"><Button variant="outline">Back to Dashboard</Button></Link>
        </Card>
      </div>
    );
  }

  const { booking, service, customer } = bookingData;

  return (
    <div className="min-h-screen bg-background pb-6">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14">
          <Link href="/provider"><Button variant="ghost" size="sm" className="mr-2"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-heading text-lg font-semibold">Job Details</h1>
        </div>
      </header>

      <div className="container py-6 space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5">
            <h3 className="font-heading text-lg font-semibold mb-1">{service.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{booking.issueDescription}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{booking.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{customer.name || "Customer"}</span>
              </div>
              {booking.preferredTime && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Preferred:</span>
                  <span>{booking.preferredTime}</span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Actions */}
        {booking.status === "assigned" && (
          <div className="flex gap-3">
            <Button className="flex-1 bg-[#1E40AF] hover:bg-[#1E40AF]/90 h-12" onClick={() => handleStatusUpdate("in_progress")}>
              Start Job
            </Button>
          </div>
        )}
        {booking.status === "in_progress" && (
          <Button className="w-full bg-[#10B981] hover:bg-[#10B981]/90 h-12" onClick={() => handleStatusUpdate("completed")}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Completed
          </Button>
        )}
        {booking.status === "completed" && (
          <Card className="p-4 bg-[#10B981]/5 border-[#10B981]/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              <span className="font-medium text-[#10B981]">Job Completed</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
