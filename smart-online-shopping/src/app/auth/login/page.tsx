// src/app/auth/login/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/app/styles/module/Auth.module.css";
import { authenticateUser } from "@/app/utils/auth";
import { setCurrentUser } from "@/app/utils/storage/localStorage";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = authenticateUser(formData.email, formData.password);

      if (user) {
        setCurrentUser(user);

        // Redirect based on role
        if (user.role === "admin") {
          router.push("/dashboard/admin");
        } else {
          router.push("/dashboard/user");
        }
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <Link href="/" className={styles.backLink}>
          ← Back to Home
        </Link>

        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Welcome Back</h1>
          <p className={styles.authSubtitle}>Sign in to continue shopping</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className={styles.formInput}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              placeholder="Enter your email"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.formLabel}>
              Password
            </label>
            <input
              type="password"
              id="password"
              className={styles.formInput}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className={styles.authFooter}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className={styles.authLink}>
            Register here
          </Link>
        </div>

        <div
          className={styles.authFooter}
          style={{ marginTop: "1rem", fontSize: "0.85rem" }}
        >
          <strong>Demo Credentials:</strong>
          <br />
          User: user@demo.com / password
          <br />
          Admin: admin@demo.com / password
        </div>
      </div>
    </div>
  );
}
