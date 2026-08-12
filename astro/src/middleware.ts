import { trustSystemCertificates } from '@drupal-canvas/headless/node';
import { defineMiddleware } from 'astro:middleware';

trustSystemCertificates();

export const onRequest = defineMiddleware((_context, next) => next());
