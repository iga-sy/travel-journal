export type ScheduleCategory = "食事" | "観光" | "移動" | "宿泊";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ScheduleItem {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  name: string;
  category: ScheduleCategory;
  address?: string;
  location?: GeoPoint;
  googleMapsUrl?: string;
  officialUrl?: string;
  photos?: string[];
  memo?: string;
}

export interface AlbumOnlyPhoto {
  path: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
}

export interface Trip {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  regions: string[];
  coverPhoto: string;
  memo?: string;
  schedule: ScheduleItem[];
  photos?: AlbumOnlyPhoto[];
}

export interface TripSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  regions: string[];
  coverPhoto: string;
  photoCount: number;
  comment?: string;
  location: GeoPoint;
}
