
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

interface Ad {
  id: string;
  imageUrl: string;
  linkUrl: string;
}

interface AdResponse {
  ad: Ad | null;
}

interface AdBannerProps {
  slot?: string;
  className?: string;
  format?: "horizontal" | "vertical" | "box";
}

export function AdBanner({ slot = "default", className = "", format = "horizontal" }: AdBannerProps) {
  // Fetch a random ad
  const { data, isLoading } = useQuery<AdResponse>({
    queryKey: ["ad", slot], // Add slot to key to potentially allow different ads per slot
    queryFn: async () => {
      const res = await fetch("/api/ads/random");
      if (!res.ok) throw new Error("Failed to fetch ad");
      return res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // Keep same ad for 5 minutes
  });

  const handleClick = async () => {
    if (data?.ad) {
      try {
        await fetch(`/api/ads/${data.ad.id}/click`, { method: "POST" });
      } catch (err) {
        console.error("Failed to track click", err);
      }
    }
  };

  if (isLoading || !data?.ad) {
    // Show placeholder or nothing if no ad
    // For now, return nothing to keep UI clean if no ads exist
    return null;
  }

  const { ad } = data;

  return (
    <div
      className={`
        overflow-hidden relative bg-slate-100 flex items-center justify-center
        ${format === "horizontal" ? "w-full max-w-[728px] mx-auto h-[90px]" : ""}
        ${format === "box" ? "w-[300px] h-[250px]" : ""}
        ${format === "vertical" ? "w-[160px] h-[600px]" : ""}
        ${className}
      `}
    >
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block w-full h-full relative group"
      >
        <img
          src={ad.imageUrl}
          alt="Advertisement"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-0 right-0 bg-black/50 text-white text-[9px] px-1 py-0.5">
          Ad
        </div>
      </a>
    </div>
  );
}
