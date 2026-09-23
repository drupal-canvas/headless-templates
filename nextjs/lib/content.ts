/**
 * Reference code: nothing in the template uses this module today. It is
 * kept to show how to list Drupal content (Canvas pages and articles) via
 * JSON:API and link each item through the catch-all route.
 */
import { getClient } from '@drupal-canvas/headless-next';

export interface Article {
  id: string;
  title: string;
  status: boolean;
  moderation_state?: string;
  drupal_internal__nid: number;
  path?: { alias?: string | null } | null;
}

export interface CanvasPage {
  id: string;
  title: string;
  status: boolean;
  drupal_internal__id: number;
  path?: { alias?: string | null } | null;
}

/**
 * Fetches the article list, via JSON:API.
 */
export async function getArticles(): Promise<Article[]> {
  const client = await getClient();
  return (await client.getCollection<Article[]>('node--article')) ?? [];
}

/**
 * Fetches the Canvas page list, via JSON:API.
 */
export async function getCanvasPages(): Promise<CanvasPage[]> {
  const client = await getClient();
  return (
    (await client.getCollection<CanvasPage[]>('canvas_page--canvas_page')) ?? []
  );
}

/**
 * The app-side path a Canvas page is served at: its alias when it has one,
 * its canonical Drupal path otherwise. Both resolve through the catch-all
 * route, which hands them to fetchPage() — Drupal's own routing does the
 * rest.
 */
export function canvasPagePath(page: CanvasPage): string {
  return page.path?.alias || `/page/${page.drupal_internal__id}`;
}

/**
 * The app-side path an article is served at, resolved the same way as
 * Canvas pages: alias when present, canonical Drupal path otherwise. Both
 * land in the catch-all route and render through fetchPage().
 */
export function articlePath(article: Article): string {
  return article.path?.alias || `/node/${article.drupal_internal__nid}`;
}
