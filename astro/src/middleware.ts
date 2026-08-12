import { trustSystemCertificates } from '@drupal-canvas/headless/node';
import { defineMiddleware } from 'astro:middleware';

// Node.js does not trust system certificates by default; local DDEV HTTPS requires them.
trustSystemCertificates();

export const onRequest = defineMiddleware((_context, next) => next());
