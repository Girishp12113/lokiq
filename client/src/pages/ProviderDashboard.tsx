import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Briefcase, CheckCircle2, Clock, Loader2, XCircle, ArrowLeft, MapPin, User, Star } from "lucide-react";

export default function ProviderDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { data: provider, isLoading: providerLoading } = trpc.providers.myProfile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: bookings, isLoading: bookingsLoading } = trpc.bookings.providerBookings.useQuery(undefined, { enabled: isAuthenticated });
  const updateStatus = trpc.bookings.updateStatus.useMutation();
  const utils = trpc.useUtils();

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm">
          <h2 className="font-heading text-xl font-semibold mb-2">Sign In</h2>
          <p className="text-muted-foreground mb-4">Sign in to access your provider dashboard.</p>
          <a href={getLoginUrl()}><Button className="bg-[#1E40AF]">Sign In</Button></a>
        </Card>
      </div>
    );
  }

  if (!authLoading && !providerLoading && !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm">
          <h2 className="font-heading text-xl font-semibold mb-2">Not a Provider</h2>
          <p className="text-muted-foreground mb-4">You haven't registered as a service provider yet.</p>
          <Link href="/provider/onboarding"><Button className="bg-[#1E40AF]">Register as Provider</Button></Link>
        </Card>
      </div>
    );
  }

  const pendingJobs = bookings?.filter(b => b.booking.status === "assigned") || [];
  const activeJobs = bookings?.filter(b => b.booking.status === "in_progress") || [];
  const completedJobs = bookings?.filter(b => b.booking.status === "completed") || [];

  const handleStatusUpdate = async (bookingId: string, status: "in_progress" | "completed" | "cancelled") => {
    try {
      await updateStatus.mutateAsync({ bookingId, status });
      toast.success(`Job ${status === "in_progress" ? "started" : status === "completed" ? "completed" : "cancelled"}`);
      utils.bookings.providerBookings.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center">
            <Link href="/"><Button variant="ghost" size="sm" className="mr-2"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <h1 className="font-heading text-lg font-semibold">Provider Dashboard</h1>
          </div>
          {provider && (
            <Badge variant="secondary" className="bg-[#10B981]/10 text-[#10B981] text-xs">
              {provider.availability}
            </Badge>
          )}
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Stats */}
        {providerLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{pendingJobs.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Pending</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-[#1E40AF]">{activeJobs.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Active</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-[#10B981]">{completedJobs.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </Card>
          </motion.div>
        )}

        {/* Provider Info */}
        {provider && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1E40AF]/10 flex items-center justify-center">
                <User className="w-5 h-5 text-[#1E40AF]" />
              </div>
              <div>
                <p className="font-medium">{user?.name || "Provider"}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{provider.rating || "0.00"}</span>
                  <span>·</span>
                  <span>{provider.completedJobs} jobs done</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Pending Jobs */}
        <div>
          <h2 className="font-heading text-lg font-semibold mb-3">Pending Jobs</h2>
          {bookingsLoading ? (
            <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
          ) : pendingJobs.length === 0 ? (
            <Card className="p-6 text-center">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending jobs right now</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingJobs.map((item) => (
                <motion.div key={item.booking.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{item.service.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.customer.name || "Customer"}</p>
                      </div>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">Assigned</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.booking.issueDescription}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{item.booking.address}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-[#1E40AF] hover:bg-[#1E40AF]/90" onClick={() => handleStatusUpdate(item.booking.bookingId, "in_progress")}>
                        Accept & Start
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 border-red-200" onClick={() => handleStatusUpdate(item.booking.bookingId, "cancelled")}>
                        Decline
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <div>
            <h2 className="font-heading text-lg font-semibold mb-3">Active Jobs</h2>
            <div className="space-y-3">
              {activeJobs.map((item) => (
                <Card key={item.booking.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{item.service.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.customer.name || "Customer"}</p>
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">In Progress</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.booking.issueDescription}</p>
                  <Button size="sm" className="w-full bg-[#10B981] hover:bg-[#10B981]/90" onClick={() => handleStatusUpdate(item.booking.bookingId, "completed")}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Complete
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Jobs */}
        {completedJobs.length > 0 && (
          <div>
            <h2 className="font-heading text-lg font-semibold mb-3">Completed ({completedJobs.length})</h2>
            <div className="space-y-3">
              {completedJobs.slice(0, 5).map((item) => (
                <Card key={item.booking.id} className="p-4 opacity-75">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-sm">{item.service.name}</h3>
                      <p className="text-xs text-muted-foreground">{item.customer.name}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
