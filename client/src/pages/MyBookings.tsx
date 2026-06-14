import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileNav } from "@/components/MobileNav";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Clock, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  assigned: { label: "Assigned", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-700", icon: Loader2 },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function MyBookings() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: bookings, isLoading } = trpc.bookings.myBookings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm">
          <h2 className="font-heading text-xl font-semibold mb-2">Sign in to View Bookings</h2>
          <p className="text-muted-foreground mb-4">You need to sign in to see your bookings.</p>
          <a href={getLoginUrl()}>
            <Button className="bg-[#1E40AF]">Sign In</Button>
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14">
          <Calendar className="w-5 h-5 mr-2 text-[#1E40AF]" />
          <h1 className="font-heading text-lg font-semibold">My Bookings</h1>
        </div>
      </header>

      <div className="container py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-heading text-lg font-semibold mb-2">No Bookings Yet</h3>
            <p className="text-muted-foreground mb-6">Book your first service to get started</p>
            <Link href="/book">
              <Button className="bg-[#1E40AF]">Book a Service</Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {bookings.map((item, index) => {
              const status = statusConfig[item.booking.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <motion.div
                  key={item.booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/bookings/${item.booking.bookingId}`}>
                    <Card className="p-4 hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{item.service.name}</h3>
                            <Badge variant="secondary" className={`text-xs ${status.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                            {item.booking.issueDescription}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.booking.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric"
                            })}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground mt-1" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <MobileNav />
    </div>
  );
}
