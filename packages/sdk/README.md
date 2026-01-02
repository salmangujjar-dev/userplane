# @workspace/sdk

A TypeScript SDK built with Vite for CDN distribution.

## Features

- TypeScript support with full type definitions
- Multiple bundle formats (UMD + ESM)
- CDN-ready builds
- Tree-shakeable
- Source maps included

## Development

```bash
# Install dependencies
bun install

# Build the package
bun run build

# Watch mode for development
bun run dev

# Type checking
bun run typecheck
```

## Usage

### Via CDN (UMD)

```html
<script src="https://cdn.example.com/sdk.umd.cjs"></script>
<script>
  const sdk = new UserplaneSDK({
    apiKey: 'your-api-key',
    endpoint: 'https://api.example.com',
  });

  sdk.initialize();
</script>
```

### Via CDN (ESM)

```html
<script type="module">
  import { createSDK } from 'https://cdn.example.com/sdk.js';

  const sdk = createSDK({
    apiKey: 'your-api-key',
    endpoint: 'https://api.example.com',
  });

  await sdk.initialize();
</script>
```

### Via NPM

```bash
npm install @workspace/sdk
```

```typescript
import { UserplaneSDK } from '@workspace/sdk';

const sdk = new UserplaneSDK({
  apiKey: 'your-api-key',
  endpoint: 'https://api.example.com',
});

await sdk.initialize();
```

## Build Output

The build process generates:

- `dist/sdk.js` - ESM bundle
- `dist/sdk.umd.cjs` - UMD bundle (CommonJS)
- `dist/index.d.ts` - TypeScript definitions
- Source maps for all bundles

## CDN Deployment

After building, upload the `dist/` directory to your CDN provider:

- **unpkg**: Automatically available at `https://unpkg.com/@workspace/sdk@version/dist/`
- **jsDelivr**: Available at `https://cdn.jsdelivr.net/npm/@workspace/sdk@version/dist/`
- **Custom CDN**: Upload dist files to your CDN

## API

### `UserplaneSDK`

The main SDK class.

```typescript
const sdk = new UserplaneSDK(config?: SDKConfig);
```

### `createSDK`

Factory function to create SDK instances.

```typescript
const sdk = createSDK(config?: SDKConfig);
```

### Configuration

```typescript
interface SDKConfig {
  apiKey?: string;
  endpoint?: string;
}
```

## License

Private
