import { Component, Input } from "@angular/core";
import { CanvasMarkup } from "@drupal-canvas/headless-angular";
import { NgTemplateOutlet } from "@angular/common";
import Heading from "../heading";
import Button from "../button";

@Component({
  selector: "app-card",
  imports: [CanvasMarkup, NgTemplateOutlet, Heading, Button],
  host: { style: "display: contents" },
  templateUrl: "./template.html",
})
export default class Card {
  @Input() variant: string = "default";
  @Input() image?: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  @Input() layout: string = "left_aligned";
  @Input() heading: string = "";
  @Input() headingElement: string = "h2";
  @Input() byline: string = "";
  @Input() text: string = "";
  @Input() link: string = "";
  @Input() linkLabel: string = "";
  @Input() linkVariant: string = "link";
  @Input() backgroundColor: string = "#ffffff";
  @Input() backgroundColorOnHover: string = "#E2E8F0";
  @Input() textColor: string = "Default";
  readonly align: Record<string, string> = {
    left_aligned: "items-start text-left",
    center_aligned: "items-center text-center",
    right_aligned: "items-end text-right",
  };
  readonly linkCardTextAlign: Record<string, string> = {
    left_aligned: "text-left",
    center_aligned: "text-center",
    right_aligned: "text-right",
  };
  readonly textColors: Record<string, string> = {
    Default: "",
    Dark: "text-primary-dark",
    Light: "text-white",
  };
}
