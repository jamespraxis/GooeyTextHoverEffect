"use client";

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { gsap } from "gsap";
import type { Logo, MorphSettings } from "@/lib/morph-engine";
import { getEasingFunction } from "@/lib/morph-engine";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MorphPreviewHandle {
  captureFrame: () => string | null;
  getProgress: () => number;
  setProgress: (progress: number) => void;
  play: () => void;
  pause: () => void;
  isPlaying: () => boolean;
}

interface MorphPreviewProps {
  logos: Logo[];
  settings: MorphSettings;
  backgroundColor: string;
}

export const MorphPreview = forwardRef<MorphPreviewHandle, MorphPreviewProps>(
  function MorphPreview({ logos, settings, backgroundColor }, ref) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const blurRef = useRef<SVGFEGaussianBlurElement>(null);
    const primitiveValuesRef = useRef({ stdDeviation: 0 });

    const filterId = "morph-goo-filter";

    useImperativeHandle(ref, () => ({
      captureFrame: () => {
        if (!svgRef.current) return null;
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgRef.current);
        return svgString;
      },
      getProgress: () => {
        return timelineRef.current?.progress() ?? 0;
      },
      setProgress: (progress: number) => {
        timelineRef.current?.progress(progress);
      },
      play: () => {
        timelineRef.current?.play();
        setIsPlaying(true);
      },
      pause: () => {
        timelineRef.current?.pause();
        setIsPlaying(false);
      },
      isPlaying: () => isPlaying,
    }));

    const createAnimation = useCallback(() => {
      if (logos.length < 2 || !blurRef.current) return null;

      const tl = gsap.timeline({
        repeat: settings.loop ? -1 : 0,
        repeatDelay: settings.loopDelay,
        onUpdate: () => {
          if (blurRef.current) {
            blurRef.current.setAttribute(
              "stdDeviation",
              String(primitiveValuesRef.current.stdDeviation)
            );
          }
        },
      });

      for (let i = 0; i < logos.length; i++) {
        const nextIndex = (i + 1) % logos.length;
        const currentEl = document.getElementById(`logo-${i}`);
        const nextEl = document.getElementById(`logo-${nextIndex}`);

        if (!currentEl || !nextEl) continue;

        // Blur in
        tl.to(
          primitiveValuesRef.current,
          {
            duration: settings.duration / 2,
            ease: "none",
            stdDeviation: settings.blurIntensity,
          },
          `morph${i}`
        );

        // Blur out
        tl.to(
          primitiveValuesRef.current,
          {
            duration: settings.duration / 2,
            ease: "none",
            stdDeviation: 0,
          },
          `morph${i}+=${settings.duration / 2}`
        );

        // Fade current out
        tl.to(
          currentEl,
          {
            duration: settings.duration,
            ease: getEasingFunction(settings.easing),
            opacity: 0,
            onStart: () => setCurrentIndex(i),
          },
          `morph${i}`
        );

        // Fade next in
        tl.to(
          nextEl,
          {
            duration: settings.duration,
            ease: getEasingFunction(settings.easing),
            opacity: 1,
          },
          `morph${i}`
        );

        // Hold at end if not looping or if there are more transitions
        if (i < logos.length - 1 || settings.loop) {
          tl.to({}, { duration: settings.loopDelay }, `morph${i}+=${settings.duration}`);
        }
      }

      return tl;
    }, [logos, settings]);

    useEffect(() => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      // Reset all logos
      logos.forEach((_, i) => {
        const el = document.getElementById(`logo-${i}`);
        if (el) {
          gsap.set(el, { opacity: i === 0 ? 1 : 0 });
        }
      });

      primitiveValuesRef.current.stdDeviation = 0;
      if (blurRef.current) {
        blurRef.current.setAttribute("stdDeviation", "0");
      }

      const tl = createAnimation();
      if (tl) {
        timelineRef.current = tl;
        if (isPlaying) {
          tl.play();
        } else {
          tl.pause();
        }
      }

      return () => {
        if (timelineRef.current) {
          timelineRef.current.kill();
        }
      };
    }, [createAnimation, logos, isPlaying]);

    const togglePlayPause = () => {
      if (isPlaying) {
        timelineRef.current?.pause();
      } else {
        timelineRef.current?.play();
      }
      setIsPlaying(!isPlaying);
    };

    const restart = () => {
      timelineRef.current?.restart();
      setIsPlaying(true);
    };

    const goToNext = () => {
      const nextIndex = (currentIndex + 1) % logos.length;
      logos.forEach((_, i) => {
        const el = document.getElementById(`logo-${i}`);
        if (el) {
          gsap.set(el, { opacity: i === nextIndex ? 1 : 0 });
        }
      });
      setCurrentIndex(nextIndex);
    };

    if (logos.length < 2) {
      return (
        <div
          className="w-full aspect-video rounded-lg flex items-center justify-center"
          style={{ backgroundColor }}
        >
          <p className="text-muted-foreground text-sm">Upload at least 2 logos to preview</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div
          ref={containerRef}
          className="relative w-full aspect-video rounded-lg overflow-hidden"
          style={{ backgroundColor }}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 800 450"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id={filterId}>
                <feGaussianBlur
                  ref={blurRef}
                  in="SourceGraphic"
                  stdDeviation="0"
                  result="blur"
                />
                <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${settings.colorMatrixStrength} -8`}
                  result="goo"
                />
                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
              </filter>
            </defs>
            <g filter={`url(#${filterId})`}>
              {logos.map((logo, index) => (
                <g
                  key={logo.id}
                  id={`logo-${index}`}
                  opacity={index === 0 ? 1 : 0}
                  transform="translate(200, 75)"
                  dangerouslySetInnerHTML={{
                    __html: logo.content
                      .replace(/<svg[^>]*>/, "")
                      .replace(/<\/svg>/, "")
                      .replace(/fill="[^"]*"/g, `fill="${logo.color}"`)
                      .replace(/width="[^"]*"/g, "")
                      .replace(/height="[^"]*"/g, ""),
                  }}
                />
              ))}
            </g>
          </svg>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" onClick={restart} className="h-9 w-9">
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={togglePlayPause}
            className="h-10 w-10 bg-primary hover:bg-primary/90"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext} className="h-9 w-9">
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }
);
