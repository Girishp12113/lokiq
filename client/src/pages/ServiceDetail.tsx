import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileNav } from "@/components/MobileNav";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Droplets, Wind, Star, Shield, User } from "lucide-react";

const iconMap: Record<string, any> = { Zap, Droplets, Wind };

export default function ServiceDetail() {
  const params = useParams<{ id: string }>();
  const serviceId = parseInt(params.id || "0");
  const { data: service, isLoading } = trpc.services.getById.useQuery({ id: serviceId }, { enabled: serviceId > 0 });
  const { data: providers, isLoading: providersLoading } = trpc.providers.byService.useQuery({ serviceId }, { enabled: serviceId > 0 });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border/50">
          <div className="container flex items-center h-14"><Skeleton className="w-32 h-6" /></div>
        </header>
        <div className="container py-6 space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="font-heading text-lg font-semibold mb-2">Service Not Found</h2>
          <Link href="/"><Button variant="outline">Back to Home</Button></Link>
        </Card>
      </div>
    );
  }

  const Icon = iconMap[service.icon || "Zap"] || Zap;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14">
          <Link href="/"><Button variant="ghost" size="sm" className="mr-2"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-heading text-lg font-semibold">{service.name}</h1>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Service Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-[#1E40AF]/10 flex items-center justify-center">
                <Icon className="w-7 h-7 text-[#1E40AF]" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-semibold">{service.name}</h2>
                {service.startingPrice && (
                  <p className="text-sm text-[#1E40AF] font-medium">Starting at ₹{service.startingPrice}</p>
                )}
              </div>
            </div>
            <p className="text-muted-foreground">{service.description}</p>
            <Link href="/book">
              <Button className="w-full mt-4 bg-[#1E40AF] hover:bg-[#1E40AF]/90 h-12">Book Now</Button>
            </Link>
          </Card>
        </motion.div>

        {/* Available Providers */}
        <div>
          <h2 className="font-heading text-lg font-semibold mb-3">Available Professionals</h2>
          {providersLoading ? (
            <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : !providers || providers.length === 0 ? (
            <Card className="p-6 text-center">
              <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No verified providers available yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {providers.map((item) => (
                <motion.div key={item.provider.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1E40AF]/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#1E40AF]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm">{item.user.name || "Professional"}</h3>
                          {item.provider.isVerified ? (
                            <Badge variant="secondary" className="text-xs bg-[#10B981]/10 text-[#10B981]">
                              <Shield className="w-3 h-3 mr-0.5" /> Verified
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{item.provider.rating || "New"}</span>
                          <span>·</span>
                          <span>{item.provider.experienceYears || 0} yrs exp</span>
                          <span>·</span>
                          <span>{item.provider.completedJobs} jobs</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
