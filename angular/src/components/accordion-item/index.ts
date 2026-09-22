import {
  Component,
  Input,
  inject,
  signal,
  ElementRef,
  DestroyRef,
  afterNextRender,
} from "@angular/core";
import { CanvasSlot } from "@drupal-canvas/headless-angular";
import { NgTemplateOutlet } from "@angular/common";
import { ACCORDION, AccordionIds } from "../../ui/accordion-context";

@Component({
  selector: "app-accordion-item",
  imports: [CanvasSlot, NgTemplateOutlet],
  host: { style: "display: contents" },
  templateUrl: "./template.html",
})
export default class AccordionItem {
  @Input() title: string = "";
  @Input() headingElement: string = "h3";
  @Input() anchorId: string = "";
  readonly group = inject(ACCORDION, { optional: true }) ?? {
    variant: "default",
    borderColor: "gray_200",
  };
  readonly isOpen = signal(false);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly id = inject(AccordionIds).allocate();
  readonly buttonId = `${this.id}-button`;
  readonly panelId = `${this.id}-panel`;
  @Input() set defaultOpen(value: boolean) {
    this.isOpen.set(value);
  }
  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      let frame = 0;
      const checkHash = () => {
        if (this.anchorId && window.location.hash === `#${this.anchorId}`) {
          this.isOpen.set(true);
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(() =>
              this.element.nativeElement
                .querySelector("[data-accordion-item]")
                ?.scrollIntoView({ behavior: "smooth", block: "center" }),
            );
          });
        }
      };
      checkHash();
      window.addEventListener("hashchange", checkHash);
      destroy.onDestroy(() => {
        window.removeEventListener("hashchange", checkHash);
        cancelAnimationFrame(frame);
      });
    });
  }
  get itemClasses() {
    return (
      "w-full " +
      (this.group.variant === "bordered"
        ? "border bg-white "
        : this.group.variant === "separated"
          ? "rounded-xl border bg-white "
          : "") +
      (this.group.variant === "default"
        ? ""
        : this.borderClasses[this.group.borderColor])
    );
  }
  get buttonClasses() {
    return (
      "flex w-full items-center gap-3 text-left font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 " +
      (this.group.variant === "bordered"
        ? "px-5 py-4 text-base text-black hover:text-primary-700"
        : this.group.variant === "separated"
          ? "justify-between px-4 py-4 text-base text-black hover:text-primary-700"
          : "justify-between py-4 text-base text-black hover:text-primary-700")
    );
  }
  readonly borderClasses: Record<string, string> = {
    gray_200: "border-gray-200",
    gray_300: "border-gray-300",
    gray_400: "border-gray-400",
    primary_200: "border-primary-200",
    primary_300: "border-primary-300",
  };
}
