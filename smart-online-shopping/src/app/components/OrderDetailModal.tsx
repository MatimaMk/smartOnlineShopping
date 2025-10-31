"use client";

import { Order, Product } from "@/app/types";
import { formatPrice } from "@/app/utils/currency";
import { downloadInvoiceAsPDF, viewInvoice } from "@/app/utils/invoiceGenerator";

interface OrderDetailModalProps {
  order: Order;
  products: Product[];
  customerName: string;
  customerEmail: string;
  onClose: () => void;
}

export default function OrderDetailModal({
  order,
  products,
  customerName,
  customerEmail,
  onClose,
}: OrderDetailModalProps) {
  const orderDate = new Date(order.date).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDownloadPDF = () => {
    downloadInvoiceAsPDF(order, products, customerName, customerEmail);
  };

  const handleViewInvoice = () => {
    viewInvoice(order, products, customerName, customerEmail);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#00D9A3";
      case "pending":
        return "#FFB74D";
      case "cancelled":
        return "#FF5252";
      default:
        return "#636E72";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "24px",
          padding: "2.5rem",
          maxWidth: "700px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(255, 107, 157, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: "2rem", borderBottom: "2px solid #F8F9FA", paddingBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
            <div>
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #FF6B9D 0%, #9D50BB 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: "0.5rem",
                }}
              >
                Order Details
              </h2>
              <p style={{ color: "#636E72", fontSize: "0.9rem" }}>
                Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div
              style={{
                padding: "8px 20px",
                borderRadius: "20px",
                background: getStatusColor(order.status),
                color: "white",
                fontWeight: 600,
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {order.status}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
              marginTop: "1.5rem",
            }}
          >
            <div>
              <p style={{ fontSize: "0.8rem", color: "#95A5A6", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                Order Date
              </p>
              <p style={{ fontWeight: 600, color: "#2D3436" }}>{orderDate}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.8rem", color: "#95A5A6", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                Payment Method
              </p>
              <p style={{ fontWeight: 600, color: "#2D3436" }}>{order.paymentMethod}</p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#2D3436" }}>
            Items Ordered ({order.items.length})
          </h3>
          <div style={{ background: "#F8F9FA", borderRadius: "16px", padding: "1rem" }}>
            {order.items.map((item, index) => {
              const product = products.find((p) => p.id === item.productId);
              if (!product) return null;

              const itemTotal = product.price * item.quantity;

              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem",
                    background: "white",
                    borderRadius: "12px",
                    marginBottom: index < order.items.length - 1 ? "0.75rem" : 0,
                    boxShadow: "0 2px 8px rgba(255, 107, 157, 0.08)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: "#2D3436", marginBottom: "0.25rem" }}>
                      {product.name}
                    </p>
                    <p style={{ fontSize: "0.85rem", color: "#636E72" }}>
                      Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                    </p>
                    <p style={{ fontSize: "0.85rem", color: "#95A5A6", marginTop: "0.25rem" }}>
                      {formatPrice(product.price)} each
                    </p>
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      background: "linear-gradient(135deg, #00D9A3 0%, #00B87C 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      marginLeft: "1rem",
                    }}
                  >
                    {formatPrice(itemTotal)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping Address */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.75rem", color: "#2D3436" }}>
            🏠 Shipping Address
          </h3>
          <div
            style={{
              background: "linear-gradient(135deg, #FFF5F7 0%, #F8F9FA 100%)",
              padding: "1.25rem",
              borderRadius: "12px",
              border: "2px solid #FF6B9D20",
            }}
          >
            <p style={{ color: "#636E72", lineHeight: "1.6", whiteSpace: "pre-line" }}>
              {order.shippingAddress}
            </p>
          </div>
        </div>

        {/* Order Total */}
        <div
          style={{
            background: "linear-gradient(135deg, #FFF5F7 0%, #FFFFFF 100%)",
            padding: "1.5rem",
            borderRadius: "16px",
            marginBottom: "2rem",
            border: "2px solid #FF6B9D20",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
              fontSize: "0.95rem",
              color: "#636E72",
            }}
          >
            <span>Subtotal:</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "1rem",
              fontSize: "0.95rem",
              color: "#636E72",
            }}
          >
            <span>Shipping:</span>
            <span style={{ color: "#00D9A3", fontWeight: 600 }}>FREE</span>
          </div>
          <div
            style={{
              borderTop: "2px solid #FF6B9D",
              paddingTop: "1rem",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "1.5rem",
              fontWeight: 700,
            }}
          >
            <span style={{ color: "#2D3436" }}>Total:</span>
            <span
              style={{
                background: "linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={handleViewInvoice}
            style={{
              flex: 1,
              minWidth: "150px",
              padding: "14px 24px",
              borderRadius: "12px",
              border: "2px solid #4A90E2",
              background: "white",
              color: "#4A90E2",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4A90E2";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.color = "#4A90E2";
            }}
          >
            👁️ View Invoice
          </button>

          <button
            onClick={handleDownloadPDF}
            style={{
              flex: 1,
              minWidth: "150px",
              padding: "14px 24px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)",
              color: "white",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 15px rgba(255, 107, 157, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(255, 107, 157, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(255, 107, 157, 0.3)";
            }}
          >
            📥 Download PDF
          </button>

          <button
            onClick={onClose}
            style={{
              flex: 1,
              minWidth: "150px",
              padding: "14px 24px",
              borderRadius: "12px",
              border: "2px solid #E8EAED",
              background: "white",
              color: "#636E72",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F8F9FA";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
            }}
          >
            Close
          </button>
        </div>

        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.8rem",
            color: "#95A5A6",
            textAlign: "center",
          }}
        >
          💖 Thank you for shopping with us!
        </p>
      </div>
    </div>
  );
}
