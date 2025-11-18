import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';

export function ButtonDemo() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col gap-4 items-center p-8 border rounded-lg bg-card">
      <h2 className="text-2xl font-semibold">Counter</h2>
      <p className="text-4xl font-mono">{count}</p>
      <div className="flex gap-2">
        <Button onClick={() => setCount(count - 1)}>-</Button>
        <Button onClick={() => setCount(0)} variant="outline">
          Reset
        </Button>
        <Button onClick={() => setCount(count + 1)}>+</Button>
      </div>
    </div>
  );
}
