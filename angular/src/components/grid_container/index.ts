import { Component, Input } from "@angular/core";
import { CanvasSlot } from "@drupal-canvas/headless-angular";

@Component({
  selector: "app-grid-container",
  imports: [CanvasSlot],
  host: { style: "display: contents" },
  templateUrl: "./template.html",
})
export default class GridContainer {
  @Input() layout: string = "33-33-33";
  @Input() gap: string = "medium";
  readonly layouts: Record<string, string> = {
    "50-50": "md:grid-cols-[1fr_1fr]",
    "33-33-33": "md:grid-cols-[1fr_1fr_1fr]",
    "75-25": "md:grid-cols-[3fr_1fr]",
    "25-75": "md:grid-cols-[1fr_3fr]",
    "67-33": "md:grid-cols-[2fr_1fr]",
    "33-67": "md:grid-cols-[1fr_2fr]",
    "50-25-25": "md:grid-cols-[2fr_1fr_1fr]",
    "25-25-50": "md:grid-cols-[1fr_1fr_2fr]",
    "25-25-25-25": "sm:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1fr_1fr_1fr]",
  };
  readonly gaps: Record<string, string> = {
    extra_small: "gap-1",
    small: "gap-2",
    medium: "gap-4",
    large: "gap-6",
    extra_large: "gap-8",
  };
}
