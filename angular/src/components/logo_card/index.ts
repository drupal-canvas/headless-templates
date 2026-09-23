import { Component, Input } from "@angular/core";

@Component({
  selector: "app-logo-card",
  host: { style: "display: contents" },
  templateUrl: "./template.html",
})
export default class LogoCard {
  @Input() image?: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  @Input() backgroundColor: string = "#F1F5F9";
}
