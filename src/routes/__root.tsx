import { QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Web3Providers } from "../components/providers";
import { LiquidBackground } from "../components/liquid-background";
import { CustomCursor } from "../components/custom-cursor";
import { IntroOverlay } from "../components/intro-overlay";
import { Toaster } from "../components/ui/sonner";

import { reportLovableError } from "../lib/lovable-error-reporting";
import "../styles.css";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This route isn't on Arc Testnet.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Back to ArcPilot
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-transparent px-5 py-2.5 text-sm font-medium hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ArcPilot AI — Natural-language finance on Arc Testnet" },
      {
        name: "description",
        content:
          "Send, simulate, and understand every transaction on Arc Testnet through natural language. AI copilot with risk analysis and gas estimation.",
      },
      { name: "author", content: "ArcPilot AI" },
      { property: "og:title", content: "ArcPilot AI — Natural-language finance on Arc Testnet" },
      {
        property: "og:description",
        content:
          "Send, simulate, and understand every transaction on Arc Testnet through natural language. AI copilot with risk analysis and gas estimation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ArcPilot AI — Natural-language finance on Arc Testnet" },
      { name: "twitter:description", content: "Send, simulate, and understand every transaction on Arc Testnet through natural language. AI copilot with risk analysis and gas estimation." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f02b8dcd-9857-4f0a-8859-20c49aa07168/id-preview-8b58b0ca--81686c3e-4232-4d16-8ef9-3e8f7258ef07.lovable.app-1784645717879.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f02b8dcd-9857-4f0a-8859-20c49aa07168/id-preview-8b58b0ca--81686c3e-4232-4d16-8ef9-3e8f7258ef07.lovable.app-1784645717879.png" },
    ],
    links: [
      { rel: "icon", href: "/favicon.jpg", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <Web3Providers>
      <LiquidBackground />
      <CustomCursor />
      <IntroOverlay />
      <Outlet />
      <Toaster richColors position="top-right" theme="dark" />
    </Web3Providers>
  );
}

