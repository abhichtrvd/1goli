import { QuickActionSetting } from "@/data/siteDefaults";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Upload, Stethoscope, Pill, Star, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";

interface QuickActionsSectionProps {
  quickActions: QuickActionSetting[];
  onChange: (actions: QuickActionSetting[]) => void;
}

const QUICK_ACTION_ICON_OPTIONS = [
  { label: "Upload", value: "upload" },
  { label: "Stethoscope", value: "stethoscope" },
  { label: "Pill", value: "pill" },
  { label: "Star", value: "star" },
] as const;

const QUICK_ACTION_ACCENT_OPTIONS = [
  { label: "Lime", value: "lime" },
  { label: "Blue", value: "blue" },
  { label: "Pink", value: "pink" },
  { label: "Purple", value: "purple" },
] as const;

const ICON_MAP: Record<QuickActionSetting["icon"], typeof Upload> = {
  upload: Upload,
  stethoscope: Stethoscope,
  pill: Pill,
  star: Star,
};

const ACCENT_STYLES: Record<QuickActionSetting["accent"], { container: string; badge: string }> = {
  lime: { container: "bg-lime-100 text-lime-700", badge: "bg-lime-100 text-lime-700" },
  blue: { container: "bg-blue-100 text-blue-700", badge: "bg-blue-100 text-blue-700" },
  pink: { container: "bg-pink-100 text-pink-700", badge: "bg-pink-100 text-pink-700" },
  purple: { container: "bg-purple-100 text-purple-700", badge: "bg-purple-100 text-purple-700" },
};

export function SettingsQuickActionsSection({ quickActions, onChange }: QuickActionsSectionProps) {
  const handleActionChange = <K extends keyof QuickActionSetting>(index: number, field: K, value: QuickActionSetting[K]) => {
    const updated = [...quickActions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAddAction = () => {
    onChange([
      ...quickActions,
      {
        title: "New Action",
        description: "Describe this action",
        href: "/",
        icon: "upload",
        accent: "lime",
      },
    ]);
  };

  const handleRemoveAction = (index: number) => {
    onChange(quickActions.filter((_, i) => i !== index));
  };

  const handleMoveAction = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= quickActions.length) return;

    const reordered = [...quickActions];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onChange(reordered);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Guide customers toward key flows with curated shortcuts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {quickActions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Add quick action tiles to highlight uploads, consultations, offers, and more.
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = ICON_MAP[action.icon];
              const accent = ACCENT_STYLES[action.accent];

              return (
                <AccordionItem
                  key={`quick-action-${index}`}
                  value={`quick-action-${index}`}
                  className="overflow-hidden rounded-xl border bg-card/40"
                >
                  <AccordionTrigger className="flex items-center gap-3 px-4 py-3 text-left">
                    <div className="flex flex-1 items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold ${accent.container}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {action.title || `Quick Action ${index + 1}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {action.description || "Describe this action"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`${accent.badge} capitalize`}>
                        {action.accent}
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
                          handleMoveAction(index, "up");
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
                        disabled={index === quickActions.length - 1}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleMoveAction(index, "down");
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
                          handleRemoveAction(index);
                        }}
                        aria-label="Remove quick action"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Title</label>
                        <Input
                          value={action.title}
                          onChange={(event) => handleActionChange(index, "title", event.target.value)}
                          placeholder="Upload Prescription"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Link</label>
                        <Input
                          value={action.href}
                          onChange={(event) => handleActionChange(index, "href", event.target.value)}
                          placeholder="/upload"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-foreground">Description</label>
                        <Textarea
                          value={action.description}
                          onChange={(event) => handleActionChange(index, "description", event.target.value)}
                          placeholder="We'll dispense it for you"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Icon</label>
                        <Select
                          value={action.icon}
                          onValueChange={(value) => handleActionChange(index, "icon", value as QuickActionSetting["icon"])}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose icon" />
                          </SelectTrigger>
                          <SelectContent>
                            {QUICK_ACTION_ICON_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Accent</label>
                        <Select
                          value={action.accent}
                          onValueChange={(value) => handleActionChange(index, "accent", value as QuickActionSetting["accent"])}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose accent" />
                          </SelectTrigger>
                          <SelectContent>
                            {QUICK_ACTION_ACCENT_OPTIONS.map((option) => (
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

        <Button type="button" variant="outline" className="w-full" onClick={handleAddAction}>
          <Plus className="mr-2 h-4 w-4" />
          Add Quick Action
        </Button>
      </CardContent>
    </Card>
  );
}