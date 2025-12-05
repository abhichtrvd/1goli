import { useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

export function AIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "bot"; content: string }[]>([
    { role: "bot", content: "Hello. I'm your 1goli AI Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");

    // Mock AI Logic
    setTimeout(() => {
      let response = "I'm not sure about that. Please consult a professional homeopath.";
      const lowerInput = userMsg.toLowerCase();

      if (lowerInput.includes("fever")) {
        response = "For fever, Belladonna (sudden onset) or Ferrum Phos are often indicated. Please consult a doctor for high temperatures.";
      } else if (lowerInput.includes("stress") || lowerInput.includes("anxiety")) {
        response = "For stress, Nux Vomica or Ignatia are often considered. Nux Vomica is excellent for work-related stress.";
      } else if (lowerInput.includes("injury") || lowerInput.includes("bruise")) {
        response = "Arnica Montana is the premier remedy for injuries, bruising, and trauma.";
      } else if (lowerInput.includes("flu")) {
        response = "Oscillococcinum is widely used for flu-like symptoms, especially in the early stages.";
      }

      setMessages((prev) => [...prev, { role: "bot", content: response }]);
    }, 1000);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] shadow-2xl"
          >
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
              <CardHeader className="bg-primary/5 p-4 flex flex-row items-center justify-between space-y-0 border-b border-primary/5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">1goli Assistant</CardTitle>
                    <p className="text-xs text-muted-foreground">Always here to help.</p>
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
              <CardContent className="p-0">
                <ScrollArea className="h-[350px] p-4">
                  <div className="flex flex-col gap-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-secondary text-secondary-foreground rounded-bl-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-3 bg-white/50">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex w-full gap-2 relative"
                >
                  <Input
                    placeholder="Describe your symptoms..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 rounded-full border-none bg-secondary/50 focus-visible:ring-0 pl-4 pr-12 h-10"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!input.trim()} 
                    className="absolute right-1 top-1 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </form>
              </CardFooter>
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