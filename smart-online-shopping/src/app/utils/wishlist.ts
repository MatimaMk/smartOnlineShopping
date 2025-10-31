// Wishlist utility functions
import { Product } from "../types";

const WISHLIST_KEY = "fashion_app_wishlist";
const RECENT_VIEWS_KEY = "fashion_app_recent_views";
const PRICE_ALERTS_KEY = "fashion_app_price_alerts";

export interface WishlistItem {
  productId: string;
  addedAt: string;
  priceWhenAdded: number;
}

export interface RecentView {
  productId: string;
  viewedAt: string;
}

export interface PriceAlert {
  productId: string;
  targetPrice: number;
  createdAt: string;
  notified: boolean;
}

// Wishlist Functions
export const getWishlist = (userId: string): WishlistItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(`${WISHLIST_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading wishlist:", error);
    return [];
  }
};

export const addToWishlist = (userId: string, product: Product): boolean => {
  try {
    const wishlist = getWishlist(userId);

    // Check if already in wishlist
    if (wishlist.some(item => item.productId === product.id)) {
      return false;
    }

    const newItem: WishlistItem = {
      productId: product.id,
      addedAt: new Date().toISOString(),
      priceWhenAdded: product.price,
    };

    wishlist.push(newItem);
    localStorage.setItem(`${WISHLIST_KEY}_${userId}`, JSON.stringify(wishlist));
    return true;
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return false;
  }
};

export const removeFromWishlist = (userId: string, productId: string): void => {
  try {
    const wishlist = getWishlist(userId);
    const updated = wishlist.filter(item => item.productId !== productId);
    localStorage.setItem(`${WISHLIST_KEY}_${userId}`, JSON.stringify(updated));
  } catch (error) {
    console.error("Error removing from wishlist:", error);
  }
};

export const isInWishlist = (userId: string, productId: string): boolean => {
  const wishlist = getWishlist(userId);
  return wishlist.some(item => item.productId === productId);
};

export const clearWishlist = (userId: string): void => {
  localStorage.removeItem(`${WISHLIST_KEY}_${userId}`);
};

// Recent Views Functions
export const getRecentViews = (userId: string): RecentView[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(`${RECENT_VIEWS_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading recent views:", error);
    return [];
  }
};

export const addRecentView = (userId: string, productId: string): void => {
  try {
    let recentViews = getRecentViews(userId);

    // Remove if already exists
    recentViews = recentViews.filter(view => view.productId !== productId);

    // Add to beginning
    recentViews.unshift({
      productId,
      viewedAt: new Date().toISOString(),
    });

    // Keep only last 20 views
    recentViews = recentViews.slice(0, 20);

    localStorage.setItem(`${RECENT_VIEWS_KEY}_${userId}`, JSON.stringify(recentViews));
  } catch (error) {
    console.error("Error adding recent view:", error);
  }
};

// Price Alerts Functions
export const getPriceAlerts = (userId: string): PriceAlert[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(`${PRICE_ALERTS_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading price alerts:", error);
    return [];
  }
};

export const addPriceAlert = (userId: string, productId: string, targetPrice: number): boolean => {
  try {
    const alerts = getPriceAlerts(userId);

    // Check if alert already exists
    if (alerts.some(alert => alert.productId === productId)) {
      return false;
    }

    const newAlert: PriceAlert = {
      productId,
      targetPrice,
      createdAt: new Date().toISOString(),
      notified: false,
    };

    alerts.push(newAlert);
    localStorage.setItem(`${PRICE_ALERTS_KEY}_${userId}`, JSON.stringify(alerts));
    return true;
  } catch (error) {
    console.error("Error adding price alert:", error);
    return false;
  }
};

export const removePriceAlert = (userId: string, productId: string): void => {
  try {
    const alerts = getPriceAlerts(userId);
    const updated = alerts.filter(alert => alert.productId !== productId);
    localStorage.setItem(`${PRICE_ALERTS_KEY}_${userId}`, JSON.stringify(updated));
  } catch (error) {
    console.error("Error removing price alert:", error);
  }
};

export const checkPriceAlerts = (userId: string, products: Product[]): PriceAlert[] => {
  try {
    const alerts = getPriceAlerts(userId);
    const triggeredAlerts: PriceAlert[] = [];

    const updatedAlerts = alerts.map(alert => {
      const product = products.find(p => p.id === alert.productId);

      if (product && product.price <= alert.targetPrice && !alert.notified) {
        triggeredAlerts.push(alert);
        return { ...alert, notified: true };
      }

      return alert;
    });

    localStorage.setItem(`${PRICE_ALERTS_KEY}_${userId}`, JSON.stringify(updatedAlerts));
    return triggeredAlerts;
  } catch (error) {
    console.error("Error checking price alerts:", error);
    return [];
  }
};

// Smart Search Helper
export const smartSearch = (products: Product[], query: string): Product[] => {
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return products;

  // Split query into words for better matching
  const queryWords = lowerQuery.split(" ");

  return products.filter(product => {
    const searchText = `
      ${product.name}
      ${product.description}
      ${product.category}
      ${product.brand}
      ${product.color.join(" ")}
      ${product.size.join(" ")}
    `.toLowerCase();

    // Check if all query words are in the search text
    return queryWords.every(word => searchText.includes(word));
  }).sort((a, b) => {
    // Sort by relevance - products with query in name come first
    const aNameMatch = a.name.toLowerCase().includes(lowerQuery);
    const bNameMatch = b.name.toLowerCase().includes(lowerQuery);

    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;

    return 0;
  });
};

// Product comparison
export const compareProducts = (productIds: string[], products: Product[]): Product[] => {
  return products.filter(p => productIds.includes(p.id));
};
