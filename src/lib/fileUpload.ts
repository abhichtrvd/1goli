import { toast } from "sonner";

export async function uploadFile(file: File, generateUploadUrl: () => Promise<string>): Promise<{ url: string; storageId: string } | null> {
  try {
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
      return null;
    }

    // Get upload URL
    const uploadUrl = await generateUploadUrl();

    // Upload the file
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!result.ok) {
      throw new Error("Upload failed");
    }

    const { storageId } = await result.json();

    // Construct the URL
    const url = uploadUrl.replace("/upload", `/storage/${storageId}`);

    return { url, storageId };
  } catch (error) {
    console.error("Upload error:", error);
    toast.error("Failed to upload file");
    return null;
  }
}

export function validateImageFile(file: File): boolean {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

  if (!validTypes.includes(file.type)) {
    toast.error("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
    return false;
  }

  return true;
}
