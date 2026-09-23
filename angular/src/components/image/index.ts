import { Component, Input } from "@angular/core";

@Component({
  selector: "app-image",
  host: { style: "display: contents" },
  templateUrl: "./template.html",
})
export default class Image {
  @Input() image?: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  };
}
