import CanvasComponentTree from '@drupal-canvas/headless-next/CanvasComponentTree';
import {
  fetchPage,
  isPageRedirect,
  toNextMetadata,
} from '@drupal-canvas/headless-next';
import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { cache } from 'react';

import { trustSystemCertificates } from '@drupal-canvas/headless/node';

// Node.js does not trust system certificates by default; local DDEV HTTPS requires them.
trustSystemCertificates();

export const dynamic = 'force-dynamic';

interface CatchAllPageProps {
  params: Promise<{ slug?: string[] }>;
}

const getPage = cache((path: string) => fetchPage(path));

async function getPath(params: CatchAllPageProps['params']) {
  const { slug } = await params;
  return `/${(slug ?? []).map(encodeURIComponent).join('/')}`;
}

export async function generateMetadata({
  params,
}: CatchAllPageProps): Promise<Metadata> {
  const page = await getPage(await getPath(params));
  return page && !isPageRedirect(page) ? toNextMetadata(page.head) : {};
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const page = await getPage(await getPath(params));

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
