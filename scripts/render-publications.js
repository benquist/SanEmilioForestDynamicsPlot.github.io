#!/usr/bin/env node
"use strict";

// No network or third-party packages: JSON is the sole publication source.
const fs = require("node:fs");
const path = require("node:path");

const startMarker = "          <!-- BEGIN GENERATED PUBLICATIONS: scripts/render-publications.js -->";
const endMarker = "          <!-- END GENERATED PUBLICATIONS -->";
const fields = new Set([
  "id", "title", "authors", "year", "journal", "doi", "url",
  "topicTags", "summary", "sourceNotes", "volume", "issue", "pages"
]);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function requireText(value, label) {
  if (typeof value !== "string" || !value.trim() || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`${label} must be nonempty text without control characters`);
  }
}

function validateUrl(value, label) {
  requireText(value, label);
  if (!/^https?:\/\//.test(value) || /[\s\\]/.test(value) || /%(?![0-9a-f]{2})/i.test(value)) {
    throw new Error(`${label} must be an explicit HTTP(S) URL without whitespace, backslashes, or invalid escapes`);
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid URL`);
  }
  if (!url.hostname || url.username || url.password) {
    throw new Error(`${label} must have a host and must not contain credentials`);
  }
}

function validatePublications(data) {
  if (!Array.isArray(data) || !data.length) throw new Error("Publications must be a nonempty array");
  const ids = new Set();
  data.forEach((item, index) => {
    const label = `Publication ${index + 1}`;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`${label} must be an object`);
    }
    Object.keys(item).forEach((key) => {
      if (!fields.has(key)) throw new Error(`${label}: unsupported field ${key}`);
    });
    ["id", "title", "authors", "journal", "summary"].forEach((key) => {
      requireText(item[key], `${label}.${key}`);
    });
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) || ids.has(item.id)) {
      throw new Error(`${label}.id must be a unique lowercase slug`);
    }
    ids.add(item.id);
    if (!Number.isInteger(item.year) || item.year < 1 || item.year > 9999) {
      throw new Error(`${label}.year must be an integer from 1 to 9999`);
    }
    if (!Array.isArray(item.topicTags) || !item.topicTags.length ||
        item.topicTags.some((tag) => typeof tag !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag)) ||
        new Set(item.topicTags).size !== item.topicTags.length) {
      throw new Error(`${label}.topicTags must be nonempty, unique lowercase slugs`);
    }
    ["volume", "issue", "pages", "sourceNotes"].forEach((key) => {
      if (Object.hasOwn(item, key)) requireText(item[key], `${label}.${key}`);
    });
    if ((item.issue || item.pages) && !item.volume) {
      throw new Error(`${label}: issue/pages require volume`);
    }
    if (Object.hasOwn(item, "doi")) {
      requireText(item.doi, `${label}.doi`);
      if (!/^10\.\d{4,9}\/[^\s?#\\]+$/.test(item.doi)) {
        throw new Error(`${label}.doi must be a DOI identifier, not a URL`);
      }
      validateUrl(`https://doi.org/${item.doi}`, `${label}.doi URL`);
    }
    if (Object.hasOwn(item, "url")) validateUrl(item.url, `${label}.url`);
    if (!item.doi && !item.url) throw new Error(`${label} requires a DOI or URL`);
  });
  return data;
}

function renderPublications(data) {
  validatePublications(data);
  // Stable sort preserves JSON order within each year, matching the former browser renderer.
  return [...data].sort((a, b) => b.year - a.year).map((item) => {
    let citation = item.journal;
    if (item.volume) {
      citation += ` ${item.volume}`;
      if (item.issue) citation += `(${item.issue})`;
      if (item.pages) citation += `: ${item.pages}`;
    }
    const href = item.doi ? `https://doi.org/${item.doi}` : item.url;
    return [
      `          <article class="pub-item" role="listitem" data-publication-id="${escapeHtml(item.id)}" data-topic-tags="${escapeHtml(item.topicTags.join(" "))}">`,
      `            <div class="pub-year">${escapeHtml(item.year)}</div>`,
      '            <div class="pub-details">',
      `              <h3>${escapeHtml(item.title)}</h3>`,
      `              <p>${escapeHtml(`${item.authors} · ${citation}`)}</p>`,
      `              <a class="pub-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">Open publication ↗</a>`,
      "            </div>",
      `            <div class="pub-summary">${escapeHtml(item.summary)}</div>`,
      "          </article>"
    ].join("\n");
  }).join("\n");
}

function updateHtml(html, data) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start < 0 || end < start || html.indexOf(startMarker, start + 1) !== -1 ||
      html.indexOf(endMarker, end + 1) !== -1) {
    throw new Error("index.html must contain exactly one ordered pair of generated publication markers");
  }
  return html.slice(0, start + startMarker.length) + "\n" +
    renderPublications(data) + "\n" + html.slice(end);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== "--check")) {
    throw new Error("Usage: node scripts/render-publications.js [--check]");
  }
  const root = path.resolve(__dirname, "..");
  const indexPath = path.join(root, "index.html");
  const data = JSON.parse(fs.readFileSync(path.join(root, "data/publications.json"), "utf8"));
  const html = fs.readFileSync(indexPath, "utf8");
  const generated = updateHtml(html, data);
  if (args[0] === "--check") {
    if (generated !== html) {
      throw new Error("Static publications are stale; run node scripts/render-publications.js");
    }
    console.log(`Static publications match JSON (${data.length} cards).`);
  } else {
    if (generated !== html) fs.writeFileSync(indexPath, generated);
    console.log(`Rendered ${data.length} publication cards in index.html.`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Publication build failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { escapeHtml, validatePublications, renderPublications, updateHtml };
