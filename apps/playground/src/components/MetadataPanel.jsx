export function MetadataPanel({ metadata }) {
  return (
    <div className="metadata-panel">
      <div className="metadata-header">
        <h3 className="metadata-title">Userplane Metadata</h3>
        <span className="metadata-badge">Live Preview</span>
      </div>
      <div className="metadata-content">
        <p className="metadata-info">
          This metadata is automatically attached to recordings when submitted. Click on a customer
          row to see the <code>selectedCustomerId</code> update.
        </p>
        <pre className="metadata-preview">{JSON.stringify(metadata, null, 2)}</pre>
      </div>
    </div>
  );
}
