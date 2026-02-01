import localFont from "next/font/local"
import "./globals.css"
import { AppShell } from "@/components/shared/app-shell"
import AppSessionProvider from "@/components/providers/session-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { CartProvider } from "@/lib/cart-context"

const beatrice = localFont({
  src: [
    {
      path: "../lib/assets/beatrice-font-family/BeatriceTRIAL-Light-BF64829e8f87d4e.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../lib/assets/beatrice-font-family/BeatriceTRIAL-LightItalic-BF64829e8fd96c6.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../lib/assets/beatrice-font-family/BeatriceTRIAL-Regular-BF64829e8f591fb.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../lib/assets/beatrice-font-family/BeatriceTRIAL-RegularItalic-BF64829e8a78ca8.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../lib/assets/beatrice-font-family/BeatriceTRIAL-Medium-BF64829e8f63463.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../lib/assets/beatrice-font-family/BeatriceTRIAL-MediumItalic-BF64829e8f58376.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../lib/assets/beatrice-font-family/BeatriceTRIAL-Semibold-BF64829e8f17d4c.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../lib/assets/beatrice-font-family/BeatriceTRIAL-SemiboldItalic-BF64829e8ed91f7.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../lib/assets/beatrice-font-family/BeatriceTRIAL-Bold-BF64829e8fd7dc6.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../lib/assets/beatrice-font-family/BeatriceTRIAL-BoldItalic-BF64829e9014b3a.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-beatrice",
  display: "swap",
})
const beatriceDeck = localFont({
  src: [
    {
      path: "../lib/assets/beatrice-font-family/BeatriceDeckTRIAL-Regular-BF64829e9182459.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../lib/assets/beatrice-font-family/BeatriceDeckTRIAL-Medium-BF64829e9193070.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../lib/assets/beatrice-font-family/BeatriceDeckTRIAL-Bold-BF64829e916f5e9.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-beatrice-deck",
  display: "swap",
})

export const metadata = {
  title: "VYNTARA - Premium Print-on-Demand Apparel",
  description:
    "Discover unique, artist-designed t-shirts where art meets streetwear. Premium quality print-on-demand clothing.",
  keywords: ["t-shirts", "streetwear", "print-on-demand", "artistic apparel", "custom tees"],
  openGraph: {
    title: "VYNTARA - Premium Print-on-Demand Apparel",
    description: "Discover unique, artist-designed t-shirts where art meets streetwear.",
    type: "website",
    locale: "en_US",
    siteName: "VYNTARA",
  },
    generator: 'v0.app'
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${beatrice.variable} ${beatrice.className} ${beatriceDeck.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AppSessionProvider>
            <CartProvider>
              <AppShell>{children}</AppShell>
            </CartProvider>
          </AppSessionProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
