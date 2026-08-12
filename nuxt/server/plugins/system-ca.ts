import { trustSystemCertificates } from '@drupal-canvas/headless/node';

export default defineNitroPlugin(() => {
  // Node.js does not trust system certificates by default; local DDEV HTTPS requires them.
  trustSystemCertificates();
});
