import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { ProductBasicInfo } from "./product-form/ProductBasicInfo";
import { ProductMedia, GalleryItem } from "./product-form/ProductMedia";
import { ProductVariants } from "./product-form/ProductVariants";
import { ProductAttributes } from "./product-form/ProductAttributes";
import { compressImage, isValidUrl } from "@/lib/utils";

interface ProductFormProps {
  initialData?: any;
  onSuccess: () => void;
}

export function ProductForm({ initialData, onSuccess }: ProductFormProps) {
  const createProduct = useMutation(api.products_admin.createProduct);
  const updateProduct = useMutation(api.products_admin.updateProduct);
  const generateUploadUrl = useMutation(api.products_admin.generateUploadUrl);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // State for array fields
  const [potencies, setPotencies] = useState<string[]>(initialData?.potencies || []);
  const [forms, setForms] = useState<string[]>(initialData?.forms || []);
  const [tags, setTags] = useState<string[]>(initialData?.symptomsTags || []);
  const [keyBenefits, setKeyBenefits] = useState<string[]>(initialData?.keyBenefits || []);

  const [imagePreview, setImagePreview] = useState(initialData?.imageUrl || "");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState(initialData?.videoUrl || "");
  const [videoThumbnail, setVideoThumbnail] = useState(initialData?.videoThumbnail || "");
  
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(
    (initialData?.images || []).map((img: any, index: number) => ({
      id: `existing-${index}-${Date.now()}`,
      type: 'existing',
      url: img.url,
      storageId: img.storageId
    }))
  );

  // Auto-generate thumbnail from YouTube URL
  useEffect(() => {
    if (!videoUrlInput) {
      setVideoThumbnail("");
      return;
    }
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = videoUrlInput.match(youtubeRegex);
    if (match && match[1]) {
      setVideoThumbnail(`https://img.youtube.com/vi/${match[1]}/0.jpg`);
    }
  }, [videoUrlInput]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (videoUrlInput && !isValidUrl(videoUrlInput)) {
      toast.error("Please enter a valid Video URL");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const basePrice = parseFloat(formData.get("basePrice") as string);

    if (isNaN(basePrice)) {
      toast.error("Please enter a valid base price");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    
    let imageStorageId: Id<"_storage"> | null | undefined = undefined;
    let imageUrl: string | null | undefined = formData.get("imageUrl") as string | null;

    // Handle Main Image Upload
    if (selectedImage) {
      try {
        const compressed = await compressImage(selectedImage);
        const postUrl = await generateUploadUrl();
        
        const uploadResult = await new Promise<{ storageId: Id<"_storage"> }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", postUrl);
          xhr.setRequestHeader("Content-Type", compressed.type);
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setUploadProgress((event.loaded / event.total) * 30);
            }
          };
          xhr.onload = () => xhr.status === 200 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error("Upload failed"));
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.send(compressed);
        });

        imageStorageId = uploadResult.storageId;
        imageUrl = null;
      } catch (error) {
        toast.error("Failed to upload main image");
        setIsSubmitting(false);
        return;
      }
    } else if (!imageUrl && !imagePreview) {
      imageUrl = null;
      imageStorageId = null;
    } else if (!imageUrl && imagePreview && initialData?.imageStorageId) {
      imageStorageId = undefined;
      imageUrl = undefined;
    }

    // Handle Gallery Uploads
    const finalGalleryImages: { storageId?: Id<"_storage">, url: string }[] = [];
    try {
      const newItems = galleryItems.filter(item => item.type === 'new');
      const totalNewItems = newItems.length;
      let processedNewItems = 0;

      for (const item of galleryItems) {
        if (item.type === 'existing') {
          finalGalleryImages.push({ storageId: item.storageId, url: item.url });
        } else if (item.type === 'new' && item.file) {
          const compressed = await compressImage(item.file);
          const postUrl = await generateUploadUrl();
          
          const uploadResult = await new Promise<{ storageId: Id<"_storage"> }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", postUrl);
            xhr.setRequestHeader("Content-Type", compressed.type);
            xhr.onload = () => xhr.status === 200 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error("Upload failed"));
            xhr.send(compressed);
          });
          
          finalGalleryImages.push({ storageId: uploadResult.storageId, url: "" });
          processedNewItems++;
          setUploadProgress(30 + (processedNewItems / totalNewItems) * 70);
        }
      }
    } catch (error) {
      toast.error("Failed to upload gallery images");
      setIsSubmitting(false);
      return;
    }

    const productData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      brand: formData.get("brand") as string,
      imageUrl: imageUrl,
      imageStorageId: imageStorageId,
      images: finalGalleryImages,
      videoUrl: videoUrlInput,
      videoThumbnail: videoThumbnail,
      basePrice: basePrice,
      stock: parseInt(formData.get("stock") as string) || 0,
      category: formData.get("category") as string,
      availability: formData.get("availability") as string,
      potencies: potencies,
      forms: forms,
      symptomsTags: tags,
      keyBenefits: keyBenefits.filter(b => b.trim().length > 0),
      directionsForUse: formData.get("directionsForUse") as string,
      safetyInformation: formData.get("safetyInformation") as string,
      ingredients: formData.get("ingredients") as string,
    };

    try {
      if (initialData) {
        await updateProduct({
          id: initialData._id,
          ...productData,
        });
        toast.success("Product updated successfully");
      } else {
        await createProduct(productData as any);
        toast.success("Product created successfully");
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(initialData ? "Failed to update product" : "Failed to create product");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <ProductBasicInfo initialData={initialData} />
      
      <ProductMedia 
        initialData={initialData}
        imagePreview={imagePreview}
        setImagePreview={setImagePreview}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        galleryItems={galleryItems}
        setGalleryItems={setGalleryItems}
        videoUrlInput={videoUrlInput}
        setVideoUrlInput={setVideoUrlInput}
        videoThumbnail={videoThumbnail}
        uploadProgress={uploadProgress}
      />

      <ProductVariants 
        potencies={potencies}
        setPotencies={setPotencies}
        forms={forms}
        setForms={setForms}
      />

      <ProductAttributes 
        tags={tags}
        setTags={setTags}
        keyBenefits={keyBenefits}
        setKeyBenefits={setKeyBenefits}
        initialData={initialData}
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {initialData ? "Update Product" : "Create Product"}
      </Button>
    </form>
  );
}