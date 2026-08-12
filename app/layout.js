import "./globals.css";

export const metadata = {
  title: "SkyBlock Coach — what to do next",
  description: "A personalized progression coach for Hypixel SkyBlock.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
