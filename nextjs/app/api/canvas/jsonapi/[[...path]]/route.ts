import { createDraftRouteHandlers } from '@drupal-canvas/headless-next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const { GET, HEAD, POST, PATCH, DELETE, OPTIONS } =
  createDraftRouteHandlers().jsonApiProxy;
