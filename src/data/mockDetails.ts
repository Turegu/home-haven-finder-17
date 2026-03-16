import { Property, Project } from './mockProperties';

// Extended mock data for detail pages
export const mockPropertyDetail = {
  id: '1',
  title: 'High Floor | Luxurious with Full Skyline Views',
  price: 1900000,
  currency: 'USD',
  location: 'Kestel, Karşıyaka Sk. No:8, 07450 Alanya/Antalya, Türkiye',
  city: 'Antalya',
  type: 'Apartment',
  area: 244,
  areaUnit: 'm²',
  bedrooms: 3,
  bathrooms: 4,
  parkingSpaces: 2,
  floorLevel: 'High Floor',
  ceilingHeight: '3.2m',
  propertyAge: 'New',
  propertyStatus: 'Ready',
  furniture: 'Semi-Furnished',
  orientation: ['Sea View', 'City View'],
  listingId: '48208342',
  listingDate: '2026-01-15',
  listingType: 'buy' as const,
  images: [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=600&fit=crop',
  ],
  agentLogo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop',
  agentName: 'Knight Frank',
  agentCompany: 'Real Estate Company',
  isFeatured: true,
  description: `Apartment for sale in Bulgari Resort & Residences, Jumeirah Bay Island

Brought to you by The Private Collection, this 3 Bedroom Apartment is located in Bulgari Resort & Residences, Jumeirah.

Unit Details:
• Vacant on transfer
• High floor
• Type B
• Full Skyline Views
• Open and Fully Fitted Kitchen
• 4 Bathrooms
• Built-up Area: 2,631 square feet
• 2 allocated parking

Features:
• Balcony
• Central air conditioning
• Gymnasium
• View of Water
• Built in wardrobes
• Basement parking
• Maids room
• Walk-in Closet
• Children's nursery
• Children's play area
• Restaurants
• Shared Spa
• Shops
• Security
• Concierge Service`,
  interiorAmenities: [
    'Steel Door', 'Kitchen Natural Gas', 'Central Air Conditioning',
    'Built-in Wardrobes', 'Walk-in Closet', 'Fully Fitted Kitchen',
  ],
  exteriorAmenities: [
    'Close to the city center', 'Close to public transport',
    'Earthquake Regulations Compliant', 'Balcony', 'Gymnasium',
    'Swimming Pool', 'Children\'s Play Area', 'Security', 'Concierge Service',
  ],
};

export const mockProjectDetail = {
  id: 'p1',
  title: 'Skyline Views',
  subtitle: 'High Floor | Luxurious with Full Skyline Views',
  priceFrom: 1900000,
  currency: 'USD',
  location: 'Kestel, Karşıyaka Sk. No:8, 07450 Alanya/Antalya, Türkiye',
  city: 'Antalya',
  projectType: 'Residential Compound',
  units: 245,
  developer: 'Imara',
  areaRange: '100 m² - 500 m²',
  status: 'Under Construction',
  completionDate: 'Q4 2026',
  listingId: '48208342',
  images: [
    'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1448630360428-65456885c650?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=600&fit=crop',
  ],
  agentLogo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop',
  agentName: 'Knight Frank',
  agentCompany: 'Real Estate Company',
  description: `Apartment for sale in Bulgari Resort & Residences, Jumeirah Bay Island

Brought to you by The Private Collection, this 3 Bedroom Apartment is located in Bulgari Resort & Residences, Jumeirah.

Unit Details:
• Vacant on transfer
• High floor
• Full Skyline Views
• Open and Fully Fitted Kitchen
• 2 allocated parking

Features:
• Balcony
• Central air conditioning
• Gymnasium
• View of Water
• Swimming Pool
• Children's Play Area
• Security
• Concierge Service`,
  interiorAmenities: [
    'Steel Door', 'Kitchen Natural Gas', 'Central Air Conditioning',
    'Built-in Wardrobes', 'Walk-in Closet', 'Fully Fitted Kitchen',
  ],
  exteriorAmenities: [
    'Close to the city center', 'Close to public transport',
    'Earthquake Regulations Compliant', 'Balcony', 'Gymnasium',
    'Swimming Pool', 'Children\'s Play Area', 'Security', 'Concierge Service',
  ],
};
