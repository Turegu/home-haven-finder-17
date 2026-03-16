export interface Event {
  id: string;
  title: string;
  location: string;
  city: string;
  eventType: string;
  date: string;
  price: number | null;
  currency: string;
  images: string[];
  organizer: string;
  organizerLogo: string;
  description: string;
  phone: string;
  email: string;
  whatsapp: string;
}

export const mockEvents: Event[] = [
  {
    id: 'e1',
    title: 'Ayanna Dennis',
    location: 'İhya İslami İlimler Külliyesi, Mevlanakapı, Fatih/İstanbul',
    city: 'Istanbul',
    eventType: 'Exhibition/Trade Show',
    date: '2026-01-15',
    price: 422,
    currency: 'USD',
    images: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=500&fit=crop',
    ],
    organizer: 'Knight Frank',
    organizerLogo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop',
    description: 'Join us for an exclusive real estate exhibition showcasing luxury properties across Turkey. Meet top developers and agents.',
    phone: '+90 555 123 4567',
    email: 'events@turegu.com',
    whatsapp: '+905551234567',
  },
  {
    id: 'e2',
    title: 'Rhiannon Moss',
    location: 'Nevşehir, Nevşehir Merkez/Nevşehir',
    city: 'Nevşehir',
    eventType: 'Exhibition/Trade Show',
    date: '2026-01-14',
    price: null,
    currency: 'USD',
    images: [
      'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=500&fit=crop',
    ],
    organizer: 'Imara Group',
    organizerLogo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop',
    description: 'Open invitation event for property investors interested in Cappadocia region developments.',
    phone: '+90 555 234 5678',
    email: 'info@imara.com',
    whatsapp: '+905552345678',
  },
  {
    id: 'e3',
    title: 'Regina Gentry Heloee',
    location: 'Gaziantep',
    city: 'Gaziantep',
    eventType: 'Seminar/Conference',
    date: '2026-01-05',
    price: 243,
    currency: 'USD',
    images: [
      'https://images.unsplash.com/photo-1587825140708-dfaf18c11727?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=500&fit=crop',
    ],
    organizer: 'RE/MAX Turkey',
    organizerLogo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
    description: 'A seminar on real estate investment opportunities in southeastern Turkey.',
    phone: '+90 555 345 6789',
    email: 'seminars@remax.tr',
    whatsapp: '+905553456789',
  },
  {
    id: 'e4',
    title: 'Istanbul Property Expo 2026',
    location: 'Istanbul Congress Center, Harbiye, Şişli/İstanbul',
    city: 'Istanbul',
    eventType: 'Exhibition/Trade Show',
    date: '2026-03-20',
    price: 150,
    currency: 'USD',
    images: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=500&fit=crop',
    ],
    organizer: 'Turegu Events',
    organizerLogo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop',
    description: 'The largest property expo in Istanbul featuring 200+ developers and thousands of properties.',
    phone: '+90 555 456 7890',
    email: 'expo@turegu.com',
    whatsapp: '+905554567890',
  },
  {
    id: 'e5',
    title: 'Antalya Investment Forum',
    location: 'Antalya Expo Center, Muratpaşa/Antalya',
    city: 'Antalya',
    eventType: 'Seminar/Conference',
    date: '2026-04-10',
    price: null,
    currency: 'USD',
    images: [
      'https://images.unsplash.com/photo-1559223607-a43c990c692c?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&h=500&fit=crop',
    ],
    organizer: 'Knight Frank',
    organizerLogo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop',
    description: 'Free investment forum discussing tourism property opportunities in Antalya.',
    phone: '+90 555 567 8901',
    email: 'forum@knightfrank.tr',
    whatsapp: '+905555678901',
  },
];
