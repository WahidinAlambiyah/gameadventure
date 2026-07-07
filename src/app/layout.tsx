import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/shared/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BacaNgaji Adventure",
    template: "%s | BacaNgaji Adventure"
  },
  description: "A child-friendly Bahasa Indonesia and Hijaiyah learning adventure.",
  applicationName: "BacaNgaji Adventure",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2f7d75"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
