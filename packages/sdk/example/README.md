# Userplane SDK Examples

This directory contains various examples demonstrating different ways to use the Userplane SDK.

## Available Examples

### 1. Basic Example (`example/`)

A simple HTML/CSS/JS customer dashboard demonstrating:

- Auto-initialization via script tag
- Multiple workspace IDs
- Basic recorder mounting

**Run:** Serve with any static server

```bash
npx serve example/
```

### 2. Initialization Example (`initialization/`)

Demonstrates manual SDK initialization and control:

- Defer auto-mounting with `openImmediately: false`
- Programmatic recorder control
- Custom base URL configuration

### 3. Metadata Example (`metadata/`)

Shows how to attach custom metadata to recordings:

- Register metadata callback
- Dynamic metadata updates
- Live preview of metadata payload

### 4. Tab ID Example (`tabid/`)

Demonstrates tab reference functionality:

- Persistent tab identification
- Tab ref in session storage

### 5. React App (Full Demo)

For a complete React application example with custom metadata, see:

**Location:** `apps/playground/`

**Features:**

- Customer dashboard with data table
- `useUserplaneMetadata` hook
- Live metadata preview
- Interactive state management

**Run:**

```bash
cd ../../apps/playground
bun run dev
```

## Quick Start

All HTML examples can be opened directly in a browser or served with:

```bash
# Python
python -m http.server 5500

# Node
npx serve .

# Bun
bun serve .
```

Then append recording parameters to the URL:

```
?userplane-action=recording&userplane-token=YOUR_TOKEN&userplane-workspace=ws_YOUR_ID
```

## Documentation

For full documentation, see the main SDK README at `../README.md`
