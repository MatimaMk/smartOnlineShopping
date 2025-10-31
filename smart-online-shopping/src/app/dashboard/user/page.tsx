"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/styles/module/Dashboard.module.css";
import {
  getCurrentUser,
  getProducts,
  getCart,
  saveCart,
  getUserOrders,
  createOrderWithStockUpdate,
  clearCart,
  initializeDemoData,
} from "@/app/utils/storage/localStorage";
import { logout } from "@/app/utils/auth";
import { User, Product, CartItem, Order } from "@/app/types";
import VirtualTryOn from "@/app/components/VirtualTryOn";
import CheckoutModal from "@/app/components/CheckoutModal";
import OrderDetailModal from "@/app/components/OrderDetailModal";
import { formatPrice } from "@/app/utils/currency";

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("browse");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    paymentMethod: "Credit Card",
    shippingAddress: "",
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [showVirtualTryOn, setShowVirtualTryOn] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize demo data on first load
    initializeDemoData();

    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "user") {
      router.push("/auth/login");
      return;
    }
    setUser(currentUser);
    setProducts(getProducts());
    setCart(getCart());
    setOrders(getUserOrders(currentUser.id));

    // Set default shipping address
    if (currentUser.address) {
      setCheckoutData((prev) => ({
        ...prev,
        shippingAddress: currentUser.address || "",
      }));
    }
  }, [router]);

  useEffect(() => {
    let filtered = products;
    if (selectedCategory !== "All") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory]);

  useEffect(() => {
    if (activeTab === "recommendations" && user && products.length > 0) {
      fetchAIRecommendations();
    }
  }, [activeTab, user, products.length, orders.length]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.size[0] || "");
    setSelectedColor(product.color[0] || "");
  };

  const addToCart = (product: Product, size?: string, color?: string) => {
    // Check stock before adding
    if (product.stockLevel <= 0) {
      alert("This product is out of stock!");
      return;
    }

    const sizeToUse = size || product.size[0];
    const colorToUse = color || product.color[0];

    const existingItem = cart.find(
      (item) =>
        item.productId === product.id &&
        item.size === sizeToUse &&
        item.color === colorToUse
    );

    let newCart: CartItem[];
    if (existingItem) {
      // Check if adding one more exceeds stock
      if (existingItem.quantity + 1 > product.stockLevel) {
        alert(`Only ${product.stockLevel} items available in stock!`);
        return;
      }

      newCart = cart.map((item) =>
        item.productId === product.id &&
        item.size === sizeToUse &&
        item.color === colorToUse
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [
        ...cart,
        {
          productId: product.id,
          quantity: 1,
          size: sizeToUse,
          color: colorToUse,
        },
      ];
    }
    setCart(newCart);
    saveCart(newCart);
    setSelectedProduct(null);
    alert("Added to cart!");
  };

  const updateCartQuantity = (
    productId: string,
    size: string,
    color: string,
    quantity: number
  ) => {
    if (quantity < 1) {
      removeFromCart(productId, size, color);
      return;
    }

    // Check stock limit
    const product = products.find((p) => p.id === productId);
    if (product && quantity > product.stockLevel) {
      alert(`Only ${product.stockLevel} items available in stock!`);
      return;
    }

    const newCart = cart.map((item) =>
      item.productId === productId && item.size === size && item.color === color
        ? { ...item, quantity }
        : item
    );
    setCart(newCart);
    saveCart(newCart);
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    const newCart = cart.filter(
      (item) =>
        !(
          item.productId === productId &&
          item.size === size &&
          item.color === color
        )
    );
    setCart(newCart);
    saveCart(newCart);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const handleCheckout = (paymentMethod: string, shippingAddress: string, paymentDetails?: any) => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (!shippingAddress) {
      alert("Please enter a shipping address!");
      return;
    }

    if (!user) return;

    const result = createOrderWithStockUpdate(
      user.id,
      cart,
      getCartTotal(),
      paymentMethod,
      shippingAddress
    );

    if (result.success) {
      alert(`✅ Order placed successfully!\n\nOrder ID: ${result.order?.id.slice(0, 8)}\nPayment: ${paymentMethod}\n\nYou can download your invoice from the Orders tab.`);
      clearCart();
      setCart([]);
      setOrders(getUserOrders(user.id));
      setProducts(getProducts()); // Refresh products to show updated stock
      setShowCheckout(false);
      setActiveTab("orders");
    } else {
      alert("Order failed: " + result.message);
    }
  };

  const fetchAIRecommendations = async () => {
    if (!user) return;

    setLoadingRecommendations(true);
    setRecommendationsError(null);

    try {
      // Get product details for order items
      const ordersWithProductDetails = orders.map(order => ({
        ...order,
        items: order.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            ...item,
            name: product?.name || "",
            category: product?.category || "",
            brand: product?.brand || "",
            price: product?.price || 0,
          };
        }),
      }));

      // Extract user preferences
      const orderedProducts = ordersWithProductDetails.flatMap(o => o.items);
      const preferredCategories = [...new Set(orderedProducts.map(i => i.category).filter(Boolean))];
      const preferredBrands = [...new Set(orderedProducts.map(i => i.brand).filter(Boolean))];

      const response = await fetch("/api/ai-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          orderHistory: ordersWithProductDetails,
          browsingHistory: [],
          cartItems: cart,
          availableProducts: products.filter(p => p.stockLevel > 0),
          userPreferences: {
            preferredCategories,
            preferredBrands,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      setAiRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      setRecommendationsError("Failed to load personalized recommendations. Showing popular items instead.");
      // Fallback to showing some products
      setAiRecommendations(products.filter(p => p.stockLevel > 0).slice(0, 6));
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  if (!user) return <div>Loading...</div>;

  return (
    <div className={styles.dashboardLayout}>
      <button
        className={styles.mobileMenuButton}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>FashionShop</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userEmail}>{user.email}</div>
          </div>
        </div>

        <nav className={styles.navMenu}>
          {[
            { id: "browse", icon: "🛍️", label: "Browse Products" },
            { id: "cart", icon: "🛒", label: `Shopping Cart (${cart.length})` },
            { id: "tryon", icon: "👗", label: "Virtual Try-On" },
            { id: "orders", icon: "📦", label: "My Orders" },
            { id: "recommendations", icon: "🤖", label: "AI Recommendations" },
            { id: "assistant", icon: "💬", label: "Shopping Assistant" },
            { id: "profile", icon: "👤", label: "My Profile" },
          ].map((item) => (
            <div
              key={item.id}
              className={`${styles.navItem} ${
                activeTab === item.id ? styles.navItemActive : ""
              }`}
              onClick={() => {
                if (item.id === "assistant") {
                  window.location.href = "/shopping-assistant";
                } else {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }
              }}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className={styles.mainContent}>
        {activeTab === "browse" && (
          <>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Browse Products</h1>
              <p className={styles.contentDescription}>
                Discover our latest fashion collection
              </p>
            </div>

            <div className={styles.contentHeader}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "2px solid #e0e0e0",
                  width: "100%",
                  maxWidth: "400px",
                  marginBottom: "1rem",
                }}
              />
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "20px",
                      border: "none",
                      background:
                        selectedCategory === cat ? "#667eea" : "#e0e0e0",
                      color: selectedCategory === cat ? "white" : "#2c3e50",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.productGrid}>
              {filteredProducts.map((product) => (
                <div key={product.id} className={styles.productCard}>
                  <img
                    src={product.imageURL}
                    alt={product.name}
                    className={styles.productImage}
                  />
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <p className={styles.productCategory}>
                      {product.category} • {product.brand}
                    </p>
                    <p
                      style={{
                        color: "#7f8c8d",
                        fontSize: "0.9rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {product.description}
                    </p>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color:
                          product.stockLevel === 0
                            ? "#e74c3c"
                            : product.stockLevel < 10
                            ? "#f39c12"
                            : "#27ae60",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {product.stockLevel === 0
                        ? "Out of Stock"
                        : product.stockLevel < 10
                        ? `Only ${product.stockLevel} left!`
                        : `In Stock (${product.stockLevel})`}
                    </p>
                    <div className={styles.productFooter}>
                      <span className={styles.productPrice}>
                        {formatPrice(product.price)}
                      </span>
                      <button
                        className={styles.addToCartButton}
                        onClick={() => openProductModal(product)}
                        disabled={product.stockLevel === 0}
                        style={{
                          opacity: product.stockLevel === 0 ? 0.5 : 1,
                          cursor:
                            product.stockLevel === 0
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {product.stockLevel === 0
                          ? "Out of Stock"
                          : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "cart" && (
          <>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Shopping Cart</h1>
              <p className={styles.contentDescription}>
                {cart.length} items in your cart
              </p>
            </div>

            {cart.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🛒</div>
                <h2 className={styles.emptyTitle}>Your cart is empty</h2>
                <p className={styles.emptyDescription}>
                  Add some products to get started
                </p>
              </div>
            ) : (
              <div>
                {cart.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  if (!product) return null;
                  return (
                    <div
                      key={item.productId}
                      style={{
                        background: "white",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                        display: "flex",
                        gap: "1.5rem",
                        alignItems: "center",
                      }}
                    >
                      <img
                        src={product.imageURL}
                        alt={product.name}
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <h3>{product.name}</h3>
                        <p style={{ color: "#7f8c8d" }}>
                          {item.size} • {item.color}
                        </p>
                        <p
                          style={{
                            fontSize: "1.25rem",
                            fontWeight: 600,
                            color: "#27ae60",
                          }}
                        >
                          {formatPrice(product.price)}
                        </p>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "1rem",
                          alignItems: "center",
                        }}
                      >
                        <button
                          onClick={() =>
                            updateCartQuantity(
                              item.productId,
                              item.size,
                              item.color,
                              item.quantity - 1
                            )
                          }
                          style={{
                            padding: "8px 12px",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateCartQuantity(
                              item.productId,
                              item.size,
                              item.color,
                              item.quantity + 1
                            )
                          }
                          style={{
                            padding: "8px 12px",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                          }}
                        >
                          +
                        </button>
                        <button
                          onClick={() =>
                            removeFromCart(
                              item.productId,
                              item.size,
                              item.color
                            )
                          }
                          style={{
                            padding: "8px 16px",
                            background: "#e74c3c",
                            color: "white",
                            borderRadius: "6px",
                            border: "none",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div
                  style={{
                    background: "white",
                    padding: "2rem",
                    borderRadius: "12px",
                    textAlign: "right",
                  }}
                >
                  <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
                    Total:{" "}
                    <span style={{ color: "#27ae60" }}>
                      {formatPrice(getCartTotal())}
                    </span>
                  </h2>
                  <button
                    style={{
                      padding: "14px 32px",
                      background: "#667eea",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                    onClick={() => setShowCheckout(true)}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "tryon" && (
          <>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Virtual Try-On</h1>
              <p className={styles.contentDescription}>
                Try on outfits virtually using AI technology
              </p>
            </div>

            <div
              style={{
                background: "white",
                padding: "3rem",
                borderRadius: "16px",
                textAlign: "center",
                maxWidth: "800px",
                margin: "0 auto",
              }}
            >
              <div style={{ fontSize: "5rem", marginBottom: "1.5rem" }}>
                👗✨
              </div>
              <h2
                style={{
                  fontSize: "2rem",
                  marginBottom: "1rem",
                  color: "#2c3e50",
                }}
              >
                See How You Look in Our Outfits
              </h2>
              <p
                style={{
                  fontSize: "1.1rem",
                  color: "#7f8c8d",
                  marginBottom: "2rem",
                  lineHeight: "1.6",
                }}
              >
                Upload your photo and select any outfit from our catalog to see
                how it looks on you. Our AI-powered virtual try-on technology
                helps you make confident purchase decisions.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "2rem",
                  marginBottom: "2rem",
                }}
              >
                <div style={{ padding: "1.5rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                    📸
                  </div>
                  <h3 style={{ marginBottom: "0.5rem" }}>Upload Photo</h3>
                  <p style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>
                    Take or upload a clear photo of yourself
                  </p>
                </div>
                <div style={{ padding: "1.5rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                    👔
                  </div>
                  <h3 style={{ marginBottom: "0.5rem" }}>Choose Outfit</h3>
                  <p style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>
                    Select any product from our catalog
                  </p>
                </div>
                <div style={{ padding: "1.5rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                    ✨
                  </div>
                  <h3 style={{ marginBottom: "0.5rem" }}>See Result</h3>
                  <p style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>
                    View how the outfit looks on you instantly
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowVirtualTryOn(true)}
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "16px 48px",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                Start Virtual Try-On
              </button>

            </div>
          </>
        )}

        {activeTab === "orders" && (
          <>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>My Orders</h1>
              <p className={styles.contentDescription}>
                Track your order history
              </p>
            </div>
            {orders.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📦</div>
                <h2 className={styles.emptyTitle}>No orders yet</h2>
                <p className={styles.emptyDescription}>
                  Start shopping to see your orders here
                </p>
              </div>
            ) : (
              <div className={styles.statsGrid}>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={styles.statCard}
                    onClick={() => setSelectedOrder(order)}
                    style={{ cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.75rem" }}>
                      <h3 style={{ margin: 0 }}>Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                      <div
                        style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          background: order.status === "completed" ? "#00D9A3" : "#FFB74D",
                          color: "white",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {order.status}
                      </div>
                    </div>
                    <p style={{ margin: "0.5rem 0", color: "#636E72", fontSize: "0.9rem" }}>
                      Items: {order.items.length} • {order.paymentMethod}
                    </p>
                    <p style={{ margin: "0.5rem 0", fontWeight: 700, fontSize: "1.3rem", background: "linear-gradient(135deg, #00D9A3 0%, #00B87C 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {formatPrice(order.totalAmount)}
                    </p>
                    <p style={{ margin: "0.5rem 0 0 0", color: "#95A5A6", fontSize: "0.85rem" }}>
                      {new Date(order.date).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    <div style={{ marginTop: "1rem", padding: "0.75rem", background: "linear-gradient(135deg, #FFF5F7 0%, #F8F9FA 100%)", borderRadius: "8px", fontSize: "0.85rem", color: "#FF6B9D", fontWeight: 600, textAlign: "center" }}>
                      📄 Click to view details & download invoice
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "recommendations" && (
          <>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>🤖 AI-Powered Recommendations</h1>
              <p className={styles.contentDescription}>
                Personalized picks based on your style, preferences, and shopping history
              </p>
            </div>

            {loadingRecommendations ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#667eea" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔄</div>
                <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                  Analyzing your preferences...
                </p>
                <p style={{ color: "#95a5a6", marginTop: "0.5rem" }}>
                  Our AI is finding the perfect products for you
                </p>
              </div>
            ) : recommendationsError ? (
              <div style={{ textAlign: "center", padding: "2rem", background: "#FFF3E0", borderRadius: "12px", margin: "1rem 0" }}>
                <p style={{ color: "#F57C00", fontWeight: 600 }}>⚠️ {recommendationsError}</p>
              </div>
            ) : null}

            {!loadingRecommendations && aiRecommendations.length > 0 && (
              <>
                {orders.length > 0 && (
                  <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "1.5rem", borderRadius: "12px", color: "white", marginBottom: "1.5rem" }}>
                    <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.6" }}>
                      💡 <strong>Personalized for you:</strong> Based on your {orders.length} previous order{orders.length > 1 ? "s" : ""} and shopping preferences, we've curated these recommendations to match your unique style.
                    </p>
                  </div>
                )}

                <div className={styles.productGrid}>
                  {aiRecommendations.map((product) => (
                    <div key={product.id} className={styles.productCard} style={{ position: "relative" }}>
                      {product.matchScore && product.matchScore >= 85 && (
                        <div style={{ position: "absolute", top: "10px", right: "10px", background: "#FFD700", color: "#000", padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, zIndex: 1, boxShadow: "0 2px 8px rgba(255,215,0,0.4)" }}>
                          ⭐ {product.matchScore}% Match
                        </div>
                      )}
                      <img
                        src={product.imageURL}
                        alt={product.name}
                        className={styles.productImage}
                      />
                      <div className={styles.productInfo}>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                          <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", padding: "4px 12px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>
                            🤖 AI Recommended
                          </div>
                          {product.tags && product.tags.slice(0, 1).map((tag: string, idx: number) => (
                            <div key={idx} style={{ background: "#E8EAF6", color: "#667eea", padding: "4px 10px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 600 }}>
                              {tag}
                            </div>
                          ))}
                        </div>
                        <h3 className={styles.productName}>{product.name}</h3>
                        <p className={styles.productCategory}>{product.category} • {product.brand}</p>
                        {product.aiReason && (
                          <p style={{ fontSize: "0.85rem", color: "#636E72", margin: "0.75rem 0", lineHeight: "1.5", fontStyle: "italic", background: "#F8F9FA", padding: "0.75rem", borderRadius: "8px", borderLeft: "3px solid #667eea" }}>
                            💬 {product.aiReason}
                          </p>
                        )}
                        <div className={styles.productFooter}>
                          <span className={styles.productPrice}>
                            {formatPrice(product.price)}
                          </span>
                          <button
                            className={styles.addToCartButton}
                            onClick={() => openProductModal(product)}
                            disabled={product.stockLevel === 0}
                            style={{
                              opacity: product.stockLevel === 0 ? 0.5 : 1,
                              cursor: product.stockLevel === 0 ? "not-allowed" : "pointer",
                            }}
                          >
                            {product.stockLevel === 0 ? "Out of Stock" : "Add to Cart"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "2rem", padding: "1.5rem", background: "linear-gradient(135deg, #FFF5F7 0%, #F8F9FA 100%)", borderRadius: "12px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#636E72" }}>
                    💡 The more you shop, the better our recommendations become! Keep exploring to help us understand your style.
                  </p>
                </div>
              </>
            )}

            {!loadingRecommendations && aiRecommendations.length === 0 && !recommendationsError && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🤖</div>
                <h2 className={styles.emptyTitle}>Getting to know your style</h2>
                <p className={styles.emptyDescription}>
                  Start shopping to receive personalized AI recommendations tailored just for you
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "profile" && (
          <>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>My Profile</h1>
              <p className={styles.contentDescription}>
                Manage your account information
              </p>
            </div>
            <div className={styles.statsGrid}>
              {[
                { label: "Name", value: user.name },
                { label: "Email", value: user.email },
                { label: "Address", value: user.address || "Not provided" },
                { label: "Account Type", value: user.role },
              ].map((item, idx) => (
                <div key={idx} className={styles.statCard}>
                  <h3>{item.label}</h3>
                  <p>{item.value}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Product Selection Modal */}
      {selectedProduct && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "1rem" }}>{selectedProduct.name}</h2>
            <img
              src={selectedProduct.imageURL}
              alt={selectedProduct.name}
              style={{
                width: "100%",
                height: "300px",
                objectFit: "cover",
                borderRadius: "12px",
                marginBottom: "1rem",
              }}
            />
            <p style={{ color: "#7f8c8d", marginBottom: "1rem" }}>
              {selectedProduct.description}
            </p>
            <p
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: "#27ae60",
                marginBottom: "1rem",
              }}
            >
              {formatPrice(selectedProduct.price)}
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                }}
              >
                Select Size:
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {selectedProduct.size.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border:
                        selectedSize === size
                          ? "2px solid #667eea"
                          : "2px solid #e0e0e0",
                      background: selectedSize === size ? "#f0f3ff" : "white",
                      color: selectedSize === size ? "#667eea" : "#2c3e50",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                }}
              >
                Select Color:
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {selectedProduct.color.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border:
                        selectedColor === color
                          ? "2px solid #667eea"
                          : "2px solid #e0e0e0",
                      background: selectedColor === color ? "#f0f3ff" : "white",
                      color: selectedColor === color ? "#667eea" : "#2c3e50",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={() =>
                  addToCart(selectedProduct, selectedSize, selectedColor)
                }
                style={{
                  flex: 1,
                  padding: "14px",
                  background: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                Add to Cart
              </button>
              <button
                onClick={() => setSelectedProduct(null)}
                style={{
                  padding: "14px 24px",
                  background: "#e0e0e0",
                  color: "#2c3e50",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          products={products}
          totalAmount={getCartTotal()}
          onClose={() => setShowCheckout(false)}
          onConfirmOrder={(paymentMethod, shippingAddress, paymentDetails) => {
            handleCheckout(paymentMethod, shippingAddress, paymentDetails);
          }}
        />
      )}

      {/* Virtual Try-On Component */}
      {showVirtualTryOn && (
        <VirtualTryOn
          products={products}
          onClose={() => setShowVirtualTryOn(false)}
        />
      )}

      {/* Order Detail Modal */}
      {selectedOrder && user && (
        <OrderDetailModal
          order={selectedOrder}
          products={products}
          customerName={user.name}
          customerEmail={user.email}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
