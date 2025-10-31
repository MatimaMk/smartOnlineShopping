"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/app/styles/module/Auth.module.css";
import { registerUser } from "@/app/utils/auth";
import { setCurrentUser } from "@/app/utils/storage/localStorage";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user" as "user" | "admin",
    address: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const user = registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        address: formData.address,
        preferences: [],
      });

      if (user) {
        setSuccess("Account created successfully! Redirecting...");
        setCurrentUser(user);

        setTimeout(() => {
          if (user.role === "admin") {
            router.push("/dashboard/admin");
          } else {
            router.push("/dashboard/user");
          }
        }, 1500);
      } else {
        setError("Email already exists. Please use a different email.");
      }
    } catch (err) {
      setError("An error occurred during registration");
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
          <h1 className={styles.authTitle}>Create Account</h1>
          <p className={styles.authSubtitle}>
            Join us for a better shopping experience
          </p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.formLabel}>
              Full Name
            </label>
            <input
              type="text"
              id="name"
              className={styles.formInput}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Enter your full name"
            />
          </div>

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
            <label htmlFor="role" className={styles.formLabel}>
              Account Type
            </label>
            <select
              id="role"
              className={styles.formSelect}
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as "user" | "admin",
                })
              }
              required
            >
              <option value="user">Customer</option>
              <option value="admin">Retailer/Admin</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="address" className={styles.formLabel}>
              Address (Optional)
            </label>
            <input
              type="text"
              id="address"
              className={styles.formInput}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Enter your address"
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
              placeholder="Create a password (min. 6 characters)"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.formLabel}>
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className={styles.formInput}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className={styles.authFooter}>
          Already have an account?{" "}
          <Link href="/auth/login" className={styles.authLink}>
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
