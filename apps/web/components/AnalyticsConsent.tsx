'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

type ConsentWindow = Window & {
  cookiehub?: {
    load: (config: Record<string, unknown>) => void;
    hasConsented?: (category: string) => boolean;
  };
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

function updateConsent(analytics: boolean): void {
  const w = window as ConsentWindow;
  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) {
    w.gtag = function gtag(...args: unknown[]) {
      w.dataLayer!.push(args);
    };
  }
  w.gtag('consent', 'update', {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

/**
 * CookieHub decides analytics. Google Analytics is not added until that
 * category is allowed. Consent Mode defaults to denied in the root layout,
 * before any tag can run.
 */
export default function AnalyticsConsent() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<{ analytics?: boolean }>).detail;
      const analytics = Boolean(detail?.analytics);
      updateConsent(analytics);
      setAllowed(analytics);
    };
    window.addEventListener('ksero-consent', onConsent);
    return () => window.removeEventListener('ksero-consent', onConsent);
  }, []);

  return (
    <>
      <Script
        src="https://cdn.cookiehub.eu/c2/0cd5ea0b.js"
        strategy="afterInteractive"
        onLoad={() => {
          const w = window as ConsentWindow;
          if (!w.cookiehub) return;
          w.cookiehub.load({
            onInitialise(this: { hasConsented: (category: string) => boolean }) {
              const analytics = this.hasConsented('analytics');
              window.dispatchEvent(new CustomEvent('ksero-consent', { detail: { analytics } }));
            },
            onStatusChange(this: { hasConsented: (category: string) => boolean }) {
              const analytics = this.hasConsented('analytics');
              window.dispatchEvent(new CustomEvent('ksero-consent', { detail: { analytics } }));
            },
          });
        }}
      />
      {allowed && GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </>
  );
}
