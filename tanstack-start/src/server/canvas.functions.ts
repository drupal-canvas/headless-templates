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
  readPageForPath,
} from '#/server/canvas.server'

export const getDraftSessionState = createServerFn().handler(() =>
  readDraftSessionState(),
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
