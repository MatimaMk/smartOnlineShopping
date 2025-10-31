"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AIChatPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to shopping assistant
    router.push("/shopping-assistant");
  }, [router]);

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "linear-gradient(135deg, #FFF5F7 0%, #FFE5EE 100%)"
    }}>
      <p style={{ fontSize: "1.2rem", color: "#666" }}>Redirecting to Shopping Assistant...</p>
    </div>
  );
}