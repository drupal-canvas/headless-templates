export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { trustSystemCertificates } = await import(
      '@drupal-canvas/headless/node'
    );
    // Node.js does not trust system certificates by default; local DDEV HTTPS requires them.
    trustSystemCertificates();
  }
}
