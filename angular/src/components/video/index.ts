import { Component, Input } from "@angular/core";

@Component({
  selector: "app-video",
  host: { style: "display: contents" },
  templateUrl: "./template.html",
})
export default class Video {
  @Input() video?: { src: string; poster?: string };
}
