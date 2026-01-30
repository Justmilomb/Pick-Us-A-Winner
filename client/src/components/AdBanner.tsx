
import React from "react";

interface AdBannerProps {
  slot?: string;
  className?: string;
  format?: "horizontal" | "vertical" | "box";
}

export function AdBanner({ slot = "default", className = "", format = "horizontal" }: AdBannerProps) {
  // In production, you would replace this logical block with your AdSense/Ad network code
  // Example: <ins class="adsbygoogle" ... />

  const isDev = true; // Set to false when you add real ads

  if (!isDev) return null; // Hide placeholders in production if no ads are configured

  return (
    <div 
      className={`
        bg-gray-50 border-2 border-dashed border-gray-200 
        flex items-center justify-center text-gray-400 text-xs uppercase tracking-widest font-mono
        overflow-hidden relative
        ${format === "horizontal" ? "w-full h-[90px]" : ""}
        ${format === "box" ? "w-[300px] h-[250px]" : ""}
        ${format === "vertical" ? "w-[160px] h-[600px]" : ""}
        ${className}
      `}
    >
      <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]"></div>
      <span>Ad Space ({format})</span>
    </div>
  );
}
