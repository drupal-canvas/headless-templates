import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';

const source = (path) =>
  readFile(new URL('../' + path, import.meta.url), 'utf8');

async function harness(config = {}) {
  const calls = [];
  const response = new Response('proxy', { status: 405 });
  const context = createContext({ URL });
  const module = new SourceTextModule(
    stripTypeScriptTypes(await source('angular/src/canvas-handler.ts')),
    { context },
  );
  const imports = {
    '@drupal-canvas/headless-angular/server': {
      createCanvasHandler: () => async (request, render) => {
        calls.push(['original', request, render]);
        return response;
      },
      createCanvasRequest: (request, options) => {
        calls.push(['request', request, options]);
        return {
          server: {
            handleJsonApiProxy: async (value) => {
              calls.push(['proxy', value]);
              return response;
            },
          },
          finalize: async (value) => {
            calls.push(['finalize', value]);
            return value;
          },
        };
      },
    },
    '@drupal-canvas/headless/server': {
      DEFAULT_JSONAPI_PROXY_PATH: '/api/canvas/jsonapi',
      resolveDraftConfig: (value) => {
        calls.push(['config']);
        return value ?? config;
      },
    },
  };
  await module.link((name) => {
    assert.ok(Object.hasOwn(imports, name));
    const exports = imports[name];
    return new SyntheticModule(
      Object.keys(exports),
      function () {
        for (const [key, value] of Object.entries(exports))
          this.setExport(key, value);
      },
      { context },
    );
  });
  await module.evaluate();
  return {
    factory: module.namespace.createCanvasHandlerWithProxy,
    calls,
    response,
  };
}

for (const method of ['GET', 'POST', 'PUT', 'OPTIONS']) {
  test(`Angular ${method}: delegates the original request and finalizes the proxy response`, async () => {
    const { factory, calls, response } = await harness();
    const options = { manifest: {} };
    const handler = factory(options);
    assert.equal(calls.length, 0, 'No eager configuration or session reads');
    const request = new Request(
      'https://app.example/api/canvas/jsonapi/jsonapi/node/article?include=uid',
      { method },
    );
    assert.equal(
      await handler(request, () => {
        throw new Error('Unexpected SSR');
      }),
      response,
    );
    assert.deepEqual(
      calls.map((row) => row[0]),
      ['config', 'request', 'proxy', 'finalize'],
    );
    assert.equal(calls[1][1], request);
    assert.equal(calls[1][2], options);
    assert.equal(calls[2][1], request);
    assert.equal(calls[3][1], response);
  });
}

for (const path of [
  '/about',
  '/api/draft',
  '/api/draft/renew',
  '/api/disable-draft',
  '/api/canvas/component-preview',
  '/api/canvas/jsonapi-other',
]) {
  test(`Angular leaves ${path} with the existing adapter`, async () => {
    const { factory, calls } = await harness();
    const request = new Request('https://app.example' + path);
    const render = () => {};
    await factory({ manifest: {} })(request, render);
    assert.deepEqual(
      calls.map((row) => row[0]),
      ['config', 'original'],
    );
    assert.equal(calls[1][1], request);
    assert.equal(calls[1][2], render);
  });
}

test('Angular respects custom proxy paths and lazy config providers', async () => {
  const { factory, calls } = await harness();
  let reads = 0;
  const handler = factory({
    manifest: {},
    config: () => {
      reads++;
      return { jsonApiProxyPath: '/custom/proxy/' };
    },
  });
  assert.equal(reads, 0);
  await handler(new Request('https://app.example/custom/proxy'), () => {});
  assert.equal(reads, 1);
  assert.deepEqual(
    calls.map((row) => row[0]),
    ['request', 'proxy', 'finalize'],
  );
});

test('Angular keeps authority validation, native providers and data binding', async () => {
  const server = await source('angular/src/server.ts');
  assert.ok(
    server.indexOf('prepareRequest(req, policy)') <
      server.indexOf('canvas(request,'),
  );
  assert.match(server, /createCanvasHandlerWithProxy\(\{ manifest \}\)/);
  for (const path of ['angular/src/main.ts', 'angular/src/main.server.ts']) {
    assert.match(await source(path), /provideCanvas\(\)/);
  }
  const page = await source('angular/src/page.ts');
  assert.match(page, /inject\(CanvasPageStore\)/);
  assert.match(page, /\[tree\]="page.content" \[components\]="components"/);
  assert.doesNotMatch(
    page,
    /\[context\]|drupal-canvas\/react|JsonApiRuntimeProvider/,
  );
});
