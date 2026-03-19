import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Banner {
  id: string;
  name: string;
  page_name: string;
  banner_type: string;
  page_position: number;
  image_url: string | null;
  link_url: string | null;
  banner_text: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface BannerDisplayProps {
  pageName: string;
  bannerType: "horizontal" | "vertical";
  position?: number;
  className?: string;
}

const BannerDisplay = memo(({ pageName, bannerType, position, className = "" }: BannerDisplayProps) => {
  const { data: banner } = useQuery({
    queryKey: ["banner", pageName, bannerType, position ?? "any"],
    queryFn: async () => {
      let query = supabase
        .from("banners")
        .select("*")
        .eq("page_name", pageName)
        .eq("banner_type", bannerType)
        .eq("status", "active");

      if (position) query = query.eq("page_position", position);

      const { data } = await query.limit(1);
      if (!data || data.length === 0) return null;

      const b = data[0] as Banner;
      const now = new Date();
      if (b.start_date && new Date(b.start_date) > now) return null;
      if (b.end_date && new Date(b.end_date) < now) return null;
      if (!b.image_url && !b.banner_text) return null;
      return b;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  if (!banner) return null;

  const content = (
    <div className="relative overflow-hidden rounded-lg">
      {banner.image_url && (
        <img
          src={banner.image_url}
          alt={banner.name}
          loading="lazy"
          className={`w-full h-auto object-cover ${
            bannerType === "horizontal"
              ? "max-h-[120px] sm:max-h-[160px] md:max-h-[206px]"
              : "max-h-[300px] sm:max-h-[400px] md:max-h-[513px] w-full"
          }`}
        />
      )}
      {banner.banner_text && (
        <div className={`${banner.image_url ? "absolute inset-0 flex items-center justify-center bg-foreground/30" : "bg-primary py-6 px-4 flex items-center justify-center"}`}>
          <p className={`text-white font-bold text-center leading-tight ${
            bannerType === "horizontal"
              ? "text-sm sm:text-base md:text-xl lg:text-2xl px-4"
              : "text-xs sm:text-sm md:text-base px-2"
          }`}>
            {banner.banner_text}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className={className}>
      {banner.link_url ? (
        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
});

BannerDisplay.displayName = "BannerDisplay";

export default BannerDisplay;
