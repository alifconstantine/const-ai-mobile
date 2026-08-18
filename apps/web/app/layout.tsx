import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ConvexClientProvider } from "./ConvexClientProvider";

export const metadata: Metadata = {
  title: "Intelligence Designed To Evolve — Const AI",
  description:
    "Build applications that reason, adapt and collaborate using a modular AI platform designed for production.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Fonts - Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* BubbledotICG-FinePos Retro Dot-Matrix Display Font */}
        <link
          href="https://db.onlinewebfonts.com/c/8cb707a9b8a73f8a7403336b861c3074?family=BubbledotICG-FinePos"
          rel="stylesheet"
        />
        {/* Font Awesome 6.5.2 for Brand Icons */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="antialiased bg-black text-white selection:bg-white selection:text-black min-h-screen">
        <ClerkProvider
          appearance={{
            theme: dark,
            variables: {
              colorPrimary: "#ffffff",
              colorBackground: "#09090b",
              borderRadius: "0.75rem",
            },
            elements: {
              card: "bg-zinc-950/90 border border-zinc-800 shadow-2xl backdrop-blur-2xl rounded-3xl",
              formButtonPrimary:
                "bg-white hover:bg-zinc-200 text-black font-semibold rounded-full py-2.5 shadow-md",
              socialButtonsBlockButton:
                "bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white rounded-full py-2.5",
              headerTitle: "text-white text-xl font-bold tracking-tight",
              headerSubtitle: "text-zinc-400 text-xs",
              formFieldLabel: "text-zinc-300 text-xs font-medium",
              formFieldInput:
                "bg-zinc-900 border-zinc-800 text-white rounded-xl text-xs sm:text-sm focus:ring-1 focus:ring-zinc-400",
              footerActionLink: "text-white hover:underline font-medium",
            },
          }}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
