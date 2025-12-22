export type QuickActionSetting = {
  title: string;
  description: string;
  href: string;
  icon: "upload" | "stethoscope" | "pill" | "star";
  accent: "lime" | "blue" | "pink" | "purple";
};

export type HealthConcernSetting = {
  title: string;
  query: string;
  icon: "activity" | "heart" | "pill" | "thermometer" | "flask" | "stethoscope";
  color: "orange" | "red" | "lime" | "green" | "purple" | "teal";
};

export type FeatureCardSetting = {
  title: string;
  description: string;
  href: string;
  theme: "light" | "dark";
};

export const DEFAULT_QUICK_ACTIONS: QuickActionSetting[] = [
  {
    title: "Upload Prescription",
    description: "We'll dispense it for you",
    href: "/upload",
    icon: "upload",
    accent: "lime",
  },
  {
    title: "Consult Homeopath",
    description: "Expert guidance from certified doctors",
    href: "/consult",
    icon: "stethoscope",
    accent: "blue",
  },
];

export const DEFAULT_HEALTH_CONCERNS: HealthConcernSetting[] = [
  { title: "Hair Fall", query: "Hair Fall", icon: "activity", color: "orange" },
  { title: "Skin Care", query: "Skin Care", icon: "heart", color: "red" },
  { title: "Gastric Issues", query: "Gastric Issues", icon: "pill", color: "lime" },
  { title: "Cold & Cough", query: "Cold & Cough", icon: "thermometer", color: "green" },
  { title: "Joint Pain", query: "Joint Pain", icon: "flask", color: "purple" },
  { title: "Female Care", query: "Female Care", icon: "stethoscope", color: "teal" },
];

export const DEFAULT_FEATURE_CARDS: FeatureCardSetting[] = [
  {
    title: "Symptom Search",
    description: "Find what you need instantly with AI assistance.",
    href: "https://chatgpt.com/",
    theme: "light",
  },
  {
    title: "Expert AI",
    description: "Guidance available 24/7 via ChatGPT.",
    href: "https://chatgpt.com/",
    theme: "dark",
  },
];

export const DEFAULT_FEATURED_BRANDS: string[] = [
  "Dr. Reckeweg",
  "SBL World Class",
  "Schwabe India",
  "Adel Pekana",
  "Bakson's",
  "Bjain Pharma",
];