import { Link } from "react-router";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function Footer() {
  const settings = useQuery(api.settings.getSettings);

  return (
    <footer className="bg-secondary border-t border-border pt-16 pb-8 mt-auto">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-semibold text-2xl tracking-tight">
                1g<span className="inline-block w-[0.55em] h-[0.55em] rounded-full border-[0.12em] border-current bg-[#A6FF00] mx-[0.02em] translate-y-[0.05em]" />li
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              {settings?.heroDescription || "India's trusted Homeopathic Pharmacy. Authentic remedies, expert guidance, and doorstep delivery."}
            </p>
            <div className="flex gap-4 pt-2">
              {settings?.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-lime-600 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings?.twitterUrl && (
                <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-lime-600 transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {settings?.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-lime-600 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings?.linkedinUrl && (
                <a href={settings.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-lime-600 transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {!settings?.facebookUrl && !settings?.twitterUrl && !settings?.instagramUrl && !settings?.linkedinUrl && (
                 <div className="text-xs text-muted-foreground">Social links not configured</div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-lime-600 transition-colors">Home</Link></li>
              <li><Link to="/#products" className="hover:text-lime-600 transition-colors">Shop Remedies</Link></li>
              <li><Link to="/upload" className="hover:text-lime-600 transition-colors">Upload Prescription</Link></li>
              <li><Link to="#" className="hover:text-lime-600 transition-colors">Consult Homeopath</Link></li>
              <li><Link to="#" className="hover:text-lime-600 transition-colors">Wholesale</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-6">Support</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="#" className="hover:text-lime-600 transition-colors">Help Center</Link></li>
              <li><Link to="#" className="hover:text-lime-600 transition-colors">Track Order</Link></li>
              <li><Link to="#" className="hover:text-lime-600 transition-colors">Returns & Refunds</Link></li>
              <li><Link to="#" className="hover:text-lime-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-lime-600 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-6">Contact Us</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-lime-600" />
                <span>{settings?.address || "123 Wellness Street, Health City, India 400001"}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-lime-600" />
                <span>{settings?.supportPhone || "+91 98765 43210"}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-lime-600" />
                <span>{settings?.supportEmail || "support@1goli.com"}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {settings?.siteName || "1goli"}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="#" className="hover:text-foreground transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}