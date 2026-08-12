import { trustSystemCertificates } from '@drupal-canvas/headless/node'
import handler, {
  createServerEntry,
} from '@tanstack/react-start/server-entry'

// Node.js does not trust system certificates by default; local DDEV HTTPS requires them.
trustSystemCertificates()

export default createServerEntry({
  fetch(request) {
    return handler.fetch(request)
  },
})
