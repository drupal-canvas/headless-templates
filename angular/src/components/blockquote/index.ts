import { Component, Input } from "@angular/core";
import { CanvasMarkup } from "@drupal-canvas/headless-angular";

@Component({
  selector: "app-blockquote",
  imports: [CanvasMarkup],
  host: { style: "display: contents" },
  templateUrl: "./template.html",
})
export default class Blockquote {
  @Input() text: string = "";
  @Input() textColor: string = "dark";
  @Input() name: string = "";
  @Input() title: string = "";
}
