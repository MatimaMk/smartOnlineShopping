import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI("AIzaSyA3bQvZUYEbVwETFvJKyQVl4Xx0xefA1z8");

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      userName,
      userEmail,
      orderHistory,
      browsingHistory,
      cartItems,
      availableProducts,
      userPreferences,
    } = await request.json();

    if (!availableProducts || availableProducts.length === 0) {
      return NextResponse.json(
        { error: "No products available for recommendations" },
        { status: 400 }
      );
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build user profile context
    const orderedProducts = orderHistory?.flatMap((order: any) =>
      order.items?.map((item: any) => ({
        name: item.name,
        category: item.category,
        price: item.price,
        brand: item.brand,
      })) || []
    ) || [];

    const orderedCategories = [...new Set(orderedProducts.map((p: any) => p.category))];
    const orderedBrands = [...new Set(orderedProducts.map((p: any) => p.brand))];

    // Calculate average price range
    const prices = orderedProducts.map((p: any) => p.price);
    const avgPrice = prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0;
    const priceRange = avgPrice > 0 ? `R${Math.floor(avgPrice * 0.7)} - R${Math.ceil(avgPrice * 1.3)}` : "Any";

    // Create comprehensive recommendation prompt
    const prompt = `
      You are an expert fashion stylist and product recommendation specialist for a South African online fashion store. Your goal is to provide highly personalized product recommendations based on the customer's shopping history, preferences, and behavior.

      CUSTOMER PROFILE:
      - Name: ${userName || "Customer"}
      - Email: ${userEmail || "Not provided"}
      - Total Orders: ${orderHistory?.length || 0}
      - Previously Ordered Categories: ${orderedCategories.join(", ") || "None"}
      - Preferred Brands: ${orderedBrands.join(", ") || "None"}
      - Average Price Range: ${priceRange}
      - Items in Current Cart: ${cartItems?.length || 0}
      - User Preferences: ${JSON.stringify(userPreferences || {})}

      PREVIOUS PURCHASES:
      ${orderedProducts.length > 0 ? orderedProducts.map((p: any, i: number) =>
        `${i + 1}. ${p.name} (${p.category}) - ${p.brand} - R${p.price}`
      ).join("\n") : "No previous purchases"}

      AVAILABLE PRODUCTS TO RECOMMEND:
      ${availableProducts.map((p: any, i: number) =>
        `${i + 1}. ID: ${p.id} | ${p.name} | Category: ${p.category} | Brand: ${p.brand} | Price: R${p.price} | Stock: ${p.stockLevel} | Description: ${p.description}`
      ).join("\n")}

      YOUR TASK:
      Analyze the customer's shopping behavior, preferences, and purchase history to recommend the BEST products from the available catalog. Consider:

      1. STYLE CONSISTENCY: Recommend products that match their previous style choices
      2. PRICE AFFINITY: Stay within their typical price range (±30%)
      3. COMPLEMENTARY ITEMS: Suggest items that complete outfits or match previous purchases
      4. BRAND LOYALTY: Prioritize brands they've purchased before
      5. SEASONAL RELEVANCE: Consider current season and trends
      6. VARIETY: Mix familiar categories with gentle exploration
      7. STOCK AVAILABILITY: Only recommend in-stock items
      8. BUNDLE OPPORTUNITIES: Suggest items that work well together

      RECOMMENDATION CRITERIA:
      - For NEW CUSTOMERS (0 orders): Recommend trending, versatile pieces across categories
      - For RETURNING CUSTOMERS (1-3 orders): Focus on similar styles with slight variety
      - For LOYAL CUSTOMERS (4+ orders): Deep personalization based on established preferences

      RESPONSE FORMAT:
      Return ONLY a valid JSON array with exactly 6 product recommendations, ordered by relevance (most relevant first). Each recommendation must include:
      {
        "productId": "the product ID from available products",
        "reason": "1-2 sentence explanation why this is perfect for the customer",
        "matchScore": number between 0-100 indicating fit strength,
        "tags": ["tag1", "tag2"] // e.g., "Matches your style", "Completes your wardrobe", "Trending now"
      }

      IMPORTANT:
      - Return ONLY the JSON array, no additional text
      - All productIds MUST exist in the available products list
      - Ensure all recommended products have stock > 0
      - Prioritize higher-priced items slightly to maximize value
      - Be specific about why each item fits the customer

      Example format:
      [
        {
          "productId": "123",
          "reason": "This elegant dress matches your preference for formal wear and fits your usual price range perfectly.",
          "matchScore": 95,
          "tags": ["Matches your style", "Perfect price range"]
        }
      ]
    `;

    // Generate recommendations
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up the response to extract JSON
    text = text.trim();

    // Remove markdown code blocks if present
    if (text.startsWith("```json")) {
      text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/```\n?/g, "");
    }

    // Parse the recommendations
    let recommendations;
    try {
      recommendations = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse AI response:", text);

      // Fallback: return top products if AI response is invalid
      recommendations = availableProducts
        .filter((p: any) => p.stockLevel > 0)
        .slice(0, 6)
        .map((p: any) => ({
          productId: p.id,
          reason: "Based on our current trending items and your profile.",
          matchScore: 75,
          tags: ["Trending now", "Popular choice"],
        }));
    }

    // Validate recommendations and match with actual products
    const validRecommendations = recommendations
      .filter((rec: any) => rec.productId)
      .map((rec: any) => {
        const product = availableProducts.find((p: any) => p.id === rec.productId);
        if (!product || product.stockLevel === 0) return null;

        return {
          ...product,
          aiReason: rec.reason,
          matchScore: rec.matchScore,
          tags: rec.tags,
        };
      })
      .filter(Boolean)
      .slice(0, 6);

    // If we don't have enough valid recommendations, fill with popular items
    if (validRecommendations.length < 6) {
      const remainingSlots = 6 - validRecommendations.length;
      const usedIds = validRecommendations.map((r: any) => r.id);
      const fillerProducts = availableProducts
        .filter((p: any) => p.stockLevel > 0 && !usedIds.includes(p.id))
        .slice(0, remainingSlots)
        .map((p: any) => ({
          ...p,
          aiReason: "A popular choice among our customers.",
          matchScore: 70,
          tags: ["Trending", "Popular"],
        }));

      validRecommendations.push(...fillerProducts);
    }

    return NextResponse.json({
      recommendations: validRecommendations,
      totalRecommendations: validRecommendations.length,
      userProfile: {
        ordersCount: orderHistory?.length || 0,
        preferredCategories: orderedCategories,
        preferredBrands: orderedBrands,
        priceRange,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Recommendations error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
