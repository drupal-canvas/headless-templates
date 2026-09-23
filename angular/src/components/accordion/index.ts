import { Component, Input, forwardRef } from "@angular/core";
import { CanvasSlot } from "@drupal-canvas/headless-angular";
import { ACCORDION } from "../../ui/accordion-context";

@Component({
  selector: "app-accordion",
  imports: [CanvasSlot],
  host: { style: "display: contents" },
  providers: [{ provide: ACCORDION, useExisting: forwardRef(() => Accordion) }],
  templateUrl: "./template.html",
})
export default class Accordion {
  @Input() borderColor: string = "gray_200";
  @Input() variant: string = "default";
  readonly colors: Record<string, string> = {
    gray_200: "var(--color-gray-200)",
    gray_300: "var(--color-gray-300)",
    gray_400: "var(--color-gray-400)",
    primary_200: "var(--color-primary-200)",
    primary_300: "var(--color-primary-300)",
  };
}
