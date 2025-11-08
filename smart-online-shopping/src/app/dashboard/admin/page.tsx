"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/styles/module/Dashboard.module.css";
import {
  getCurrentUser,
  getProducts,
  saveProduct,
  getOrders,
  getUsers,
  deleteProduct,
  updateOrderStatus,
  initializeDemoData,
} from "@/app/utils/storage/localStorage";
import { logout } from "@/app/utils/auth";
import { User, Product, Order } from "@/app/types";
import { formatPrice } from "@/app/utils/currency";
import {
  getSalesTrends,
  getRevenueComparison,
  getCustomerPreferences,
  getInventoryInsights,
  predictStockouts,
  getCustomerBehavior,
  forecastRevenue,
  getPeakShoppingHours,
  getAOVTrends,
  getConversionMetrics,
} from "@/app/utils/analytics";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    category: "",
    size: [],
    color: [],
    price: 0,
    stockLevel: 0,
    imageURL: "",
    description: "",
    brand: "",
  });
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [useImageUpload, setUseImageUpload] = useState(false);

  useEffect(() => {
    // Initialize demo data on first load
    initializeDemoData();

    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/auth/login");
      return;
    }
    setUser(currentUser);
    setProducts(getProducts());
    setOrders(getOrders());
    setUsers(getUsers());
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const addSize = () => {
    if (sizeInput.trim()) {
      setNewProduct({
        ...newProduct,
        size: [...(newProduct.size || []), sizeInput.trim()],
      });
      setSizeInput("");
    }
  };

  const removeSize = (sizeToRemove: string) => {
    setNewProduct({
      ...newProduct,
      size: (newProduct.size || []).filter((s) => s !== sizeToRemove),
    });
  };

  const addColor = () => {
    if (colorInput.trim()) {
      setNewProduct({
        ...newProduct,
        color: [...(newProduct.color || []), colorInput.trim()],
      });
      setColorInput("");
    }
  };

  const removeColor = (colorToRemove: string) => {
    setNewProduct({
      ...newProduct,
      color: (newProduct.color || []).filter((c) => c !== colorToRemove),
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      setNewProduct({
        ...newProduct,
        imageURL: base64String,
      });
    };
    reader.readAsDataURL(file);
  };

  const clearImageUpload = () => {
    setImagePreview(null);
    setNewProduct({
      ...newProduct,
      imageURL: "",
    });
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price) {
      alert("Please fill in all required fields");
      return;
    }
    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name,
      category: newProduct.category,
      size: newProduct.size || [],
      color: newProduct.color || [],
      price: newProduct.price,
      stockLevel: newProduct.stockLevel || 0,
      imageURL: newProduct.imageURL || "https://via.placeholder.com/400",
      description: newProduct.description || "",
      brand: newProduct.brand || "",
    };
    saveProduct(product);
    setProducts([...products, product]);
    setShowAddProduct(false);
    setImagePreview(null);
    setUseImageUpload(false);
    setNewProduct({
      name: "",
      category: "",
      size: [],
      color: [],
      price: 0,
      stockLevel: 0,
      imageURL: "",
      description: "",
      brand: "",
    });
    alert("Product added successfully!");
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setImagePreview(
      product.imageURL.startsWith("data:") ? product.imageURL : null
    );
    setUseImageUpload(product.imageURL.startsWith("data:"));
    setShowEditProduct(true);
  };

  const handleUpdateProduct = () => {
    if (
      !editingProduct ||
      !newProduct.name ||
      !newProduct.category ||
      !newProduct.price
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const updatedProduct: Product = {
      ...editingProduct,
      name: newProduct.name,
      category: newProduct.category || "",
      size: newProduct.size || [],
      color: newProduct.color || [],
      price: newProduct.price,
      stockLevel: newProduct.stockLevel || 0,
      imageURL: newProduct.imageURL || "https://via.placeholder.com/400",
      description: newProduct.description || "",
      brand: newProduct.brand || "",
    };

    saveProduct(updatedProduct);
    setProducts(
      products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    setShowEditProduct(false);
    setEditingProduct(null);
    setImagePreview(null);
    setUseImageUpload(false);
    setNewProduct({
      name: "",
      category: "",
      size: [],
      color: [],
      price: 0,
      stockLevel: 0,
      imageURL: "",
      description: "",
      brand: "",
    });
    alert("Product updated successfully!");
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct(productId);
      setProducts(products.filter((p) => p.id !== productId));
      alert("Product deleted successfully!");
    }
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    updateOrderStatus(orderId, newStatus);
    setOrders(getOrders());
    alert(`Order status updated to ${newStatus}`);
  };

  const getTotalRevenue = () =>
    orders.reduce((total, order) => total + order.totalAmount, 0);
  const getPendingOrders = () =>
    orders.filter(
      (order) => order.status === "pending" || order.status === "processing"
    ).length;
  const getLowStockProducts = () =>
    products.filter((product) => product.stockLevel < 20).length;

  // Monthly revenue calculation
  const getMonthlyRevenue = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return orders
      .filter((order) => {
        const orderDate = new Date(order.date);
        return (
          orderDate.getMonth() === currentMonth &&
          orderDate.getFullYear() === currentYear
        );
      })
      .reduce((total, order) => total + order.totalAmount, 0);
  };

  // Weekly revenue calculation
  const getWeeklyRevenue = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return orders
      .filter((order) => new Date(order.date) >= oneWeekAgo)
      .reduce((total, order) => total + order.totalAmount, 0);
  };

  // Today's revenue
  const getTodayRevenue = () => {
    const today = new Date().toDateString();
    return orders
      .filter((order) => new Date(order.date).toDateString() === today)
      .reduce((total, order) => total + order.totalAmount, 0);
  };

  // Best selling category
  const getBestCategory = () => {
    const categoryCount: { [key: string]: number } = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          categoryCount[product.category] =
            (categoryCount[product.category] || 0) + item.quantity;
        }
      });
    });
    const sorted = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : "N/A";
  };

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
        className={`${styles.sidebar} ${styles.adminSidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>Admin Panel</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userEmail}>{user.email}</div>
          </div>
        </div>

        <nav className={styles.navMenu}>
          {[
            { id: "overview", icon: "📊", label: "Overview" },
            { id: "products", icon: "📦", label: "Products" },
            { id: "orders", icon: "🛒", label: "Orders" },
            { id: "customers", icon: "👥", label: "Customers" },
            { id: "analytics", icon: "📈", label: "Analytics" },
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
        {activeTab === "overview" && (
          <>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Dashboard Overview</h1>
              <p className={styles.contentDescription}>
                Welcome back, {user.name}
              </p>
            </div>

            <div className={styles.statsGrid}>
              {[
                {
                  label: "Total Revenue",
                  value: formatPrice(getTotalRevenue()),
                  icon: "💰",
                  bg: "#00D9A3",
                },
                {
                  label: "Total Products",
                  value: products.length,
                  icon: "📦",
                  bg: "#4A90E2",
                },
                {
                  label: "Pending Orders",
                  value: getPendingOrders(),
                  icon: "⏳",
                  bg: "#FFB74D",
                },
                {
                  label: "Total Customers",
                  value: users.filter((u) => u.role === "user").length,
                  icon: "👥",
                  bg: "#FF6B9D",
                },
                {
                  label: "Total Orders",
                  value: orders.length,
                  icon: "🛒",
                  bg: "#9D50BB",
                },
                {
                  label: "Low Stock Items",
                  value: getLowStockProducts(),
                  icon: "⚠️",
                  bg: "#e67e22",
                },
              ].map((stat, idx) => (
                <div key={idx} className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <span className={styles.statLabel}>{stat.label}</span>
                    <div
                      className={styles.statIcon}
                      style={{ background: stat.bg }}
                    >
                      {stat.icon}
                    </div>
                  </div>
                  <div className={styles.statValue}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div className={styles.contentHeader} style={{ marginTop: "2rem" }}>
              <h2 className={styles.contentTitle}>Recent Activity</h2>
            </div>
            <div
              style={{
                background: "white",
                padding: "2rem",
                borderRadius: "12px",
              }}
            >
              <p>✅ System running smoothly</p>
              <p>📊 Analytics updated in real-time</p>
              <p>🔒 All security checks passed</p>
            </div>
          </>
        )}

        {activeTab === "products" && (
          <>
            <div className={styles.contentHeader}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h1 className={styles.contentTitle}>Product Management</h1>
                  <p className={styles.contentDescription}>
                    Manage your product inventory
                  </p>
                </div>
                <button
                  onClick={() => setShowAddProduct(true)}
                  style={{
                    padding: "12px 24px",
                    background: "#27ae60",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Add Product
                </button>
              </div>
            </div>

            {showAddProduct && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                }}
                onClick={() => {
                  setShowAddProduct(false);
                  setImagePreview(null);
                  setUseImageUpload(false);
                }}
              >
                <div
                  style={{
                    background: "white",
                    padding: "2rem",
                    borderRadius: "12px",
                    maxWidth: "600px",
                    width: "90%",
                    maxHeight: "90vh",
                    overflow: "auto",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 style={{ marginBottom: "1.5rem" }}>Add New Product</h2>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    {[
                      {
                        id: "name",
                        placeholder: "Product Name *",
                        value: newProduct.name || "",
                        type: "text",
                      },
                      {
                        id: "category",
                        placeholder: "Category *",
                        value: newProduct.category || "",
                        type: "text",
                      },
                      {
                        id: "brand",
                        placeholder: "Brand",
                        value: newProduct.brand || "",
                        type: "text",
                      },
                      {
                        id: "price",
                        placeholder: "Price *",
                        value: newProduct.price || "",
                        type: "number",
                      },
                      {
                        id: "stockLevel",
                        placeholder: "Stock Level",
                        value: newProduct.stockLevel || "",
                        type: "number",
                      },
                    ].map((field) => (
                      <input
                        key={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={field.value}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            [field.id]:
                              field.type === "number"
                                ? parseFloat(e.target.value) || 0
                                : e.target.value,
                          })
                        }
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          border: "2px solid #e0e0e0",
                        }}
                      />
                    ))}

                    {/* Image Upload Section */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "0.75rem",
                          fontWeight: 600,
                          color: "#2D3436",
                        }}
                      >
                        Product Image:
                      </label>

                      {/* Toggle between URL and Upload */}
                      <div
                        style={{
                          display: "flex",
                          gap: "1rem",
                          marginBottom: "1rem",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setUseImageUpload(false);
                            setImagePreview(null);
                          }}
                          style={{
                            flex: 1,
                            padding: "10px",
                            borderRadius: "8px",
                            border: !useImageUpload
                              ? "2px solid #FF6B9D"
                              : "2px solid #E8EAED",
                            background: !useImageUpload
                              ? "linear-gradient(135deg, #FFF5F7 0%, #FFFFFF 100%)"
                              : "white",
                            color: !useImageUpload ? "#FF6B9D" : "#636E72",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                          }}
                        >
                          📎 Use URL
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUseImageUpload(true);
                            setNewProduct({ ...newProduct, imageURL: "" });
                          }}
                          style={{
                            flex: 1,
                            padding: "10px",
                            borderRadius: "8px",
                            border: useImageUpload
                              ? "2px solid #FF6B9D"
                              : "2px solid #E8EAED",
                            background: useImageUpload
                              ? "linear-gradient(135deg, #FFF5F7 0%, #FFFFFF 100%)"
                              : "white",
                            color: useImageUpload ? "#FF6B9D" : "#636E72",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                          }}
                        >
                          📤 Upload Image
                        </button>
                      </div>

                      {/* URL Input */}
                      {!useImageUpload && (
                        <input
                          type="text"
                          placeholder="Enter image URL"
                          value={newProduct.imageURL || ""}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              imageURL: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "2px solid #E8EAED",
                            transition: "border-color 0.3s ease",
                          }}
                          onFocus={(e) =>
                            (e.target.style.borderColor = "#FF6B9D")
                          }
                          onBlur={(e) =>
                            (e.target.style.borderColor = "#E8EAED")
                          }
                        />
                      )}

                      {/* File Upload */}
                      {useImageUpload && (
                        <div>
                          <div
                            style={{
                              border: "2px dashed #FF6B9D40",
                              borderRadius: "12px",
                              padding: "2rem",
                              textAlign: "center",
                              background:
                                "linear-gradient(135deg, #FFF5F7 0%, #FFFFFF 100%)",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "#FF6B9D";
                              e.currentTarget.style.background =
                                "linear-gradient(135deg, #FFE5EE 0%, #FFF5F7 100%)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "#FF6B9D40";
                              e.currentTarget.style.background =
                                "linear-gradient(135deg, #FFF5F7 0%, #FFFFFF 100%)";
                            }}
                            onClick={() =>
                              document.getElementById("imageUpload")?.click()
                            }
                          >
                            <div
                              style={{
                                fontSize: "3rem",
                                marginBottom: "0.5rem",
                              }}
                            >
                              📸
                            </div>
                            <p
                              style={{
                                color: "#FF6B9D",
                                fontWeight: 600,
                                marginBottom: "0.25rem",
                              }}
                            >
                              Click to upload image
                            </p>
                            <p
                              style={{ color: "#95A5A6", fontSize: "0.85rem" }}
                            >
                              JPEG, PNG, GIF, or WebP (Max 5MB)
                            </p>
                            <input
                              id="imageUpload"
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={handleImageUpload}
                              hidden
                              title="Upload product image"
                              aria-label="Upload product image"
                            />
                          </div>

                          {/* Image Preview */}
                          {imagePreview && (
                            <div style={{ marginTop: "1rem" }}>
                              <div
                                style={{
                                  position: "relative",
                                  display: "inline-block",
                                  width: "100%",
                                }}
                              >
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  style={{
                                    width: "100%",
                                    maxHeight: "200px",
                                    objectFit: "contain",
                                    borderRadius: "12px",
                                    border: "2px solid #FF6B9D40",
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={clearImageUpload}
                                  style={{
                                    position: "absolute",
                                    top: "10px",
                                    right: "10px",
                                    background: "#FF5252",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "32px",
                                    height: "32px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: "1.2rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Size Input */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "0.5rem",
                          fontWeight: 600,
                        }}
                      >
                        Available Sizes:
                      </label>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <label
                          htmlFor="sizeInput"
                          className={styles.inputLabel}
                        >
                          Size Input
                        </label>
                        <input
                          id="sizeInput"
                          className={styles.sizeInput}
                          type="text"
                          title="Enter available sizes"
                          placeholder="e.g., S, M, L, XL"
                          value={sizeInput}
                          onChange={(e) => setSizeInput(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && (e.preventDefault(), addSize())
                          }
                        />
                        <button
                          type="button"
                          onClick={addSize}
                          style={{
                            padding: "8px 16px",
                            background: "#667eea",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Add
                        </button>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        {(newProduct.size || []).map((size, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: "4px 12px",
                              background: "#f0f3ff",
                              borderRadius: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            {size}
                            <button
                              type="button"
                              onClick={() => removeSize(size)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#e74c3c",
                                cursor: "pointer",
                                fontWeight: "bold",
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Color Input */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "0.5rem",
                          fontWeight: 600,
                        }}
                      >
                        Available Colors:
                      </label>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="e.g., Red, Blue, Black"
                          value={colorInput}
                          onChange={(e) => setColorInput(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), addColor())
                          }
                          style={{
                            flex: 1,
                            padding: "8px",
                            borderRadius: "6px",
                            border: "2px solid #e0e0e0",
                          }}
                        />
                        <button
                          type="button"
                          onClick={addColor}
                          style={{
                            padding: "8px 16px",
                            background: "#667eea",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Add
                        </button>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        {(newProduct.color || []).map((color, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: "4px 12px",
                              background: "#f0f3ff",
                              borderRadius: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            {color}
                            <button
                              type="button"
                              onClick={() => removeColor(color)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#e74c3c",
                                cursor: "pointer",
                                fontWeight: "bold",
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <textarea
                      placeholder="Description"
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          description: e.target.value,
                        })
                      }
                      style={{
                        padding: "12px",
                        borderRadius: "8px",
                        border: "2px solid #e0e0e0",
                        minHeight: "100px",
                      }}
                    />
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button
                        onClick={handleAddProduct}
                        style={{
                          flex: 1,
                          padding: "12px",
                          background: "#27ae60",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Add Product
                      </button>
                      <button
                        onClick={() => setShowAddProduct(false)}
                        style={{
                          flex: 1,
                          padding: "12px",
                          background: "#e74c3c",
                          color: "white",
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
              </div>
            )}

            <div className={styles.productGrid}>
              {products.map((product) => (
                <div key={product.id} className={styles.productCard}>
                  <img
                    src={product.imageURL}
                    alt={product.name}
                    className={styles.productImage}
                  />
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <p className={styles.productCategory}>{product.category}</p>
                    <p
                      style={{
                        color: product.stockLevel < 20 ? "#e74c3c" : "#27ae60",
                        fontWeight: 600,
                      }}
                    >
                      Stock: {product.stockLevel}
                    </p>
                    <div className={styles.productFooter}>
                      <span className={styles.productPrice}>
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginTop: "1rem",
                      }}
                    >
                      <button
                        onClick={() => handleEditProduct(product)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          background: "#3498db",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          background: "#e74c3c",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "orders" && (
          <>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Order Management</h1>
              <p className={styles.contentDescription}>
                View and manage customer orders
              </p>
            </div>

            {/* Order Stats */}
            <div className={styles.statsGrid} style={{ marginBottom: "2rem" }}>
              {[
                {
                  label: "Total Orders",
                  value: orders.length,
                  icon: "🛒",
                  color: "#FF6B9D",
                },
                {
                  label: "Completed",
                  value: orders.filter((o) => o.status === "completed").length,
                  icon: "✅",
                  color: "#00D9A3",
                },
                {
                  label: "Pending",
                  value: orders.filter((o) => o.status === "pending").length,
                  icon: "⏳",
                  color: "#FFB74D",
                },
                {
                  label: "Total Revenue",
                  value: formatPrice(getTotalRevenue()),
                  icon: "💰",
                  color: "#9D50BB",
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className={styles.statCard}
                  style={{
                    background: `linear-gradient(135deg, ${stat.color}10 0%, white 100%)`,
                    borderColor: `${stat.color}60`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "0.9rem",
                        color: "#636E72",
                        margin: 0,
                      }}
                    >
                      {stat.label}
                    </h3>
                    <span style={{ fontSize: "1.8rem" }}>{stat.icon}</span>
                  </div>
                  <div
                    className={styles.statValue}
                    style={{
                      fontSize: "1.8rem",
                      background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}DD 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Search and Filter */}
            <div
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "16px",
                marginBottom: "2rem",
                boxShadow: "0 4px 20px rgba(255, 107, 157, 0.1)",
                border: "2px solid #FF6B9D40",
              }}
            >
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {/* Search */}
                <div style={{ flex: 1, minWidth: "250px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: 600,
                      color: "#2D3436",
                      fontSize: "0.9rem",
                    }}
                  >
                    🔍 Search Orders
                  </label>
                  <input
                    type="text"
                    placeholder="Search by order ID, customer..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #E8EAED",
                      borderRadius: "10px",
                      fontSize: "0.95rem",
                      transition: "border-color 0.3s ease",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#FF6B9D")}
                    onBlur={(e) => (e.target.style.borderColor = "#E8EAED")}
                  />
                </div>

                {/* Status Filter */}
                <div style={{ minWidth: "200px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: 600,
                      color: "#2D3436",
                      fontSize: "0.9rem",
                    }}
                  >
                    📊 Filter by Status
                  </label>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className={styles.orderFilterSelect}
                    title="Filter orders by status"
                    aria-label="Filter orders by status"
                  >
                    <option value="all">All Orders</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🛒</div>
                <h2 className={styles.emptyTitle}>No orders yet</h2>
                <p className={styles.emptyDescription}>
                  Orders will appear here once customers make purchases
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {(() => {
                  // Filter orders based on search and status
                  let filteredOrders = orders;

                  // Status filter
                  if (orderStatusFilter !== "all") {
                    filteredOrders = filteredOrders.filter(
                      (o) => o.status === orderStatusFilter
                    );
                  }

                  // Search filter
                  if (orderSearchQuery) {
                    const query = orderSearchQuery.toLowerCase();
                    filteredOrders = filteredOrders.filter((o) => {
                      const customer = users.find((u) => u.id === o.userId);
                      return (
                        o.id.toLowerCase().includes(query) ||
                        customer?.name.toLowerCase().includes(query) ||
                        customer?.email.toLowerCase().includes(query) ||
                        o.paymentMethod.toLowerCase().includes(query)
                      );
                    });
                  }

                  if (filteredOrders.length === 0) {
                    return (
                      <div
                        style={{
                          background: "white",
                          padding: "3rem",
                          borderRadius: "16px",
                          textAlign: "center",
                          border: "2px solid #FF6B9D40",
                        }}
                      >
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                          🔍
                        </div>
                        <h3
                          style={{ color: "#2D3436", marginBottom: "0.5rem" }}
                        >
                          No orders found
                        </h3>
                        <p style={{ color: "#636E72" }}>
                          Try adjusting your search or filters
                        </p>
                      </div>
                    );
                  }

                  return filteredOrders.map((order) => {
                    const customer = users.find((u) => u.id === order.userId);
                    const statusColor =
                      order.status === "completed"
                        ? "#00D9A3"
                        : order.status === "pending"
                        ? "#FFB74D"
                        : "#FF5252";
                    return (
                      <div
                        key={order.id}
                        style={{
                          background: "white",
                          padding: "1.5rem",
                          borderRadius: "16px",
                          boxShadow: "0 4px 20px rgba(255, 107, 157, 0.1)",
                          border: `2px solid #FF6B9D40`,
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow =
                            "0 8px 30px rgba(255, 107, 157, 0.2)";
                          e.currentTarget.style.borderColor = "#FF6B9D";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 20px rgba(255, 107, 157, 0.1)";
                          e.currentTarget.style.borderColor = "#FF6B9D40";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "1rem",
                          }}
                        >
                          <div>
                            <h3>Order #{order.id.slice(0, 8)}</h3>
                            <p style={{ color: "#7f8c8d" }}>
                              {new Date(order.date).toLocaleDateString()}
                            </p>
                            {customer && (
                              <p
                                style={{
                                  color: "#636E72",
                                  fontSize: "0.9rem",
                                  marginTop: "0.25rem",
                                }}
                              >
                                Customer: {customer.name}
                              </p>
                            )}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{
                                padding: "6px 12px",
                                borderRadius: "12px",
                                background: statusColor,
                                color: "white",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                display: "inline-block",
                              }}
                            >
                              {order.status.toUpperCase()}
                            </div>
                            <p
                              style={{
                                fontWeight: 600,
                                fontSize: "1.25rem",
                                marginTop: "0.5rem",
                                color: "#2D3436",
                              }}
                            >
                              {formatPrice(order.totalAmount)}
                            </p>
                          </div>
                        </div>
                        <p style={{ color: "#7f8c8d" }}>
                          Items: {order.items.length} • Payment:{" "}
                          {order.paymentMethod}
                        </p>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </>
        )}

        {activeTab === "customers" && (
          <>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Customer Management</h1>
              <p className={styles.contentDescription}>
                View registered customers
              </p>
            </div>
            <div className={styles.statsGrid}>
              {users
                .filter((u) => u.role === "user")
                .map((customer) => (
                  <div key={customer.id} className={styles.statCard}>
                    <h3>{customer.name}</h3>
                    <p style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                      {customer.email}
                    </p>
                    <p
                      style={{
                        color: "#7f8c8d",
                        fontSize: "0.85rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      Joined:{" "}
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
            </div>
          </>
        )}

        {activeTab === "analytics" && (
          <>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Analytics Dashboard</h1>
              <p className={styles.contentDescription}>
                Real-time business insights
              </p>
            </div>
            {/* Revenue Cards */}
            <div className={styles.statsGrid}>
              {[
                {
                  label: "💰 Monthly Revenue",
                  value: formatPrice(getMonthlyRevenue()),
                  icon: "📅",
                  color: "#FF6B9D",
                },
                {
                  label: "📊 Weekly Revenue",
                  value: formatPrice(getWeeklyRevenue()),
                  icon: "📈",
                  color: "#9D50BB",
                },
                {
                  label: "🌟 Today's Revenue",
                  value: formatPrice(getTodayRevenue()),
                  icon: "⭐",
                  color: "#4A90E2",
                },
                {
                  label: "💎 Average Order Value",
                  value:
                    orders.length > 0
                      ? formatPrice(getTotalRevenue() / orders.length)
                      : formatPrice(0),
                  icon: "💵",
                  color: "#00D9A3",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={styles.statCard}
                  style={{
                    background: `linear-gradient(135deg, ${item.color}15 0%, white 100%)`,
                    borderColor: `${item.color}60`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      marginBottom: "1rem",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "0.9rem",
                        color: "#636E72",
                        fontWeight: 600,
                      }}
                    >
                      {item.label}
                    </h3>
                    <span style={{ fontSize: "2rem" }}>{item.icon}</span>
                  </div>
                  <div
                    className={styles.statValue}
                    style={{
                      fontSize: "1.8rem",
                      background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}CC 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Metrics */}
            <div className={styles.statsGrid} style={{ marginTop: "2rem" }}>
              {[
                {
                  label: "🎯 Conversion Rate",
                  value: `${(
                    (orders.length /
                      (users.filter((u) => u.role === "user").length || 1)) *
                    100
                  ).toFixed(1)}%`,
                  color: "#FFB74D",
                },
                {
                  label: "📦 Total Stock Value",
                  value: formatPrice(
                    products.reduce((sum, p) => sum + p.price * p.stockLevel, 0)
                  ),
                  color: "#4A90E2",
                },
                {
                  label: "🏆 Best Category",
                  value: getBestCategory(),
                  color: "#FF6B9D",
                },
                {
                  label: "🛒 Total Orders This Month",
                  value: orders.filter((o) => {
                    const orderDate = new Date(o.date);
                    const now = new Date();
                    return (
                      orderDate.getMonth() === now.getMonth() &&
                      orderDate.getFullYear() === now.getFullYear()
                    );
                  }).length,
                  color: "#9D50BB",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={styles.statCard}
                  style={{
                    background: `linear-gradient(135deg, ${item.color}10 0%, white 100%)`,
                    borderColor: `${item.color}50`,
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.9rem",
                      color: "#636E72",
                      marginBottom: "1rem",
                    }}
                  >
                    {item.label}
                  </h3>
                  <div
                    className={styles.statValue}
                    style={{
                      fontSize: idx === 2 ? "1.5rem" : "2rem",
                      background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}DD 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            {/* Revenue Chart */}
            <div
              style={{
                background: "white",
                padding: "2rem",
                borderRadius: "16px",
                marginTop: "2rem",
                boxShadow: "0 4px 20px rgba(255, 107, 157, 0.15)",
                border: "2px solid #FF6B9D40",
                transition: "all 0.3s ease",
              }}
            >
              <h3
                style={{
                  marginBottom: "1.5rem",
                  color: "#2D3436",
                  fontSize: "1.3rem",
                }}
              >
                📊 Revenue Breakdown
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                {[
                  {
                    label: "Today",
                    value: getTodayRevenue(),
                    color: "#4A90E2",
                    max: getTotalRevenue(),
                  },
                  {
                    label: "This Week",
                    value: getWeeklyRevenue(),
                    color: "#9D50BB",
                    max: getTotalRevenue(),
                  },
                  {
                    label: "This Month",
                    value: getMonthlyRevenue(),
                    color: "#FF6B9D",
                    max: getTotalRevenue(),
                  },
                  {
                    label: "All Time",
                    value: getTotalRevenue(),
                    color: "#00D9A3",
                    max: getTotalRevenue(),
                  },
                ].map((item, idx) => {
                  const percentage =
                    item.max > 0 ? (item.value / item.max) * 100 : 0;
                  return (
                    <div key={idx}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#2D3436" }}>
                          {item.label}
                        </span>
                        <span style={{ fontWeight: 700, color: item.color }}>
                          {formatPrice(item.value)}
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "12px",
                          background: "#F8F9FA",
                          borderRadius: "6px",
                          overflow: "hidden",
                          border: `1px solid ${item.color}30`,
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: "100%",
                            background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}CC 100%)`,
                            borderRadius: "6px",
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Insights */}
            <div
              style={{
                background: "white",
                padding: "2rem",
                borderRadius: "16px",
                marginTop: "2rem",
                boxShadow: "0 4px 20px rgba(255, 107, 157, 0.15)",
                border: "2px solid #FF6B9D40",
                transition: "all 0.3s ease",
              }}
            >
              <h3
                style={{
                  marginBottom: "1.5rem",
                  color: "#2D3436",
                  fontSize: "1.3rem",
                }}
              >
                💡 Quick Insights
              </h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li
                  style={{
                    padding: "1rem",
                    marginBottom: "0.75rem",
                    background:
                      "linear-gradient(135deg, #4A90E215 0%, #FFFFFF 100%)",
                    borderRadius: "8px",
                    borderLeft: "4px solid #4A90E2",
                  }}
                >
                  📊 Business is performing well with steady growth
                </li>
                <li
                  style={{
                    padding: "1rem",
                    marginBottom: "0.75rem",
                    background:
                      "linear-gradient(135deg, #FFB74D15 0%, #FFFFFF 100%)",
                    borderRadius: "8px",
                    borderLeft: "4px solid #FFB74D",
                  }}
                >
                  🎯 {getLowStockProducts()} products need restocking
                </li>
                <li
                  style={{
                    padding: "1rem",
                    marginBottom: "0.75rem",
                    background:
                      "linear-gradient(135deg, #00D9A315 0%, #FFFFFF 100%)",
                    borderRadius: "8px",
                    borderLeft: "4px solid #00D9A3",
                  }}
                >
                  💰 Total revenue: {formatPrice(getTotalRevenue())}
                </li>
                <li
                  style={{
                    padding: "1rem",
                    background:
                      "linear-gradient(135deg, #FF6B9D15 0%, #FFFFFF 100%)",
                    borderRadius: "8px",
                    borderLeft: "4px solid #FF6B9D",
                  }}
                >
                  🛒 {orders.length} total orders placed
                </li>
                <li
                  style={{
                    padding: "1rem",
                    marginTop: "0.75rem",
                    background:
                      "linear-gradient(135deg, #9D50BB15 0%, #FFFFFF 100%)",
                    borderRadius: "8px",
                    borderLeft: "4px solid #9D50BB",
                  }}
                >
                  ✅ All systems operational
                </li>
              </ul>
            </div>

            {/* Category Distribution Chart */}
            <div
              style={{
                background: "white",
                padding: "2rem",
                borderRadius: "16px",
                marginTop: "2rem",
                boxShadow: "0 4px 20px rgba(255, 107, 157, 0.15)",
                border: "2px solid #FF6B9D40",
              }}
            >
              <h3
                style={{
                  marginBottom: "1.5rem",
                  color: "#2D3436",
                  fontSize: "1.3rem",
                }}
              >
                📊 Sales by Category
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: "2rem",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {/* Category bars */}
                <div style={{ flex: 1, minWidth: "300px" }}>
                  {(() => {
                    const categoryData: { [key: string]: number } = {};
                    orders.forEach((order) => {
                      order.items.forEach((item) => {
                        const product = products.find(
                          (p) => p.id === item.productId
                        );
                        if (product) {
                          categoryData[product.category] =
                            (categoryData[product.category] || 0) +
                            item.quantity;
                        }
                      });
                    });
                    const maxSales = Math.max(
                      ...Object.values(categoryData),
                      1
                    );
                    const colors = [
                      "#FF6B9D",
                      "#9D50BB",
                      "#4A90E2",
                      "#00D9A3",
                      "#FFB74D",
                      "#FF5252",
                    ];

                    return Object.entries(categoryData)
                      .sort((a, b) => b[1] - a[1])
                      .map(([category, count], idx) => {
                        const percentage = (count / maxSales) * 100;
                        const color = colors[idx % colors.length];
                        return (
                          <div
                            key={category}
                            style={{ marginBottom: "1.5rem" }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "0.5rem",
                              }}
                            >
                              <span
                                style={{ fontWeight: 600, color: "#2D3436" }}
                              >
                                {category}
                              </span>
                              <span style={{ fontWeight: 700, color: color }}>
                                {count} items
                              </span>
                            </div>
                            <div
                              style={{
                                width: "100%",
                                height: "16px",
                                background: "#F8F9FA",
                                borderRadius: "8px",
                                overflow: "hidden",
                                border: `2px solid ${color}30`,
                              }}
                            >
                              <div
                                style={{
                                  width: `${percentage}%`,
                                  height: "100%",
                                  background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
                                  borderRadius: "8px",
                                  transition: "width 0.5s ease",
                                  boxShadow: `0 2px 8px ${color}40`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>

                {/* Visual pie representation */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    minWidth: "200px",
                  }}
                >
                  {(() => {
                    const categoryData: { [key: string]: number } = {};
                    orders.forEach((order) => {
                      order.items.forEach((item) => {
                        const product = products.find(
                          (p) => p.id === item.productId
                        );
                        if (product) {
                          categoryData[product.category] =
                            (categoryData[product.category] || 0) +
                            item.quantity;
                        }
                      });
                    });
                    const total =
                      Object.values(categoryData).reduce(
                        (sum, val) => sum + val,
                        0
                      ) || 1;
                    const colors = [
                      "#FF6B9D",
                      "#9D50BB",
                      "#4A90E2",
                      "#00D9A3",
                      "#FFB74D",
                      "#FF5252",
                    ];

                    return Object.entries(categoryData)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([category, count], idx) => {
                        const percentage = ((count / total) * 100).toFixed(1);
                        const color = colors[idx % colors.length];
                        return (
                          <div
                            key={category}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              padding: "0.75rem",
                              background: `${color}10`,
                              borderRadius: "8px",
                              border: `2px solid ${color}40`,
                            }}
                          >
                            <div
                              style={{
                                width: "20px",
                                height: "20px",
                                borderRadius: "4px",
                                background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
                                boxShadow: `0 2px 6px ${color}50`,
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  fontWeight: 600,
                                  color: "#2D3436",
                                }}
                              >
                                {category}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#636E72",
                                }}
                              >
                                {percentage}% of sales
                              </div>
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>
            </div>

            {/* Order Trends Graph */}
            <div
              style={{
                background: "white",
                padding: "2rem",
                borderRadius: "16px",
                marginTop: "2rem",
                boxShadow: "0 4px 20px rgba(255, 107, 157, 0.15)",
                border: "2px solid #FF6B9D40",
              }}
            >
              <h3
                style={{
                  marginBottom: "1.5rem",
                  color: "#2D3436",
                  fontSize: "1.3rem",
                }}
              >
                📈 Order Trends (Last 7 Days)
              </h3>
              <div
                style={{
                  position: "relative",
                  height: "250px",
                  padding: "20px 0",
                }}
              >
                {(() => {
                  // Get last 7 days data
                  const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    return date.toDateString();
                  });

                  const dailyOrders = last7Days.map((dateStr) => {
                    return orders.filter(
                      (order) => new Date(order.date).toDateString() === dateStr
                    ).length;
                  });

                  const maxOrders = Math.max(...dailyOrders, 1);
                  const colors = [
                    "#4A90E2",
                    "#9D50BB",
                    "#FF6B9D",
                    "#00D9A3",
                    "#FFB74D",
                    "#FF5252",
                    "#4A90E2",
                  ];

                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "1rem",
                        height: "200px",
                      }}
                    >
                      {last7Days.map((dateStr, idx) => {
                        const date = new Date(dateStr);
                        const dayName = date.toLocaleDateString("en-ZA", {
                          weekday: "short",
                        });
                        const count = dailyOrders[idx];
                        const heightPercent = (count / maxOrders) * 100;
                        const color = colors[idx];

                        return (
                          <div
                            key={idx}
                            style={{
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            {/* Bar */}
                            <div
                              style={{
                                width: "100%",
                                height: `${heightPercent}%`,
                                minHeight: count > 0 ? "20px" : "5px",
                                background: `linear-gradient(180deg, ${color} 0%, ${color}CC 100%)`,
                                borderRadius: "8px 8px 0 0",
                                position: "relative",
                                boxShadow: `0 -4px 15px ${color}40`,
                                border: `2px solid ${color}`,
                                borderBottom: "none",
                                transition: "all 0.3s ease",
                              }}
                            >
                              {/* Value label */}
                              {count > 0 && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "-25px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    background: color,
                                    color: "white",
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {count}
                                </div>
                              )}
                            </div>
                            {/* Day label */}
                            <div
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "#636E72",
                                textAlign: "center",
                              }}
                            >
                              {dayName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Products Performance */}
            <div
              style={{
                background: "white",
                padding: "2rem",
                borderRadius: "16px",
                marginTop: "2rem",
                boxShadow: "0 4px 20px rgba(255, 107, 157, 0.15)",
                border: "2px solid #FF6B9D40",
              }}
            >
              <h3
                style={{
                  marginBottom: "1.5rem",
                  color: "#2D3436",
                  fontSize: "1.3rem",
                }}
              >
                🏆 Top Selling Products
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {(() => {
                  const productSales: { [key: string]: number } = {};
                  orders.forEach((order) => {
                    order.items.forEach((item) => {
                      productSales[item.productId] =
                        (productSales[item.productId] || 0) + item.quantity;
                    });
                  });

                  const colors = [
                    "#FF6B9D",
                    "#9D50BB",
                    "#4A90E2",
                    "#00D9A3",
                    "#FFB74D",
                  ];
                  const maxSales = Math.max(...Object.values(productSales), 1);

                  return Object.entries(productSales)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([productId, soldCount], idx) => {
                      const product = products.find((p) => p.id === productId);
                      if (!product) return null;

                      const percentage = (soldCount / maxSales) * 100;
                      const color = colors[idx];
                      const revenue = product.price * soldCount;

                      return (
                        <div
                          key={productId}
                          style={{
                            padding: "1rem",
                            background: `linear-gradient(135deg, ${color}08 0%, white 100%)`,
                            borderRadius: "12px",
                            border: `2px solid ${color}30`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "0.75rem",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: "#2D3436",
                                  marginBottom: "0.25rem",
                                }}
                              >
                                #{idx + 1} {product.name}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#636E72",
                                }}
                              >
                                {soldCount} units sold • {formatPrice(revenue)}{" "}
                                revenue
                              </div>
                            </div>
                            <div
                              style={{
                                padding: "8px 16px",
                                background: color,
                                color: "white",
                                borderRadius: "20px",
                                fontWeight: 700,
                                fontSize: "1.2rem",
                              }}
                            >
                              {idx === 0
                                ? "🥇"
                                : idx === 1
                                ? "🥈"
                                : idx === 2
                                ? "🥉"
                                : "⭐"}
                            </div>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: "8px",
                              background: "#F8F9FA",
                              borderRadius: "4px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${percentage}%`,
                                height: "100%",
                                background: `linear-gradient(90deg, ${color} 0%, ${color}DD 100%)`,
                                borderRadius: "4px",
                                transition: "width 0.5s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            </div>

            {/* Sales Trends & Growth Analysis */}
            {(() => {
              const revenueComp = getRevenueComparison(orders);
              const forecast = forecastRevenue(orders, 30);
              const conversionMetrics = getConversionMetrics(orders);

              return (
                <div
                  style={{
                    background: "white",
                    padding: "2rem",
                    borderRadius: "16px",
                    marginTop: "2rem",
                    boxShadow: "0 4px 20px rgba(255, 107, 157, 0.15)",
                    border: "2px solid #FF6B9D40",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "1.5rem",
                      color: "#2D3436",
                      fontSize: "1.3rem",
                    }}
                  >
                    📊 Sales Trends & Growth Analysis
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "1.5rem",
                    }}
                  >
                    {/* Revenue Growth */}
                    <div
                      style={{
                        padding: "1.5rem",
                        background:
                          revenueComp.growth >= 0
                            ? "linear-gradient(135deg, #00D9A315 0%, white 100%)"
                            : "linear-gradient(135deg, #FF525215 0%, white 100%)",
                        borderRadius: "12px",
                        border: `2px solid ${
                          revenueComp.growth >= 0 ? "#00D9A3" : "#FF5252"
                        }40`,
                      }}
                    >
                      <div
                        style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}
                      >
                        {revenueComp.growth >= 0 ? "📈" : "📉"}
                      </div>
                      <h4
                        style={{
                          fontSize: "0.9rem",
                          color: "#636E72",
                          marginBottom: "0.5rem",
                        }}
                      >
                        30-Day Growth Rate
                      </h4>
                      <div
                        style={{
                          fontSize: "2rem",
                          fontWeight: 700,
                          color:
                            revenueComp.growth >= 0 ? "#00D9A3" : "#FF5252",
                        }}
                      >
                        {revenueComp.growth >= 0 ? "+" : ""}
                        {revenueComp.growth.toFixed(1)}%
                      </div>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#95A5A6",
                          marginTop: "0.5rem",
                        }}
                      >
                        vs previous 30 days
                      </p>
                    </div>

                    {/* Revenue Forecast */}
                    <div
                      style={{
                        padding: "1.5rem",
                        background:
                          "linear-gradient(135deg, #4A90E215 0%, white 100%)",
                        borderRadius: "12px",
                        border: "2px solid #4A90E240",
                      }}
                    >
                      <div
                        style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}
                      >
                        🔮
                      </div>
                      <h4
                        style={{
                          fontSize: "0.9rem",
                          color: "#636E72",
                          marginBottom: "0.5rem",
                        }}
                      >
                        30-Day Forecast
                      </h4>
                      <div
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: 700,
                          color: "#4A90E2",
                        }}
                      >
                        {formatPrice(forecast.forecastedRevenue)}
                      </div>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#95A5A6",
                          marginTop: "0.5rem",
                        }}
                      >
                        Confidence: {forecast.confidence}
                      </p>
                    </div>

                    {/* Conversion Rate */}
                    <div
                      style={{
                        padding: "1.5rem",
                        background:
                          "linear-gradient(135deg, #9D50BB15 0%, white 100%)",
                        borderRadius: "12px",
                        border: "2px solid #9D50BB40",
                      }}
                    >
                      <div
                        style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}
                      >
                        🎯
                      </div>
                      <h4
                        style={{
                          fontSize: "0.9rem",
                          color: "#636E72",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Order Completion Rate
                      </h4>
                      <div
                        style={{
                          fontSize: "2rem",
                          fontWeight: 700,
                          color: "#9D50BB",
                        }}
                      >
                        {conversionMetrics.completionRate.toFixed(1)}%
                      </div>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#95A5A6",
                          marginTop: "0.5rem",
                        }}
                      >
                        {conversionMetrics.totalOrders} total orders
                      </p>
                    </div>

                    {/* Avg Daily Revenue */}
                    <div
                      style={{
                        padding: "1.5rem",
                        background:
                          "linear-gradient(135deg, #FFB74D15 0%, white 100%)",
                        borderRadius: "12px",
                        border: "2px solid #FFB74D40",
                      }}
                    >
                      <div
                        style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}
                      >
                        💰
                      </div>
                      <h4
                        style={{
                          fontSize: "0.9rem",
                          color: "#636E72",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Avg Daily Revenue
                      </h4>
                      <div
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: 700,
                          color: "#FFB74D",
                        }}
                      >
                        {formatPrice(forecast.avgDailyRevenue)}
                      </div>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#95A5A6",
                          marginTop: "0.5rem",
                        }}
                      >
                        Last 30 days avg
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Customer Preferences & Behavior */}
            {(() => {
              const preferences = getCustomerPreferences(orders, products);
              const behavior = getCustomerBehavior(orders, users);

              return (
                <>
                  <div
                    style={{
                      background: "white",
                      padding: "2rem",
                      borderRadius: "16px",
                      marginTop: "2rem",
                      boxShadow: "0 4px 20px rgba(255, 107, 157, 0.15)",
                      border: "2px solid #FF6B9D40",
                    }}
                  >
                    <h3
                      style={{
                        marginBottom: "1.5rem",
                        color: "#2D3436",
                        fontSize: "1.3rem",
                      }}
                    >
                      👥 Customer Preferences & Shopping Patterns
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "2rem",
                      }}
                    >
                      {/* Top Categories */}
                      <div>
                        <h4
                          style={{
                            fontSize: "1rem",
                            color: "#2D3436",
                            marginBottom: "1rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          🏆 Top Categories
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                          }}
                        >
                          {preferences.categories
                            .slice(0, 5)
                            .map(([category, count], idx) => {
                              const total = preferences.categories.reduce(
                                (sum, [, c]) => sum + c,
                                0
                              );
                              const percentage = (
                                (count / total) *
                                100
                              ).toFixed(1);
                              const colors = [
                                "#FF6B9D",
                                "#9D50BB",
                                "#4A90E2",
                                "#00D9A3",
                                "#FFB74D",
                              ];
                              const color = colors[idx];

                              return (
                                <div
                                  key={category}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "1rem",
                                  }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "0.25rem",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: "0.9rem",
                                          fontWeight: 600,
                                          color: "#2D3436",
                                        }}
                                      >
                                        {category}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: "0.85rem",
                                          fontWeight: 600,
                                          color,
                                        }}
                                      >
                                        {count} units
                                      </span>
                                    </div>
                                    <div
                                      style={{
                                        height: "6px",
                                        background: "#F8F9FA",
                                        borderRadius: "3px",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: `${percentage}%`,
                                          height: "100%",
                                          background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
                                          borderRadius: "3px",
                                        }}
                                      />
                                    </div>
                                    <span
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "#95A5A6",
                                      }}
                                    >
                                      {percentage}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Top Brands */}
                      {preferences.brands.length > 0 && (
                        <div>
                          <h4
                            style={{
                              fontSize: "1rem",
                              color: "#2D3436",
                              marginBottom: "1rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            ⭐ Top Brands
                          </h4>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.75rem",
                            }}
                          >
                            {preferences.brands
                              .slice(0, 5)
                              .map(([brand, count], idx) => {
                                const total = preferences.brands.reduce(
                                  (sum, [, c]) => sum + c,
                                  0
                                );
                                const percentage = (
                                  (count / total) *
                                  100
                                ).toFixed(1);
                                const colors = [
                                  "#9D50BB",
                                  "#FF6B9D",
                                  "#4A90E2",
                                  "#00D9A3",
                                  "#FFB74D",
                                ];
                                const color = colors[idx];

                                return (
                                  <div key={brand}>
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "0.25rem",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: "0.9rem",
                                          fontWeight: 600,
                                          color: "#2D3436",
                                        }}
                                      >
                                        {brand}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: "0.85rem",
                                          fontWeight: 600,
                                          color,
                                        }}
                                      >
                                        {count} units
                                      </span>
                                    </div>
                                    <div
                                      style={{
                                        height: "6px",
                                        background: "#F8F9FA",
                                        borderRadius: "3px",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: `${percentage}%`,
                                          height: "100%",
                                          background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
                                          borderRadius: "3px",
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Price Range Preferences */}
                      <div>
                        <h4
                          style={{
                            fontSize: "1rem",
                            color: "#2D3436",
                            marginBottom: "1rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          💵 Price Range Preferences
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                          }}
                        >
                          {preferences.priceRanges.map(
                            ([range, count], idx) => {
                              const total = preferences.priceRanges.reduce(
                                (sum, [, c]) => sum + c,
                                0
                              );
                              const percentage = (
                                (count / total) *
                                100
                              ).toFixed(1);
                              const colors = [
                                "#00D9A3",
                                "#4A90E2",
                                "#FFB74D",
                                "#FF6B9D",
                                "#9D50BB",
                              ];
                              const color = colors[idx % colors.length];

                              return (
                                <div key={range}>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      marginBottom: "0.25rem",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "0.9rem",
                                        fontWeight: 600,
                                        color: "#2D3436",
                                      }}
                                    >
                                      {range}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                        color,
                                      }}
                                    >
                                      {count} items
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      height: "6px",
                                      background: "#F8F9FA",
                                      borderRadius: "3px",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${percentage}%`,
                                        height: "100%",
                                        background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
                                        borderRadius: "3px",
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Segments */}
                  <div
                    style={{
                      background: "white",
                      padding: "2rem",
                      borderRadius: "16px",
                      marginTop: "2rem",
                      boxShadow: "0 4px 20px rgba(255, 107, 157, 0.15)",
                      border: "2px solid #FF6B9D40",
                    }}
                  >
                    <h3
                      style={{
                        marginBottom: "1.5rem",
                        color: "#2D3436",
                        fontSize: "1.3rem",
                      }}
                    >
                      🎯 Customer Segments & Behavior
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "1.5rem",
                      }}
                    >
                      {/* VIP Customers */}
                      <div
                        style={{
                          padding: "1.5rem",
                          background:
                            "linear-gradient(135deg, #FFB74D15 0%, white 100%)",
                          borderRadius: "12px",
                          border: "2px solid #FFB74D40",
                        }}
                      >
                        <div
                          style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}
                        >
                          👑
                        </div>
                        <h4
                          style={{
                            fontSize: "0.9rem",
                            color: "#636E72",
                            marginBottom: "0.5rem",
                          }}
                        >
                          VIP Customers
                        </h4>
                        <div
                          style={{
                            fontSize: "2rem",
                            fontWeight: 700,
                            color: "#FFB74D",
                          }}
                        >
                          {behavior.vip.length}
                        </div>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: "#95A5A6",
                            marginTop: "0.5rem",
                          }}
                        >
                          5+ orders, R10k+ spent
                        </p>
                      </div>

                      {/* Loyal Customers */}
                      <div
                        style={{
                          padding: "1.5rem",
                          background:
                            "linear-gradient(135deg, #00D9A315 0%, white 100%)",
                          borderRadius: "12px",
                          border: "2px solid #00D9A340",
                        }}
                      >
                        <div
                          style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}
                        >
                          💚
                        </div>
                        <h4
                          style={{
                            fontSize: "0.9rem",
                            color: "#636E72",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Loyal Customers
                        </h4>
                        <div
                          style={{
                            fontSize: "2rem",
                            fontWeight: 700,
                            color: "#00D9A3",
                          }}
                        >
                          {behavior.loyal.length}
                        </div>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: "#95A5A6",
                            marginTop: "0.5rem",
                          }}
                        >
                          3+ orders
                        </p>
                      </div>

                      {/* At-Risk Customers */}
                      <div
                        style={{
                          padding: "1.5rem",
                          background:
                            "linear-gradient(135deg, #FF525215 0%, white 100%)",
                          borderRadius: "12px",
                          border: "2px solid #FF525240",
                        }}
                      >
                        <div
                          style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}
                        >
                          ⚠️
                        </div>
                        <h4
                          style={{
                            fontSize: "0.9rem",
                            color: "#636E72",
                            marginBottom: "0.5rem",
                          }}
                        >
                          At-Risk Customers
                        </h4>
                        <div
                          style={{
                            fontSize: "2rem",
                            fontWeight: 700,
                            color: "#FF5252",
                          }}
                        >
                          {behavior.atRisk.length}
                        </div>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: "#95A5A6",
                            marginTop: "0.5rem",
                          }}
                        >
                          No order in 60+ days
                        </p>
                      </div>

                      {/* New Customers */}
                      <div
                        style={{
                          padding: "1.5rem",
                          background:
                            "linear-gradient(135deg, #4A90E215 0%, white 100%)",
                          borderRadius: "12px",
                          border: "2px solid #4A90E240",
                        }}
                      >
                        <div
                          style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}
                        >
                          🆕
                        </div>
                        <h4
                          style={{
                            fontSize: "0.9rem",
                            color: "#636E72",
                            marginBottom: "0.5rem",
                          }}
                        >
                          New Customers
                        </h4>
                        <div
                          style={{
                            fontSize: "2rem",
                            fontWeight: 700,
                            color: "#4A90E2",
                          }}
                        >
                          {behavior.new.length}
                        </div>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: "#95A5A6",
                            marginTop: "0.5rem",
                          }}
                        >
                          0-1 orders
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Inventory Management & Stockout Predictions */}
            {(() => {
              const inventory = getInventoryInsights(products, orders);
              const stockoutPredictions = predictStockouts(products, orders);

              return (
                <>
                  {/* Inventory Alerts */}
                  <div
                    style={{
                      background: "white",
                      padding: "2rem",
                      borderRadius: "16px",
                      marginTop: "2rem",
                      boxShadow: "0 4px 20px rgba(255, 107, 157, 0.15)",
                      border: "2px solid #FF6B9D40",
                    }}
                  >
                    <h3
                      style={{
                        marginBottom: "1.5rem",
                        color: "#2D3436",
                        fontSize: "1.3rem",
                      }}
                    >
                      📦 Inventory Management & Stock Levels
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "1.5rem",
                        marginBottom: "2rem",
                      }}
                    >
                      {/* Out of Stock */}
                      <div
                        style={{
                          padding: "1.5rem",
                          background:
                            "linear-gradient(135deg, #FF525215 0%, white 100%)",
                          borderRadius: "12px",
                          border: "2px solid #FF525240",
                        }}
                      >
                        <div
                          style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
                        >
                          🚨
                        </div>
                        <h4
                          style={{
                            fontSize: "0.9rem",
                            color: "#636E72",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Out of Stock
                        </h4>
                        <div
                          style={{
                            fontSize: "2.5rem",
                            fontWeight: 700,
                            color: "#FF5252",
                          }}
                        >
                          {inventory.outOfStock.length}
                        </div>
                      </div>

                      {/* Low Stock */}
                      <div
                        style={{
                          padding: "1.5rem",
                          background:
                            "linear-gradient(135deg, #FFB74D15 0%, white 100%)",
                          borderRadius: "12px",
                          border: "2px solid #FFB74D40",
                        }}
                      >
                        <div
                          style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
                        >
                          ⚠️
                        </div>
                        <h4
                          style={{
                            fontSize: "0.9rem",
                            color: "#636E72",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Low Stock (&lt;10)
                        </h4>
                        <div
                          style={{
                            fontSize: "2.5rem",
                            fontWeight: 700,
                            color: "#FFB74D",
                          }}
                        >
                          {inventory.lowStock.length}
                        </div>
                      </div>

                      {/* Fast Moving */}
                      <div
                        style={{
                          padding: "1.5rem",
                          background:
                            "linear-gradient(135deg, #00D9A315 0%, white 100%)",
                          borderRadius: "12px",
                          border: "2px solid #00D9A340",
                        }}
                      >
                        <div
                          style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
                        >
                          🔥
                        </div>
                        <h4
                          style={{
                            fontSize: "0.9rem",
                            color: "#636E72",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Fast Moving
                        </h4>
                        <div
                          style={{
                            fontSize: "2.5rem",
                            fontWeight: 700,
                            color: "#00D9A3",
                          }}
                        >
                          {inventory.fastMoving.length}
                        </div>
                      </div>

                      {/* Slow Moving */}
                      <div
                        style={{
                          padding: "1.5rem",
                          background:
                            "linear-gradient(135deg, #9D50BB15 0%, white 100%)",
                          borderRadius: "12px",
                          border: "2px solid #9D50BB40",
                        }}
                      >
                        <div
                          style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
                        >
                          🐌
                        </div>
                        <h4
                          style={{
                            fontSize: "0.9rem",
                            color: "#636E72",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Slow Moving
                        </h4>
                        <div
                          style={{
                            fontSize: "2.5rem",
                            fontWeight: 700,
                            color: "#9D50BB",
                          }}
                        >
                          {inventory.slowMoving.length}
                        </div>
                      </div>

                      {/* Overstocked */}
                      <div
                        style={{
                          padding: "1.5rem",
                          background:
                            "linear-gradient(135deg, #4A90E215 0%, white 100%)",
                          borderRadius: "12px",
                          border: "2px solid #4A90E240",
                        }}
                      >
                        <div
                          style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
                        >
                          📦
                        </div>
                        <h4
                          style={{
                            fontSize: "0.9rem",
                            color: "#636E72",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Overstocked (&gt;100)
                        </h4>
                        <div
                          style={{
                            fontSize: "2.5rem",
                            fontWeight: 700,
                            color: "#4A90E2",
                          }}
                        >
                          {inventory.overstocked.length}
                        </div>
                      </div>
                    </div>

                    {/* Stockout Predictions */}
                    {stockoutPredictions.length > 0 && (
                      <div>
                        <h4
                          style={{
                            fontSize: "1.1rem",
                            color: "#2D3436",
                            marginBottom: "1rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          🔮 Stockout Predictions & Recommendations
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                          }}
                        >
                          {stockoutPredictions
                            .slice(0, 10)
                            .map((prediction, idx) => {
                              const urgencyColor =
                                prediction.daysUntilStockout < 3
                                  ? "#FF5252"
                                  : prediction.daysUntilStockout < 7
                                  ? "#FFB74D"
                                  : "#4A90E2";

                              return (
                                <div
                                  key={prediction.product.id}
                                  style={{
                                    padding: "1rem",
                                    background: `linear-gradient(135deg, ${urgencyColor}10 0%, white 100%)`,
                                    borderRadius: "8px",
                                    border: `2px solid ${urgencyColor}40`,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "1rem",
                                  }}
                                >
                                  <div style={{ flex: "1 1 200px" }}>
                                    <h5
                                      style={{
                                        fontSize: "1rem",
                                        fontWeight: 700,
                                        color: "#2D3436",
                                        marginBottom: "0.25rem",
                                      }}
                                    >
                                      {prediction.product.name}
                                    </h5>
                                    <p
                                      style={{
                                        fontSize: "0.85rem",
                                        color: "#636E72",
                                      }}
                                    >
                                      Current Stock:{" "}
                                      {prediction.product.stockLevel} units
                                    </p>
                                  </div>
                                  <div
                                    style={{
                                      flex: "0 0 auto",
                                      textAlign: "center",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: "1.5rem",
                                        fontWeight: 700,
                                        color: urgencyColor,
                                      }}
                                    >
                                      {prediction.daysUntilStockout} days
                                    </div>
                                    <p
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "#95A5A6",
                                      }}
                                    >
                                      until stockout
                                    </p>
                                  </div>
                                  <div style={{ flex: "1 1 250px" }}>
                                    <div
                                      style={{
                                        padding: "0.75rem",
                                        background: `${urgencyColor}15`,
                                        borderRadius: "6px",
                                        fontSize: "0.9rem",
                                        fontWeight: 600,
                                        color: urgencyColor,
                                      }}
                                    >
                                      {prediction.recommendedAction}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Fast & Slow Moving Products */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "2rem",
                        marginTop: "2rem",
                      }}
                    >
                      {/* Fast Moving Products */}
                      {inventory.fastMoving.length > 0 && (
                        <div>
                          <h4
                            style={{
                              fontSize: "1rem",
                              color: "#2D3436",
                              marginBottom: "1rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            🔥 Fast Moving Products (High Demand)
                          </h4>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.75rem",
                            }}
                          >
                            {inventory.fastMoving
                              .slice(0, 5)
                              .map(({ product, velocity }) => (
                                <div
                                  key={product.id}
                                  style={{
                                    padding: "1rem",
                                    background:
                                      "linear-gradient(135deg, #00D9A310 0%, white 100%)",
                                    borderRadius: "8px",
                                    border: "2px solid #00D9A330",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <div>
                                      <h5
                                        style={{
                                          fontSize: "0.9rem",
                                          fontWeight: 700,
                                          color: "#2D3436",
                                          marginBottom: "0.25rem",
                                        }}
                                      >
                                        {product.name}
                                      </h5>
                                      <p
                                        style={{
                                          fontSize: "0.8rem",
                                          color: "#636E72",
                                        }}
                                      >
                                        Stock: {product.stockLevel} • Velocity:{" "}
                                        {velocity.toFixed(1)} units/day
                                      </p>
                                    </div>
                                    <div style={{ fontSize: "1.5rem" }}>🚀</div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Slow Moving Products */}
                      {inventory.slowMoving.length > 0 && (
                        <div>
                          <h4
                            style={{
                              fontSize: "1rem",
                              color: "#2D3436",
                              marginBottom: "1rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            🐌 Slow Moving Products (Consider Promotion)
                          </h4>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.75rem",
                            }}
                          >
                            {inventory.slowMoving
                              .slice(0, 5)
                              .map(({ product, velocity }) => (
                                <div
                                  key={product.id}
                                  style={{
                                    padding: "1rem",
                                    background:
                                      "linear-gradient(135deg, #9D50BB10 0%, white 100%)",
                                    borderRadius: "8px",
                                    border: "2px solid #9D50BB30",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <div>
                                      <h5
                                        style={{
                                          fontSize: "0.9rem",
                                          fontWeight: 700,
                                          color: "#2D3436",
                                          marginBottom: "0.25rem",
                                        }}
                                      >
                                        {product.name}
                                      </h5>
                                      <p
                                        style={{
                                          fontSize: "0.8rem",
                                          color: "#636E72",
                                        }}
                                      >
                                        Stock: {product.stockLevel} • Velocity:{" "}
                                        {velocity.toFixed(2)} units/day
                                      </p>
                                    </div>
                                    <div style={{ fontSize: "1.5rem" }}>💤</div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Key Actionable Insights */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, #FF6B9D15 0%, #4A90E215 100%)",
                padding: "2rem",
                borderRadius: "16px",
                marginTop: "2rem",
                boxShadow: "0 4px 20px rgba(255, 107, 157, 0.15)",
                border: "2px solid #FF6B9D60",
              }}
            >
              <h3
                style={{
                  marginBottom: "1.5rem",
                  color: "#2D3436",
                  fontSize: "1.3rem",
                }}
              >
                💡 Key Actionable Insights & Recommendations
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {(() => {
                  const insights = [];
                  const revenueComp = getRevenueComparison(orders);
                  const inventory = getInventoryInsights(products, orders);
                  const behavior = getCustomerBehavior(orders, users);
                  const stockoutPredictions = predictStockouts(
                    products,
                    orders
                  );

                  // Revenue insights
                  if (revenueComp.growth > 10) {
                    insights.push({
                      icon: "📈",
                      color: "#00D9A3",
                      message: `Excellent growth! Revenue is up ${revenueComp.growth.toFixed(
                        1
                      )}% vs last period. Continue current strategies.`,
                    });
                  } else if (revenueComp.growth < -5) {
                    insights.push({
                      icon: "📉",
                      color: "#FF5252",
                      message: `Revenue declined by ${Math.abs(
                        revenueComp.growth
                      ).toFixed(
                        1
                      )}%. Consider promotional campaigns or reviewing pricing.`,
                    });
                  }

                  // Stock alerts
                  if (inventory.outOfStock.length > 0) {
                    insights.push({
                      icon: "🚨",
                      color: "#FF5252",
                      message: `URGENT: ${inventory.outOfStock.length} products are out of stock. Restock immediately to avoid lost sales.`,
                    });
                  }

                  if (inventory.lowStock.length > 0) {
                    insights.push({
                      icon: "⚠️",
                      color: "#FFB74D",
                      message: `${inventory.lowStock.length} products have low stock levels (<10 units). Plan restocking soon.`,
                    });
                  }

                  // Fast moving insights
                  if (inventory.fastMoving.length > 0) {
                    insights.push({
                      icon: "🔥",
                      color: "#00D9A3",
                      message: `${inventory.fastMoving.length} products are selling fast! Ensure adequate stock to meet demand.`,
                    });
                  }

                  // Slow moving insights
                  if (inventory.slowMoving.length > 3) {
                    insights.push({
                      icon: "💤",
                      color: "#9D50BB",
                      message: `${inventory.slowMoving.length} products are slow-moving. Consider running promotions or discounts.`,
                    });
                  }

                  // Customer insights
                  if (behavior.atRisk.length > 0) {
                    insights.push({
                      icon: "⚠️",
                      color: "#FFB74D",
                      message: `${behavior.atRisk.length} customers haven't ordered in 60+ days. Launch re-engagement campaigns.`,
                    });
                  }

                  if (behavior.vip.length > 0) {
                    insights.push({
                      icon: "👑",
                      color: "#FFB74D",
                      message: `You have ${behavior.vip.length} VIP customers! Offer exclusive deals to maintain loyalty.`,
                    });
                  }

                  // Stockout predictions
                  if (stockoutPredictions.length > 0) {
                    const urgent = stockoutPredictions.filter(
                      (p) => p.daysUntilStockout < 7
                    ).length;
                    if (urgent > 0) {
                      insights.push({
                        icon: "🔮",
                        color: "#FF5252",
                        message: `${urgent} products will run out of stock within 7 days. Review stockout predictions above.`,
                      });
                    }
                  }

                  // Default insight if none
                  if (insights.length === 0) {
                    insights.push({
                      icon: "✅",
                      color: "#00D9A3",
                      message:
                        "All systems are running smoothly! Keep up the good work.",
                    });
                  }

                  return insights.map((insight, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "1.25rem",
                        background: "white",
                        borderRadius: "10px",
                        border: `2px solid ${insight.color}40`,
                        borderLeft: `6px solid ${insight.color}`,
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ fontSize: "2rem" }}>{insight.icon}</div>
                      <p
                        style={{
                          fontSize: "0.95rem",
                          color: "#2D3436",
                          lineHeight: "1.5",
                          margin: 0,
                        }}
                      >
                        {insight.message}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Edit Product Modal */}
      {showEditProduct && editingProduct && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setShowEditProduct(false);
            setEditingProduct(null);
            setImagePreview(null);
            setUseImageUpload(false);
            setNewProduct({
              name: "",
              category: "",
              size: [],
              color: [],
              price: 0,
              stockLevel: 0,
              imageURL: "",
              description: "",
              brand: "",
            });
          }}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "12px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "1.5rem" }}>Edit Product</h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {[
                {
                  id: "name",
                  placeholder: "Product Name *",
                  value: newProduct.name || "",
                  type: "text",
                },
                {
                  id: "category",
                  placeholder: "Category *",
                  value: newProduct.category || "",
                  type: "text",
                },
                {
                  id: "brand",
                  placeholder: "Brand",
                  value: newProduct.brand || "",
                  type: "text",
                },
                {
                  id: "price",
                  placeholder: "Price *",
                  value: newProduct.price || "",
                  type: "number",
                },
                {
                  id: "stockLevel",
                  placeholder: "Stock Level",
                  value: newProduct.stockLevel || "",
                  type: "number",
                },
              ].map((field) => (
                <input
                  key={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      [field.id]:
                        field.type === "number"
                          ? parseFloat(e.target.value) || 0
                          : e.target.value,
                    })
                  }
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: "2px solid #e0e0e0",
                  }}
                />
              ))}

              {/* Image Upload Section */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.75rem",
                    fontWeight: 600,
                    color: "#2D3436",
                  }}
                >
                  Product Image:
                </label>

                {/* Toggle between URL and Upload */}
                <div
                  style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setUseImageUpload(false);
                      setImagePreview(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: !useImageUpload
                        ? "2px solid #FF6B9D"
                        : "2px solid #E8EAED",
                      background: !useImageUpload
                        ? "linear-gradient(135deg, #FFF5F7 0%, #FFFFFF 100%)"
                        : "white",
                      color: !useImageUpload ? "#FF6B9D" : "#636E72",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    📎 Use URL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUseImageUpload(true);
                      setNewProduct({ ...newProduct, imageURL: "" });
                    }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: useImageUpload
                        ? "2px solid #FF6B9D"
                        : "2px solid #E8EAED",
                      background: useImageUpload
                        ? "linear-gradient(135deg, #FFF5F7 0%, #FFFFFF 100%)"
                        : "white",
                      color: useImageUpload ? "#FF6B9D" : "#636E72",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    📤 Upload Image
                  </button>
                </div>

                {/* URL Input */}
                {!useImageUpload && (
                  <input
                    type="text"
                    placeholder="Enter image URL"
                    value={newProduct.imageURL || ""}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        imageURL: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "2px solid #E8EAED",
                      transition: "border-color 0.3s ease",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#FF6B9D")}
                    onBlur={(e) => (e.target.style.borderColor = "#E8EAED")}
                  />
                )}

                {/* File Upload */}
                {useImageUpload && (
                  <div>
                    <div
                      style={{
                        border: "2px dashed #FF6B9D40",
                        borderRadius: "12px",
                        padding: "2rem",
                        textAlign: "center",
                        background:
                          "linear-gradient(135deg, #FFF5F7 0%, #FFFFFF 100%)",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#FF6B9D";
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, #FFE5EE 0%, #FFF5F7 100%)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#FF6B9D40";
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, #FFF5F7 0%, #FFFFFF 100%)";
                      }}
                      onClick={() =>
                        document.getElementById("imageUploadEdit")?.click()
                      }
                    >
                      <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
                        📸
                      </div>
                      <p
                        style={{
                          color: "#FF6B9D",
                          fontWeight: 600,
                          marginBottom: "0.25rem",
                        }}
                      >
                        Click to upload image
                      </p>
                      <p style={{ color: "#95A5A6", fontSize: "0.85rem" }}>
                        <input
                          id="imageUploadEdit"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleImageUpload}
                          hidden
                          title="Upload product image"
                          aria-label="Upload product image"
                        />
                      </p>
                    </div>

                    {/* Image Preview */}
                    {imagePreview && (
                      <div style={{ marginTop: "1rem" }}>
                        <div
                          style={{
                            position: "relative",
                            display: "inline-block",
                            width: "100%",
                          }}
                        >
                          <img
                            src={imagePreview}
                            alt="Preview"
                            style={{
                              width: "100%",
                              maxHeight: "200px",
                              objectFit: "contain",
                              borderRadius: "12px",
                              border: "2px solid #FF6B9D40",
                            }}
                          />
                          <button
                            type="button"
                            onClick={clearImageUpload}
                            style={{
                              position: "absolute",
                              top: "10px",
                              right: "10px",
                              background: "#FF5252",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              width: "32px",
                              height: "32px",
                              cursor: "pointer",
                              fontWeight: "bold",
                              fontSize: "1.2rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Size & Color management same as Add Product */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  Available Sizes:
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <input
                    type="text"
                    placeholder="e.g., S, M, L, XL"
                    title="Enter available sizes, e.g., S, M, L, XL"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addSize())
                    }
                    className={styles.sizeInput}
                  />
                  <button
                    type="button"
                    onClick={addSize}
                    style={{
                      padding: "8px 16px",
                      background: "#667eea",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </div>
                <div
                  style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                >
                  {(newProduct.size || []).map((size, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "4px 12px",
                        background: "#f0f3ff",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => removeSize(size)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#e74c3c",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  Available Colors:
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <input
                    type="text"
                    placeholder="e.g., Red, Blue, Black"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addColor())
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "6px",
                      border: "2px solid #e0e0e0",
                    }}
                  />
                  <button
                    type="button"
                    onClick={addColor}
                    style={{
                      padding: "8px 16px",
                      background: "#667eea",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </div>
                <div
                  style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                >
                  {(newProduct.color || []).map((color, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "4px 12px",
                        background: "#f0f3ff",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => removeColor(color)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#e74c3c",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <textarea
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    description: e.target.value,
                  })
                }
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "2px solid #e0e0e0",
                  minHeight: "100px",
                }}
              />
              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={handleUpdateProduct}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#3498db",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Update Product
                </button>
                <button
                  onClick={() => {
                    setShowEditProduct(false);
                    setEditingProduct(null);
                    setNewProduct({
                      name: "",
                      category: "",
                      size: [],
                      color: [],
                      price: 0,
                      stockLevel: 0,
                      imageURL: "",
                      description: "",
                      brand: "",
                    });
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#e74c3c",
                    color: "white",
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
        </div>
      )}
    </div>
  );
}
