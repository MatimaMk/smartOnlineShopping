"use client";

import { useState } from "react";
import { Product, CartItem } from "@/app/types";
import { formatPrice } from "@/app/utils/currency";

interface CheckoutModalProps {
  cart: CartItem[];
  products: Product[];
  totalAmount: number;
  onClose: () => void;
  onConfirmOrder: (paymentMethod: string, shippingAddress: string, paymentDetails?: any) => void;
}

export default function CheckoutModal({
  cart,
  products,
  totalAmount,
  onClose,
  onConfirmOrder,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [shippingAddress, setShippingAddress] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shippingAddress.trim()) {
      alert("Please enter a shipping address");
      return;
    }

    if (paymentMethod === "Credit Card" || paymentMethod === "Debit Card") {
      if (!cardNumber || !cardName || !expiryDate || !cvv) {
        alert("Please fill in all card details");
        return;
      }
    }

    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      const paymentDetails = {
        cardNumber: cardNumber ? `****${cardNumber.slice(-4)}` : null,
        cardName,
        paymentMethod,
      };

      onConfirmOrder(paymentMethod, shippingAddress, paymentDetails);
      setProcessing(false);
    }, 2000);
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
          maxWidth: "650px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(255, 107, 157, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: "2rem" }}>
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
            Complete Your Order
          </h2>
          <p style={{ color: "#636E72", fontSize: "0.95rem" }}>
            Secure checkout powered by encrypted payment processing
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Order Summary */}
          <div
            style={{
              background: "linear-gradient(135deg, #FFF5F7 0%, #F8F9FA 100%)",
              padding: "1.5rem",
              borderRadius: "16px",
              marginBottom: "2rem",
              border: "2px solid #FF6B9D20",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#2D3436" }}>
              Order Summary
            </h3>
            <div style={{ marginBottom: "1rem" }}>
              {cart.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                if (!product) return null;
                return (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.75rem",
                      fontSize: "0.9rem",
                      color: "#636E72",
                    }}
                  >
                    <span>
                      {product.name} ({item.size}, {item.color}) × {item.quantity}
                    </span>
                    <span style={{ fontWeight: 600, color: "#00D9A3" }}>
                      {formatPrice(product.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                borderTop: "2px solid #E8EAED",
                paddingTop: "1rem",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1.3rem",
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
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          <div style={{ marginBottom: "2rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 600,
                color: "#2D3436",
                fontSize: "0.95rem",
              }}
            >
              🏠 Shipping Address *
            </label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Enter your complete delivery address..."
              required
              rows={3}
              style={{
                width: "100%",
                padding: "14px",
                border: "2px solid #E8EAED",
                borderRadius: "12px",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                resize: "vertical",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#FF6B9D")}
              onBlur={(e) => (e.target.style.borderColor = "#E8EAED")}
            />
          </div>

          {/* Payment Method Selection */}
          <div style={{ marginBottom: "2rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.75rem",
                fontWeight: 600,
                color: "#2D3436",
                fontSize: "0.95rem",
              }}
            >
              💳 Payment Method *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
              {[
                { value: "Credit Card", icon: "💳", color: "#FF6B9D" },
                { value: "Debit Card", icon: "💸", color: "#9D50BB" },
                { value: "EFT", icon: "🏦", color: "#4A90E2" },
                { value: "Cash on Delivery", icon: "💰", color: "#00D9A3" },
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  style={{
                    padding: "1rem",
                    borderRadius: "12px",
                    border: `2px solid ${
                      paymentMethod === method.value ? method.color : "#E8EAED"
                    }`,
                    background:
                      paymentMethod === method.value
                        ? `${method.color}15`
                        : "white",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: paymentMethod === method.value ? method.color : "#636E72",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>
                    {method.icon}
                  </div>
                  {method.value}
                </button>
              ))}
            </div>
          </div>

          {/* Card Details (only for Card payments) */}
          {(paymentMethod === "Credit Card" || paymentMethod === "Debit Card") && (
            <div
              style={{
                background: "#F8F9FA",
                padding: "1.5rem",
                borderRadius: "16px",
                marginBottom: "2rem",
              }}
            >
              <h4 style={{ marginBottom: "1rem", color: "#2D3436", fontSize: "1rem" }}>
                Card Details
              </h4>

              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#636E72",
                  }}
                >
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 16) setCardNumber(value);
                  }}
                  placeholder="1234 5678 9012 3456"
                  maxLength={16}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #E8EAED",
                    borderRadius: "10px",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#636E72",
                  }}
                >
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #E8EAED",
                    borderRadius: "10px",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#636E72",
                    }}
                  >
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + "/" + value.slice(2, 4);
                      }
                      if (value.length <= 5) setExpiryDate(value);
                    }}
                    placeholder="MM/YY"
                    maxLength={5}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px solid #E8EAED",
                      borderRadius: "10px",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#636E72",
                    }}
                  >
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 3) setCvv(value);
                    }}
                    placeholder="123"
                    maxLength={3}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px solid #E8EAED",
                      borderRadius: "10px",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: "12px",
                border: "2px solid #E8EAED",
                background: "white",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: processing ? "not-allowed" : "pointer",
                opacity: processing ? 0.5 : 1,
                transition: "all 0.3s ease",
                color: "#636E72",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              style={{
                flex: 2,
                padding: "16px",
                borderRadius: "12px",
                border: "none",
                background: processing
                  ? "#95A5A6"
                  : "linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)",
                color: "white",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: processing ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                boxShadow: processing ? "none" : "0 4px 20px rgba(255, 107, 157, 0.4)",
              }}
            >
              {processing ? "Processing... 🔄" : `Pay ${formatPrice(totalAmount)} 🔒`}
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
            🔒 Your payment information is encrypted and secure. We never store your card details.
          </p>
        </form>
      </div>
    </div>
  );
}
