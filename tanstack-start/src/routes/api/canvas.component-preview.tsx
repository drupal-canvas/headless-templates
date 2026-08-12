import ComponentPreview, {
  loadComponentPreview,
} from '@drupal-canvas/headless-tanstack-start/ComponentPreview'
import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/api/canvas/component-preview')({
  loader: async () => (await loadComponentPreview()) ?? notFound(),
  component: () => <ComponentPreview {...Route.useLoaderData()} />,
})
