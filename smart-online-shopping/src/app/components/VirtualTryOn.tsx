"use client";

import { useState } from "react";
import { Product } from "@/app/types";
import { formatPrice } from "@/app/utils/currency";

interface VirtualTryOnProps {
  products: Product[];
  onClose: () => void;
}

interface TryOnResult {
  userImageUrl: string;
  outfitImageUrl: string;
  resultImageUrl: string;
  processedAt: string;
}

export default function VirtualTryOn({ products, onClose }: VirtualTryOnProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [userImage, setUserImage] = useState<File | null>(null);
  const [userImagePreview, setUserImagePreview] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [error, setError] = useState("");

  const handleUserImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size must be less than 10MB");
        return;
      }
      setUserImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleTryOn = async () => {
    if (!userImage || !selectedProduct) {
      setError("Please select both your photo and an outfit");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("userImage", userImage);

      // For demo purposes, we'll fetch the outfit image from URL
      const outfitResponse = await fetch(selectedProduct.imageURL);
      const outfitBlob = await outfitResponse.blob();
      formData.append("outfitImage", outfitBlob, "outfit.jpg");

      const response = await fetch("http://localhost:3001/api/tryon", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          userImageUrl: `http://localhost:3001${data.data.userImageUrl}`,
          outfitImageUrl: `http://localhost:3001${data.data.outfitImageUrl}`,
          resultImageUrl: `http://localhost:3001${data.data.resultImageUrl}`,
          processedAt: data.data.processedAt,
        });
      } else {
        setError(data.message || "Failed to process try-on");
      }
    } catch (err) {
      setError("Error connecting to try-on service. Make sure the server is running.");
      console.error("Try-on error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTryOn = () => {
    setResult(null);
    setUserImage(null);
    setUserImagePreview("");
    setSelectedProduct(null);
    setError("");
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          maxWidth: "1200px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          padding: "2rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 700 }}>Virtual Try-On</h2>
          <button
            onClick={onClose}
            style={{
              background: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "#fee",
              color: "#c00",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        {!result ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            {/* User Image Upload */}
            <div>
              <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem" }}>1. Upload Your Photo</h3>
              <div
                style={{
                  border: "2px dashed #ccc",
                  borderRadius: "12px",
                  padding: "2rem",
                  textAlign: "center",
                  minHeight: "300px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {userImagePreview ? (
                  <div style={{ position: "relative", width: "100%" }}>
                    <img
                      src={userImagePreview}
                      alt="Preview"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "300px",
                        borderRadius: "8px",
                        objectFit: "contain",
                      }}
                    />
                    <button
                      onClick={() => {
                        setUserImage(null);
                        setUserImagePreview("");
                      }}
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "#e74c3c",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "30px",
                        height: "30px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📸</div>
                    <p style={{ marginBottom: "1rem", color: "#666" }}>
                      Upload a clear photo of yourself
                    </p>
                    <label
                      style={{
                        background: "#667eea",
                        color: "white",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Choose Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUserImageChange}
                        style={{ display: "none" }}
                      />
                    </label>
                    <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#999" }}>
                      Max size: 10MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Product Selection */}
            <div>
              <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem" }}>2. Select an Outfit</h3>
              <div
                style={{
                  maxHeight: "400px",
                  overflow: "auto",
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  padding: "1rem",
                }}
              >
                {products.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#666" }}>No products available</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {products.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        style={{
                          border:
                            selectedProduct?.id === product.id
                              ? "3px solid #667eea"
                              : "1px solid #e0e0e0",
                          borderRadius: "8px",
                          padding: "0.5rem",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <img
                          src={product.imageURL}
                          alt={product.name}
                          style={{
                            width: "100%",
                            height: "150px",
                            objectFit: "cover",
                            borderRadius: "6px",
                            marginBottom: "0.5rem",
                          }}
                        />
                        <p style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                          {product.name}
                        </p>
                        <p style={{ fontSize: "0.85rem", color: "#27ae60", fontWeight: 600 }}>
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Results Display */
          <div>
            <h3 style={{ marginBottom: "1.5rem", fontSize: "1.3rem", textAlign: "center" }}>
              Try-On Result
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
              <div>
                <h4 style={{ marginBottom: "0.5rem", textAlign: "center" }}>Your Photo</h4>
                <img
                  src={result.userImageUrl}
                  alt="Your photo"
                  style={{
                    width: "100%",
                    height: "300px",
                    objectFit: "cover",
                    borderRadius: "12px",
                  }}
                />
              </div>
              <div>
                <h4 style={{ marginBottom: "0.5rem", textAlign: "center" }}>Selected Outfit</h4>
                <img
                  src={result.outfitImageUrl}
                  alt="Outfit"
                  style={{
                    width: "100%",
                    height: "300px",
                    objectFit: "cover",
                    borderRadius: "12px",
                  }}
                />
              </div>
              <div>
                <h4 style={{ marginBottom: "0.5rem", textAlign: "center" }}>Virtual Try-On Result</h4>
                <img
                  src={result.resultImageUrl}
                  alt="Result"
                  style={{
                    width: "100%",
                    height: "300px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    border: "3px solid #27ae60",
                  }}
                />
              </div>
            </div>
            <div
              style={{
                marginTop: "1.5rem",
                padding: "1rem",
                background: "#f0f9ff",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
                Note: This is a demo. In production, AI would blend the outfit onto your photo.
              </p>
              <button
                onClick={resetTryOn}
                style={{
                  background: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "1rem",
                }}
              >
                Try Another Outfit
              </button>
            </div>
          </div>
        )}

        {!result && (
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <button
              onClick={handleTryOn}
              disabled={!userImage || !selectedProduct || isProcessing}
              style={{
                background: !userImage || !selectedProduct || isProcessing ? "#ccc" : "#27ae60",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "14px 32px",
                cursor: !userImage || !selectedProduct || isProcessing ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "1.1rem",
              }}
            >
              {isProcessing ? "Processing... 🔄" : "Try It On! 👕"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
