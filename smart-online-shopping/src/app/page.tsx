// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/app/styles/module/Landing.module.css";
import { getCurrentUser } from "@/app/utils/storage/localStorage";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setIsLoggedIn(!!user);
  }, []);

  return (
      <div className={styles.landing}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>✨ Your Style, Elevated ✨</h1>
            <p className={styles.heroSubtitle}>
              Discover South Africa's premier online fashion destination. Shop the latest trends with AI-powered recommendations, virtual try-on, and secure payment options.
            </p>
            <div className={styles.heroButtons}>
              {isLoggedIn ? (
                <Link
                  href="/dashboard/user"
                  className={`${styles.heroButton} ${styles.primaryButton}`}
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/register"
                    className={`${styles.heroButton} ${styles.primaryButton}`}
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/auth/login"
                    className={`${styles.heroButton} ${styles.secondaryButton}`}
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <div className={styles.featuresContainer}>
            <h2 className={styles.sectionTitle}>Why Choose Our Platform?</h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🤖</div>
                <h3 className={styles.featureTitle}>AI Recommendations</h3>
                <p className={styles.featureDescription}>
                  Get personalized product suggestions based on your style
                  preferences and browsing history using advanced machine
                  learning algorithms.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>👗</div>
                <h3 className={styles.featureTitle}>Virtual Try-On</h3>
                <p className={styles.featureDescription}>
                  See how clothes look on you before buying with our AR-powered
                  virtual try-on feature. Reduce returns and shop with
                  confidence.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>💬</div>
                <h3 className={styles.featureTitle}>24/7 AI Support</h3>
                <p className={styles.featureDescription}>
                  Get instant answers to your questions with our intelligent
                  chatbot. Available around the clock to assist with orders and
                  inquiries.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📊</div>
                <h3 className={styles.featureTitle}>Smart Analytics</h3>
                <p className={styles.featureDescription}>
                  Retailers get real-time insights on inventory, sales trends,
                  and customer preferences to make data-driven decisions.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🔒</div>
                <h3 className={styles.featureTitle}>Secure Payments</h3>
                <p className={styles.featureDescription}>
                  Multiple payment options with enterprise-grade security. Shop
                  safely with encrypted transactions and secure checkout.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>⚡</div>
                <h3 className={styles.featureTitle}>Lightning Fast</h3>
                <p className={styles.featureDescription}>
                  Optimized performance with page loads under 3 seconds. Smooth
                  browsing experience across all devices.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={styles.stats}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>10K+</div>
              <div className={styles.statLabel}>Happy Customers</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>5K+</div>
              <div className={styles.statLabel}>Fashion Products</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>95%</div>
              <div className={styles.statLabel}>Satisfaction Rate</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>24/7</div>
              <div className={styles.statLabel}>Customer Support</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.cta}>
          <h2 className={styles.ctaTitle}>
            Ready to Transform Your Shopping Experience?
          </h2>
          <p className={styles.ctaText}>
            Join thousands of satisfied customers who are already enjoying
            personalized fashion recommendations and virtual try-on technology.
          </p>
          <div className={styles.heroButtons}>
            {!isLoggedIn && (
              <Link
                href="/auth/register"
                className={`${styles.heroButton} ${styles.primaryButton}`}
              >
                Create Free Account
              </Link>
            )}
          </div>
        </section>
      </div>
  );
}
