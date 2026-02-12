
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

interface Ad {
  id: string;
  imageUrl: string;
  linkUrl: string;
}

interface AdResponse {
  ad: Ad | null;
}

/** AdSense slot IDs: horizontal bar (9573154835), vertical (8260073166) */
const AD_SLOTS = {
  horizontal: "9573154835",
  vertical: "8260073166",
} as const;

interface AdBannerProps {
  slot?: string;
  className?: string;
  format?: "horizontal" | "vertical" | "box";
  type?: "custom" | "adsense";
  adsenseClientId?: string;
}

export function AdBanner({
  slot,
  className = "",
  format = "horizontal",
  type = "custom",
  adsenseClientId
}: AdBannerProps) {
  const adSlot = slot ?? (format === "vertical" ? AD_SLOTS.vertical : AD_SLOTS.horizontal);
  const adRef = useRef<HTMLDivElement>(null);
  const [canShowAd, setCanShowAd] = useState(false);

  // Fetch a random ad (only for custom type)
  const { data, isLoading } = useQuery<AdResponse>({
    queryKey: ["ad", slot ?? "default"],
    queryFn: async () => {
      const res = await fetch("/api/ads/random");
      if (!res.ok) throw new Error("Failed to fetch ad");
      return res.json();
    },
    enabled: type === "custom", // Disable query if using adsense
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Only render <ins> when container has width (avoids "No slot size for availableWidth=0")
  useLayoutEffect(() => {
    if (type !== "adsense") return;

    const container = adRef.current;
    if (!container) return;

    const check = () => {
      if (container.offsetWidth > 0) {
        setCanShowAd(true);
        return true;
      }
      return false;
    };

    if (check()) return;

    const observer = new ResizeObserver(() => check());
    observer.observe(container);
    const timeout = setTimeout(() => { check(); observer.disconnect(); }, 500);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [type]);

  // Push to AdSense only after <ins> is rendered and has dimensions
  useEffect(() => {
    if (type !== "adsense" || !canShowAd) return;

    const container = adRef.current;
    if (!container || container.offsetWidth <= 0) return;

    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (e) {
      console.error("AdSense script error", e);
    }
  }, [type, canShowAd]);

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
    const isVertical = format === "vertical";
    return (
      <div
        ref={adRef}
        className={`overflow-hidden flex justify-center ${isVertical ? "w-[160px] min-w-[120px]" : "min-w-[320px] w-full"} ${className}`}
        style={{ minHeight: isVertical ? 600 : 90 }}
      >
        {canShowAd && (
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={adsenseClientId || "ca-pub-3154339896678246"}
            data-ad-slot={adSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        )}
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
