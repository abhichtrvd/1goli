import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEFAULT_QUICK_ACTIONS, QuickActionSetting } from "@/data/siteDefaults";
import { Upload, Stethoscope, Pill, Star } from "lucide-react";

const ICON_MAP = {
  upload: Upload,
  stethoscope: Stethoscope,
  pill: Pill,
  star: Star,
};

const ACCENT_STYLES: Record<
  QuickActionSetting["accent"],
  { container: string }
> = {
  lime: { container: "bg-lime-50 text-lime-700" },
  blue: { container: "bg-blue-50 text-blue-700" },
  pink: { container: "bg-pink-50 text-pink-700" },
  purple: { container: "bg-purple-50 text-purple-700" },
};

export function QuickActions() {
  const navigate = useNavigate();
  const settings = useQuery(api.settings.getSettings);
  const quickActions =
    (settings?.quickActions as QuickActionSetting[] | undefined) ??
    DEFAULT_QUICK_ACTIONS;

  const handleActionClick = (href: string) => {
    if (href.startsWith("http")) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(href);
  };

  if (!quickActions.length) return null;

  return (
    <section className="bg-secondary pb-12 -mt-12">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl"
          >
            {quickActions.map((action, index) => {
              const Icon =
                ICON_MAP[action.icon as keyof typeof ICON_MAP] ?? Upload;
              const accent =
                ACCENT_STYLES[action.accent as keyof typeof ACCENT_STYLES] ??
                ACCENT_STYLES.lime;

              return (
                <Card
                  key={`${action.title}-${index}`}
                  className="bg-white dark:bg-card border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => handleActionClick(action.href)}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <div
                      className={`h-12 w-12 rounded-2xl flex items-center justify-center ${accent.container}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{action.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}