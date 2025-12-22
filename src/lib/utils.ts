import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isValidUrl = (value: string, options?: { allowRelative?: boolean }) => {
  if (!value) return true;
  const trimmed = value.trim();
  if (options?.allowRelative && trimmed.startsWith("/")) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const maxWidth = 1200; 
      const scale = maxWidth / img.width;
      const width = scale < 1 ? maxWidth : img.width;
      const height = scale < 1 ? img.height * scale : img.height;
      
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" });
          resolve(newFile);
        } else {
          reject(new Error("Compression failed"));
        }
      }, "image/webp", 0.8);
    };
    img.onerror = reject;
  });
};