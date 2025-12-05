import { Outlet } from "react-router";
import { Navbar } from "./Navbar";
import { AIWidget } from "./AIWidget";
import { Footer } from "./Footer";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
      <AIWidget />
    </div>
  );
}