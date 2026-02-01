"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Film, Loader2 } from "lucide-react";
import type { MorphPreviewHandle } from "@/components/morph-preview";
import type { Logo, MorphSettings } from "@/lib/morph-engine";

interface VideoExporterProps {
  previewRef: React.RefObject<MorphPreviewHandle | null>;
  logos: Logo[];
  settings: MorphSettings;
  backgroundColor: string;
  disabled?: boolean;
}

type ExportFormat = "webm" | "gif";
type Resolution = "720p" | "1080p" | "4k";

const resolutions: Record<Resolution, { width: number; height: number }> = {
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "4k": { width: 3840, height: 2160 },
};

export function VideoExporter({
  previewRef,
  logos,
  settings,
  backgroundColor,
  disabled,
}: VideoExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState<ExportFormat>("webm");
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const renderSvgToCanvas = useCallback(
    async (svgString: string, canvas: HTMLCanvasElement): Promise<void> => {
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      const { width, height } = resolutions[resolution];
      canvas.width = width;
      canvas.height = height;

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Create image from SVG
      const img = new window.Image();
      img.crossOrigin = "anonymous";

      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      return new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Failed to load SVG"));
        };
        img.src = url;
      });
    },
    [backgroundColor, resolution]
  );

  const exportVideo = useCallback(async () => {
    if (!previewRef.current || logos.length < 2) return;

    setIsExporting(true);
    setProgress(0);

    try {
      const { width, height } = resolutions[resolution];
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvasRef.current = canvas;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Calculate total frames based on duration and fps
      const fps = 30;
      const totalDuration = (settings.duration + settings.loopDelay) * logos.length;
      const totalFrames = Math.ceil(totalDuration * fps);

      const frames: Blob[] = [];

      // Pause the preview animation
      previewRef.current.pause();

      for (let frame = 0; frame < totalFrames; frame++) {
        const progress = frame / totalFrames;
        previewRef.current.setProgress(progress);

        // Small delay to allow GSAP to update
        await new Promise((resolve) => setTimeout(resolve, 16));

        const svgString = previewRef.current.captureFrame();
        if (svgString) {
          await renderSvgToCanvas(svgString, canvas);

          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png");
          });
          frames.push(blob);
        }

        setProgress(Math.round((frame / totalFrames) * 100));
      }

      // For WebM export using MediaRecorder
      if (format === "webm") {
        const stream = canvas.captureStream(fps);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp9",
          videoBitsPerSecond: 8000000,
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

        await new Promise<void>(async (resolve) => {
          mediaRecorder.onstop = () => resolve();
          mediaRecorder.start();

          // Play back frames
          for (let i = 0; i < frames.length; i++) {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            await new Promise<void>((imgResolve) => {
              img.onload = () => {
                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                imgResolve();
              };
              img.src = URL.createObjectURL(frames[i]);
            });
            await new Promise((r) => setTimeout(r, 1000 / fps));
          }

          mediaRecorder.stop();
        });

        const blob = new Blob(chunks, { type: "video/webm" });
        downloadBlob(blob, `morph-animation-${Date.now()}.webm`);
      } else {
        // GIF export - create animated GIF using canvas frames
        // For simplicity, we'll export as WebM since GIF encoding requires additional libraries
        const stream = canvas.captureStream(fps);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp9",
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

        await new Promise<void>(async (resolve) => {
          mediaRecorder.onstop = () => resolve();
          mediaRecorder.start();

          for (let i = 0; i < frames.length; i++) {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            await new Promise<void>((imgResolve) => {
              img.onload = () => {
                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                imgResolve();
              };
              img.src = URL.createObjectURL(frames[i]);
            });
            await new Promise((r) => setTimeout(r, 1000 / fps));
          }

          mediaRecorder.stop();
        });

        const blob = new Blob(chunks, { type: "video/webm" });
        downloadBlob(blob, `morph-animation-${Date.now()}.webm`);
      }

      // Resume playback
      previewRef.current.play();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [previewRef, logos, settings, format, resolution, backgroundColor, renderSvgToCanvas]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Format</Label>
          <Select value={format} onValueChange={(v: ExportFormat) => setFormat(v)}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="webm">WebM Video</SelectItem>
              <SelectItem value="gif">GIF (as WebM)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Resolution</Label>
          <Select value={resolution} onValueChange={(v: Resolution) => setResolution(v)}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="720p">720p (1280x720)</SelectItem>
              <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
              <SelectItem value="4k">4K (3840x2160)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isExporting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rendering frames...</span>
            <span className="font-mono text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <Button
        onClick={exportVideo}
        disabled={disabled || isExporting || logos.length < 2}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Export Video
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Video will be exported as WebM format compatible with most browsers and video editors
      </p>
    </div>
  );
}
