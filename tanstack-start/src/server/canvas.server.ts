/**
 * Server-only Canvas helpers. The `.server.ts` suffix keeps this module —
 * and the SDK's server entry it imports — out of the client bundle; only
 * the server functions in canvas.functions.ts may import it.
 */
import {
  fetchPage,
  getClient,
  getDraftData,
  getDraftEditorOrigin,
  getJsonApiRuntimeConfig,
  isDraftModeEnabled,
  isDraftSessionExpired,
} from '@drupal-canvas/headless-tanstack-start'

import type { PageResult } from '@drupal-canvas/headless-tanstack-start'
import type {
  Article,
  CanvasPage,
  ContentLists,
  DraftSessionState,
} from '#/lib/content'

/** Serializable configuration only: never return the client or session token. */
export function readJsonApiRuntimeConfig() {
  return getJsonApiRuntimeConfig()
}

/**
 * The draft session state the root route's banner needs. Nothing here is a
 * secret: the expiry instant, Drupal's own renew URL (a signed assertion
 * claim), and its origin.
 */
export async function readDraftSessionState(): Promise<DraftSessionState> {
  if (!isDraftModeEnabled()) {
    return {
      enabled: false,
      tokenExpiresAt: null,
      expired: false,
      renewUrl: null,
      editorOrigin: null,
    }
  }
  const draftData = await getDraftData()
  return {
    enabled: true,
    tokenExpiresAt: draftData?.tokenExpiresAt ?? null,
    expired: !draftData || isDraftSessionExpired(draftData),
    renewUrl: draftData?.renewUrl ?? null,
    editorOrigin: getDraftEditorOrigin(draftData),
  }
}

/**
 * Reference code: nothing in the template calls this today. It is kept,
 * with the getContentLists server function, to show how to list Drupal
 * content for a listing page.
 *
 * The Canvas page and article lists, via JSON:API. The client is
 * draft-session-aware and answers working copies while a session is live.
 */
export async function readContentLists(): Promise<ContentLists> {
  const client = await getClient()
  const [canvasPages, articles] = await Promise.all([
    client.getCollection<Array<CanvasPage>>('canvas_page--canvas_page'),
    client.getCollection<Array<Article>>('node--article'),
  ])
  return {
    canvasPages: canvasPages ?? [],
    articles: articles ?? [],
  }
}

/**
 * Resolves a Drupal path through Drupal's routing (the SDK's fetchPage()),
 * carrying the live draft session's bearer token when there is one.
 */
export function readPageForPath(path: string): Promise<PageResult | null> {
  return fetchPage(path)
}
