import { fetchPage } from '@drupal-canvas/headless-nuxt/server';

import { trustSystemCertificates } from '@drupal-canvas/headless/node';

// Node.js does not trust system certificates by default; local DDEV HTTPS requires them.
trustSystemCertificates();

/**
 * Resolves a Drupal path through Drupal's routing (the SDK's fetchPage()),
 * carrying the live draft session's bearer token when there is one. The path
 * arrives as a query parameter so the site root ('/') resolves like any other
 * path. The catch-all page consumes this; a missing page answers 404 with a
 * null body so the page can render its own not-found state.
 */
export default defineEventHandler(async (event) => {
  const path = getQuery(event).path;

  if (typeof path !== 'string' || !path.startsWith('/')) {
    setResponseStatus(event, 400);
    return null;
  }

  const page = await fetchPage(event, path);

  if (!page) {
    setResponseStatus(event, 404);
    return null;
  }
  return page;
});
