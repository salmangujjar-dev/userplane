export function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      style={{
        marginTop: '8px',
        padding: '8px',
        background: '#fff0f1',
        color: '#cc3340',
        borderRadius: '4px',
        fontSize: '12px',
      }}
    >
      {message}
    </div>
  );
}
