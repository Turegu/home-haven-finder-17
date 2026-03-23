import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  jsonLd?: Record<string, any>;
}

const SEOHead = ({ title, description, image, url, type = 'website', jsonLd }: SEOHeadProps) => {
  useEffect(() => {
    const fullTitle = `${title} | Turegu`;
    document.title = fullTitle;

    const setMeta = (property: string, content: string, isName = false) => {
      const attr = isName ? 'name' : 'property';
      let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, property);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    if (description) {
      setMeta('description', description, true);
      setMeta('og:description', description);
      setMeta('twitter:description', description);
    }

    setMeta('og:title', fullTitle);
    setMeta('twitter:title', fullTitle);
    setMeta('og:type', type);

    if (image) {
      setMeta('og:image', image);
      setMeta('twitter:image', image);
    }

    if (url) {
      setMeta('og:url', url);
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = url;
    }

    // JSON-LD structured data
    const existingScript = document.querySelector('script[data-seo-jsonld]');
    if (existingScript) existingScript.remove();

    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const script = document.querySelector('script[data-seo-jsonld]');
      if (script) script.remove();
    };
  }, [title, description, image, url, type, jsonLd]);

  return null;
};

export default SEOHead;
