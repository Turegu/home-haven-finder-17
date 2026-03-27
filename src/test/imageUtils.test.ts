import { describe, it, expect } from 'vitest';
import { getOptimizedImageUrl } from '@/lib/imageUtils';

describe('getOptimizedImageUrl', () => {
  it('returns placeholder for null/undefined', () => {
    expect(getOptimizedImageUrl(null, 'card')).toBe('/placeholder.svg');
    expect(getOptimizedImageUrl(undefined, 'card')).toBe('/placeholder.svg');
    expect(getOptimizedImageUrl('', 'card')).toBe('/placeholder.svg');
  });

  it('returns original URL for non-Supabase URLs', () => {
    const url = 'https://cdn.example.com/photo.jpg';
    expect(getOptimizedImageUrl(url, 'card')).toBe(url);
  });

  it('appends transform params to Supabase Storage URLs', () => {
    const url = 'https://abc.supabase.co/storage/v1/object/public/images/photo.jpg';
    const result = getOptimizedImageUrl(url, 'card');
    expect(result).toBe(url + '?width=400&quality=80&format=webp');
  });

  it('uses & separator when URL already has query params', () => {
    const url = 'https://abc.supabase.co/storage/v1/object/public/images/photo.jpg?token=x';
    const result = getOptimizedImageUrl(url, 'thumbnail');
    expect(result).toBe(url + '&width=200&quality=75&format=webp');
  });

  it('applies correct dimensions per size preset', () => {
    const base = 'https://abc.supabase.co/storage/v1/object/public/img.jpg';
    expect(getOptimizedImageUrl(base, 'thumbnail')).toContain('width=200&quality=75');
    expect(getOptimizedImageUrl(base, 'card')).toContain('width=400&quality=80');
    expect(getOptimizedImageUrl(base, 'hero')).toContain('width=900&quality=85');
    expect(getOptimizedImageUrl(base, 'og')).toContain('width=1200&quality=90');
  });

  it('does not transform avatar/external URLs', () => {
    const avatar = 'https://cdn.example.com/avatars/user.png';
    expect(getOptimizedImageUrl(avatar, 'thumbnail')).toBe(avatar);
  });
});
