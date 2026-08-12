export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { trustSystemCertificates } = await import(
      '@drupal-canvas/headless/node'
    );
    trustSystemCertificates();
  }
}
