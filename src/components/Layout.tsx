import { Outlet } from "react-router";
import { Navbar } from "./Navbar";
import { AIWidget } from "./AIWidget";
import { Footer } from "./Footer";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Layout() {
  const settings = useQuery(api.settings.getSettings);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {settings?.bannerMessage && !settings?.maintenanceMode && (
        <div className="bg-primary text-primary-foreground px-4 py-2 text-center text-sm font-medium animate-in fade-in slide-in-from-top-1">
          {settings.bannerMessage}
        </div>
      )}
      <Navbar />
      <main className="flex-1 flex flex-col">
        {settings?.maintenanceMode ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Under Maintenance</h1>
            <p className="text-muted-foreground max-w-md">
              We are currently performing scheduled maintenance. Please check back later.
            </p>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
      <AIWidget />
    </div>
  );
}