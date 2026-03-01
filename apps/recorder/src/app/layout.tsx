export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: 'light only' } as React.CSSProperties}>
      <head>
        <meta name="color-scheme" content="light only" />
        <style>{'html, body { color-scheme: light only !important; }'}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
