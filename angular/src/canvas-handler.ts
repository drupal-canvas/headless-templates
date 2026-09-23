// Server only: mount the JSON:API proxy through the Angular adapter's
// request accessor so it shares the existing session and response policy.
import {
  createCanvasHandler,
  createCanvasRequest,
} from "@drupal-canvas/headless-angular/server";
import {
  DEFAULT_JSONAPI_PROXY_PATH,
  resolveDraftConfig,
} from "@drupal-canvas/headless/server";

import type { CanvasServerOptions } from "@drupal-canvas/headless-angular/server";

export function createCanvasHandlerWithProxy(options: CanvasServerOptions) {
  const canvas = createCanvasHandler(options);
  const handler: ReturnType<typeof createCanvasHandler> = async (
    request,
    render,
  ) => {
    // Resolve lazily: importing the SSR entry during a build must not require
    // deployment environment variables. Use the same configuration as the SDK.
    const config =
      typeof options.config === "function"
        ? options.config()
        : resolveDraftConfig(options.config);
    const proxyPath = (
      config.jsonApiProxyPath ?? DEFAULT_JSONAPI_PROXY_PATH
    ).replace(/\/+$/, "");
    const path = new URL(request.url).pathname;
    if (path !== proxyPath && !path.startsWith(`${proxyPath}/`)) {
      return canvas(request, render);
    }
    const context = createCanvasRequest(request, options);
    return context.finalize(await context.server.handleJsonApiProxy(request));
  };
  return handler;
}
