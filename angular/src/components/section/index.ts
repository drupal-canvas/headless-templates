import { Component, Input } from "@angular/core";
import { CanvasSlot } from "@drupal-canvas/headless-angular";

@Component({
  selector: "app-section",
  imports: [CanvasSlot],
  host: { style: "display: contents" },
  templateUrl: "./template.html",
})
export default class Section {
  @Input() width: string = "normal";
}
