import {
  bootstrapApplication,
  provideClientHydration,
} from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { provideServerRendering, RenderMode, withRoutes } from "@angular/ssr";
import { provideCanvas } from "@drupal-canvas/headless-angular";

import { App } from "./app";
import { routes } from "./routes";

import type { BootstrapContext } from "@angular/platform-browser";

export default (context: BootstrapContext) =>
  bootstrapApplication(
    App,
    {
      providers: [
        provideClientHydration(),
        provideRouter(routes),
        provideCanvas(),
        provideServerRendering(
          withRoutes([{ path: "**", renderMode: RenderMode.Server }]),
        ),
      ],
    },
    context,
  );
