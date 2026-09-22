import { Component, Input } from "@angular/core";

@Component({
  selector: "app-footer",
  host: { style: "display: contents" },
  templateUrl: "./template.html",
})
export default class Footer {
  @Input() text: string = "";
}
