"use client";

import { useEffect } from "react";

const applicationCachePrefix = "bacangaji-";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    async function cleanupDevelopmentServiceWorker() {
      const registrations = await navigator.serviceWorker.getRegistrations();

      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ("caches" in window) {
        const cacheNames = await window.caches.keys();

        await Promise.all(
          cacheNames
            .filter((name) => name.startsWith(applicationCachePrefix))
            .map((name) => window.caches.delete(name))
        );
      }
    }

    const shouldRegister =
      process.env.NODE_ENV === "production" && window.location.protocol === "https:";

    if (!shouldRegister) {
      void cleanupDevelopmentServiceWorker().catch(() => undefined);
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return null;
}
