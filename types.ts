export interface User {
  id: string;
  phone: string;
  name: string; // Nickname
  joinedAt: number;
}

export interface Holding {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  profit: number; // Absolute profit/loss
  profitPercent: number; // Percentage
  notes: string; // Daily intention/notes
  updatedAt: number;
}

export interface Room {
  code: string;
  hostId: string;
  members: string[]; // List of User IDs
  createdAt: number;
}

export interface MarketTrend {
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  summary: string;
  sources: Array<{ title: string; uri: string }>;
  timestamp: number;
}

// AI Service Types
export interface ScreenshotAnalysisResult {
  holdings: Array<Partial<Holding>>;
}