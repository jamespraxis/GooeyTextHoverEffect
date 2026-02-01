"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MorphSettings } from "@/lib/morph-engine";
import { Clock, Droplets, Palette, RotateCcw } from "lucide-react";

interface MorphControlsProps {
  settings: MorphSettings;
  onSettingsChange: (settings: MorphSettings) => void;
}

export function MorphControls({ settings, onSettingsChange }: MorphControlsProps) {
  const updateSetting = <K extends keyof MorphSettings>(key: K, value: MorphSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Duration</Label>
          <span className="ml-auto text-sm text-muted-foreground font-mono">
            {settings.duration.toFixed(1)}s
          </span>
        </div>
        <Slider
          value={[settings.duration]}
          onValueChange={([value]) => updateSetting("duration", value)}
          min={0.2}
          max={5}
          step={0.1}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Blur Intensity</Label>
          <span className="ml-auto text-sm text-muted-foreground font-mono">
            {settings.blurIntensity.toFixed(1)}
          </span>
        </div>
        <Slider
          value={[settings.blurIntensity]}
          onValueChange={([value]) => updateSetting("blurIntensity", value)}
          min={0}
          max={5}
          step={0.1}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Gooey Strength</Label>
          <span className="ml-auto text-sm text-muted-foreground font-mono">
            {settings.colorMatrixStrength}
          </span>
        </div>
        <Slider
          value={[settings.colorMatrixStrength]}
          onValueChange={([value]) => updateSetting("colorMatrixStrength", value)}
          min={1}
          max={30}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Easing</Label>
        <Select
          value={settings.easing}
          onValueChange={(value: MorphSettings["easing"]) => updateSetting("easing", value)}
        >
          <SelectTrigger className="w-full bg-secondary border-border">
            <SelectValue placeholder="Select easing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="easeIn">Ease In</SelectItem>
            <SelectItem value="easeOut">Ease Out</SelectItem>
            <SelectItem value="easeInOut">Ease In Out</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Loop Animation</Label>
        </div>
        <Switch checked={settings.loop} onCheckedChange={(value) => updateSetting("loop", value)} />
      </div>

      {settings.loop && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Loop Delay</Label>
            <span className="ml-auto text-sm text-muted-foreground font-mono">
              {settings.loopDelay.toFixed(1)}s
            </span>
          </div>
          <Slider
            value={[settings.loopDelay]}
            onValueChange={([value]) => updateSetting("loopDelay", value)}
            min={0}
            max={5}
            step={0.1}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
