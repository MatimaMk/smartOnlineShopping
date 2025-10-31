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
            { id: "profile", icon: "👤", label: "My Profile" },
          ].map((item) => (
            <div
              key={item.id}
              className={`${styles.navItem} ${
                activeTab === item.id ? styles.navItemActive : ""
              }`}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
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

              <div
                style={{
                  marginTop: "2rem",
                  padding: "1rem",
                  background: "#fff9e6",
                  borderRadius: "8px",
                  border: "1px solid #ffe066",
                }}
              >
                <p style={{ fontSize: "0.9rem", color: "#856404", margin: 0 }}>
                  <strong>Note:</strong> Make sure the backend server is running
                  on port 3001. Run{" "}
                  <code
                    style={{
                      background: "#fff",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    npm run server
                  </code>{" "}
                  in a separate terminal.
                </p>
              </div>
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
              <h1 className={styles.contentTitle}>AI Recommendations</h1>
              <p className={styles.contentDescription}>
                Personalized picks just for you
              </p>
            </div>
            <div className={styles.productGrid}>
              {products.slice(0, 3).map((product) => (
                <div key={product.id} className={styles.productCard}>
                  <img
                    src={product.imageURL}
                    alt={product.name}
                    className={styles.productImage}
                  />
                  <div className={styles.productInfo}>
                    <div
                      style={{
                        background: "#667eea",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "0.8rem",
                        display: "inline-block",
                        marginBottom: "0.5rem",
                      }}
                    >
                      🤖 AI Recommended
                    </div>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <p className={styles.productCategory}>{product.category}</p>
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
