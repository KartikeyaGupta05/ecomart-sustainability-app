// User-related types
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  address?: Address;
  ecoPoints: number;
  createdAt: Date;
  wasteRecycled: number; // in kg
  mealsRescued: number;
  role: 'user' | 'admin';
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Product-related types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  ecoRating: number; // 1-5 stars
  stockQuantity: number;
  recyclable: boolean;
  sustainabilityFeatures: string[];
  createdAt: Date;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

// Order-related types
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  shippingAddress: Address;
  createdAt: Date;
  updatedAt: Date;
  ecoPointsEarned: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

// Waste request types
export interface WasteRequest {
  id: string;
  userId: string;
  wasteType: 'plastic' | 'paper' | 'glass' | 'metal' | 'electronic' | 'organic' | 'other';
  weight: number; // in kg
  description: string;
  imageUrls?: string[];
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  scheduledPickupDate?: Date;
  completedDate?: Date;
  ecoPointsAwarded?: number;
  createdAt: Date;
  updatedAt: Date;
  address: Address;
}

// Food donation types
export interface FoodRequest {
  id: string;
  userId: string;
  foodType: string;
  quantity: number;
  description: string;
  imageUrl?: string;
  expiryDate: Date;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  scheduledPickupDate?: Date;
  completedDate?: Date;
  ecoPointsAwarded?: number;
  createdAt: Date;
  updatedAt: Date;
  address: Address;
}

// Leaderboard types
export interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  photoURL: string;
  ecoPoints: number;
  wasteRecycled: number;
  mealsRescued: number;
  rank: number;
  totalWasteRecycled?: number;
  totalMealsRescued?: number;
  wasteRecyclingCount?: number;
  foodDonationCount?: number;
  lastRecyclingDate?: Date;
  lastDonationDate?: Date;
  updatedAt?: Date;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  type: 'order' | 'waste' | 'food' | 'system';
  relatedId?: string; // ID of the related order, waste request, etc.
  createdAt: Date;
}