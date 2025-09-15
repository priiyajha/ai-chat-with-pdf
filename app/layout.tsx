
import "./globals.css";
import {ClerkProvider} from "@clerk/nextjs";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <ClerkProvider>
    <html lang="en">
    <body className="overflow-scroll p-2 lg:p-5 min-h-screen h-screen flex flex-col">{children}</body>
    </html>
      </ClerkProvider>
  );
}
