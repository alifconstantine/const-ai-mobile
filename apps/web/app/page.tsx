"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ConstLogoIcon } from "@/components/ConstLogo";

interface StatItem {
  glyph: string;
  target: number;
  suffix: string;
  decimals: number;
  label: string;
  delay: string;
}

const statsData: StatItem[] = [
  {
    glyph: "<",
    target: 120,
    suffix: "ms",
    decimals: 0,
    label: "Inference Time",
    delay: "0.5s",
  },
  {
    glyph: "%",
    target: 99.99,
    suffix: "%",
    decimals: 2,
    label: "Platform Uptime",
    delay: "0.58s",
  },
  {
    glyph: "*",
    target: 24,
    suffix: "/7",
    decimals: 0,
    label: "Autonomous Runtime",
    delay: "0.66s",
  },
  {
    glyph: "#",
    target: 2.4,
    suffix: "M",
    decimals: 1,
    label: "Context Windows",
    delay: "0.74s",
  },
];

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function StatCounter({ stat, index }: { stat: StatItem; index: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const duration = 1500 + index * 80;
    const startDelay = 480 + index * 90;
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const timeoutId = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = easeOutCubic(progress) * stat.target;
        setValue(current);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setValue(stat.target);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [stat.target, index]);

  return (
    <div
      className="anim flex flex-col items-center justify-center text-center px-3"
      style={{ "--d": stat.delay } as React.CSSProperties}
    >
      <div
        className="text-white select-none mb-1 leading-none"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(22px, 3vw, 33px)",
        }}
      >
        {stat.glyph}
      </div>
      <div
        className="text-white font-semibold tabular-nums tracking-tight"
        style={{
          fontSize: "clamp(18px, 2.2vw, 26px)",
          letterSpacing: "-0.025em",
        }}
      >
        {value.toFixed(stat.decimals)}
        {stat.suffix}
      </div>
      <div
        className="text-[#8e8e8e] font-normal mt-0.5"
        style={{
          fontSize: "clamp(11px, 1.2vw, 12.5px)",
        }}
      >
        {stat.label}
      </div>
    </div>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "product" | "features" | "mobile">("home");

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full h-[100vh] h-[100dvh] overflow-hidden bg-black select-none">
      {/* Background Video */}
      <div className="bg">
        <video className="bg-video" autoPlay muted loop playsInline>
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* 1-Viewport 3-Region Page Layout */}
      <main className="relative z-10 w-full h-full flex flex-col justify-between items-center px-[clamp(14px,3vw,32px)] py-[clamp(16px,2.4vh,28px)] max-w-7xl mx-auto">
        {/* ===================== 1) HEADER ===================== */}
        <header className="header-anim w-full flex items-center justify-between md:justify-center gap-[clamp(18px,2.8vw,28px)] max-w-[720px] shrink-0">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center justify-center bg-white rounded-full transition-transform hover:scale-[1.04] shrink-0"
            style={{
              width: "clamp(40px, 4.4vw, 46px)",
              height: "clamp(40px, 4.4vw, 46px)",
              boxShadow: "var(--nav-shadow)",
            }}
            aria-label="Const AI Home"
          >
            {/* Custom SVG Logo inside scaled to 72% */}
            <div className="w-[72%] h-[72%] flex items-center justify-center text-black">
              <ConstLogoIcon size="md" color="#000000" className="w-full h-full" />
            </div>
          </Link>

          {/* Desktop Nav Pill (White) */}
          <nav
            className="hidden md:flex items-center justify-around bg-white rounded-full px-2 flex-1 max-w-[430px]"
            style={{
              height: "clamp(44px, 5.2vw, 48px)",
              boxShadow: "var(--nav-shadow)",
            }}
          >
            <button
              onClick={() => setActiveTab("home")}
              className={`text-[#2e2e2e] font-medium tracking-tight px-3.5 py-1.5 transition-opacity ${
                activeTab === "home"
                  ? "nav-link-active opacity-100"
                  : "opacity-50 hover:opacity-75"
              }`}
              style={{ fontSize: "clamp(13px, 1.4vw, 15px)" }}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab("product")}
              className={`text-[#2e2e2e] font-medium tracking-tight px-3.5 py-1.5 transition-opacity ${
                activeTab === "product"
                  ? "nav-link-active opacity-100"
                  : "opacity-50 hover:opacity-75"
              }`}
              style={{ fontSize: "clamp(13px, 1.4vw, 15px)" }}
            >
              Product
            </button>
            <button
              onClick={() => setActiveTab("features")}
              className={`text-[#2e2e2e] font-medium tracking-tight px-3.5 py-1.5 transition-opacity ${
                activeTab === "features"
                  ? "nav-link-active opacity-100"
                  : "opacity-50 hover:opacity-75"
              }`}
              style={{ fontSize: "clamp(13px, 1.4vw, 15px)" }}
            >
              Features
            </button>
            <button
              onClick={() => setActiveTab("mobile")}
              className={`text-[#2e2e2e] font-medium tracking-tight px-3.5 py-1.5 transition-opacity ${
                activeTab === "mobile"
                  ? "nav-link-active opacity-100"
                  : "opacity-50 hover:opacity-75"
              }`}
              style={{ fontSize: "clamp(13px, 1.4vw, 15px)" }}
            >
              Mobile App
            </button>
          </nav>

          {/* Desktop Sign in Pill */}
          <Link
            href="/sign-in"
            className="hidden md:inline-flex items-center justify-center bg-[#28282a] text-[#c8c8c8] hover:bg-[#323234] hover:text-white rounded-full px-6 transition-all hover:-translate-y-0.5 shrink-0 font-medium"
            style={{
              height: "clamp(44px, 5.2vw, 48px)",
              fontSize: "clamp(13px, 1.4vw, 15px)",
              boxShadow: "var(--nav-shadow)",
            }}
          >
            Sign in
          </Link>

          {/* Mobile Burger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col items-center justify-center w-12 h-12 rounded-full bg-[#28282a] text-white transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <div className="relative w-[18px] h-[12px] flex flex-col justify-between items-center">
              <span
                className={`w-[18px] h-[1.5px] bg-white transition-transform duration-200 ${
                  mobileMenuOpen ? "rotate-45 translate-y-[5px]" : ""
                }`}
              />
              <span
                className={`w-[18px] h-[1.5px] bg-white transition-opacity duration-200 ${
                  mobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`w-[18px] h-[1.5px] bg-white transition-transform duration-200 ${
                  mobileMenuOpen ? "-rotate-45 -translate-y-[5.5px]" : ""
                }`}
              />
            </div>
          </button>
        </header>

        {/* Mobile Overlay & Sheet Menu */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 flex flex-col items-center pt-24 px-4 bg-black/65 backdrop-blur-md transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-full max-w-sm bg-white text-[#2e2e2e] rounded-[28px] p-6 shadow-2xl flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="flex flex-col gap-2 text-center text-base font-medium">
                <button
                  onClick={() => {
                    setActiveTab("home");
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 hover:bg-zinc-100 rounded-xl"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    setActiveTab("product");
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 hover:bg-zinc-100 rounded-xl"
                >
                  Product
                </button>
                <button
                  onClick={() => {
                    setActiveTab("features");
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 hover:bg-zinc-100 rounded-xl"
                >
                  Features
                </button>
                <button
                  onClick={() => {
                    setActiveTab("mobile");
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 hover:bg-zinc-100 rounded-xl"
                >
                  Mobile App
                </button>
              </nav>
              <div className="pt-2 border-t border-zinc-200">
                <Link
                  href="/sign-in"
                  className="w-full flex items-center justify-center bg-[#28282a] text-white py-3 rounded-full font-medium"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ===================== 2) HERO (CENTER) ===================== */}
        <section className="flex-1 flex flex-col items-center justify-center text-center max-w-[900px] w-full my-auto py-4">
          {/* Trust Row ("Trusted by 2000+ Enterprises") */}
          <div
            className="anim inline-flex items-center mb-[clamp(16px,2.5vh,26px)]"
            style={
              {
                "--d": "0.05s",
                "--trust-size": "clamp(36px, 4.5vw, 42px)",
              } as React.CSSProperties
            }
          >
            {/* Avatar 1: Microsoft */}
            <div
              className="relative flex items-center justify-center bg-[#28282a] border border-white/40 rounded-full p-[5px] transition-transform hover:-translate-y-0.5 z-10"
              style={{
                width: "var(--trust-size)",
                height: "var(--trust-size)",
              }}
            >
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-[#111]">
                <i
                  className="fa-brands fa-microsoft"
                  style={{ fontSize: "calc(var(--trust-size) * 0.34)" }}
                />
              </div>
            </div>

            {/* Avatar 2: Amazon */}
            <div
              className="relative flex items-center justify-center bg-[#28282a] border border-white/40 rounded-full p-[5px] transition-transform hover:-translate-y-1 z-20"
              style={{
                width: "var(--trust-size)",
                height: "var(--trust-size)",
                marginLeft: "calc(var(--trust-size) * -0.42)",
              }}
            >
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-[#111]">
                <i
                  className="fa-brands fa-amazon"
                  style={{ fontSize: "calc(var(--trust-size) * 0.34)" }}
                />
              </div>
            </div>

            {/* Avatar 3: Google */}
            <div
              className="relative flex items-center justify-center bg-[#28282a] border border-white/40 rounded-full p-[5px] transition-transform hover:-translate-y-0.5 z-30"
              style={{
                width: "var(--trust-size)",
                height: "var(--trust-size)",
                marginLeft: "calc(var(--trust-size) * -0.42)",
              }}
            >
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-[#111]">
                <i
                  className="fa-brands fa-google"
                  style={{ fontSize: "calc(var(--trust-size) * 0.34)" }}
                />
              </div>
            </div>

            {/* Trust Pill */}
            <div
              className="relative flex items-center bg-[#28282a] border border-white/40 rounded-full pr-4 text-[#c4c2c3] font-medium"
              style={{
                height: "var(--trust-size)",
                marginLeft: "calc(var(--trust-size) * -0.42)",
                paddingLeft: "calc(var(--trust-size) * 0.58)",
                fontSize: "clamp(12px, 1.4vw, 13.5px)",
              }}
            >
              Trusted by 2000+ Enterprises
            </div>
          </div>

          {/* Headline (Exact 2 Lines, Retro Dot-Matrix Display Font) */}
          <h1
            className="text-white font-normal overflow-hidden select-none"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 6.2vw, 80px)",
              lineHeight: 1.12,
              letterSpacing: "clamp(-0.08em, -0.04em, -0.04em)",
              whiteSpace: "nowrap",
            }}
          >
            <span className="headline-line-1 block">Intelligence</span>
            <span className="headline-line-2 block">Designed To Evolve</span>
          </h1>

          {/* Subhead */}
          <p
            className="anim text-[#d0d0d0] opacity-80 font-normal mt-4 mb-7 max-w-[min(500px,92%)] leading-relaxed"
            style={{
              "--d": "0.28s",
              fontSize:
                "clamp(calc(13.5px + 2pt), calc(1.55vw + 2pt), calc(16.5px + 2pt))",
            } as React.CSSProperties}
          >
            Build applications that reason, adapt and collaborate using a modular
            AI platform designed for production.
          </p>

          {/* CTA Button */}
          <div
            className="anim-pulse"
            style={{ "--d": "0.4s" } as React.CSSProperties}
          >
            <Link
              href="/sign-up"
              className="cta-glow inline-flex items-center justify-center bg-white text-black font-semibold rounded-full px-[clamp(22px,3vw,28px)] py-[clamp(11px,1.6vh,13px)] tracking-tight cursor-pointer"
              style={{
                fontSize: "clamp(13.5px, 1.5vw, 14.5px)",
              }}
            >
              Get Started
            </Link>
          </div>
        </section>

        {/* ===================== 3) STATS FOOTER ===================== */}
        <footer className="w-full max-w-[920px] shrink-0 border-t border-white/10 pt-4 md:pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 justify-items-center">
            {statsData.map((stat, idx) => (
              <StatCounter key={stat.label} stat={stat} index={idx} />
            ))}
          </div>
        </footer>
      </main>
    </div>
  );
}
