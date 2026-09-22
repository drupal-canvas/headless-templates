import { Injectable, InjectionToken } from "@angular/core";
export interface AccordionContext {
  variant: string;
  borderColor: string;
}
export const ACCORDION = new InjectionToken<AccordionContext>("Accordion");
// Application-scoped, so concurrent SSR requests do not share an ID counter.
@Injectable({ providedIn: "root" })
export class AccordionIds {
  private next = 0;
  allocate() {
    return `accordion-item-${this.next++}`;
  }
}
