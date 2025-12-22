import type { JSX } from "react";
import { FeatureCardSetting } from "@/data/siteDefaults";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles, Wand2, Trash2, Plus, ArrowUp, ArrowDown, Sun, Moon } from "lucide-react";

const THEME_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
] as const;

const THEME_ACCENTS: Record<FeatureCardSetting["theme"], { badge: string; icon: JSX.Element }> = {
  light: {
    badge: "bg-amber-100 text-amber-700",
    icon: <Sun className="h-4 w-4" />,
  },
  dark: {
    badge: "bg-slate-900/80 text-slate-50",
    icon: <Moon className="h-4 w-4" />,
  },
};

interface SettingsFeatureCardsSectionProps {
  featureCards: FeatureCardSetting[];
  onChange: (cards: FeatureCardSetting[]) => void;
  errors?: Record<string, string | undefined>;
  onClearError?: (key: string) => void;
}

export function SettingsFeatureCardsSection({
  featureCards,
  onChange,
  errors,
  onClearError,
}: SettingsFeatureCardsSectionProps) {
  const updateCard = <K extends keyof FeatureCardSetting>(index: number, field: K, value: FeatureCardSetting[K]) => {
    const updated = [...featureCards];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAddCard = () => {
    onChange([
      ...featureCards,
      {
        title: "New Card",
        description: "Describe this AI capability",
        href: "/",
        theme: "light",
      },
    ]);
  };

  const handleRemoveCard = (index: number) => {
    onChange(featureCards.filter((_, i) => i !== index));
  };

  const handleMoveCard = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= featureCards.length) return;

    const reordered = [...featureCards];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onChange(reordered);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>AI Feature Section</CardTitle>
          <Badge variant="secondary" className="rounded-full px-3 text-xs">
            {featureCards.length}
          </Badge>
        </div>
        <CardDescription>Configure the cards displayed in the AI highlight section.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {featureCards.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Highlight AI-powered experiences to boost discovery.
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {featureCards.map((card, index) => {
              const themeAccent = THEME_ACCENTS[card.theme];
              const urlError = errors?.[`featureCard-${index}`];

              return (
                <AccordionItem
                  key={`feature-card-${index}`}
                  value={`feature-card-${index}`}
                  className="overflow-hidden rounded-xl border bg-card/40"
                >
                  <AccordionTrigger className="flex items-center gap-3 px-4 py-3 text-left">
                    <div className="flex flex-1 items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-200 via-white to-lime-200 text-lime-800">
                        {card.theme === "dark" ? <Wand2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {card.title || `Feature Card ${index + 1}`}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {card.description || "Describe this AI capability"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn("flex items-center gap-1", themeAccent.badge)}>
                        {themeAccent.icon}
                        <span className="capitalize">{card.theme}</span>
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={index === 0}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleMoveCard(index, "up");
                        }}
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Move up</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={index === featureCards.length - 1}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleMoveCard(index, "down");
                        }}
                      >
                        <ArrowDown className="h-4 w-4" />
                        <span className="sr-only">Move down</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleRemoveCard(index);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Title</label>
                        <Input
                          value={card.title}
                          onChange={(event) => updateCard(index, "title", event.target.value)}
                          placeholder="Symptom Search"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Link</label>
                        <Input
                          value={card.href}
                          onChange={(event) => {
                            updateCard(index, "href", event.target.value);
                            onClearError?.(`featureCard-${index}`);
                          }}
                          placeholder="/ai-search"
                          className={cn(urlError && "border-destructive focus-visible:ring-destructive/60")}
                        />
                        {urlError ? <p className="text-xs text-destructive">{urlError}</p> : null}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-foreground">Description</label>
                        <Textarea
                          value={card.description}
                          onChange={(event) => updateCard(index, "description", event.target.value)}
                          placeholder="Find what you need instantly with AI assistance."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Theme</label>
                        <Select
                          value={card.theme}
                          onValueChange={(value) => updateCard(index, "theme", value as FeatureCardSetting["theme"])}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose theme" />
                          </SelectTrigger>
                          <SelectContent>
                            {THEME_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        <Button type="button" variant="outline" className="w-full" onClick={handleAddCard}>
          <Plus className="mr-2 h-4 w-4" />
          Add Feature Card
        </Button>
      </CardContent>
    </Card>
  );
}