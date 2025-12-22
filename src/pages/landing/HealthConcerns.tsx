import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Activity,
  Heart,
  Pill,
  Thermometer,
  Stethoscope,
  FlaskConical,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DEFAULT_HEALTH_CONCERNS,
  HealthConcernSetting,
} from "@/data/siteDefaults";

const ICON_MAP = {
  activity: Activity,
  heart: Heart,
  pill: Pill,
  thermometer: Thermometer,
  flask: FlaskConical,
  stethoscope: Stethoscope,
};

const COLOR_MAP: Record<HealthConcernSetting["color"], string> = {
  orange: "bg-orange-100 text-orange-600",
  red: "bg-red-100 text-red-600",
  lime: "bg-lime-100 text-lime-700",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  teal: "bg-teal-100 text-teal-600",
};

export function HealthConcerns() {
  const navigate = useNavigate();
  const settings = useQuery(api.settings.getSettings);
  const healthConcerns =
    (settings?.healthConcerns as HealthConcernSetting[] | undefined) ??
    DEFAULT_HEALTH_CONCERNS;

  if (!healthConcerns.length) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Shop by Health Concern
          </h2>
          <Button
            variant="link"
            className="text-lime-600"
            onClick={() => navigate("/search")}
          >
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {healthConcerns.map((concern, index) => {
            const Icon =
              ICON_MAP[concern.icon as keyof typeof ICON_MAP] || Activity;
            const colorClass =
              COLOR_MAP[concern.color as keyof typeof COLOR_MAP] ||
              COLOR_MAP.orange;

            return (
              <motion.div
                key={`${concern.title}-${index}`}
                whileHover={{ y: -5 }}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-secondary transition-colors cursor-pointer text-center"
                onClick={() =>
                  navigate(`/search?q=${encodeURIComponent(concern.query)}`)
                }
              >
                <div
                  className={`h-16 w-16 rounded-full flex items-center justify-center ${colorClass}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="font-medium text-sm">{concern.title}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}