import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Not found',
};

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <p className="mb-6">
        <Link href="/" className="text-sm underline">
          ← Back to home
        </Link>
      </p>
      <h1 className="mb-2 text-3xl font-bold">Not found</h1>
      <p className="text-sm text-gray-500">
        Drupal answered nothing for this path.
      </p>
    </main>
  );
}
