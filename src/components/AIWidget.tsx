import { useState } from "react";
import { MessageCircle, X, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { motion, AnimatePresence } from "framer-motion";

export function AIWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[320px] max-w-[calc(100vw-2rem)] shadow-2xl"
          >
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl">
              <CardHeader className="bg-primary/5 p-4 flex flex-row items-center justify-between space-y-0 border-b border-primary/5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#A6FF00] to-lime-500 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      1g<span className="inline-block w-[0.41em] h-[0.41em] rounded-full border-[0.12em] border-current bg-[#A6FF00] mx-[0.02em] translate-y-[0.1em]" />li AI
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Powered by ChatGPT</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-black/5"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Our AI assistant has moved to ChatGPT for a smarter, faster experience.
                </p>
                <Button 
                  className="w-full rounded-full bg-[#A6FF00] text-black hover:bg-[#95e600] font-semibold"
                  onClick={() => window.open("https://chatgpt.com/", "_blank")}
                >
                  Open ChatGPT <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-black text-white hover:bg-black/90 transition-transform hover:scale-105"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </>
  );
}