"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, ImagePlus, Loader2 } from "lucide-react";

export function PhotoUploadField({
  photoUrl,
  readOnly,
  uploading,
  onUpload,
}: {
  photoUrl?: string;
  readOnly?: boolean;
  uploading?: boolean;
  onUpload: (file: File) => Promise<void>;
}) {
  const selfieRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    await onUpload(file);
  };

  return (
    <div className="space-y-3">
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt="Employee photograph"
          className="h-28 w-28 rounded-lg object-cover border border-slate-200"
        />
      )}
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <input
            ref={selfieRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => selfieRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Camera className="h-4 w-4 mr-1" />
            )}
            Take Selfie
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => galleryRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4 mr-1" />
            Upload from Gallery
          </Button>
        </div>
      )}
      <p className="text-xs text-slate-500">Passport-size photo is required (JPG or PNG, max 10MB).</p>
    </div>
  );
}
