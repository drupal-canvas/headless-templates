import CanvasComponentTree from '@drupal-canvas/headless-next/CanvasComponentTree';
import {
  fetchPage,
  isPageRedirect,
  toNextMetadata,
} from '@drupal-canvas/headless-next';
import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { cache } from 'react';

export const dynamic = 'force-dynamic';

interface CatchAllPageProps {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ viewMode?: string | string[] }>;
}

const getPage = cache((path: string, viewMode?: string) =>
  fetchPage(path, {
    ...(viewMode ? { viewMode } : {}),
  }),
);

async function getPath(params: CatchAllPageProps['params']) {
  const { slug } = await params;
  return `/${(slug ?? []).map(encodeURIComponent).join('/')}`;
}

export async function generateMetadata({
  params,
  searchParams,
}: CatchAllPageProps): Promise<Metadata> {
  const rawViewMode = (await searchParams).viewMode;
  const viewMode = typeof rawViewMode === 'string' ? rawViewMode : undefined;
  const page = await getPage(await getPath(params), viewMode);
  return page && !isPageRedirect(page) ? toNextMetadata(page.head) : {};
}

export default async function CatchAllPage({
  params,
  searchParams,
}: CatchAllPageProps) {
  const rawViewMode = (await searchParams).viewMode;
  const viewMode = typeof rawViewMode === 'string' ? rawViewMode : undefined;
  const page = await getPage(await getPath(params), viewMode);

  if (!page) {
    notFound();
  }

  if (isPageRedirect(page)) {
    const { statusCode, url } = page.redirect;
    if (statusCode === 301 || statusCode === 308) {
      permanentRedirect(url);
    }
    redirect(url);
  }

  return <CanvasComponentTree tree={page.content} />;
}
