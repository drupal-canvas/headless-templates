import handler, {
  createServerEntry,
} from '@tanstack/react-start/server-entry'
import { trustSystemCertificates } from '@drupal-canvas/headless/node'

trustSystemCertificates()

export default createServerEntry({
  fetch(request) {
    return handler.fetch(request)
  },
})
