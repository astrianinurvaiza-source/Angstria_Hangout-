export interface Place {
  id: string;
  name: string;
  description: string;
  location: string;
  openingHours: string;
  facilities: string[];
  rating: number;
  image: string;
  images: string[];
  tags: string[];
  socials?: {
    instagram?: string;
    website?: string;
    tiktok?: string;
  };
  views: number;
  priceRange: string;
  featured?: boolean;
  lat?: number;
  lng?: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  placeId: string;
  username: string;
  comment: string;
  rating: number;
  createdAt: any; // Firestore Timestamp or ISO string
}

export interface SiteStats {
  totalPlaces: number;
  totalViews: number;
}
