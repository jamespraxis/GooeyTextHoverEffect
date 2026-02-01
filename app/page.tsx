"use client";

import { useRef, useState, useEffect } from "react";
import { LogoUploader } from "@/components/logo-uploader";
import { MorphControls } from "@/components/morph-controls";
import { MorphPreview, type MorphPreviewHandle } from "@/components/morph-preview";
import { VideoExporter } from "@/components/video-exporter";
import { defaultSettings, type Logo, type MorphSettings } from "@/lib/morph-engine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Droplets, Settings, Upload, Film } from "lucide-react";

console.log("[v0] MorphAnimator module loaded");

export default function MorphAnimator() {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [settings, setSettings] = useState<MorphSettings>(defaultSettings);
  const [backgroundColor, setBackgroundColor] = useState("#111318");
  const previewRef = useRef<MorphPreviewHandle>(null);

  useEffect(() => {
    console.log("[v0] MorphAnimator rendered, logos:", logos.length);
  }, [logos]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Droplets className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Liquid Morph</h1>
              <p className="text-xs text-muted-foreground">SVG Animation Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="px-2 py-1 rounded bg-secondary text-xs font-mono">
              {logos.length} logos
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col lg:flex-row max-w-screen-2xl mx-auto">
        {/* Left Panel - Controls */}
        <aside className="w-full lg:w-80 border-r border-border bg-card/50 lg:h-[calc(100vh-65px)] overflow-y-auto">
          <Tabs defaultValue="logos" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto">
              <TabsTrigger
                value="logos"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <Upload className="w-4 h-4 mr-2" />
                Logos
              </TabsTrigger>
              <TabsTrigger
                value="controls"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <Settings className="w-4 h-4 mr-2" />
                Controls
              </TabsTrigger>
              <TabsTrigger
                value="export"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <Film className="w-4 h-4 mr-2" />
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="logos" className="p-4 mt-0">
              <LogoUploader logos={logos} onLogosChange={setLogos} maxLogos={6} />
            </TabsContent>

            <TabsContent value="controls" className="p-4 mt-0">
              <div className="space-y-6">
                <MorphControls settings={settings} onSettingsChange={setSettings} />

                <div className="pt-4 border-t border-border">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Background Color</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer bg-transparent border border-border"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="flex-1 h-10 px-3 rounded-md bg-secondary border border-border text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="export" className="p-4 mt-0">
              <VideoExporter
                previewRef={previewRef}
                logos={logos}
                settings={settings}
                backgroundColor={backgroundColor}
                disabled={logos.length < 2}
              />
            </TabsContent>
          </Tabs>
        </aside>

        {/* Right Panel - Preview */}
        <section className="flex-1 p-6 lg:h-[calc(100vh-65px)] flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-foreground">Preview</h2>
            <p className="text-xs text-muted-foreground">
              {logos.length < 2
                ? "Upload at least 2 SVG logos to see the morph animation"
                : "Your liquid morph animation preview"}
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center bg-card/30 rounded-xl border border-border p-4">
            <div className="w-full max-w-4xl">
              <MorphPreview
                ref={previewRef}
                logos={logos}
                settings={settings}
                backgroundColor={backgroundColor}
              />
            </div>
          </div>

          {/* Footer info */}
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Duration: {((settings.duration + settings.loopDelay) * Math.max(logos.length, 1)).toFixed(1)}s
              total
            </span>
            <span>
              {settings.loop ? "Looping" : "Single play"} | Easing: {settings.easing}
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
