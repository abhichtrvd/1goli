import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Reorder } from "framer-motion";
import { X, Video, GripVertical } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { isValidUrl } from "@/lib/utils";

export type GalleryItem = {
  id: string;
  type: 'existing' | 'new';
  url: string;
  storageId?: Id<"_storage">;
  file?: File;
};

interface ProductMediaProps {
  initialData?: any;
  imagePreview: string;
  setImagePreview: (url: string) => void;
  selectedImage: File | null;
  setSelectedImage: (file: File | null) => void;
  galleryItems: GalleryItem[];
  setGalleryItems: (items: GalleryItem[]) => void;
  videoUrlInput: string;
  setVideoUrlInput: (url: string) => void;
  videoThumbnail: string;
  uploadProgress: number;
}

export function ProductMedia({
  initialData,
  imagePreview,
  setImagePreview,
  selectedImage,
  setSelectedImage,
  galleryItems,
  setGalleryItems,
  videoUrlInput,
  setVideoUrlInput,
  videoThumbnail,
  uploadProgress
}: ProductMediaProps) {
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        e.target.value = "";
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("File must be an image");
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
          setGalleryItems([...galleryItems, {
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
    setGalleryItems(galleryItems.filter((_, i) => i !== index));
  };

  const isVideoUrlValid = !videoUrlInput || isValidUrl(videoUrlInput);

  return (
    <div className="space-y-4">
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
                  className={`pl-8 ${!isVideoUrlValid ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </div>
              {!isVideoUrlValid && (
                <p className="text-xs text-destructive">Please enter a valid URL.</p>
              )}
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
    </div>
  );
}