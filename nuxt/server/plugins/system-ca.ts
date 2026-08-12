import { trustSystemCertificates } from '@drupal-canvas/headless/node';

export default defineNitroPlugin(() => {
  trustSystemCertificates();
});
