import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface Language {
  id: string;
  name: string;
  code: string;
}

interface TranslationData {
  title: string;
  description: string;
}

const AdminBlogEditPage = () => {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [activeLang, setActiveLang] = useState("en");
  const [translations, setTranslations] = useState<Record<string, TranslationData>>({});
  const [slug, setSlug] = useState("");
  const [author, setAuthor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Fetch active languages
      const { data: langs } = await supabase
        .from("languages")
        .select("id, name, code")
        .eq("status", "active")
        .order("sort_order");

      if (langs && langs.length > 0) {
        setLanguages(langs);
        setActiveLang(langs[0].code);
        // Init empty translations for all languages
        const init: Record<string, TranslationData> = {};
        langs.forEach(l => { init[l.code] = { title: "", description: "" }; });
        setTranslations(init);
      }

      // If editing existing blog, load it
      if (!isNew && id) {
        const { data: blog } = await supabase.from("blogs").select("*").eq("id", id).single();
        if (blog) {
          setSlug(blog.slug);
          setAuthor(blog.author || "");
          setImageUrl(blog.image_url || "");
        }

        const { data: trans } = await supabase
          .from("blog_translations")
          .select("language_code, title, description")
          .eq("blog_id", id);

        if (trans) {
          const map: Record<string, TranslationData> = {};
          // Start with empty for all languages
          if (langs) langs.forEach(l => { map[l.code] = { title: "", description: "" }; });
          (trans as any[]).forEach((t: any) => {
            map[t.language_code] = { title: t.title, description: t.description };
          });
          setTranslations(map);
        }
      }
    };
    init();
  }, [id, isNew]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `blogs/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("blog-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) {
        console.error("Blog image upload error:", uploadError);
        toast({ title: t("admin.uploadFailed"), description: uploadError.message, variant: "destructive" });
        setUploading(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("blog-images").getPublicUrl(path);
      setImageUrl(publicUrl);
      toast({ title: t("admin.imageUploaded") });
    } catch (err: any) {
      console.error("Blog image upload exception:", err);
      toast({ title: t("admin.uploadFailed"), description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const updateTranslation = (langCode: string, field: keyof TranslationData, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [langCode]: { ...prev[langCode], [field]: value },
    }));
  };

  // Auto-generate slug from English title
  const generateSlug = () => {
    const enTitle = translations["en"]?.title || translations[languages[0]?.code]?.title || "";
    const generated = enTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80);
    setSlug(generated);
  };

  const handleSave = async (publish: boolean) => {
    const firstTitle = translations[activeLang]?.title || Object.values(translations).find(t => t.title)?.title;
    if (!firstTitle) {
      toast({ title: t("admin.enterTitleForOneLanguage"), variant: "destructive" });
      return;
    }
    if (!slug) {
      toast({ title: t("admin.enterSlug"), variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      let blogId = id;

      if (isNew) {
        const { data, error } = await supabase
          .from("blogs")
          .insert({ slug, author, image_url: imageUrl || null, status: publish ? "published" : "draft" })
          .select("id")
          .single();
        if (error) throw error;
        blogId = data.id;
      } else {
        const { error } = await supabase
          .from("blogs")
          .update({ slug, author, image_url: imageUrl || null, status: publish ? "published" : "draft" })
          .eq("id", blogId!);
        if (error) throw error;

        // Delete existing translations to re-insert
        await supabase.from("blog_translations").delete().eq("blog_id", blogId!);
      }

      // Insert all translations
      const rows = Object.entries(translations)
        .filter(([_, t]) => t.title || t.description)
        .map(([code, t]) => ({
          blog_id: blogId!,
          language_code: code,
          title: t.title,
          description: t.description,
        }));

      if (rows.length > 0) {
        const { error } = await supabase.from("blog_translations").insert(rows);
        if (error) throw error;
      }

      toast({ title: isNew ? t("admin.blogSaved") : t("admin.blogSaved") });
      navigate("/admin/blog");
    } catch (err: any) {
      toast({ title: t("admin.error"), description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const currentTrans = translations[activeLang] || { title: "", description: "" };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={() => navigate("/admin/blog")}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blog Management
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              Save as Draft
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              {saving ? "Saving..." : "Publish Blog"}
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-primary">{isNew ? "New Blog" : "Edit Blog"}</h1>

        {/* Language Tabs */}
        {languages.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => setActiveLang(lang.code)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                  activeLang === lang.code
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {lang.name}
              </button>
            ))}
          </div>
        )}

        {/* Information Section */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Information</h2>

          {/* Blog Title */}
          <div className="space-y-2">
            <Label className="text-primary font-medium">Blog Title*</Label>
            <Input
              value={currentTrans.title}
              onChange={e => updateTranslation(activeLang, "title", e.target.value)}
              placeholder="Writer Blog Title (60-80 Characters)"
              className="bg-muted/30"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label className="text-primary font-medium">Slug</Label>
            <div className="flex gap-2">
              <Input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="blog-url-slug"
                className="bg-muted/30"
              />
              <Button variant="outline" size="sm" onClick={generateSlug} type="button">
                Auto
              </Button>
            </div>
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label className="text-primary font-medium">Author</Label>
            <Input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="Author name"
              className="bg-muted/30"
            />
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label className="text-primary font-medium">Image</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center min-h-[180px] relative bg-muted/20">
              {imageUrl ? (
                <div className="relative w-full">
                  <img src={imageUrl} alt="Blog" className="max-h-[200px] object-contain mx-auto rounded" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-0 right-0"
                    onClick={() => setImageUrl("")}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-12 w-12" />
                </div>
              )}
              <label className="absolute top-3 right-3 cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Upload className="h-4 w-4" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Description / Content */}
          <div className="space-y-2">
            <Label className="text-primary font-medium">Description</Label>
            <Textarea
              value={currentTrans.description}
              onChange={e => updateTranslation(activeLang, "description", e.target.value)}
              placeholder="Write your blog here..."
              className="bg-muted/20 min-h-[300px]"
            />
            <p className="text-xs text-muted-foreground">Supports HTML for rich formatting.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBlogEditPage;
