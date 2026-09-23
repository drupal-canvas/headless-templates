import { getClient } from '@drupal-canvas/headless-nuxt/server';

import type { Article, CanvasPage, ContentLists } from '#shared/content';

/**
 * Reference code: nothing in the template calls this route today. It is
 * kept to show how to list Drupal content for a listing page.
 *
 * The Canvas page and article lists, via JSON:API. Fetched in a server route
 * because the draft session lives in httpOnly request cookies: the client
 * is draft-session-aware and answers working copies while a session is
 * live.
 */
export default defineEventHandler(async (event): Promise<ContentLists> => {
  const client = await getClient(event);
  const [canvasPages, articles] = await Promise.all([
    client.getCollection<CanvasPage[]>('canvas_page--canvas_page'),
    client.getCollection<Article[]>('node--article'),
  ]);

  return {
    canvasPages: canvasPages ?? [],
    articles: articles ?? [],
  };
});
