export interface Property {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  city: string;
  type: string;
  area: number;
  areaUnit: string;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  agentLogo: string;
  agentName: string;
  agentAvatar?: string;
  isFeatured: boolean;
  listingTier: 'premium' | 'featured' | 'standard';
  listingType: 'buy' | 'rent';
  advertisingTags?: string[];
}

export interface Project {
  id: string;
  title: string;
  location: string;
  priceFrom: number;
  currency: string;
  image: string;
  developer: string;
  units: number;
  completionDate: string;
}

export interface CityLocation {
  id: string;
  name: string;
  country: string;
  propertyCount: number;
  image: string;
}

export const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Modern Villa with Sea View in Jumeirah',
    price: 2500000,
    currency: 'USD',
    location: 'Jumeirah Beach Residence, Dubai Marina',
    city: 'Dubai',
    type: 'Villa',
    area: 450,
    areaUnit: 'm²',
    bedrooms: 5,
    bathrooms: 4,
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
    ],
    agentLogo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop',
    agentName: 'Prime Properties',
    isFeatured: true,
    listingTier: 'premium',
    listingType: 'buy',
  },
  {
    id: '2',
    title: 'Luxury Penthouse in Downtown Istanbul',
    price: 1800000,
    currency: 'USD',
    location: 'Levent, Beşiktaş',
    city: 'Istanbul',
    type: 'Penthouse',
    area: 320,
    areaUnit: 'm²',
    bedrooms: 4,
    bathrooms: 3,
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
    ],
    agentLogo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop',
    agentName: 'Istanbul Estates',
    isFeatured: true,
    listingTier: 'featured',
    listingType: 'buy',
  },
  {
    id: '3',
    title: 'Elegant Apartment in Abu Dhabi Corniche',
    price: 950000,
    currency: 'USD',
    location: 'Corniche Road, Al Khalidiyah',
    city: 'Abu Dhabi',
    type: 'Apartment',
    area: 180,
    areaUnit: 'm²',
    bedrooms: 3,
    bathrooms: 2,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
    ],
    agentLogo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
    agentName: 'Gulf Realty',
    isFeatured: true,
    listingTier: 'premium',
    listingType: 'buy',
  },
  {
    id: '4',
    title: 'Contemporary Studio for Rent in JLT',
    price: 4500,
    currency: 'USD',
    location: 'Jumeirah Lake Towers, Cluster D',
    city: 'Dubai',
    type: 'Studio',
    area: 55,
    areaUnit: 'm²',
    bedrooms: 0,
    bathrooms: 1,
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop',
    ],
    agentLogo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop',
    agentName: 'Rental Hub',
    isFeatured: false,
    listingTier: 'standard',
    listingType: 'rent',
  },
  {
    id: '5',
    title: 'Spacious Family Home in Ankara',
    price: 650000,
    currency: 'USD',
    location: 'Çankaya, Ankara',
    city: 'Ankara',
    type: 'Villa',
    area: 380,
    areaUnit: 'm²',
    bedrooms: 6,
    bathrooms: 4,
    images: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=400&fit=crop',
    ],
    agentLogo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop',
    agentName: 'Ankara Properties',
    isFeatured: true,
    listingTier: 'featured',
    listingType: 'buy',
  },
  {
    id: '6',
    title: 'Waterfront Apartment in Sharjah',
    price: 420000,
    currency: 'USD',
    location: 'Al Majaz Waterfront, Sharjah',
    city: 'Sharjah',
    type: 'Apartment',
    area: 140,
    areaUnit: 'm²',
    bedrooms: 2,
    bathrooms: 2,
    images: [
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=400&fit=crop',
    ],
    agentLogo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop',
    agentName: 'Sharjah Homes',
    isFeatured: false,
    listingTier: 'standard',
    listingType: 'buy',
  },
];

export const mockProjects: Project[] = [
  {
    id: 'p1',
    title: 'The Grand Marina Residences',
    location: 'Dubai Marina, Dubai',
    priceFrom: 750000,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop',
    developer: 'Emaar Properties',
    units: 450,
    completionDate: 'Q4 2026',
  },
  {
    id: 'p2',
    title: 'Bosphorus Tower Istanbul',
    location: 'Beşiktaş, Istanbul',
    priceFrom: 520000,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
    developer: 'Istanbul Development',
    units: 280,
    completionDate: 'Q2 2027',
  },
  {
    id: 'p3',
    title: 'Al Reem Island Heights',
    location: 'Al Reem Island, Abu Dhabi',
    priceFrom: 380000,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=600&h=400&fit=crop',
    developer: 'Aldar Properties',
    units: 600,
    completionDate: 'Q1 2027',
  },
];

export const mockCities: CityLocation[] = [
  {
    id: 'c1',
    name: 'Dubai',
    country: 'UAE',
    propertyCount: 12450,
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop',
  },
  {
    id: 'c2',
    name: 'Istanbul',
    country: 'Turkey',
    propertyCount: 8920,
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&h=400&fit=crop',
  },
  {
    id: 'c3',
    name: 'Abu Dhabi',
    country: 'UAE',
    propertyCount: 5630,
    image: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=600&h=400&fit=crop',
  },
  {
    id: 'c4',
    name: 'Ankara',
    country: 'Turkey',
    propertyCount: 4210,
    image: 'https://images.unsplash.com/photo-1569396116180-210c182bedb8?w=600&h=400&fit=crop',
  },
  {
    id: 'c5',
    name: 'Sharjah',
    country: 'UAE',
    propertyCount: 3180,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop',
  },
  {
    id: 'c6',
    name: 'Antalya',
    country: 'Turkey',
    propertyCount: 6740,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=400&fit=crop',
  },
];

export const partnerLogos = [
  { name: 'Emaar', id: 'l1' },
  { name: 'Damac', id: 'l2' },
  { name: 'Aldar', id: 'l3' },
  { name: 'Nakheel', id: 'l4' },
  { name: 'Meraas', id: 'l5' },
  { name: 'Sobha', id: 'l6' },
  { name: 'Azizi', id: 'l7' },
  { name: 'Select Group', id: 'l8' },
];
