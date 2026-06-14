import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileNav } from "@/components/MobileNav";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { Zap, Droplets, Wind, Shield, Star, Clock, CheckCircle2, ArrowRight, MapPin } from "lucide-react";

const iconMap: Record<string, any> = {
  Zap: Zap,
  Droplets: Droplets,
  Wind: Wind,
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: services, isLoading } = trpc.services.list.useQuery();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1E40AF] rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-foreground">Lokiq</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">Admin</Button>
                  </Link>
                )}
                {user?.role === "provider" && (
                  <Link href="/provider">
                    <Button variant="outline" size="sm">Dashboard</Button>
                  </Link>
                )}
                <Link href="/profile">
                  <Button variant="ghost" size="sm">{user?.name?.split(" ")[0] || "Profile"}</Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="bg-[#1E40AF] hover:bg-[#1E40AF]/90">Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container pt-12 pb-8 md:pt-20 md:pb-16"
      >
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#10B981]/10 rounded-full mb-6">
            <Shield className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-xs font-medium text-[#10B981]">Verified Professionals Only</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
            Trusted Local Help,{" "}
            <span className="text-[#1E40AF]">Right Around You</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Book verified electricians, plumbers, and AC technicians in your neighborhood within minutes. Every professional is locally verified and accountable.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/book">
              <Button size="lg" className="bg-[#1E40AF] hover:bg-[#1E40AF]/90 h-12 px-8 text-base font-medium w-full sm:w-auto">
                Book a Service
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/provider/onboarding">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-medium w-full sm:w-auto">
                Become a Partner
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Service Cards */}
      <section className="container pb-12">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="font-heading text-2xl font-semibold mb-6"
        >
          Our Services
        </motion.h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {services?.map((service) => {
              const Icon = iconMap[service.icon || "Zap"] || Zap;
              return (
                <motion.div key={service.id} variants={item}>
                  <Link href={`/services/${service.id}`}>
                    <Card className="p-6 hover:shadow-lg transition-all duration-250 cursor-pointer border-border/50 hover:-translate-y-0.5 group">
                      <div className="w-12 h-12 rounded-xl bg-[#1E40AF]/10 flex items-center justify-center mb-4 group-hover:bg-[#1E40AF]/20 transition-colors">
                        <Icon className="w-6 h-6 text-[#1E40AF]" />
                      </div>
                      <h3 className="font-heading text-lg font-semibold mb-2">{service.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                      {service.startingPrice && (
                        <p className="text-sm font-medium text-[#1E40AF]">Starting at ₹{service.startingPrice}</p>
                      )}
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* Trust Section */}
      <section className="container pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[#1E40AF]/5 to-[#10B981]/5 rounded-2xl p-8 md:p-12"
        >
          <h2 className="font-heading text-2xl font-semibold mb-8 text-center">Why Choose Lokiq?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-[#10B981]" />
              </div>
              <h3 className="font-medium mb-1">Verified Professionals</h3>
              <p className="text-sm text-muted-foreground">Every provider is Aadhaar verified and background checked</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#1E40AF]/10 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-[#1E40AF]" />
              </div>
              <h3 className="font-medium mb-1">Quick Response</h3>
              <p className="text-sm text-muted-foreground">Get connected with a professional within minutes</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-3">
                <Star className="w-6 h-6 text-[#10B981]" />
              </div>
              <h3 className="font-medium mb-1">Transparent Ratings</h3>
              <p className="text-sm text-muted-foreground">Real reviews from real customers in your area</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="container pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-heading text-2xl font-semibold mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Choose Service", desc: "Select the type of help you need" },
              { step: "2", title: "Describe Issue", desc: "Tell us what's wrong and your location" },
              { step: "3", title: "Get Help", desc: "A verified professional is assigned to you" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-[#1E40AF] text-white flex items-center justify-center font-heading font-bold mb-3">
                  {s.step}
                </div>
                <h3 className="font-medium mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 bg-[#1E40AF] rounded-md flex items-center justify-center">
              <MapPin className="w-3 h-3 text-white" />
            </div>
            <span className="font-heading font-semibold">Lokiq</span>
          </div>
          <p className="text-sm text-muted-foreground">Intelligence of Your People</p>
          <p className="text-xs text-muted-foreground mt-2">Hyderabad, India</p>
        </div>
      </footer>

      <MobileNav />
    </div>
  );
}
