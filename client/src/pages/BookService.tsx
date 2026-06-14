import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileNav } from "@/components/MobileNav";
import { MapView } from "@/components/Map";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Zap, Droplets, Wind, MapPin, Loader2 } from "lucide-react";

const iconMap: Record<string, any> = { Zap, Droplets, Wind };

export default function BookService() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { data: services, isLoading } = trpc.services.list.useQuery();
  const createBooking = trpc.bookings.create.useMutation();

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [issueDescription, setIssueDescription] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [bookingResult, setBookingResult] = useState<{ bookingId: string; aiClassification?: string } | null>(null);

  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    if (autocompleteInputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
        componentRestrictions: { country: "in" },
        fields: ["formatted_address", "geometry"],
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          setAddress(place.formatted_address);
        }
        if (place.geometry?.location) {
          setLat(place.geometry.location.lat().toString());
          setLng(place.geometry.location.lng().toString());
          map.setCenter(place.geometry.location);
          map.setZoom(15);
          new google.maps.marker.AdvancedMarkerElement({
            map,
            position: place.geometry.location,
            title: "Service Location",
          });
        }
      });
      autocompleteRef.current = autocomplete;
    }
  }, []);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm">
          <h2 className="font-heading text-xl font-semibold mb-2">Sign in to Book</h2>
          <p className="text-muted-foreground mb-4">You need to sign in to book a service.</p>
          <a href={getLoginUrl()}>
            <Button className="bg-[#1E40AF]">Sign In</Button>
          </a>
        </Card>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!selectedService || !address || !issueDescription) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const result = await createBooking.mutateAsync({
        serviceId: selectedService,
        address,
        lat: lat || undefined,
        lng: lng || undefined,
        issueDescription,
        preferredTime: preferredTime || undefined,
      });
      setBookingResult(result);
      setStep(4);
    } catch (e: any) {
      toast.error(e.message || "Failed to create booking");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="font-heading text-lg font-semibold">Book a Service</h1>
        </div>
      </header>

      {/* Progress Bar */}
      {step < 4 && (
        <div className="container pt-4">
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full transition-colors ${s <= step ? "bg-[#1E40AF]" : "bg-border"}`} />
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Step {step} of 3: {step === 1 ? "Choose Service" : step === 2 ? "Your Location" : "Describe Issue"}
          </p>
        </div>
      )}

      <div className="container pb-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Choose Service */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="font-heading text-xl font-semibold mb-4">What do you need help with?</h2>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {services?.map((service) => {
                    const Icon = iconMap[service.icon || "Zap"] || Zap;
                    const isSelected = selectedService === service.id;
                    return (
                      <Card
                        key={service.id}
                        className={`p-4 cursor-pointer transition-all border-2 ${isSelected ? "border-[#1E40AF] bg-[#1E40AF]/5" : "border-transparent hover:border-border"}`}
                        onClick={() => setSelectedService(service.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-[#1E40AF]/20" : "bg-muted"}`}>
                            <Icon className={`w-5 h-5 ${isSelected ? "text-[#1E40AF]" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{service.name}</h3>
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-[#1E40AF]" />}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
              <Button
                className="w-full mt-6 bg-[#1E40AF] hover:bg-[#1E40AF]/90 h-12"
                disabled={!selectedService}
                onClick={() => setStep(2)}
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Address with Google Maps */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="font-heading text-xl font-semibold mb-4">Where do you need the service?</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address" className="mb-1.5 block text-sm font-medium">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      ref={autocompleteInputRef}
                      id="address"
                      placeholder="Search for your address..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Start typing to see Google Maps suggestions</p>
                </div>
                <div className="rounded-xl overflow-hidden border border-border">
                  <MapView
                    className="h-[200px]"
                    initialCenter={{ lat: 17.385, lng: 78.4867 }}
                    initialZoom={11}
                    onMapReady={handleMapReady}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  className="flex-1 bg-[#1E40AF] hover:bg-[#1E40AF]/90 h-12"
                  disabled={!address}
                  onClick={() => setStep(3)}
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Issue Description */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="font-heading text-xl font-semibold mb-4">Describe the issue</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="issue" className="mb-1.5 block text-sm font-medium">What's the problem?</Label>
                  <Textarea
                    id="issue"
                    placeholder="E.g., My AC is leaking water and making a loud noise..."
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Our AI will help categorize your issue for faster service</p>
                </div>
                <div>
                  <Label htmlFor="time" className="mb-1.5 block text-sm font-medium">Preferred Time (optional)</Label>
                  <Input
                    id="time"
                    placeholder="E.g., Today evening, Tomorrow morning..."
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  className="flex-1 bg-[#1E40AF] hover:bg-[#1E40AF]/90 h-12"
                  disabled={!issueDescription || createBooking.isPending}
                  onClick={handleSubmit}
                >
                  {createBooking.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <>Confirm Booking <CheckCircle2 className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && bookingResult && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-[#10B981]/10 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
              </motion.div>
              <h2 className="font-heading text-2xl font-bold mb-2">Booking Confirmed!</h2>
              <p className="text-muted-foreground mb-6">Your service request has been submitted successfully.</p>
              <Card className="p-6 text-left max-w-sm mx-auto mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Booking ID</span>
                    <span className="text-sm font-mono font-medium">{bookingResult.bookingId}</span>
                  </div>
                  {bookingResult.aiClassification && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">AI Category</span>
                      <span className="text-sm font-medium text-[#1E40AF]">{bookingResult.aiClassification}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="text-sm font-medium text-amber-600">Pending Assignment</span>
                  </div>
                </div>
              </Card>
              <p className="text-sm text-muted-foreground mb-6">
                Our team will assign a verified professional shortly. You'll be notified once assigned.
              </p>
              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <Link href={`/bookings/${bookingResult.bookingId}`}>
                  <Button className="w-full bg-[#1E40AF] hover:bg-[#1E40AF]/90 h-12">View Booking</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full h-12">Back to Home</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MobileNav />
    </div>
  );
}
