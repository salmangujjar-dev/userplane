export default function BareLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 1px; height: 1px; overflow: hidden; background: transparent; }
          `,
        }}
      />
      {children}
    </>
  );
}
