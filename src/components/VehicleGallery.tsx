import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, X, ChevronLeft, ChevronRight, ZoomIn, ImageOff } from "lucide-react";

interface VehicleGalleryProps {
  vehicleId: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  isAdmin: boolean;
}

export default function VehicleGallery({ vehicleId, photos, onPhotosChange, isAdmin }: VehicleGalleryProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadPhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "רק קבצי תמונה מותרים", variant: "destructive" });
      return;
    }
    const path = `${vehicleId}/${Date.now()}_${file.name}`;
    setUploading(true);
    const { error } = await supabase.storage.from("vehicle-photos").upload(path, file);
    setUploading(false);
    if (error) {
      toast({ title: "שגיאה בהעלאה", description: error.message, variant: "destructive" });
      return;
    }
    const url = supabase.storage.from("vehicle-photos").getPublicUrl(path).data.publicUrl;
    onPhotosChange([...photos, url]);
    toast({ title: "התמונה הועלתה בהצלחה ✓" });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadPhoto(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [photos]);

  const deletePhoto = async (url: string, index: number) => {
    // Extract path from URL
    const parts = url.split("/vehicle-photos/");
    if (parts.length < 2) return;
    const path = decodeURIComponent(parts[1]);
    setDeletingUrl(url);
    const { error } = await supabase.storage.from("vehicle-photos").remove([path]);
    setDeletingUrl(null);
    if (error) {
      toast({ title: "שגיאה במחיקה", description: error.message, variant: "destructive" });
      return;
    }
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
    if (lightboxIndex !== null) {
      if (lightboxIndex >= updated.length) setLightboxIndex(updated.length > 0 ? updated.length - 1 : null);
    }
    toast({ title: "התמונה נמחקה" });
  };

  const prev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === 0 ? photos.length - 1 : lightboxIndex - 1);
  };
  const next = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === photos.length - 1 ? 0 : lightboxIndex + 1);
  };

  return (
    <div className="space-y-4">
      {/* Main gallery grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((url, i) => (
            <div
              key={url}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted cursor-pointer shadow-card hover:shadow-elevated transition-all duration-200 hover:-translate-y-0.5"
              onClick={() => setLightboxIndex(i)}
            >
              <img
                src={url}
                alt={`תמונה ${i + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/30 transition-colors duration-200 flex items-center justify-center">
                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              {/* Delete button */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); deletePhoto(url, i); }}
                  disabled={deletingUrl === url}
                  className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive/80 shadow-md z-10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              {/* Index badge */}
              <div className="absolute bottom-1.5 right-1.5 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full font-polin-light opacity-0 group-hover:opacity-100 transition-opacity">
                {i + 1}/{photos.length}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-border text-muted-foreground">
          <ImageOff className="h-10 w-10 mb-2 opacity-30" />
          <p className="font-polin-light text-sm">אין תמונות לרכב זה</p>
        </div>
      )}

      {/* Upload area */}
      {isAdmin && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed transition-colors duration-200 p-4 ${
            dragOver ? "border-accent bg-accent/5" : "border-border hover:border-accent/50 hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <label className="cursor-pointer flex items-center gap-2 font-polin-medium text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              <Upload className="h-4 w-4" />
              {uploading ? "מעלה..." : "בחר תמונות"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
            <span className="text-xs font-polin-light text-muted-foreground">
              {dragOver ? "שחרר כאן להעלאה" : "או גרור תמונות לכאן • JPG, PNG, WEBP"}
            </span>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 font-polin-light text-sm">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <img
            src={photos[lightboxIndex]}
            alt={`תמונה ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Delete in lightbox */}
          {isAdmin && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); deletePhoto(photos[lightboxIndex], lightboxIndex); }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-destructive hover:bg-destructive/80 text-white px-4 py-2 rounded-lg font-polin-light text-sm transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              מחק תמונה
            </button>
          )}

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto pb-1">
              {photos.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`flex-shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${
                    i === lightboxIndex ? "border-accent scale-110" : "border-white/20 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
