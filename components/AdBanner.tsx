"use client";

import { useEffect } from "react";

export default function AdBanner() {
  const adClient = process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT;
  const adSlot = process.env.NEXT_PUBLIC_GOOGLE_AD_SLOT;

  useEffect(() => {
    if (!adClient || !adSlot) return;

    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e: any) {
      if (e.message?.includes("already have ads")) return;
      console.error("AdSense error:", e);
    }
  }, [adClient, adSlot]);

  if (!adClient || !adSlot) return null;

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
