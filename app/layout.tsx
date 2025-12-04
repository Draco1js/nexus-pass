import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ConvexClientProvider } from "~/components/shared/ConvexClientProvider";
import { AuthGuard } from "~/components/shared/AuthGuard";
import { Toaster } from "sonner";

const Averta = localFont({
  src: [
    {
      path: '../public/averta-alt/ExtraLight.ttf',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../public/averta-alt/ExtraLightItalic.ttf',
      weight: '200',
      style: 'italic',
    },
    {
      path: '../public/averta-alt/Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/averta-alt/LightItalic.ttf',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../public/averta-alt/Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/averta-alt/Italic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../public/averta-alt/SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/averta-alt/SemiBoldItalic.ttf',
      weight: '600',
      style: 'italic',
    },
    {
      path: '../public/averta-alt/Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/averta-alt/BoldItalic.ttf',
      weight: '700',
      style: 'italic',
    },
    {
      path: '../public/averta-alt/ExtraBold.ttf',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../public/averta-alt/ExtraBoldItalic.ttf',
      weight: '800',
      style: 'italic',
    },
    {
      path: '../public/averta-alt/Black.ttf',
      weight: '900',
      style: 'normal',
    },
    {
      path: '../public/averta-alt/BlackItalic.ttf',
      weight: '900',
      style: 'italic',
    },
  ],
  variable: '--font-averta',
  preload: true,
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Nexus Pass - Your Ticket to Live Events",
  description: "Discover and purchase tickets for concerts, sports, and live events",
  icons: {
    icon: "/ticket.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${Averta.className} antialiased`}
      >
        <ConvexClientProvider>
          <AuthGuard>
          {children}
          </AuthGuard>
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
