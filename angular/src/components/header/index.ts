import { Component } from "@angular/core";
import { CanvasSlot } from "@drupal-canvas/headless-angular";

@Component({
  selector: "app-header",
  imports: [CanvasSlot],
  host: { style: "display: contents" },
  templateUrl: "./template.html",
})
export default class Header {}
