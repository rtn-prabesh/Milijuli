"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Sheet({ isOpen, onClose, title, children }: SheetProps) {
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);

  // Handle client-side mounting for Portal rendering safely in SSR Next.js
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle slide-in/slide-out delay animation cycles
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"; // Prevent background scroll
      // Trigger animations in next paint frame
      const frame = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(frame);
    } else {
      setAnimate(false);
      // Wait for exit transition to complete before allowing body scroll
      const timer = setTimeout(() => {
        document.body.style.overflow = "";
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || (!isOpen && !animate)) return null;

  const overlayHtml = (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center p-0 md:p-4">
      {/* Dark semi-translucent backdrop */}
      <div
        className={`absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 ease-out cursor-pointer ${
          animate ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Spring Animated Content Container */}
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full max-w-lg glass rounded-t-3xl md:rounded-3xl border-t border-slate-200/5 bg-slate-900/90 shadow-2xl relative z-10 flex flex-col max-h-[85vh] md:max-h-[90vh] transition-all duration-300 ${
          animate
            ? "translate-y-0 opacity-100 md:scale-100"
            : "translate-y-full opacity-0 md:scale-95 md:translate-y-4"
        }`}
        style={{
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)", // Premium spring easing
        }}
      >
        {/* Mobile drag / indicator bar */}
        <div className="flex justify-center py-3 md:hidden">
          <div className="w-12 h-1 bg-slate-800 rounded-full" onClick={onClose} />
        </div>

        {/* Modal Header */}
        <div className="px-6 pb-4 pt-2 md:pt-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100 tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all transform active:scale-90"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto no-scrollbar flex-1 text-sm text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(overlayHtml, document.body);
}
