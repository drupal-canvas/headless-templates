import { Component, Input } from "@angular/core";

@Component({
  selector: "app-spacer",
  host: { style: "display: contents" },
  templateUrl: "./template.html",
})
export default class Spacer {
  @Input() height: string = "small";
  readonly heights: Record<string, string> = {
    small: "h-8",
    medium: "h-12",
    large: "h-16",
    extra_large: "h-24",
  };
}
