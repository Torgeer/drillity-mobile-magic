import { useEffect, useState } from "react";

export type SizeOption = "small" | "medium" | "big";

type DisplaySettings = {
  textScale: SizeOption;
  adSize: SizeOption;
};

const TEXT_KEY = "drillity-text-scale";
const AD_KEY = "drillity-ad-size";

export function useDisplaySettings() {
  const [textScale, setTextScale] = useState<SizeOption>(() => {
    const stored = (localStorage.getItem(TEXT_KEY) as SizeOption) || "medium";
    return stored;
  });
  const [adSize, setAdSize] = useState<SizeOption>(() => {
    const stored = (localStorage.getItem(AD_KEY) as SizeOption) || "medium";
    return stored;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("text-scale-small", "text-scale-medium", "text-scale-big");
    root.classList.add(`text-scale-${textScale}`);
    localStorage.setItem(TEXT_KEY, textScale);
  }, [textScale]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("ad-size-small", "ad-size-medium", "ad-size-big");
    root.classList.add(`ad-size-${adSize}`);
    localStorage.setItem(AD_KEY, adSize);
  }, [adSize]);

  return { textScale, setTextScale, adSize, setAdSize } as DisplaySettings & {
    setTextScale: (s: SizeOption) => void;
    setAdSize: (s: SizeOption) => void;
  };
}
