import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

import { DraftBanner } from '#/components/DraftBanner'
import { getDraftSessionState } from '#/server/canvas.functions'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Canvas Headless — TanStack Start' },
      {
        name: 'description',
        content: 'A minimal Drupal Canvas headless frontend.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  loader: () => getDraftSessionState(),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootComponent() {
  const session = Route.useLoaderData()
  return (
    <>
      <DraftBanner session={session} />
      <Outlet />
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
