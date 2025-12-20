import { Card, CardContent } from "@/components/ui/card";
import { Upload, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <section className="bg-secondary pb-12 -mt-12">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl"
          >
            <Card className="bg-white dark:bg-card border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/upload')}>
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-lime-50 text-lime-700 flex items-center justify-center">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Upload Prescription</h3>
                  <p className="text-xs text-muted-foreground mt-1">We'll dispense it for you</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-white dark:bg-card border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => navigate("/consult")}
            >
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Consult Homeopath</h3>
                  <p className="text-xs text-muted-foreground mt-1">Expert guidance</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
