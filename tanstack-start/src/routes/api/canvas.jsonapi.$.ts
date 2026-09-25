import { createDraftRouteHandlers } from '@drupal-canvas/headless-tanstack-start'
import { createFileRoute } from '@tanstack/react-router'

const { jsonApiProxy } = createDraftRouteHandlers()

export const Route = createFileRoute('/api/canvas/jsonapi/$')({
  // Includes PUT so the shared proxy returns 405 instead of framework HTML.
  server: { handlers: jsonApiProxy },
})
