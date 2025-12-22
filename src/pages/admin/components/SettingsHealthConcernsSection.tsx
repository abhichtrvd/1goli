import { HealthConcernSetting } from "@/data/siteDefaults";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Activity,
  HeartPulse,
  Pill,
  Thermometer,
  FlaskConical,
  Stethoscope,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const HEALTH_CONCERN_ICON_OPTIONS = [
  { label: "Activity", value: "activity" },
  { label: "Heart", value: "heart" },
  { label: "Pill", value: "pill" },
  { label: "Thermometer", value: "thermometer" },
  { label: "Flask", value: "flask" },
  { label: "Stethoscope", value: "stethoscope" },
] as const;

const HEALTH_CONCERN_COLOR_OPTIONS = [
  { label: "Sunset Orange", value: "orange" },
  { label: "Rose", value: "red" },
  { label: "Lime", value: "lime" },
  { label: "Herbal Green", value: "green" },
  { label: "Lavender", value: "purple" },
  { label: "Teal", value: "teal" },
] as const;

const ICON_MAP: Record<HealthConcernSetting["icon"], typeof Activity> = {
  activity: Activity,
  heart: HeartPulse,
  pill: Pill,
  thermometer: Thermometer,
  flask: FlaskConical,
  stethoscope: Stethoscope,
};

const COLOR_STYLES: Record<HealthConcernSetting["color"], { icon: string; badge: string }> = {
  orange: { icon: "bg-orange-100 text-orange-700", badge: "bg-orange-100 text-orange-700" },
  red: { icon: "bg-rose-100 text-rose-700", badge: "bg-rose-100 text-rose-700" },
  lime: { icon: "bg-lime-100 text-lime-700", badge: "bg-lime-100 text-lime-700" },
  green: { icon: "bg-emerald-100 text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  purple: { icon: "bg-purple-100 text-purple-700", badge: "bg-purple-100 text-purple-700" },
  teal: { icon: "bg-teal-100 text-teal-700", badge: "bg-teal-100 text-teal-700" },
};

interface SettingsHealthConcernsSectionProps {
  healthConcerns: HealthConcernSetting[];
  onChange: (concerns: HealthConcernSetting[]) => void;
}

export function SettingsHealthConcernsSection({ healthConcerns, onChange }: SettingsHealthConcernsSectionProps) {
  const updateConcern = <K extends keyof HealthConcernSetting>(index: number, field: K, value: HealthConcernSetting[K]) => {
    const updated = [...healthConcerns];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAddConcern = () => {
    onChange([
      ...healthConcerns,
      {
        title: "New Concern",
        query: "New Concern",
        icon: "activity",
        color: "orange",
      },
    ]);
  };

  const handleRemoveConcern = (index: number) => {
    onChange(healthConcerns.filter((_, i) => i !== index));
  };

  const handleMoveConcern = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= healthConcerns.length) return;

    const reordered = [...healthConcerns];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onChange(reordered);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Health Concerns</CardTitle>
          <Badge variant="secondary" className="rounded-full px-3 text-xs">
            {healthConcerns.length}
          </Badge>
        </div>
        <CardDescription>Control the “Shop by Health Concern” grid.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {healthConcerns.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Add concern cards to guide shoppers toward popular conditions.
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {healthConcerns.map((concern, index) => {
              const Icon = ICON_MAP[concern.icon];
              const color = COLOR_STYLES[concern.color];

              return (
                <AccordionItem
                  key={`health-concern-${index}`}
                  value={`health-concern-${index}`}
                  className="overflow-hidden rounded-xl border bg-card/40"
                >
                  <AccordionTrigger className="flex items-center gap-3 px-4 py-3 text-left">
                    <div className="flex flex-1 items-center gap-3">
                      <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", color.icon)}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {concern.title || `Health Concern ${index + 1}`}
                        </span>
                        <span className="text-xs text-muted-foreground">{concern.query}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn("capitalize", color.badge)}>
                        {concern.color}
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
                          handleMoveConcern(index, "up");
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
                        disabled={index === healthConcerns.length - 1}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleMoveConcern(index, "down");
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
                          handleRemoveConcern(index);
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
                          value={concern.title}
                          onChange={(event) => updateConcern(index, "title", event.target.value)}
                          placeholder="Hair Fall"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Search Query</label>
                        <Input
                          value={concern.query}
                          onChange={(event) => updateConcern(index, "query", event.target.value)}
                          placeholder="Hair Fall"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Icon</label>
                        <Select
                          value={concern.icon}
                          onValueChange={(value) => updateConcern(index, "icon", value as HealthConcernSetting["icon"])}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose icon" />
                          </SelectTrigger>
                          <SelectContent>
                            {HEALTH_CONCERN_ICON_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Color</label>
                        <Select
                          value={concern.color}
                          onValueChange={(value) => updateConcern(index, "color", value as HealthConcernSetting["color"])}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose color" />
                          </SelectTrigger>
                          <SelectContent>
                            {HEALTH_CONCERN_COLOR_OPTIONS.map((option) => (
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

        <Button type="button" variant="outline" className="w-full" onClick={handleAddConcern}>
          <Plus className="mr-2 h-4 w-4" />
          Add Health Concern
        </Button>
      </CardContent>
    </Card>
  );
}
