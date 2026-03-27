export type ImageSize = 'thumbnail' | 'card' | 'hero' | 'og';

const SIZE_MAP: Record<ImageSize, { width: number; quality: number }> = {
  thumbnail: { width: 200, quality: 75 },
  card:      { width: 400, quality: 80 },
  hero:      { width: 900, quality: 85 },
  og:        { width: 1200, quality: 90 },
};

export function getOptimizedImageUrl(
  url: string | null | undefined,
  size: ImageSize
): string {
  if (!url) return '/placeholder.svg';
  // Only transform Supabase Storage URLs — leave external URLs untouched
  if (!url.includes('supabase.co/storage')) return url;
  const { width, quality } = SIZE_MAP[size];
  const separator = url.includes('?') ? '&' : '?';
  return url + separator + 'width=' + width + '&quality=' + quality + '&format=webp';
}
