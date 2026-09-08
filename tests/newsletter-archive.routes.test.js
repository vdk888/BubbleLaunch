const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = fs.promises;
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const express = require("express");
const { denyNewsletterSource } = require("../src/backend/middleware/newsletter-source-deny");

const {
  ArchiveNotFound,
  ArchiveUnavailable,
  createNewsletterArchiveRouter,
  loadEdition,
  loadManifest,
  parsePermalink,
} = require("../src/backend/routes/newsletter-archive.routes");

const PROFILES = ["equilibre", "finance", "tech"];
const DATE = "2026-09-08";
const SLUG = "synthetic-edition";
const SIGNUP_SHA256 = "0382b31d155fd0d13917681d0f0775a1a0d9ac5f10657df65d326eb042b2ce51";

function sha(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function htmlFor(permalink) {
  const url = `https://bubbleinvest.org/newsletter/${permalink}`;
  return Buffer.from(
    `<!doctype html><html><head><title>Synthetic</title>` +
      `<link rel="canonical" href="${url}">` +
      `<meta property="og:url" content="${url}"></head>` +
      `<body><a data-view-in-browser href="${url}">Voir dans le navigateur</a>` +
      `<p>Fixture only</p></body></html>`
  );
}

async function fixture() {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), "newsletter-archive-"));
  const editions = [];
  for (const profile of PROFILES) {
    const permalink = `${DATE}-${SLUG}-${profile}`;
    const file = `${permalink}.html`;
    const html = htmlFor(permalink);
    await fsp.writeFile(path.join(root, file), html, { mode: 0o600 });
    editions.push({
      date: DATE,
      file,
      permalink,
      profile,
      sha256: sha(html),
      slug: SLUG,
      subject: "Synthetic edition",
    });
  }
  await fsp.writeFile(
    path.join(root, "manifest.json"),
    `${JSON.stringify({ schema_version: 1, editions }, null, 2)}\n`,
    { mode: 0o600 }
  );
  return { root, editions };
}

async function withServer(router, callback) {
  const app = express();
  app.use(router);
  app.use((_req, res) => res.sendStatus(404));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

test("serves only manifest-listed, hash-matched profile permalinks", async (t) => {
  const { root, editions } = await fixture();
  t.after(() => fsp.rm(root, { recursive: true, force: true }));
  const manifest = await loadManifest(root);
  assert.equal(manifest.size, 3);
  for (const record of editions) {
    const loaded = await loadEdition(record.permalink, root);
    assert.equal(loaded.record.profile, record.profile);
    assert.ok(loaded.html.includes(`newsletter/${record.permalink}`));
  }
  await withServer(createNewsletterArchiveRouter({ archiveDir: root }), async (base) => {
    const valid = await fetch(`${base}/newsletter/${editions[1].permalink}`);
    assert.equal(valid.status, 200);
    assert.equal(valid.headers.get("x-robots-tag"), "noindex, nofollow");
    assert.equal(await valid.text(), htmlFor(editions[1].permalink).toString());
    assert.equal((await fetch(`${base}/newsletter`)).status, 404);
    assert.equal((await fetch(`${base}/newsletter/unlisted-2026-finance`)).status, 404);
  });
});

test("rejects malformed dates, profiles, traversal, and encoded separators", () => {
  for (const value of [
    "2026-02-30-topic-finance",
    "2026-09-08-topic-balanced",
    "2026-09-08-../topic-finance",
    "2026-09-08-topic%2ffinance",
    "2026-09-08-topic%5cfinance",
    "2026-09-08-topic-finance.html",
  ]) {
    assert.throws(() => parsePermalink(value), ArchiveNotFound);
  }
});

test("rejects incomplete profile sets, duplicate records, and unknown keys", async (t) => {
  const { root, editions } = await fixture();
  t.after(() => fsp.rm(root, { recursive: true, force: true }));
  const manifestPath = path.join(root, "manifest.json");
  for (const records of [
    editions.slice(0, 2),
    [...editions, editions[0]],
    editions.map((record, index) => (index ? record : { ...record, extra: true })),
  ]) {
    await fsp.writeFile(
      manifestPath,
      JSON.stringify({ schema_version: 1, editions: records })
    );
    await assert.rejects(loadManifest(root), ArchiveUnavailable);
  }
});

test("rejects hash drift, symlinked editions, and cross-profile view links", async (t) => {
  const { root, editions } = await fixture();
  t.after(() => fsp.rm(root, { recursive: true, force: true }));
  const target = editions[0];
  const targetPath = path.join(root, target.file);
  await fsp.appendFile(targetPath, "drift");
  await assert.rejects(loadEdition(target.permalink, root), ArchiveUnavailable);

  await fsp.writeFile(targetPath, htmlFor(target.permalink));
  const manifest = JSON.parse(await fsp.readFile(path.join(root, "manifest.json")));
  manifest.editions[0].sha256 = sha(await fsp.readFile(targetPath));
  await fsp.writeFile(path.join(root, "manifest.json"), JSON.stringify(manifest));
  const real = `${targetPath}.real`;
  await fsp.rename(targetPath, real);
  await fsp.symlink(real, targetPath);
  await assert.rejects(loadEdition(target.permalink, root), ArchiveUnavailable);

  await fsp.unlink(targetPath);
  const wrong = htmlFor(target.permalink).toString().replaceAll("equilibre", "finance");
  await fsp.writeFile(targetPath, wrong);
  manifest.editions[0].sha256 = sha(Buffer.from(wrong));
  await fsp.writeFile(path.join(root, "manifest.json"), JSON.stringify(manifest));
  await assert.rejects(loadEdition(target.permalink, root), ArchiveUnavailable);
});

test("returns unavailable for a missing manifest or listed edition", async (t) => {
  const empty = await fsp.mkdtemp(path.join(os.tmpdir(), "newsletter-empty-"));
  t.after(() => fsp.rm(empty, { recursive: true, force: true }));
  await assert.rejects(loadManifest(empty), ArchiveUnavailable);

  const { root, editions } = await fixture();
  t.after(() => fsp.rm(root, { recursive: true, force: true }));
  await fsp.unlink(path.join(root, editions[2].file));
  await assert.rejects(
    loadEdition(editions[2].permalink, root),
    ArchiveUnavailable
  );
  await withServer(createNewsletterArchiveRouter({ archiveDir: root }), async (base) => {
    const response = await fetch(
      `${base}/newsletter/${editions[2].permalink}`
    );
    assert.equal(response.status, 503);
    assert.equal(
      await response.text(),
      "Newsletter archive temporarily unavailable"
    );
  });
});

test("keeps signup byte-identical and source directory outside static serving", async () => {
  const project = path.resolve(__dirname, "..");
  const signup = await fsp.readFile(
    path.join(project, "src/frontend/pages/newsletter.html")
  );
  assert.equal(sha(signup), SIGNUP_SHA256);
  const expressSource = await fsp.readFile(
    path.join(project, "src/backend/config/express.js"),
    "utf8"
  );
  assert.ok(expressSource.indexOf("app.use(denyNewsletterSource)") < expressSource.indexOf("express.static("));
  const sitemap = await fsp.readFile(
    path.join(project, "src/backend/routes/sitemap.routes.js"),
    "utf8"
  );
  assert.doesNotMatch(sitemap, /newsletter\/:|newsletter-editions/);
  for (const page of await fsp.readdir(path.join(project, "src/frontend/pages"))) {
    if (!page.endsWith(".html")) continue;
    const body = await fsp.readFile(
      path.join(project, "src/frontend/pages", page),
      "utf8"
    );
    assert.doesNotMatch(body, /newsletter-editions|newsletter\/\d{4}-\d{2}-\d{2}-/);
  }
  const committed = JSON.parse(
    await fsp.readFile(
      path.join(project, "src/frontend/newsletter-editions/manifest.json"),
      "utf8"
    )
  );
  assert.deepEqual(committed, { schema_version: 1, editions: [] });
  const routesSource = await fsp.readFile(
    path.join(project, "src/backend/routes/index.js"),
    "utf8"
  );
  assert.ok(
    routesSource.indexOf("createNewsletterArchiveRouter()") <
      routesSource.indexOf('router.use("/", pagesRoutes)')
  );
});

test("blocks direct and encoded static source paths before express.static", async () => {
  const app = express();
  app.use(denyNewsletterSource);
  app.use(
    express.static(path.resolve(__dirname, "../src/frontend"), { index: false })
  );
  app.use((_req, res) => res.sendStatus(404));
  await withServer(app, async (base) => {
    for (const sourcePath of [
      "/newsletter-editions/manifest.json",
      "/newsletter-editions%2Fmanifest.json",
      "/newsletter-editions%252Fmanifest.json",
      "/NEWSLETTER-EDITIONS%255cmanifest.json",
      "//newsletter-editions/manifest.json",
      "/%2fnewsletter-editions/manifest.json",
    ]) {
      assert.equal((await fetch(base + sourcePath)).status, 404);
    }
  });
});
