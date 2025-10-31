"use client";

import { useState, useEffect } from "react";
import { Bell, X, TrendingDown, Package, ShoppingBag, Sparkles } from "lucide-react";
import { checkPriceAlerts } from "../utils/wishlist";
import { getProducts } from "../utils/storage/localStorage";
import { User } from "../types";

export interface Notification {
  id: string;
  type: "price_drop" | "order_update" | "recommendation" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  icon?: string;
}

interface Props {
  user: User;
}

export default function NotificationCenter({ user }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    checkForPriceDrops();
  }, [user]);

  const loadNotifications = () => {
    try {
      const stored = localStorage.getItem(`notifications_${user.id}`);
      if (stored) {
        const loaded = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        setNotifications(loaded);
        setUnreadCount(loaded.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const saveNotifications = (notifs: Notification[]) => {
    try {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifs));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (error) {
      console.error("Error saving notifications:", error);
    }
  };

  const checkForPriceDrops = () => {
    const products = getProducts();
    const triggeredAlerts = checkPriceAlerts(user.id, products);

    if (triggeredAlerts.length > 0) {
      const newNotifications = triggeredAlerts.map(alert => {
        const product = products.find(p => p.id === alert.productId);
        return {
          id: `price_drop_${alert.productId}_${Date.now()}`,
          type: "price_drop" as const,
          title: "Price Drop Alert! 🎉",
          message: `${product?.name} is now R${product?.price}! You set an alert for R${alert.targetPrice}.`,
          timestamp: new Date(),
          read: false,
          actionUrl: `/dashboard/user?product=${alert.productId}`,
        };
      });

      const updated = [...newNotifications, ...notifications].slice(0, 50);
      saveNotifications(updated);
    }
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "price_drop":
        return <TrendingDown className="w-5 h-5" style={{ color: "#27ae60" }} />;
      case "order_update":
        return <Package className="w-5 h-5" style={{ color: "#3498db" }} />;
      case "recommendation":
        return <Sparkles className="w-5 h-5" style={{ color: "#FF6B9D" }} />;
      default:
        return <ShoppingBag className="w-5 h-5" style={{ color: "#95a5a6" }} />;
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Bell Icon */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        style={{
          position: "relative",
          background: "white",
          border: "2px solid rgba(255, 107, 157, 0.2)",
          cursor: "pointer",
          padding: "0.75rem",
          borderRadius: "50%",
          transition: "all 0.3s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(255, 107, 157, 0.2)",
          width: "50px",
          height: "50px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)";
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(255, 107, 157, 0.4)";
          const bellIcon = e.currentTarget.querySelector('.bell-icon') as HTMLElement;
          if (bellIcon) bellIcon.style.color = "white";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "white";
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 107, 157, 0.2)";
          const bellIcon = e.currentTarget.querySelector('.bell-icon') as HTMLElement;
          if (bellIcon) bellIcon.style.color = "#FF6B9D";
        }}
        title="Notifications"
      >
        <Bell className="w-6 h-6 bell-icon" style={{ color: "#FF6B9D", transition: "color 0.3s" }} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "0",
              right: "0",
              background: "#e74c3c",
              color: "white",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 700,
              border: "2px solid white",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showNotifications && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setShowNotifications(false)}
          />
          <div
            className="notification-panel"
            style={{
              position: "fixed",
              top: "80px",
              right: "20px",
              width: "380px",
              maxWidth: "calc(100vw - 40px)",
              maxHeight: "calc(100vh - 120px)",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
              zIndex: 1000,
              overflow: "hidden",
              border: "1px solid rgba(255, 107, 157, 0.1)",
              animation: "slideInRight 0.3s ease-out",
            }}
          >
            <style>
              {`
                @keyframes slideInRight {
                  from {
                    opacity: 0;
                    transform: translateX(100px);
                  }
                  to {
                    opacity: 1;
                    transform: translateX(0);
                  }
                }

                @media (max-width: 768px) {
                  .notification-panel {
                    top: 60px !important;
                    right: 10px !important;
                    left: 10px !important;
                    width: auto !important;
                    max-width: none !important;
                  }
                }
              `}
            </style>
            {/* Header */}
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "2px solid #f8f9fa",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "linear-gradient(135deg, #FFF5F7 0%, #FFFFFF 100%)",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#2c3e50" }}>
                🔔 Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#FF6B9D",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "6px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 107, 157, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: "3rem 1.5rem",
                    textAlign: "center",
                    color: "#95a5a6",
                  }}
                >
                  <Bell className="w-12 h-12" style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: "0.95rem" }}>No notifications yet</p>
                  <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem" }}>
                    We'll notify you about price drops and updates
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: "1rem 1.25rem",
                      borderBottom: "1px solid #f1f3f5",
                      background: notif.read ? "white" : "#FFF5F7",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      position: "relative",
                    }}
                    onClick={() => {
                      markAsRead(notif.id);
                      if (notif.actionUrl) {
                        window.location.href = notif.actionUrl;
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#FFF5F7";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notif.read ? "white" : "#FFF5F7";
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      style={{
                        position: "absolute",
                        top: "0.75rem",
                        right: "0.75rem",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "0.25rem",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(231, 76, 60, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <X className="w-4 h-4" style={{ color: "#95a5a6" }} />
                    </button>

                    <div style={{ display: "flex", gap: "0.75rem", paddingRight: "2rem" }}>
                      <div
                        style={{
                          flexShrink: 0,
                          width: "40px",
                          height: "40px",
                          background: "linear-gradient(135deg, #FFF5F7 0%, #FFE5EE 100%)",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4
                          style={{
                            margin: "0 0 0.25rem 0",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            color: "#2c3e50",
                          }}
                        >
                          {notif.title}
                        </h4>
                        <p
                          style={{
                            margin: "0 0 0.5rem 0",
                            fontSize: "0.85rem",
                            color: "#636E72",
                            lineHeight: "1.4",
                          }}
                        >
                          {notif.message}
                        </p>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#95a5a6",
                          }}
                        >
                          {formatTimestamp(notif.timestamp)}
                        </span>
                        {!notif.read && (
                          <span
                            style={{
                              display: "inline-block",
                              width: "8px",
                              height: "8px",
                              background: "#FF6B9D",
                              borderRadius: "50%",
                              marginLeft: "0.5rem",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
