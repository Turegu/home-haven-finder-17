import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SitemapRoute = () => {
  const [xml, setXml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Sitemap";
    const fetchSitemap = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("generate-sitemap");
        if (fnError) {
          setError("Failed to load sitemap.");
          return;
        }
        setXml(typeof data === "string" ? data : JSON.stringify(data));
      } catch {
        setError("An unexpected error occurred.");
      }
    };
    fetchSitemap();
  }, []);

  if (error) return <div>{error}</div>;
  if (!xml) return <div>Loading sitemap...</div>;

  return (
    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", fontFamily: "monospace", fontSize: 13 }}>
      {xml}
    </pre>
  );
};

export default SitemapRoute;
