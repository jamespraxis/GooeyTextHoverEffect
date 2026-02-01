export interface MorphSettings {
  duration: number;
  blurIntensity: number;
  colorMatrixStrength: number;
  easing: "linear" | "easeIn" | "easeOut" | "easeInOut";
  loop: boolean;
  loopDelay: number;
}

export const defaultSettings: MorphSettings = {
  duration: 1.6,
  blurIntensity: 1,
  colorMatrixStrength: 15,
  easing: "easeInOut",
  loop: true,
  loopDelay: 1,
};

export interface Logo {
  id: string;
  name: string;
  content: string;
  color: string;
}

export function generateFilterId(): string {
  return `goo-${Math.random().toString(36).substr(2, 9)}`;
}

export function createGooeyFilter(
  id: string,
  blurIntensity: number,
  colorMatrixStrength: number
): string {
  return `
    <filter id="${id}">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${blurIntensity}" result="blur"></feGaussianBlur>
      <feColorMatrix in="blur" mode="matrix" values="
        1 0 0 0 0  
        0 1 0 0 0  
        0 0 1 0 0  
        0 0 0 ${colorMatrixStrength} -8
      " result="goo"></feColorMatrix>
      <feComposite in="SourceGraphic" in2="goo" operator="atop"></feComposite>
    </filter>
  `;
}

export function getEasingFunction(easing: MorphSettings["easing"]): string {
  switch (easing) {
    case "linear":
      return "none";
    case "easeIn":
      return "power2.in";
    case "easeOut":
      return "power2.out";
    case "easeInOut":
      return "power2.inOut";
    default:
      return "none";
  }
}

export async function svgToDataUrl(svgContent: string): Promise<string> {
  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  return URL.createObjectURL(blob);
}

export function parseSvgContent(content: string): {
  viewBox: string;
  paths: string[];
  width: number;
  height: number;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "image/svg+xml");
  const svg = doc.querySelector("svg");

  if (!svg) {
    throw new Error("Invalid SVG content");
  }

  const viewBox = svg.getAttribute("viewBox") || "0 0 100 100";
  const width = parseFloat(svg.getAttribute("width") || "100");
  const height = parseFloat(svg.getAttribute("height") || "100");

  const paths: string[] = [];
  svg.querySelectorAll("path, polygon, rect, circle, ellipse, text").forEach((el) => {
    paths.push(el.outerHTML);
  });

  return { viewBox, paths, width, height };
}
