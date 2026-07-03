"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2 } from "lucide-react";

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
  const fileRef = useRef<HTMLInputElement>(null);

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
          alt="Personal photograph"
          className="h-28 w-28 rounded-lg object-cover border border-slate-200"
        />
      )}
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,.jpg,.jpeg,.png"
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
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <ImagePlus className="h-4 w-4 mr-1" />
            )}
            Upload Personal Photo
          </Button>
        </div>
      )}
      <p className="text-xs text-slate-500">
        Upload a clear personal photo (JPG or PNG, max 10MB). Passport-size photo is uploaded separately in the Documents step.
      </p>
    </div>
  );
}
