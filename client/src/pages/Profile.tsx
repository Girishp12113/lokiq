import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "@/components/MobileNav";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { User, Shield, MapPin, Phone, Mail, LogOut, Settings, ChevronRight } from "lucide-react";

export default function Profile() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm">
          <h2 className="font-heading text-xl font-semibold mb-2">Sign In</h2>
          <p className="text-muted-foreground mb-4">Sign in to manage your profile</p>
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
          <h1 className="font-heading text-lg font-semibold">Profile</h1>
        </div>
      </header>

      <div className="container py-6 space-y-4">
        {/* User Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#1E40AF]/10 flex items-center justify-center">
                <User className="w-7 h-7 text-[#1E40AF]" />
              </div>
              <div className="flex-1">
                <h2 className="font-heading text-lg font-semibold">{user?.name || "User"}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs capitalize">{user?.role || "customer"}</Badge>
                  {user?.role === "provider" && (
                    <Badge variant="secondary" className="text-xs bg-[#10B981]/10 text-[#10B981]">
                      <Shield className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="divide-y divide-border">
            {user?.email && (
              <div className="flex items-center gap-3 p-4">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>
            )}
            {user?.phone && (
              <div className="flex items-center gap-3 p-4">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 p-4">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Hyderabad, India</span>
            </div>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="divide-y divide-border">
            {user?.role === "admin" && (
              <Link href="/admin">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Admin Dashboard</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            )}
            {user?.role === "provider" && (
              <Link href="/provider">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Provider Dashboard</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            )}
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 p-4 w-full text-left hover:bg-muted/50 transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">Sign Out</span>
            </button>
          </Card>
        </motion.div>
      </div>

      <MobileNav />
    </div>
  );
}
