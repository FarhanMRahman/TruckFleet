import Link from "next/link";
import { Truck, Shield, MapPin, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex-1 container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center space-y-10">

        {/* Hero */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
              <Truck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            TruckFleet
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Fleet management and dispatch platform for chemical and hazardous material transport.
            Safe, compliant, and efficient.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button asChild size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <div className="p-6 border rounded-lg text-left">
            <MapPin className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Real-Time Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Live GPS location and ETA for every truck in your fleet.
            </p>
          </div>
          <div className="p-6 border rounded-lg text-left">
            <ClipboardList className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Smart Dispatch</h3>
            <p className="text-sm text-muted-foreground">
              Assign trips with automatic certification and vehicle matching.
            </p>
          </div>
          <div className="p-6 border rounded-lg text-left">
            <Shield className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Compliance Built-In</h3>
            <p className="text-sm text-muted-foreground">
              Pre/post-trip inspections, HOS logging, and digital POD.
            </p>
          </div>
          <div className="p-6 border rounded-lg text-left">
            <Truck className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Driver App</h3>
            <p className="text-sm text-muted-foreground">
              Mobile-first PWA for drivers — works on any device.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
