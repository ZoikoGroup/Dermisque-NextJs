import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";
import { Toaster } from "sonner";
import { PageLoader } from "@/components/page-loader";
import { site } from "@/lib/site";
import "./globals.css";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DERMISQUE | Premium Skincare & Hair Care Serums",
    template: "%s | Dermisque",
  },
  description: site.description,
  openGraph: {
    title: "DERMISQUE — Sum of Beauty",
    description: site.description,
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf9f5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${bodoni.variable} ${jost.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Skip the intro splash on repeat visits before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("dq-intro"))document.documentElement.classList.add("dq-seen")}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <PageLoader />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!rounded-2xl !border-line !font-sans !shadow-xl",
            },
          }}
        />
      </body>
    </html>
  );
}
