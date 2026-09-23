import { Component, Input } from "@angular/core";
import { CanvasSlot, CanvasMarkup } from "@drupal-canvas/headless-angular";
import Heading from "../heading";

@Component({
  selector: "app-hero",
  imports: [CanvasSlot, CanvasMarkup, Heading],
  host: { style: "display: contents" },
  templateUrl: "./template.html",
})
export default class Hero {
  @Input() image?: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  @Input() layout: string = "left_aligned";
  @Input() columnWidths: string = "50_50";
  @Input() preHeading: string = "";
  @Input() heading: string = "";
  @Input() headingElement: string = "h2";
  @Input() headingSize: string = "large";
  @Input() text: string = "";
  @Input() textColor: string = "dark";
  @Input() textShadow: string = "medium";
  @Input() backgroundImage?: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  @Input() darkenImage: boolean = false;
  readonly widths: Record<string, string[]> = {
    "33_66": ["md:w-1/3", "md:w-2/3"],
    "50_50": ["md:w-1/2", "md:w-1/2"],
    "66_33": ["md:w-2/3", "md:w-1/3"],
  };
  readonly layouts: Record<string, string> = {
    text_image: "flex-col md:flex-row",
    image_text: "flex-col md:flex-row-reverse",
  };
  readonly shadows: Record<string, string> = {
    light: "text-shadow-sm",
    medium: "text-shadow-md",
    heavy: "text-shadow-lg",
  };
}
