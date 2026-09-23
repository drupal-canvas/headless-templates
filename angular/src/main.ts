import {
  bootstrapApplication,
  provideClientHydration,
} from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { provideCanvas } from "@drupal-canvas/headless-angular";

import { App } from "./app";
import { routes } from "./routes";

bootstrapApplication(App, {
  providers: [provideClientHydration(), provideRouter(routes), provideCanvas()],
}).catch(console.error);
