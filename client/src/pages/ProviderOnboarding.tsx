import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Loader2, Shield } from "lucide-react";

export default function ProviderOnboarding() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { data: services } = trpc.services.list.useQuery();
  const { data: existingProvider } = trpc.providers.myProfile.useQuery(undefined, { enabled: isAuthenticated });
  const registerProvider = trpc.providers.register.useMutation();

  const [serviceId, setServiceId] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [submitted, setSubmitted] = useState(false);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm">
          <h2 className="font-heading text-xl font-semibold mb-2">Sign In First</h2>
          <p className="text-muted-foreground mb-4">Sign in to register as a service provider.</p>
          <a href={getLoginUrl()}><Button className="bg-[#1E40AF]">Sign In</Button></a>
        </Card>
      </div>
    );
  }

  if (existingProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm">
          <CheckCircle2 className="w-12 h-12 text-[#10B981] mx-auto mb-4" />
          <h2 className="font-heading text-xl font-semibold mb-2">Already Registered</h2>
          <p className="text-muted-foreground mb-4">You're already registered as a provider.</p>
          <Link href="/provider"><Button className="bg-[#1E40AF]">Go to Dashboard</Button></Link>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-8 text-center max-w-sm">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
              <Shield className="w-16 h-16 text-[#10B981] mx-auto mb-4" />
            </motion.div>
            <h2 className="font-heading text-xl font-semibold mb-2">Registration Submitted!</h2>
            <p className="text-muted-foreground mb-4">
              Your profile is under review. Once verified by our team, you'll start receiving job requests.
            </p>
            <Link href="/provider"><Button className="bg-[#1E40AF]">Go to Dashboard</Button></Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!serviceId) {
      toast.error("Please select a service category");
      return;
    }
    try {
      await registerProvider.mutateAsync({
        serviceId: parseInt(serviceId),
        experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
        bio: bio || undefined,
        city: city || undefined,
      });
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14">
          <Link href="/"><Button variant="ghost" size="sm" className="mr-2"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-heading text-lg font-semibold">Become a Partner</h1>
        </div>
      </header>

      <div className="container py-6 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-bold mb-2">Join Lokiq</h2>
            <p className="text-muted-foreground">Register as a service professional and start earning. We verify all providers for trust and safety.</p>
          </div>

          <Card className="p-6 space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Service Category *</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select your expertise..." />
                </SelectTrigger>
                <SelectContent>
                  {services?.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block text-sm font-medium">Years of Experience</Label>
              <Input
                type="number"
                placeholder="E.g., 5"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label className="mb-1.5 block text-sm font-medium">City</Label>
              <Input
                placeholder="Your city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label className="mb-1.5 block text-sm font-medium">About You</Label>
              <Textarea
                placeholder="Brief description of your experience and skills..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <Button
              className="w-full bg-[#1E40AF] hover:bg-[#1E40AF]/90 h-12 mt-2"
              onClick={handleSubmit}
              disabled={registerProvider.isPending}
            >
              {registerProvider.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                "Submit Registration"
              )}
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
