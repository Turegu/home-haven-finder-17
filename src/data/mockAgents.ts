export interface Agent {
  id: string;
  name: string;
  designation: string;
  photo: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  languages: string[];
  serviceAreas: string[];
  propertiesForBuy: number;
  propertiesForRent: number;
  projects: number;
  events: number;
  about: string;
}

export interface Company {
  id: string;
  name: string;
  type: string;
  logo: string;
  coverImage: string;
  agents: number;
  languages: string[];
  serviceAreas: string[];
  propertiesForBuy: number;
  propertiesForRent: number;
  projects: number;
  events: number;
  about: string;
}

export const mockCompanies: Company[] = [
  {
    id: 'c1',
    name: 'Knight Frank',
    type: 'Real Estate Company',
    logo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&h=300&fit=crop',
    agents: 3,
    languages: ['English', 'Turkish', 'Arabic', 'German', 'French'],
    serviceAreas: ['Istanbul', 'Antalya', 'All Areas'],
    propertiesForBuy: 12,
    propertiesForRent: 5,
    projects: 3,
    events: 2,
    about: 'Established in 2012, Knight Frank has grown into a leading property brokerage, investment, and consultancy company. We offer a full spectrum of innovative and customizable property solutions across Turkey\'s most desirable locations.',
  },
  {
    id: 'c2',
    name: 'Remax Premium',
    type: 'Real Estate Agency',
    logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=300&fit=crop',
    agents: 5,
    languages: ['English', 'Turkish', 'Russian'],
    serviceAreas: ['Istanbul', 'Bodrum'],
    propertiesForBuy: 24,
    propertiesForRent: 18,
    projects: 6,
    events: 1,
    about: 'Remax Premium is a trusted real estate agency specializing in luxury properties across Turkey. Our experienced team provides comprehensive services for buyers and investors.',
  },
  {
    id: 'c3',
    name: 'Golden Key Properties',
    type: 'Real Estate Company',
    logo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=1200&h=300&fit=crop',
    agents: 2,
    languages: ['English', 'Turkish', 'Arabic'],
    serviceAreas: ['Antalya', 'Alanya'],
    propertiesForBuy: 8,
    propertiesForRent: 3,
    projects: 2,
    events: 0,
    about: 'Golden Key Properties specializes in premium coastal real estate along the Turkish Riviera, helping international buyers find their dream homes.',
  },
];

export const mockAgents: Agent[] = [
  {
    id: 'a1',
    name: 'Karina Das',
    designation: 'Sales Director',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    companyId: 'c1',
    companyName: 'Knight Frank',
    companyLogo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop',
    languages: ['English', 'Turkish', 'Arabic', 'German'],
    serviceAreas: ['Istanbul', 'Antalya', 'All Areas'],
    propertiesForBuy: 5,
    propertiesForRent: 2,
    projects: 1,
    events: 1,
    about: 'Karina Das is a seasoned real estate professional with over 10 years of experience in the Turkish property market. She specializes in luxury apartments and villas for international buyers.',
  },
  {
    id: 'a2',
    name: 'Ahmet Yilmaz',
    designation: 'Senior Consultant',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    companyId: 'c1',
    companyName: 'Knight Frank',
    companyLogo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop',
    languages: ['English', 'Turkish'],
    serviceAreas: ['Istanbul'],
    propertiesForBuy: 8,
    propertiesForRent: 3,
    projects: 2,
    events: 0,
    about: 'Ahmet Yilmaz brings deep local knowledge of Istanbul\'s real estate market with expertise in both residential and commercial properties.',
  },
  {
    id: 'a3',
    name: 'Sarah Johnson',
    designation: 'Property Advisor',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    companyId: 'c2',
    companyName: 'Remax Premium',
    companyLogo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
    languages: ['English', 'Russian', 'Turkish'],
    serviceAreas: ['Istanbul', 'Bodrum'],
    propertiesForBuy: 12,
    propertiesForRent: 7,
    projects: 3,
    events: 1,
    about: 'Sarah Johnson specializes in helping international clients find their ideal property in Turkey, with a focus on luxury coastal living.',
  },
  {
    id: 'a4',
    name: 'Mehmet Kaya',
    designation: 'Branch Manager',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    companyId: 'c3',
    companyName: 'Golden Key Properties',
    companyLogo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop',
    languages: ['English', 'Turkish', 'Arabic'],
    serviceAreas: ['Antalya', 'Alanya'],
    propertiesForBuy: 6,
    propertiesForRent: 2,
    projects: 1,
    events: 0,
    about: 'Mehmet Kaya has been a key figure in the Antalya real estate scene for 15 years, specializing in beachfront properties and investment opportunities.',
  },
];
