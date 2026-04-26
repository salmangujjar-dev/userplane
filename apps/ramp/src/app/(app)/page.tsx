import { redirect } from 'next/navigation';

// Query params the Userplane SDK reads from the URL on load.
// These must survive any server-side redirect so the SDK can
// pick them up on the destination page.
const USERPLANE_PARAMS = ['userplane-action', 'userplane-token', 'userplane-workspace'];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const preserved = new URLSearchParams();

  for (const key of USERPLANE_PARAMS) {
    const value = params[key];
    if (typeof value === 'string') {
      preserved.set(key, value);
    }
  }

  const qs = preserved.toString();
  redirect(qs ? `/dashboard?${qs}` : '/dashboard');
}
