import React, { useState } from "react";
import EncryptPanel from "./components/EncryptPanel";
import DecryptPanel from "./components/DecryptPanel";
import ImageCryptoPanel from "./components/ImageCryptoPanel";

export default function App() {
  const [activeTab, setActiveTab] = useState("encrypt"); // 'encrypt' | 'decrypt' | 'image'
  const panelLayoutClass =
    activeTab === "image" ? "panels-single" : "panels-wide";

  return (
    <div className="app">
      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand">
            <span className="brand-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <span className="brand-name">The Ethereal Secure</span>
          </div>
          <nav className="nav-tabs">
            <button
              type="button"
              className={`nav-tab ${activeTab === "encrypt" ? "active" : ""}`}
              onClick={() => setActiveTab("encrypt")}
            >
              Encrypt
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === "decrypt" ? "active" : ""}`}
              onClick={() => setActiveTab("decrypt")}
            >
              Decrypt
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === "image" ? "active" : ""}`}
              onClick={() => setActiveTab("image")}
            >
              Image
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">Luminous Integrity Protocol</h1>
          <p className="hero-sub">
            Secure your text and images with weightless encryption. Choose your
            mode, input your data, and generate protected output instantly.
          </p>
        </div>
      </section>

      {/* ── Panels ── */}
      <main className="main-content">
        <div className={`panels-grid ${panelLayoutClass}`}>
          {activeTab === "encrypt" && <EncryptPanel />}
          {activeTab === "decrypt" && <DecryptPanel />}
          {activeTab === "image" && <ImageCryptoPanel />}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <p className="footer-name">The Ethereal Secure</p>
            <p className="footer-copy">
              © 2024 The Ethereal Secure. Luminous Integrity Protocol.
            </p>
          </div>
          <nav className="footer-nav">
            <a href="#" className="footer-link">
              Privacy Policy
            </a>
            <a href="#" className="footer-link">
              Terms of Service
            </a>
            <a href="#" className="footer-link">
              Security Audit
            </a>
            <a href="#" className="footer-link">
              API Documentation
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
