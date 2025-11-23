'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';

export default function Page() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Counter</h1>
        <p className="text-4xl font-mono">{count}</p>
        <div className="flex gap-2">
          <Button onClick={() => setCount(count - 1)}>-</Button>
          <Button onClick={() => setCount(0)} variant="outline">
            Reset
          </Button>
          <Button onClick={() => setCount(count + 1)}>+</Button>
        </div>
      </div>
    </div>
  );
}
