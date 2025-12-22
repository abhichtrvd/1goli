import { v } from "convex/values";

export const filterProductsInMemory = (products: any[], args: any) => {
  return products.filter(p => {
    if (args.forms && args.forms.length > 0) {
      if (!p.forms || !p.forms.some((f: string) => args.forms!.includes(f))) return false;
    }
    if (args.symptoms && args.symptoms.length > 0) {
      if (!p.symptomsTags || !p.symptomsTags.some((s: string) => args.symptoms!.includes(s))) return false;
    }
    if (args.potencies && args.potencies.length > 0) {
      if (!p.potencies || !p.potencies.some((pot: string) => args.potencies!.includes(pot))) return false;
    }
    return true;
  });
};
