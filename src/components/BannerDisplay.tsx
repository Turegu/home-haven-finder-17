import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Banner {
  id: string;
  name: string;
  page_name: string;
  banner_type: string;
  page_position: number;
  image_url: string | null;
  link_url: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface BannerDisplayProps {
  pageName: string;
  bannerType: "horizontal" | "vertical";
  position?: number;
  className?: string;
}

const BannerDisplay = ({ pageName, bannerType, position, className = "" }: BannerDisplayProps) => {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    const fetchBanner = async () => {
      const now = new Date().toISOString();
      let query = supabase
        .from("banners")
        .select("*")
        .eq("page_name", pageName)
        .eq("banner_type", bannerType)
        .eq("status", "active");

      if (position) {
        query = query.eq("page_position", position);
      }

      const { data } = await query.limit(1);
      if (data && data.length > 0) {
        const b = data[0] as Banner;
        // Check date range client-side
        const now = new Date();
        if (b.start_date && new Date(b.start_date) > now) return;
        if (b.end_date && new Date(b.end_date) < now) return;
        if (b.image_url) setBanner(b);
      }
    };
    fetchBanner();
  }, [pageName, bannerType, position]);

  if (!banner) return null;

  const content = (
    <img
      src={banner.image_url!}
      alt={banner.name}
      className={`w-full h-auto rounded-lg object-cover ${
        bannerType === "horizontal" ? "max-h-[206px]" : "max-h-[513px] max-w-[225px]"
      }`}
    />
  );

  return (
    <div className={`${className}`}>
      {banner.link_url ? (
        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
};

export default BannerDisplay;
