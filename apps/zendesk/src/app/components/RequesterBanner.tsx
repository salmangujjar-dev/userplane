interface RequesterBannerProps {
  name: string;
  email: string;
}

export function RequesterBanner({ name, email }: RequesterBannerProps) {
  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '8px',
        background: '#f8f9f9',
        borderRadius: '4px',
      }}
    >
      <div style={{ fontSize: '12px', color: '#68737d' }}>Requester</div>
      <div style={{ fontWeight: 500 }}>{name || email}</div>
    </div>
  );
}
