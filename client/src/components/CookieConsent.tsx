import { useState, useEffect, useCallback } from "react";

const CONSENT_KEY = "cookie_consent";
const CONSENT_VERSION = "1";

type ConsentState = "undecided" | "accepted" | "rejected";

function getStoredConsent(): ConsentState {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.version === CONSENT_VERSION) return parsed.state;
    }
  } catch {}
  return "undecided";
}

function setStoredConsent(state: ConsentState) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ state, version: CONSENT_VERSION, timestamp: Date.now() }));
}

/** Enable or disable Google AdSense based on consent */
function applyAdConsent(accepted: boolean) {
  // Google's consent mode v2
  const w = window as any;
  w.gtag =
    w.gtag ||
    function () {
      (w.dataLayer = w.dataLayer || []).push(arguments);
    };

  if (accepted) {
    w.gtag("consent", "update", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
    });
  } else {
    w.gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
  }
}

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>("undecided");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    setConsent(stored);
    if (stored === "undecided") {
      // Show banner after a short delay so it doesn't block first paint
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
    // Apply stored consent
    applyAdConsent(stored === "accepted");
  }, []);

  const handleAccept = useCallback(() => {
    setConsent("accepted");
    setStoredConsent("accepted");
    applyAdConsent(true);
    setVisible(false);
  }, []);

  const handleReject = useCallback(() => {
    setConsent("rejected");
    setStoredConsent("rejected");
    applyAdConsent(false);
    setVisible(false);
  }, []);

  if (!visible || consent !== "undecided") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 space-y-1">
            <p className="font-black uppercase text-sm tracking-wider">Cookie Consent</p>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">
              We use cookies to show you relevant ads and improve your experience.
              By accepting, you consent to the use of cookies for advertising purposes
              in accordance with GDPR. You can change your preference at any time.
            </p>
            <a
              href="/privacy"
              className="text-xs font-bold text-primary hover:underline underline-offset-2"
            >
              Read our Privacy Policy
            </a>
          </div>
          <div className="flex gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleReject}
              className="flex-1 sm:flex-none px-6 py-3 border-4 border-black font-black uppercase text-sm tracking-wider hover:bg-slate-100 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Reject
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-none px-6 py-3 border-4 border-black bg-primary text-white font-black uppercase text-sm tracking-wider hover:bg-primary/90 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
