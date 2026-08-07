import CanvasComponentTree from '@drupal-canvas/headless-tanstack-start/CanvasComponentTree'
import { toTanStackHead } from '@drupal-canvas/headless-tanstack-start/head'
import { isPageRedirect } from '@drupal-canvas/headless'
import { Link, createFileRoute, notFound, redirect } from '@tanstack/react-router'

import { getPageForPath } from '#/server/canvas.functions'

export const Route = createFileRoute('/$')({
  loader: async ({ params }) => {
    const path = `/${(params._splat ?? '')
      .split('/')
      .map(encodeURIComponent)
      .join('/')}`
    const result = await getPageForPath({ data: path })
    if (!result) {
      throw notFound()
    }
    if (isPageRedirect(result)) {
      throw redirect({
        href: result.redirect.url,
        statusCode: result.redirect.statusCode,
      })
    }
    return { page: result }
  },
  head: ({ loaderData }) =>
    loaderData ? toTanStackHead(loaderData.page.head) : {},
  component: CatchAllPage,
  notFoundComponent: NotFoundPage,
})

function CatchAllPage() {
  const { page } = Route.useLoaderData()
  return <CanvasComponentTree tree={page.content} />
}

function NotFoundPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <p className="mb-6">
        <Link to="/" className="text-sm underline">
          ← All content
        </Link>
      </p>
      <h1 className="mb-2 text-3xl font-bold">Not found</h1>
      <p className="text-sm text-gray-500">
        Drupal answered nothing for this path.
      </p>
    </main>
  )
}
