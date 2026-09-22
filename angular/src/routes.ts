import { Routes } from "@angular/router";
import { canvasPageResolver } from "@drupal-canvas/headless-angular";
import { CanvasPage } from "./page";
export const routes: Routes = [
  {
    path: "**",
    component: CanvasPage,
    resolve: { canvas: canvasPageResolver },
    runGuardsAndResolvers: "always",
  },
];
