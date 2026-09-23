import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import express from "express";
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from "@angular/ssr/node";
import { createCanvasHandler } from "@drupal-canvas/headless-angular/server";
import { trustSystemCertificates } from "@drupal-canvas/headless/node";

import manifest from "./canvas-manifest.generated";
import { prepareRequest, requestPolicy } from "./request-policy";
// Angular CLI does not load server-side environment files automatically.
if (existsSync(".env")) {
  loadEnvFile(".env");
}
// Trust installed development/system CAs without disabling TLS verification.
trustSystemCertificates();
const app = express();
const policy = requestPolicy();
const angular = new AngularNodeAppEngine({
  allowedHosts: policy.engineAllowedHosts,
  trustProxyHeaders: policy.trustProxyHeaders,
});
// Enforce the boundary before static assets AND adapter API routes, which may
// respond without entering AngularNodeAppEngine's additional host validation.
app.use((req, res, next) => {
  try {
    res.locals["canvasRequest"] = prepareRequest(req, policy);
    next();
  } catch {
    res
      .status(400)
      .set("Cache-Control", "private, no-store")
      .send("Invalid request authority or proxy headers");
  }
});
app.use(
  express.static(resolve(import.meta.dirname, "../browser"), {
    index: false,
    maxAge: "1y",
  }),
);
const canvas = createCanvasHandler({ manifest });
app.use((req, res, next) => {
  const request = res.locals["canvasRequest"] as Request;
  canvas(request, (request, context) => angular.handle(request, context))
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch((error: unknown) => {
      // Closing a hover preview can cancel SSR before the thumbnail is ready.
      if (
        request.signal.aborted &&
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        return;
      }
      next(error);
    });
});
if (isMainModule(import.meta.url)) {
  const port = Number(process.env["PORT"] ?? 4200);
  app.listen(port, () =>
    console.log(`Angular server listening on port ${port}`),
  );
}
export const reqHandler = createNodeRequestHandler(app);
