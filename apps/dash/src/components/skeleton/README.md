# Skeleton Components

Composable skeleton loading components for consistent loading states across the dashboard application.

## Design Philosophy

Skeleton components are designed to be **composable** - use actual UI components (like Sidebar, TopActions) alongside skeleton placeholders for loading states. This ensures:

- No duplication of layout logic
- Consistent behavior between loading and loaded states
- More maintainable code

## Available Components

### TopActionsSkeleton

Skeleton for the top actions bar with search and action buttons.

```tsx
import { TopActionsSkeleton } from '@/components/skeleton';

<TopActionsSkeleton />;
```

### PageHeaderSkeleton

Page header skeleton with title, description, and optional filter dropdowns.

```tsx
import { PageHeaderSkeleton } from '@/components/skeleton';

<PageHeaderSkeleton showFilters filterCount={3} />;
```

**Props:**

- `showFilters?`: boolean - Whether to show filter dropdowns (default: false)
- `filterCount?`: number - Number of filter dropdowns to display (default: 3)

### RecordingGridSkeleton

Grid of recording card skeletons for the recordings page.

```tsx
<RecordingGridSkeleton count={16} />
```

**Props:**

- `count?`: number - Number of skeleton cards to display (default: 16)

### RecordingDetailSkeleton

Full page skeleton for recording detail view with video player and side panels.

```tsx
<RecordingDetailSkeleton />
```

### LinksListSkeleton

List of link card skeletons for the links page.

```tsx
<LinksListSkeleton count={10} />
```

**Props:**

- `count?`: number - Number of skeleton rows to display (default: 10)

### TabsSkeleton

Tabs with content sections for settings-like pages.

```tsx
<TabsSkeleton tabCount={6} />
```

**Props:**

- `tabCount?`: number - Number of tab buttons to display (default: 5)

### SidebarProjectsSkeleton

Skeleton for the projects list in the sidebar.

```tsx
import { SidebarProjectsSkeleton } from '@/components/skeleton';

<SidebarProjectsSkeleton count={3} />;
```

**Props:**

- `count?`: number - Number of project items to display (default: 3)

### SettingsSectionSkeleton

Multiple setting sections with cards and form controls.

```tsx
<SettingsSectionSkeleton count={3} />
```

**Props:**

- `count?`: number - Number of sections to display (default: 3)

### TableSkeleton

Table with headers and rows for data tables.

```tsx
<TableSkeleton rows={5} columns={4} />
```

**Props:**

- `rows?`: number - Number of rows to display (default: 5)
- `columns?`: number - Number of columns to display (default: 4)

### CardSkeleton

Generic card skeletons for card-based layouts.

```tsx
<CardSkeleton count={3} />
```

**Props:**

- `count?`: number - Number of cards to display (default: 1)

### PageHeaderSkeleton

Page header skeleton with title, description, and filter dropdowns.

```tsx
<PageHeaderSkeleton />
```

## Usage in Loading Files

Compose skeleton components with actual UI components in Next.js loading.tsx files:

```tsx
// apps/dash/src/app/[workspaceId]/recordings/loading.tsx
import { Sidebar } from '@/components/navigation/sidebar';
import {
  TopActionsSkeleton,
  PageHeaderSkeleton,
  RecordingGridSkeleton,
} from '@/components/skeleton';

export default function RecordingsLoading() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopActionsSkeleton />
        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="space-y-6">
            <PageHeaderSkeleton showFilters filterCount={3} />
            <RecordingGridSkeleton count={16} />
          </div>
        </main>
      </div>
    </div>
  );
}
```

## Best Practices

- Use actual components (Sidebar, TopActions) in loading states - don't create skeleton versions
- Skeleton components should only represent content that's loading, not persistent UI
- Match the structure of actual page layouts
- Use the Skeleton component from @workspace/ui for consistent animations
- Keep skeleton components small and focused on single responsibilities
- Provide sensible defaults for props
