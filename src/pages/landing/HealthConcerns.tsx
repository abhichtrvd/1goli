import { Button } from "@/components/ui/button";
import { ChevronRight, Activity, Heart, Pill, Thermometer, Stethoscope, FlaskConical } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";

export function HealthConcerns() {
  const navigate = useNavigate();

  const healthConcerns = [
    { title: "Hair Fall", icon: <Activity className="h-6 w-6" />, color: "bg-orange-100 text-orange-600" },
    { title: "Skin Care", icon: <Heart className="h-6 w-6" />, color: "bg-red-100 text-red-600" },
    { title: "Gastric Issues", icon: <Pill className="h-6 w-6" />, color: "bg-lime-100 text-lime-700" },
    { title: "Cold & Cough", icon: <Thermometer className="h-6 w-6" />, color: "bg-green-100 text-green-600" },
    { title: "Joint Pain", icon: <FlaskConical className="h-6 w-6" />, color: "bg-purple-100 text-purple-600" },
    { title: "Female Care", icon: <Stethoscope className="h-6 w-6" />, color: "bg-teal-100 text-teal-600" },
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Shop by Health Concern</h2>
          <Button variant="link" className="text-lime-600" onClick={() => navigate('/search')}>
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {healthConcerns.map((concern, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-secondary hover:bg-secondary transition-colors cursor-pointer text-center"
              onClick={() => navigate(`/search?q=${encodeURIComponent(concern.title)}`)}
            >
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${concern.color}`}>
                {concern.icon}
              </div>
              <span className="font-medium text-sm">{concern.title}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
