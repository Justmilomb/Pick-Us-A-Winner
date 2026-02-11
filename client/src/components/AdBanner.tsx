
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
  type?: "custom" | "adsense";
  adsenseClientId?: string;
}

export function AdBanner({
  slot = "default",
  className = "",
  format = "horizontal",
  type = "custom",
  adsenseClientId
}: AdBannerProps) {
  // Fetch a random ad (only for custom type)
  const { data, isLoading } = useQuery<AdResponse>({
    queryKey: ["ad", slot],
    queryFn: async () => {
      const res = await fetch("/api/ads/random");
      if (!res.ok) throw new Error("Failed to fetch ad");
      return res.json();
    },
    enabled: type === "custom", // Disable query if using adsense
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (type === "adsense") {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense script error", e);
      }
    }
  }, [type]);

  const handleClick = async () => {
    if (data?.ad) {
      try {
        await fetch(`/api/ads/${data.ad.id}/click`, { method: "POST" });
      } catch (err) {
        console.error("Failed to track click", err);
      }
    }
  };

  if (type === "adsense") {
    // Standard AdSense format
    return (
      <div className={`overflow-hidden flex justify-center ${className}`}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adsenseClientId || "ca-pub-3154339896678246"} // Placeholder
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>
    );
  }

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
