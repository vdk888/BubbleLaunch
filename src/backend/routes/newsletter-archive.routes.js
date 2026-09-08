const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const { TextDecoder } = require("util");

const DEFAULT_ARCHIVE_DIR = path.join(
  __dirname,
  "../../frontend/newsletter-editions"
);
const PROFILES = ["equilibre", "finance", "tech"];
const MANIFEST_KEYS = ["editions", "schema_version"];
const RECORD_KEYS = [
  "date",
  "file",
  "permalink",
  "profile",
  "sha256",
  "slug",
  "subject",
];
const MAX_MANIFEST_BYTES = 1024 * 1024;
const MAX_EDITION_BYTES = 5 * 1024 * 1024;

class ArchiveNotFound extends Error {}
class ArchiveUnavailable extends Error {}

function exactKeys(value, expected) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify(expected)
  );
}

function validIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function parsePermalink(value) {
  if (typeof value !== "string" || value.includes("%")) {
    throw new ArchiveNotFound("invalid permalink");
  }
  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)-(equilibre|finance|tech)$/
  );
  if (!match || !validIsoDate(match[1]) || match[2].length > 80) {
    throw new ArchiveNotFound("invalid permalink");
  }
  return { date: match[1], slug: match[2], profile: match[3] };
}

async function readRegularFile(filePath, maxBytes) {
  let handle;
  try {
    handle = await fsp.open(
      filePath,
      fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0)
    );
    const stat = await handle.stat();
    if (!stat.isFile() || stat.nlink !== 1 || stat.size < 1 || stat.size > maxBytes) {
      throw new ArchiveUnavailable("archive file metadata is invalid");
    }
    return await handle.readFile();
  } catch (error) {
    if (error instanceof ArchiveUnavailable) throw error;
    if (error && error.code === "ENOENT") throw new ArchiveNotFound("archive file missing");
    throw new ArchiveUnavailable("archive file cannot be read");
  } finally {
    if (handle) await handle.close();
  }
}

function validateRecord(record) {
  if (!exactKeys(record, RECORD_KEYS)) {
    throw new ArchiveUnavailable("archive record schema is invalid");
  }
  let parsed;
  try {
    parsed = parsePermalink(record.permalink);
  } catch (_error) {
    throw new ArchiveUnavailable("archive record permalink is invalid");
  }
  if (
    record.date !== parsed.date ||
    record.slug !== parsed.slug ||
    record.profile !== parsed.profile ||
    record.file !== `${record.permalink}.html` ||
    typeof record.subject !== "string" ||
    record.subject.trim().length < 1 ||
    record.subject.length > 200 ||
    !/^[0-9a-f]{64}$/.test(record.sha256)
  ) {
    throw new ArchiveUnavailable("archive record contract is invalid");
  }
  return record;
}

async function loadManifest(archiveDir = DEFAULT_ARCHIVE_DIR) {
  let raw;
  try {
    raw = await readRegularFile(
      path.join(archiveDir, "manifest.json"),
      MAX_MANIFEST_BYTES
    );
  } catch (_error) {
    throw new ArchiveUnavailable("archive manifest cannot be read");
  }
  let manifest;
  try {
    manifest = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw));
  } catch (_error) {
    throw new ArchiveUnavailable("archive manifest is invalid");
  }
  if (
    !exactKeys(manifest, MANIFEST_KEYS) ||
    manifest.schema_version !== 1 ||
    !Array.isArray(manifest.editions) ||
    manifest.editions.length > 999
  ) {
    throw new ArchiveUnavailable("archive manifest schema is invalid");
  }

  const records = manifest.editions.map(validateRecord);
  const byPermalink = new Map();
  const groups = new Map();
  for (const record of records) {
    if (byPermalink.has(record.permalink)) {
      throw new ArchiveUnavailable("duplicate archive permalink");
    }
    byPermalink.set(record.permalink, record);
    const groupKey = `${record.date}\0${record.slug}`;
    const group = groups.get(groupKey) || [];
    group.push(record.profile);
    groups.set(groupKey, group);
  }
  for (const profiles of groups.values()) {
    if (
      profiles.length !== PROFILES.length ||
      JSON.stringify([...profiles].sort()) !== JSON.stringify(PROFILES)
    ) {
      throw new ArchiveUnavailable("archive edition profile set is incomplete");
    }
  }
  return byPermalink;
}

function validateEditionHtml(buffer, record) {
  let html;
  try {
    html = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch (_error) {
    throw new ArchiveUnavailable("edition is not valid UTF-8");
  }
  const publicUrl = `https://bubbleinvest.org/newsletter/${record.permalink}`;
  const required = [
    "<!doctype html",
    `<link rel="canonical" href="${publicUrl}">`,
    `<meta property="og:url" content="${publicUrl}">`,
    `data-view-in-browser href="${publicUrl}"`,
  ];
  if (!required.every((needle) => html.toLowerCase().includes(needle.toLowerCase()))) {
    throw new ArchiveUnavailable("edition public-link contract is invalid");
  }
  const profileLinks = [
    ...html.matchAll(/https:\/\/bubbleinvest\.org\/newsletter\/[a-z0-9-]+-(equilibre|finance|tech)/gi),
  ].map((match) => match[1].toLowerCase());
  if (!profileLinks.length || profileLinks.some((profile) => profile !== record.profile)) {
    throw new ArchiveUnavailable("edition links cross profile variants");
  }
  return html;
}

async function loadEdition(permalink, archiveDir = DEFAULT_ARCHIVE_DIR) {
  parsePermalink(permalink);
  const manifest = await loadManifest(archiveDir);
  const record = manifest.get(permalink);
  if (!record) throw new ArchiveNotFound("edition is not listed");
  let buffer;
  try {
    buffer = await readRegularFile(
      path.join(archiveDir, record.file),
      MAX_EDITION_BYTES
    );
  } catch (_error) {
    throw new ArchiveUnavailable("listed edition cannot be read");
  }
  const digest = crypto.createHash("sha256").update(buffer).digest("hex");
  if (digest !== record.sha256) {
    throw new ArchiveUnavailable("edition hash mismatch");
  }
  return { html: validateEditionHtml(buffer, record), record };
}

function createNewsletterArchiveRouter({ archiveDir = DEFAULT_ARCHIVE_DIR } = {}) {
  const router = express.Router();
  router.get("/newsletter/:permalink", async (req, res) => {
    const rawPath = req.originalUrl.split("?", 1)[0];
    if (/%2f|%5c/i.test(rawPath)) return res.sendStatus(404);
    try {
      const edition = await loadEdition(req.params.permalink, archiveDir);
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.type("html").send(edition.html);
    } catch (error) {
      if (error instanceof ArchiveNotFound) return res.sendStatus(404);
      return res.status(503).type("text/plain").send("Newsletter archive temporarily unavailable");
    }
  });
  return router;
}

module.exports = {
  ArchiveNotFound,
  ArchiveUnavailable,
  createNewsletterArchiveRouter,
  loadEdition,
  loadManifest,
  parsePermalink,
};
