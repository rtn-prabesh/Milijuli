"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Detect if already in standalone (app) mode
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia("(display-mode: standalone)").matches || 
        (navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    // 2. Detect if device is iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIOSDevice);
    };

    checkStandalone();
    checkIOS();

    // 3. Listen for Android/Chrome PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Wait a tiny bit to make sure it doesn't pop immediately on load (annoying)
      setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. If iOS and NOT standalone, show the custom iOS instructions banner after 4s
    const iosTimeout = setTimeout(() => {
      if (
        /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) && 
        !(navigator as any).standalone &&
        !sessionStorage.getItem("milijuli-ios-prompt-dismissed")
      ) {
        setIsVisible(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(iosTimeout);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the browser install prompt
    await deferredPrompt.prompt();

    // Wait for the user's choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);

    // Clear the deferred prompt (it can only be used once)
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (isIOS) {
      sessionStorage.setItem("milijuli-ios-prompt-dismissed", "true");
    }
  };

  // Do not render anything if already installed/in standalone mode, or not visible
  if (isStandalone || !isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-slide-up">
      <div className="glass relative overflow-hidden rounded-2xl p-5 shadow-2xl border border-slate-200/10 dark:border-white/5 bg-slate-900/90 text-white">
        {/* Decorative corner glow */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start gap-4">
          {/* Custom Mini App Icon */}
          <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center border border-emerald-500/30 shadow-inner flex-shrink-0">
            <svg viewBox="0 0 512 512" className="w-9 h-9">
              <defs>
                <linearGradient id="g-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <path d="M 120 320 C 120 220, 220 180, 256 180 C 256 220, 220 320, 160 360 Z" fill="#6366f1" />
              <path d="M 392 320 C 392 220, 292 180, 256 180 C 256 220, 292 320, 352 360 Z" fill="url(#g-grad)" />
              <circle cx="256" cy="220" r="45" fill="#fbbf24" />
            </svg>
          </div>

          <div className="flex-1 space-y-1">
            <h4 className="font-semibold text-base text-slate-100 tracking-tight">Install Milijuli App</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isIOS 
                ? "Install this app on your iPhone for offline savings, loan history, and a seamless native experience."
                : "Add to your home screen for sub-second page loads, real-time sync, and easy mobile access."}
            </p>
          </div>

          {/* Close button */}
          <button 
            onClick={handleDismiss} 
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            aria-label="Dismiss installation prompt"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Action area */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
          {isIOS ? (
            /* iOS Specific Instructions */
            <div className="w-full flex items-center justify-between text-xs text-emerald-400 font-medium">
              <div className="flex items-center gap-1.5 bg-slate-950/60 py-1.5 px-3 rounded-full border border-emerald-500/20">
                <span>Tap</span>
                {/* Safari Share Icon replica */}
                <svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="5" y="9" width="14" height="12" rx="2" />
                  <path d="M12 12V3m0 0l-3 3m3-3l3 3" />
                </svg>
                <span>then "Add to Home Screen"</span>
              </div>
            </div>
          ) : (
            /* Standard Android/Chrome Install button */
            <>
              <button 
                onClick={handleDismiss}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Not Now
              </button>
              <button 
                onClick={handleInstallClick}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold rounded-lg text-xs shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all transform active:scale-95 flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Install Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
