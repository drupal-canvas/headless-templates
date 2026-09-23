/**
 * Server functions: type-safe RPCs safe to import from routes and
 * components (the build replaces the handlers with RPC stubs in client
 * bundles). The session lives in httpOnly request cookies, so everything
 * touching it stays behind these — loaders are isomorphic and must not
 * reach the SDK's server entry themselves; that lives in canvas.server.ts.
 */
import { createServerFn } from '@tanstack/react-start'

import {
  readContentLists,
  readDraftSessionState,
  readJsonApiRuntimeConfig,
  readPageForPath,
} from '#/server/canvas.server'

export const getDraftSessionState = createServerFn().handler(() =>
  readDraftSessionState(),
)

/** Nonsecret configuration only; the client and session token stay on the server. */
export const getJsonApiRuntimeConfig = createServerFn().handler(() =>
  readJsonApiRuntimeConfig(),
)

/**
 * Reference code: nothing in the template calls this today — see
 * readContentLists() in canvas.server.ts.
 */
export const getContentLists = createServerFn().handler(() =>
  readContentLists(),
)

export const getPageForPath = createServerFn()
  .validator((path: string) => path)
  .handler(({ data }) => readPageForPath(data))
