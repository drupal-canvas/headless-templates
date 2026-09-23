import { Component, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import {
  CanvasComponentTree,
  CanvasDraftSession,
  CanvasPageStore,
} from "@drupal-canvas/headless-angular";
import components from "./canvas-components.generated";
@Component({
  selector: "app-canvas-page",
  imports: [CanvasComponentTree, RouterLink],
  host: { style: "display: contents" },
  template: `
    @if (store.session()?.enabled) {
      @if (draft.expired()) {
        <div
          class="flex items-center justify-between gap-4 bg-red-200 px-4 py-2 text-sm text-red-950"
          data-draft-session-view="expired"
        >
          <span
            ><strong>Draft preview session expired.</strong> Showing only
            content visible to anonymous visitors.</span
          >
          <span class="flex gap-4">
            @if (store.session()?.renewUrl; as url) {
              <a [href]="url" class="font-semibold underline">Renew session</a>
            }
            <form ngNoForm method="POST" action="/api/disable-draft">
              <button
                type="submit"
                class="cursor-pointer font-semibold underline"
              >
                Exit draft mode
              </button>
            </form>
          </span>
        </div>
      } @else if (draft.embedded() === false) {
        <div
          class="flex items-center justify-between gap-4 bg-amber-300 px-4 py-2 text-sm text-amber-950"
          data-draft-session-view="active"
        >
          <span
            ><strong>Draft mode is active.</strong> You may be seeing
            unpublished content.</span
          >
          <form ngNoForm method="POST" action="/api/disable-draft">
            <button
              type="submit"
              class="cursor-pointer font-semibold underline"
            >
              Exit draft mode
            </button>
          </form>
        </div>
      }
    }
    @if (store.page(); as page) {
      <canvas-component-tree [tree]="page.content" [components]="components" />
    } @else {
      <main class="mx-auto w-full max-w-2xl px-6 py-10">
        <p class="mb-6">
          <a routerLink="/" class="text-sm underline">← Back to home</a>
        </p>
        <h1 class="mb-2 text-3xl font-bold">Not found</h1>
        <p class="text-sm text-gray-500">
          Drupal answered nothing for
          <code class="rounded bg-gray-100 px-1">{{ router.url }}</code
          >.
        </p>
      </main>
    }
  `,
})
export class CanvasPage {
  readonly router = inject(Router);
  readonly store = inject(CanvasPageStore);
  readonly draft = inject(CanvasDraftSession);
  readonly components = components;
}
