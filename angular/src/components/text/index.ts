import { Component, Input } from "@angular/core";
import { CanvasMarkup } from "@drupal-canvas/headless-angular";

@Component({
  selector: "app-text",
  imports: [CanvasMarkup],
  host: { style: "display: contents" },
  templateUrl: "./template.html",
})
export default class Text {
  @Input() text: string = "";
  @Input() textSize: string = "normal";
  @Input() textColor: string = "dark";
  @Input() textShadow: string = "";
  readonly sizes: Record<string, string> = {
    extra_small: "text-xs",
    small: "text-sm",
    normal: "text-base/6",
    large: "text-lg/8",
    extra_large: "text-xl/8",
  };
  readonly shadows: Record<string, string> = {
    light: "text-shadow-sm",
    medium: "text-shadow-md",
    heavy: "text-shadow-lg",
  };
}
