import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, BarChart3, Users, Calendar, CheckCircle2, Star, Shield, Clock, AlertCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  assigned: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: allBookings, isLoading: bookingsLoading } = trpc.admin.allBookings.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: allProviders, isLoading: providersLoading } = trpc.admin.allProviders.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const assignProvider = trpc.admin.assignProvider.useMutation();
  const verifyProvider = trpc.admin.verifyProvider.useMutation();
  const utils = trpc.useUtils();

  const [selectedProvider, setSelectedProvider] = useState<string>("");

  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user && user.role !== "admin"))) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm">
          <h2 className="font-heading text-xl font-semibold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground mb-4">You need admin privileges to access this page.</p>
          <a href={getLoginUrl()}><Button className="bg-[#1E40AF]">Sign In</Button></a>
        </Card>
      </div>
    );
  }

  const handleAssignProvider = async (bookingId: string) => {
    if (!selectedProvider) {
      toast.error("Please select a provider");
      return;
    }
    try {
      await assignProvider.mutateAsync({ bookingId, providerId: parseInt(selectedProvider) });
      toast.success("Provider assigned successfully!");
      utils.admin.allBookings.invalidate();
      setSelectedProvider("");
    } catch (e: any) {
      toast.error(e.message || "Failed to assign provider");
    }
  };

  const handleVerifyProvider = async (providerId: number) => {
    try {
      await verifyProvider.mutateAsync({ providerId });
      toast.success("Provider verified!");
      utils.admin.allProviders.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to verify provider");
    }
  };

  const unverifiedProviders = allProviders?.filter(p => !p.provider.isVerified) || [];

  return (
    <div className="min-h-screen bg-background pb-6">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14">
          <Link href="/"><Button variant="ghost" size="sm" className="mr-2"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-heading text-lg font-semibold">Admin Dashboard</h1>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[#1E40AF]" />
                <span className="text-xs text-muted-foreground">Total Bookings</span>
              </div>
              <p className="text-2xl font-bold">{stats?.totalBookings || 0}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#10B981]" />
                <span className="text-xs text-muted-foreground">Providers</span>
              </div>
              <p className="text-2xl font-bold">{stats?.totalProviders || 0}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Completion Rate</span>
              </div>
              <p className="text-2xl font-bold">{stats?.completionRate || 0}%</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Avg Rating</span>
              </div>
              <p className="text-2xl font-bold">{stats?.avgRating || "0.0"}</p>
            </Card>
          </motion.div>
        )}

        {/* Pending Alert */}
        {stats && stats.pendingBookings > 0 && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                {stats.pendingBookings} booking(s) awaiting provider assignment
              </span>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="bookings">
          <TabsList className="w-full">
            <TabsTrigger value="bookings" className="flex-1">Bookings</TabsTrigger>
            <TabsTrigger value="providers" className="flex-1">Providers</TabsTrigger>
            <TabsTrigger value="verification" className="flex-1">
              Verification {unverifiedProviders.length > 0 && <Badge variant="secondary" className="ml-1 text-xs bg-red-100 text-red-700">{unverifiedProviders.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="mt-4">
            {bookingsLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
            ) : !allBookings || allBookings.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No bookings yet</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {allBookings.map((item) => (
                  <Card key={item.booking.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm">{item.service.name}</h3>
                          <Badge variant="secondary" className={`text-xs ${statusColors[item.booking.status]}`}>
                            {item.booking.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.customer.name} · {item.booking.bookingId}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{item.booking.issueDescription}</p>
                    
                    {/* Assign Provider */}
                    {item.booking.status === "pending" && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                          <SelectTrigger className="flex-1 h-9 text-xs">
                            <SelectValue placeholder="Select provider..." />
                          </SelectTrigger>
                          <SelectContent>
                            {allProviders?.filter(p => p.provider.isVerified && p.provider.serviceId === item.booking.serviceId).map(p => (
                              <SelectItem key={p.provider.id} value={p.provider.id.toString()}>
                                {p.user.name || "Provider"} ({p.service.name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" className="bg-[#1E40AF] text-xs h-9" onClick={() => handleAssignProvider(item.booking.bookingId)}>
                          Assign
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers" className="mt-4">
            {providersLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : !allProviders || allProviders.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No providers registered yet</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {allProviders.map((item) => (
                  <Card key={item.provider.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1E40AF]/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-[#1E40AF]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm">{item.user.name || "Provider"}</h3>
                            {item.provider.isVerified ? (
                              <Badge variant="secondary" className="text-xs bg-[#10B981]/10 text-[#10B981]">
                                <Shield className="w-3 h-3 mr-0.5" /> Verified
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">Pending</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.service.name} · {item.provider.experienceYears || 0} yrs exp</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{item.provider.rating || "0.0"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.provider.completedJobs} jobs</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="mt-4">
            {unverifiedProviders.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto mb-2" />
                <p className="text-muted-foreground">All providers are verified</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {unverifiedProviders.map((item) => (
                  <Card key={item.provider.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-sm">{item.user.name || "Provider"}</h3>
                        <p className="text-xs text-muted-foreground">{item.service.name} · {item.provider.experienceYears || 0} yrs</p>
                      </div>
                      <Button size="sm" className="bg-[#10B981] hover:bg-[#10B981]/90 text-xs" onClick={() => handleVerifyProvider(item.provider.id)}>
                        <Shield className="w-3 h-3 mr-1" /> Verify
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
