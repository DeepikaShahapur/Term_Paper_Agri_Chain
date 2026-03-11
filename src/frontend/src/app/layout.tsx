import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/WagmiProvider";

export const metadata: Metadata = {
  title: "AgriChain — Agricultural Supply Chain",
  description: "Blockchain-powered agricultural supply chain: traceability, escrow payments, and reputation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
