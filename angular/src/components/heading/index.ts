import { Component, Input } from "@angular/core";

@Component({
  selector: "app-heading",
  host: { style: "display: contents" },
  templateUrl: "./template.html",
})
export default class Heading {
  @Input() preHeading: string = "";
  @Input() heading: string = "";
  @Input() textColor: string = "dark";
  @Input() headingElement: string = "h2";
  @Input() headingSize: string = "medium";
  @Input() layout: string = "left_aligned";
  @Input() textShadow: string = "";
  readonly sizes: Record<string, string> = {
    small: "text-lg",
    medium: "text-2xl",
    large: "text-4xl",
    extra_large: "text-6xl",
  };
  readonly preHeadingSizes: Record<string, string> = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
    extra_large: "text-lg",
  };
  readonly align: Record<string, string> = {
    left_aligned: "items-start text-left",
    center_aligned: "items-center text-center",
    right_aligned: "items-end text-right",
  };
  readonly shadows: Record<string, string> = {
    light: "text-shadow-sm",
    medium: "text-shadow-md",
    heavy: "text-shadow-lg",
  };
  get headingClasses() {
    return (
      "leading-[normal] font-bold text-balance " +
      this.sizes[this.headingSize] +
      " " +
      (this.textColor === "light" ? "text-white" : "text-black") +
      " " +
      (this.shadows[this.textShadow] || "")
    );
  }
}
