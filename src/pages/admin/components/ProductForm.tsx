import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Reorder } from "framer-motion";
import { Loader2, X, Video, GripVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface ProductFormProps {
  initialData?: any;
  onSuccess: () => void;
}

type GalleryItem = {
  id: string;
  type: 'existing' | 'new';
  url: string;
  storageId?: Id<"_storage">;
  file?: File;
};

export function ProductForm({ initialData, onSuccess }: ProductFormProps) {
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [potenciesInput, setPotenciesInput] = useState(initialData?.potencies?.join(", ") || "");
  const [formsInput, setFormsInput] = useState(initialData?.forms?.join(", ") || "");
  const [tagsInput, setTagsInput] = useState(initialData?.symptomsTags?.join(", ") || "");
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

  const compressImage = async (file: File): Promise<File> => {
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        e.target.value = "";
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("File must be an image");
        e.target.value = "";
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter(f => f.type.startsWith("image/"));
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryItems(prev => [...prev, {
            id: `new-${Date.now()}-${Math.random()}`,
            type: 'new',
            url: reader.result as string,
            file: file
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
    e.target.value = "";
  };

  const removeGalleryItem = (index: number) => {
    setGalleryItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(0);
    const formData = new FormData(e.currentTarget);
    
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
      imageUrl: imageUrl,
      imageStorageId: imageStorageId,
      images: finalGalleryImages,
      videoUrl: videoUrlInput,
      videoThumbnail: videoThumbnail,
      basePrice: parseFloat(formData.get("basePrice") as string),
      category: formData.get("category") as string,
      availability: formData.get("availability") as string,
      potencies: (formData.get("potencies") as string).split(",").map(s => s.trim()).filter(Boolean),
      forms: (formData.get("forms") as string).split(",").map(s => s.trim()).filter(Boolean),
      symptomsTags: (formData.get("symptomsTags") as string).split(",").map(s => s.trim()).filter(Boolean),
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input id="name" name="name" required defaultValue={initialData?.name} placeholder="e.g. Arnica Montana" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="basePrice">Base Price (₹)</Label>
          <Input id="basePrice" name="basePrice" type="number" step="0.01" required defaultValue={initialData?.basePrice} placeholder="1299" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue={initialData?.category || "Classical"}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Classical">Classical</SelectItem>
              <SelectItem value="Patent">Patent</SelectItem>
              <SelectItem value="Biochemic">Biochemic</SelectItem>
              <SelectItem value="Personal Care">Personal Care</SelectItem>
              <SelectItem value="Mother Tincture">Mother Tincture</SelectItem>
              <SelectItem value="Bach Flower">Bach Flower</SelectItem>
              <SelectItem value="Bio-Combinations">Bio-Combinations</SelectItem>
              <SelectItem value="Triturations">Triturations</SelectItem>
              <SelectItem value="Drops">Drops</SelectItem>
              <SelectItem value="Syrups">Syrups</SelectItem>
              <SelectItem value="Ointments">Ointments</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="availability">Availability</Label>
          <Select name="availability" defaultValue={initialData?.availability || "in_stock"}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required defaultValue={initialData?.description} placeholder="Product description..." />
      </div>

      <div className="space-y-2">
        <Label>Product Image</Label>
        <div className="flex gap-4 items-start">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Input 
                id="imageFile" 
                type="file" 
                accept="image/*"
                onChange={handleImageSelect}
                className="cursor-pointer"
              />
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1" />
              </div>
            )}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or use URL</span>
              </div>
            </div>
            <Input 
              id="imageUrl" 
              name="imageUrl" 
              value={selectedImage ? "" : (imagePreview === initialData?.imageUrl ? "" : imagePreview)} 
              onChange={(e) => {
                setImagePreview(e.target.value);
                setSelectedImage(null);
              }}
              placeholder="https://..." 
              disabled={!!selectedImage}
            />
            <p className="text-[10px] text-muted-foreground">
              Max size 5MB. Supported formats: JPG, PNG, WebP.
            </p>
          </div>
          <div className="h-24 w-24 rounded-md border bg-secondary/20 overflow-hidden flex-shrink-0 flex items-center justify-center relative group">
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                <button 
                  type="button"
                  onClick={() => {
                    setImagePreview("");
                    setSelectedImage(null);
                    const fileInput = document.getElementById('imageFile') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                  }}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <span className="text-[10px] text-muted-foreground">No Image</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Gallery Images (Drag to Reorder)</Label>
          <div className="space-y-3">
            <Input 
              type="file" 
              accept="image/*"
              multiple
              onChange={handleGallerySelect}
              className="cursor-pointer"
            />
            <Reorder.Group 
              axis="x" 
              values={galleryItems} 
              onReorder={setGalleryItems} 
              className="flex flex-wrap gap-2 list-none p-0"
            >
              {galleryItems.map((item, i) => (
                <Reorder.Item 
                  key={item.id} 
                  value={item}
                  className="h-24 w-24 rounded-md border bg-secondary/20 overflow-hidden relative group flex flex-col cursor-move touch-none"
                  whileDrag={{ scale: 1.1, zIndex: 10, boxShadow: "0 5px 15px rgba(0,0,0,0.15)" }}
                >
                  <div className="h-full w-full relative">
                    <img src={item.url} alt={`Gallery ${i}`} className="h-full w-full object-cover pointer-events-none" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                       <GripVertical className="text-white drop-shadow-md" />
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeGalleryItem(i);
                      }}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            {galleryItems.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No gallery images added.</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="videoUrl">Video URL (Optional)</Label>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <div className="relative">
                <Video className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="videoUrl" 
                  name="videoUrl" 
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="https://youtube.com/..." 
                  className="pl-8"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Supports YouTube. Thumbnail auto-generated.</p>
            </div>
            {videoThumbnail && (
              <div className="h-16 w-24 bg-black rounded overflow-hidden relative flex-shrink-0 border">
                <img src={videoThumbnail} alt="Video Thumbnail" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1 drop-shadow-md" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="potencies">Potencies</Label>
          <Input 
            id="potencies" 
            name="potencies" 
            required 
            value={potenciesInput}
            onChange={(e) => setPotenciesInput(e.target.value)}
            placeholder="30C, 200C, 1M" 
          />
          <div className="flex flex-wrap gap-1 mt-2 min-h-[24px]">
            {potenciesInput.split(",").map((s: string) => s.trim()).filter(Boolean).map((tag: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="forms">Forms</Label>
          <Input 
            id="forms" 
            name="forms" 
            required 
            value={formsInput}
            onChange={(e) => setFormsInput(e.target.value)}
            placeholder="Dilution, Globules" 
          />
          <div className="flex flex-wrap gap-1 mt-2 min-h-[24px]">
            {formsInput.split(",").map((s: string) => s.trim()).filter(Boolean).map((tag: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="symptomsTags">Tags</Label>
        <Input 
          id="symptomsTags" 
          name="symptomsTags" 
          required 
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="fever, pain, flu" 
        />
        <div className="flex flex-wrap gap-1 mt-2 min-h-[24px]">
          {tagsInput.split(",").map((s: string) => s.trim()).filter(Boolean).map((tag: string, i: number) => (
            <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {initialData ? "Update Product" : "Create Product"}
      </Button>
    </form>
  );
}