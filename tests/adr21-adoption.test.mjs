import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';

const root = new URL('../', import.meta.url);
const source = (path) => readFile(new URL(path, root), 'utf8');
const plain = (value) => JSON.parse(JSON.stringify(value));

// Execute the actual helper source. Only framework/SDK boundaries are stubs;
// there is no copied implementation of the template's collection/path logic.
async function load(path, imports = {}, globals = {}) {
  const context = createContext(globals);
  const module = new SourceTextModule(
    stripTypeScriptTypes(await source(path)),
    { context, identifier: path },
  );
  await module.link((name) => {
    assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
    const values = imports[name];
    return new SyntheticModule(
      Object.keys(values),
      function () {
        for (const [key, value] of Object.entries(values)) {
          this.setExport(key, value);
        }
      },
      { context },
    );
  });
  await module.evaluate();
  return module.namespace;
}

const article = {
  id: 'article-id',
  title: 'Article',
  status: true,
  drupal_internal__nid: 7,
  path: { alias: '/articles/example' },
};
const page = {
  id: 'page-id',
  title: 'Page',
  status: true,
  drupal_internal__id: 9,
  path: { alias: '/about' },
};
const sdkName = (framework) => `@drupal-canvas/headless-${framework}`;
const tanstackSdk = {
  fetchPage: () => null,
  getClient: () => null,
  getDraftData: () => null,
  getDraftEditorOrigin: () => null,
  getJsonApiRuntimeConfig: () => null,
  isDraftModeEnabled: () => false,
  isDraftSessionExpired: () => false,
};

for (const [framework, path] of [
  ['next', 'nextjs/lib/content.ts'],
  ['astro', 'astro/src/lib/content.ts'],
  ['nuxt', 'nuxt/shared/content.ts'],
  ['tanstack-start', 'tanstack-start/src/lib/content.ts'],
]) {
  test(`${framework}: flattened paths preserve aliases and numeric fallbacks`, async () => {
    const helpers = await load(path, {
      [sdkName(framework)]: { getClient: () => null },
    });
    assert.equal(helpers.articlePath(article), '/articles/example');
    assert.equal(helpers.canvasPagePath(page), '/about');
    for (const path of [undefined, null, { alias: null }, { alias: '' }]) {
      assert.equal(helpers.articlePath({ ...article, path }), '/node/7');
      assert.equal(helpers.canvasPagePath({ ...page, path }), '/page/9');
    }
  });
}

for (const [framework, path] of [
  ['next', 'nextjs/lib/content.ts'],
  ['astro', 'astro/src/lib/content.ts'],
]) {
  test(`${framework}: collections are consumed as arrays without data unwrapping`, async () => {
    const calls = [];
    const request = { cookies: {} };
    const helpers = await load(path, {
      [sdkName(framework)]: {
        getClient: (context) => {
          if (framework === 'astro') assert.equal(context, request);
          return {
            getCollection: async (type) => {
              calls.push(type);
              return type === 'node--article' ? [article] : [page];
            },
          };
        },
      },
    });
    assert.deepEqual(await helpers.getArticles(request), [article]);
    assert.deepEqual(await helpers.getCanvasPages(request), [page]);
    assert.deepEqual(calls, ['node--article', 'canvas_page--canvas_page']);
  });

  test(`${framework}: empty collections remain empty and failures propagate`, async () => {
    const failure = new Error('session rejected');
    let fail = false;
    const helpers = await load(path, {
      [sdkName(framework)]: {
        getClient: () => ({
          getCollection: async () => {
            if (fail) throw failure;
            return [];
          },
        }),
      },
    });
    assert.deepEqual(plain(await helpers.getArticles({})), []);
    fail = true;
    await assert.rejects(helpers.getArticles({}), (error) => error === failure);
  });
}

for (const framework of ['nuxt', 'tanstack-start']) {
  test(`${framework}: server collection response retains both flattened arrays`, async () => {
    const request = { context: {} };
    const getClient = (event) => {
      if (framework === 'nuxt') assert.equal(event, request);
      return {
        getCollection: async (type) =>
          type === 'node--article' ? [article] : [page],
      };
    };
    const helpers =
      framework === 'nuxt'
        ? await load(
            'nuxt/server/api/content.get.ts',
            {
              '@drupal-canvas/headless-nuxt/server': { getClient },
            },
            { defineEventHandler: (handler) => handler },
          )
        : await load('tanstack-start/src/server/canvas.server.ts', {
            [sdkName(framework)]: { ...tanstackSdk, getClient },
          });
    const result =
      framework === 'nuxt'
        ? await helpers.default(request)
        : await helpers.readContentLists();
    assert.deepEqual(plain(result), {
      canvasPages: [page],
      articles: [article],
    });
  });
}

test('TanStack: runtime configuration delegates to server SDK without exposing draft data', async () => {
  const config = {
    baseUrl: 'https://drupal.example',
    proxyUrl: '/api/canvas/jsonapi',
    preview: true,
  };
  let reads = 0;
  const helpers = await load('tanstack-start/src/server/canvas.server.ts', {
    [sdkName('tanstack-start')]: {
      ...tanstackSdk,
      getJsonApiRuntimeConfig: async () => config,
      getDraftData: () => {
        reads++;
        throw new Error('Not needed for runtime config');
      },
    },
  });
  assert.equal(await helpers.readJsonApiRuntimeConfig(), config);
  assert.equal(reads, 0);
});

test('TanStack: existing draft banner state contract is retained', async () => {
  const helpers = await load('tanstack-start/src/server/canvas.server.ts', {
    [sdkName('tanstack-start')]: tanstackSdk,
  });
  assert.deepEqual(plain(await helpers.readDraftSessionState()), {
    enabled: false,
    tokenExpiresAt: null,
    expired: false,
    renewUrl: null,
    editorOrigin: null,
  });
});

test('Next: proxy methods are exactly the SDK handlers', async () => {
  const handlers = Object.fromEntries(
    ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'].map((method) => [
      method,
      () => method,
    ]),
  );
  const route = await load(
    'nextjs/app/api/canvas/jsonapi/[[...path]]/route.ts',
    {
      [sdkName('next')]: {
        createDraftRouteHandlers: () => ({ jsonApiProxy: handlers }),
      },
    },
  );
  for (const [method, handler] of Object.entries(handlers))
    assert.equal(route[method], handler);
  assert.equal(route.dynamic, 'force-dynamic');
  assert.equal(route.runtime, 'nodejs');
});

test('TanStack: route delegates every SDK method, including PUT rejection', async () => {
  const handlers = Object.fromEntries(
    ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'].map(
      (method) => [method, () => method],
    ),
  );
  const route = await load(
    'tanstack-start/src/routes/api/canvas.jsonapi.$.ts',
    {
      [sdkName('tanstack-start')]: {
        createDraftRouteHandlers: () => ({ jsonApiProxy: handlers }),
      },
      '@tanstack/react-router': {
        createFileRoute: (path) => {
          assert.equal(path, '/api/canvas/jsonapi/$');
          return (options) => options;
        },
      },
    },
  );
  assert.equal(route.Route.server.handlers, handlers);
  assert.equal(route.Route.server.handlers.PUT, handlers.PUT);
  assert.match(
    await source('tanstack-start/src/routeTree.gen.ts'),
    /\/api\/canvas\/jsonapi\/\$/,
  );
});

test('React wiring passes context and provides runtime configuration', async () => {
  for (const path of [
    'nextjs/app/[[...slug]]/page.tsx',
    'tanstack-start/src/routes/$.tsx',
  ]) {
    assert.match(await source(path), /context=\{page\.context\}/);
  }
  assert.match(
    await source('nextjs/app/layout.tsx'),
    /<CanvasRuntime>[\s\S]*\{children\}[\s\S]*<\/CanvasRuntime>/,
  );
  assert.match(
    await source('tanstack-start/src/routes/__root.tsx'),
    /<JsonApiRuntimeProvider config=\{jsonApi\}>[\s\S]*<Outlet\s*\/>/,
  );
  assert.match(
    await source('tanstack-start/src/server/canvas.functions.ts'),
    /getJsonApiRuntimeConfig = createServerFn\(\)\.handler/,
  );
});

test('Non-React templates retain native rendering, not React providers', async () => {
  for (const path of [
    'nuxt/app/pages/[...slug].vue',
    'astro/src/pages/[...slug].astro',
  ]) {
    const text = await source(path);
    assert.match(text, /page\.content/);
    assert.doesNotMatch(
      text,
      /drupal-canvas\/react|JsonApiRuntimeProvider|CanvasContextProvider/,
    );
  }
});
