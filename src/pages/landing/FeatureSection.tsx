import { Search } from "lucide-react";

export function FeatureSection() {
  return (
    <section className="py-24 bg-secondary">
      <div className="container max-w-5xl mx-auto px-4 text-center">
        <h3 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
          Intelligent Homeopathy.
        </h3>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          Our AI analyzes your symptoms to recommend the perfect remedy. 
          Safe, effective, and personalized just for you.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <a 
            href="https://chatgpt.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white dark:bg-card rounded-3xl p-10 text-left h-[400px] flex flex-col justify-between overflow-hidden relative group shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
             <div className="z-10">
               <h4 className="text-2xl font-semibold mb-2">Symptom Search</h4>
               <p className="text-muted-foreground">Find what you need, instantly with AI.</p>
             </div>
             <div className="absolute right-0 bottom-0 w-3/4 h-3/4 bg-gradient-to-tl from-[#A6FF00]/20 to-transparent rounded-tl-full" />
             <Search className="absolute bottom-8 right-8 h-32 w-32 text-primary/20 group-hover:text-primary/40 transition-colors duration-500" />
          </a>
          <a 
            href="https://chatgpt.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-black text-white rounded-3xl p-10 text-left h-[400px] flex flex-col justify-between overflow-hidden relative group shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
             <div className="z-10">
               <h4 className="text-2xl font-semibold mb-2">Expert AI</h4>
               <p className="text-gray-400">Guidance available 24/7 via ChatGPT.</p>
             </div>
             <div className="absolute right-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-gray-900 to-transparent" />
             <div className="absolute bottom-8 right-8 h-24 w-24 rounded-full bg-gradient-to-tr from-[#A6FF00] to-lime-500 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
          </a>
        </div>
      </div>
    </section>
  );
}
