"use client";

import { useCallback, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Logo } from "@/lib/morph-engine";

interface LogoUploaderProps {
  logos: Logo[];
  onLogosChange: (logos: Logo[]) => void;
  maxLogos?: number;
}

export function LogoUploader({ logos, onLogosChange, maxLogos = 4 }: LogoUploaderProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const newLogos: Logo[] = [];

      for (let i = 0; i < files.length && logos.length + newLogos.length < maxLogos; i++) {
        const file = files[i];
        if (file.type === "image/svg+xml") {
          const content = await file.text();
          newLogos.push({
            id: crypto.randomUUID(),
            name: file.name.replace(".svg", ""),
            content,
            color: "#ffffff",
          });
        }
      }

      if (newLogos.length > 0) {
        onLogosChange([...logos, ...newLogos]);
      }
    },
    [logos, maxLogos, onLogosChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const removeLogo = (id: string) => {
    onLogosChange(logos.filter((logo) => logo.id !== id));
  };

  const updateLogoColor = (id: string, color: string) => {
    onLogosChange(logos.map((logo) => (logo.id === id ? { ...logo, color } : logo)));
  };

  const updateLogoName = (id: string, name: string) => {
    onLogosChange(logos.map((logo) => (logo.id === id ? { ...logo, name } : logo)));
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragOver ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".svg"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => handleFileUpload(e.target.files)}
          disabled={logos.length >= maxLogos}
        />
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 rounded-full bg-secondary">
            <Upload className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {logos.length >= maxLogos
              ? `Maximum ${maxLogos} logos reached`
              : "Drop SVG files here or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground">
            {logos.length}/{maxLogos} logos
          </p>
        </div>
      </div>

      {logos.length > 0 && (
        <div className="space-y-3">
          {logos.map((logo, index) => (
            <div
              key={logo.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded bg-card flex items-center justify-center overflow-hidden">
                <div
                  className="w-8 h-8"
                  style={{ color: logo.color }}
                  dangerouslySetInnerHTML={{
                    __html: logo.content.replace(/fill="[^"]*"/g, 'fill="currentColor"'),
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <Input
                  value={logo.name}
                  onChange={(e) => updateLogoName(logo.id, e.target.value)}
                  className="h-8 text-sm bg-transparent border-none px-0 focus-visible:ring-0"
                  placeholder={`Logo ${index + 1}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`color-${logo.id}`} className="sr-only">
                  Color
                </Label>
                <input
                  id={`color-${logo.id}`}
                  type="color"
                  value={logo.color}
                  onChange={(e) => updateLogoColor(logo.id, e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeLogo(logo.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {logos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Upload at least 2 SVG logos to create a morph animation</p>
        </div>
      )}
    </div>
  );
}
