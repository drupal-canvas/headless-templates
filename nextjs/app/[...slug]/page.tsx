import CanvasComponentTree from '@drupal-canvas/headless-next/CanvasComponentTree';
import { fetchPage } from '@drupal-canvas/headless-next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const path = `/${slug.map(encodeURIComponent).join('/')}`;
  const page = await fetchPage(path);

  if (!page) {
    notFound();
  }

  return <CanvasComponentTree tree={page.content} />;
}
