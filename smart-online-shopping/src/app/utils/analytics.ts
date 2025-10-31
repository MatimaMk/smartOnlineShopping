import { Order, Product, User } from "../types";

// Sales Trends Analytics
export const getSalesTrends = (orders: Order[], days: number = 30) => {
  const trends: { date: string; revenue: number; orders: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();

    const dayOrders = orders.filter(
      (order) => new Date(order.date).toDateString() === dateStr
    );

    trends.push({
      date: dateStr,
      revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      orders: dayOrders.length,
    });
  }

  return trends;
};

// Calculate growth rate
export const getGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Revenue comparison (current vs previous period)
export const getRevenueComparison = (orders: Order[]) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const currentPeriod = orders.filter(
    (order) => new Date(order.date) >= thirtyDaysAgo
  );
  const previousPeriod = orders.filter(
    (order) =>
      new Date(order.date) >= sixtyDaysAgo &&
      new Date(order.date) < thirtyDaysAgo
  );

  const currentRevenue = currentPeriod.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );
  const previousRevenue = previousPeriod.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );

  return {
    current: currentRevenue,
    previous: previousRevenue,
    growth: getGrowthRate(currentRevenue, previousRevenue),
    currentOrders: currentPeriod.length,
    previousOrders: previousPeriod.length,
  };
};

// Customer Preferences Analysis
export const getCustomerPreferences = (
  orders: Order[],
  products: Product[]
) => {
  const categoryPurchases: { [key: string]: number } = {};
  const brandPurchases: { [key: string]: number } = {};
  const sizePurchases: { [key: string]: number } = {};
  const colorPurchases: { [key: string]: number } = {};
  const priceRanges = {
    "Under R500": 0,
    "R500-R1000": 0,
    "R1000-R2000": 0,
    "R2000-R3000": 0,
    "Over R3000": 0,
  };

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        // Category tracking
        categoryPurchases[product.category] =
          (categoryPurchases[product.category] || 0) + item.quantity;

        // Brand tracking
        if (product.brand) {
          brandPurchases[product.brand] =
            (brandPurchases[product.brand] || 0) + item.quantity;
        }

        // Size tracking (if size selected)
        if (item.size) {
          sizePurchases[item.size] =
            (sizePurchases[item.size] || 0) + item.quantity;
        }

        // Color tracking (if color selected)
        if (item.color) {
          colorPurchases[item.color] =
            (colorPurchases[item.color] || 0) + item.quantity;
        }

        // Price range tracking
        if (product.price < 500) priceRanges["Under R500"] += item.quantity;
        else if (product.price < 1000)
          priceRanges["R500-R1000"] += item.quantity;
        else if (product.price < 2000)
          priceRanges["R1000-R2000"] += item.quantity;
        else if (product.price < 3000)
          priceRanges["R2000-R3000"] += item.quantity;
        else priceRanges["Over R3000"] += item.quantity;
      }
    });
  });

  return {
    categories: Object.entries(categoryPurchases).sort((a, b) => b[1] - a[1]),
    brands: Object.entries(brandPurchases).sort((a, b) => b[1] - a[1]),
    sizes: Object.entries(sizePurchases).sort((a, b) => b[1] - a[1]),
    colors: Object.entries(colorPurchases).sort((a, b) => b[1] - a[1]),
    priceRanges: Object.entries(priceRanges).filter(([, value]) => value > 0),
  };
};

// Inventory Management Insights
export const getInventoryInsights = (products: Product[], orders: Order[]) => {
  const insights = {
    lowStock: [] as Product[],
    outOfStock: [] as Product[],
    overstocked: [] as Product[],
    fastMoving: [] as { product: Product; velocity: number }[],
    slowMoving: [] as { product: Product; velocity: number }[],
  };

  // Calculate sales velocity (units sold per day)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOrders = orders.filter(
    (order) => new Date(order.date) >= thirtyDaysAgo
  );

  products.forEach((product) => {
    // Stock level categorization
    if (product.stockLevel === 0) {
      insights.outOfStock.push(product);
    } else if (product.stockLevel < 10) {
      insights.lowStock.push(product);
    } else if (product.stockLevel > 100) {
      insights.overstocked.push(product);
    }

    // Calculate sales velocity
    const unitsSold = recentOrders.reduce((sum, order) => {
      const item = order.items.find((i) => i.productId === product.id);
      return sum + (item?.quantity || 0);
    }, 0);

    const velocity = unitsSold / 30; // units per day

    if (velocity > 2) {
      insights.fastMoving.push({ product, velocity });
    } else if (velocity < 0.3 && product.stockLevel > 20) {
      insights.slowMoving.push({ product, velocity });
    }
  });

  // Sort by velocity
  insights.fastMoving.sort((a, b) => b.velocity - a.velocity);
  insights.slowMoving.sort((a, b) => a.velocity - b.velocity);

  return insights;
};

// Stockout Prediction
export const predictStockouts = (products: Product[], orders: Order[]) => {
  const predictions: {
    product: Product;
    daysUntilStockout: number;
    recommendedAction: string;
  }[] = [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOrders = orders.filter(
    (order) => new Date(order.date) >= thirtyDaysAgo
  );

  products.forEach((product) => {
    if (product.stockLevel > 0) {
      const unitsSold = recentOrders.reduce((sum, order) => {
        const item = order.items.find((i) => i.productId === product.id);
        return sum + (item?.quantity || 0);
      }, 0);

      const dailyVelocity = unitsSold / 30;

      if (dailyVelocity > 0) {
        const daysUntilStockout = Math.floor(
          product.stockLevel / dailyVelocity
        );

        if (daysUntilStockout < 14) {
          let recommendedAction = "";
          if (daysUntilStockout < 3) {
            recommendedAction = "🚨 URGENT: Restock immediately";
          } else if (daysUntilStockout < 7) {
            recommendedAction = "⚠️ HIGH: Restock within 3 days";
          } else {
            recommendedAction = "⚡ MEDIUM: Plan restock within 1 week";
          }

          predictions.push({
            product,
            daysUntilStockout,
            recommendedAction,
          });
        }
      }
    }
  });

  return predictions.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
};

// Customer Behavior Insights
export const getCustomerBehavior = (orders: Order[], users: User[]) => {
  const customerStats: {
    [userId: string]: {
      orders: number;
      totalSpent: number;
      avgOrderValue: number;
      lastOrderDate: string;
    };
  } = {};

  orders.forEach((order) => {
    if (!customerStats[order.userId]) {
      customerStats[order.userId] = {
        orders: 0,
        totalSpent: 0,
        avgOrderValue: 0,
        lastOrderDate: order.date,
      };
    }

    customerStats[order.userId].orders++;
    customerStats[order.userId].totalSpent += order.totalAmount;

    if (new Date(order.date) > new Date(customerStats[order.userId].lastOrderDate)) {
      customerStats[order.userId].lastOrderDate = order.date;
    }
  });

  // Calculate average order value
  Object.keys(customerStats).forEach((userId) => {
    customerStats[userId].avgOrderValue =
      customerStats[userId].totalSpent / customerStats[userId].orders;
  });

  // Segment customers
  const segments = {
    vip: [] as { user: User; stats: typeof customerStats[string] }[],
    loyal: [] as { user: User; stats: typeof customerStats[string] }[],
    atRisk: [] as { user: User; stats: typeof customerStats[string] }[],
    new: [] as { user: User; stats: typeof customerStats[string] }[],
  };

  users
    .filter((u) => u.role === "user")
    .forEach((user) => {
      const stats = customerStats[user.id];
      if (!stats) {
        segments.new.push({ user, stats: {
          orders: 0,
          totalSpent: 0,
          avgOrderValue: 0,
          lastOrderDate: user.createdAt,
        }});
        return;
      }

      const daysSinceLastOrder = Math.floor(
        (new Date().getTime() - new Date(stats.lastOrderDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (stats.totalSpent > 10000 && stats.orders >= 5) {
        segments.vip.push({ user, stats });
      } else if (stats.orders >= 3) {
        segments.loyal.push({ user, stats });
      } else if (daysSinceLastOrder > 60 && stats.orders > 0) {
        segments.atRisk.push({ user, stats });
      } else if (stats.orders <= 1) {
        segments.new.push({ user, stats });
      }
    });

  return segments;
};

// Revenue Forecasting
export const forecastRevenue = (orders: Order[], days: number = 30) => {
  const trends = getSalesTrends(orders, 30);
  const avgDailyRevenue =
    trends.reduce((sum, day) => sum + day.revenue, 0) / trends.length;

  // Simple linear trend
  const firstHalf = trends.slice(0, 15);
  const secondHalf = trends.slice(15);

  const firstHalfAvg =
    firstHalf.reduce((sum, day) => sum + day.revenue, 0) / firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((sum, day) => sum + day.revenue, 0) / secondHalf.length;

  const trend = secondHalfAvg - firstHalfAvg;
  const trendPercent = (trend / firstHalfAvg) * 100;

  const forecast = avgDailyRevenue * days + (trend * days * 0.5);

  return {
    avgDailyRevenue,
    trend: trendPercent,
    forecastedRevenue: Math.max(0, forecast),
    confidence: Math.abs(trend) < avgDailyRevenue * 0.3 ? "High" : "Medium",
  };
};

// Peak Shopping Hours Analysis
export const getPeakShoppingHours = (orders: Order[]) => {
  const hourCounts: { [hour: number]: number } = {};

  orders.forEach((order) => {
    const hour = new Date(order.date).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const sorted = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count);

  return sorted;
};

// Average Order Value Trends
export const getAOVTrends = (orders: Order[], days: number = 30) => {
  const trends: { date: string; aov: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();

    const dayOrders = orders.filter(
      (order) => new Date(order.date).toDateString() === dateStr
    );

    const totalRevenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const aov = dayOrders.length > 0 ? totalRevenue / dayOrders.length : 0;

    trends.push({ date: dateStr, aov });
  }

  return trends;
};

// Conversion Funnel (simplified - based on order completion)
export const getConversionMetrics = (orders: Order[]) => {
  const completed = orders.filter((o) => o.status === "completed").length;
  const pending = orders.filter((o) => o.status === "pending").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;
  const total = orders.length;

  return {
    completionRate: total > 0 ? (completed / total) * 100 : 0,
    cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
    pendingRate: total > 0 ? (pending / total) * 100 : 0,
    totalOrders: total,
  };
};
