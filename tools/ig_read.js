#!/usr/bin/env node
// Read public Instagram posts (caption, account, location) for the daily inbox routine.
//
//   node tools/ig_read.js <url> [<url> ...]      → JSON array on stdout
//
// Works for /p/, /reel/, /tv/ links and instagram.com/share/... short links
// (they are opened once to find the real post). The caption comes from the
// public embed page (/p/<code>/embed/captioned/), which needs no login; if
// that fails, the post page's og:description is used instead.
// Needs: the preinstalled Playwright + Chromium, and instagram.com /
// www.instagram.com allowed in the cloud environment's network settings.
const { chromium } = require('playwright');

const CODE_RE = /instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/;

function shortcodeOf(url) {
  const m = CODE_RE.exec(url || '');
  return m ? { kind: m[1] === 'reels' ? 'reel' : m[1], code: m[2] } : null;
}

async function readOne(page, input) {
  const out = { input, url: null, shortcode: null, username: null, location: null, caption: null, method: null, error: null };
  try {
    let sc = shortcodeOf(input);
    if (!sc) {
      // share link → follow to the real post
      await page.goto(input, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2500);
      sc = shortcodeOf(page.url());
      if (!sc) {
        const og = await page.evaluate(() => document.querySelector('meta[property="og:url"]')?.content || '');
        sc = shortcodeOf(og);
      }
      if (!sc) throw new Error('could not resolve share link to a post (landed on ' + page.url() + ')');
    }
    out.shortcode = sc.code;
    out.url = `https://www.instagram.com/${sc.kind}/${sc.code}/`;

    // 1) embed page — full caption, no login
    await page.goto(`https://www.instagram.com/p/${sc.code}/embed/captioned/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('.Caption, .EmbedCaption, .UsernameText', { timeout: 15000 }).catch(() => {});
    const e = await page.evaluate(() => {
      const t = (s) => document.querySelector(s)?.innerText?.trim() || null;
      return {
        caption: t('.Caption') || t('.EmbedCaption'),
        username: t('.UsernameText') || t('.Username'),
        location: t('.Location') || t('.HeaderLocation') || null,
      };
    });
    if (e.caption) {
      out.username = e.username;
      out.location = e.location;
      // the embed caption starts with the username on its own line
      out.caption = e.username && e.caption.startsWith(e.username) ? e.caption.slice(e.username.length).trim() : e.caption;
      out.method = 'embed';
      return out;
    }

    // 2) fallback — og:description of the post page ("N likes ... - user on date: "caption"")
    await page.goto(out.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500);
    const og = await page.evaluate(() => document.querySelector('meta[property="og:description"]')?.content || '');
    if (og) {
      const m = /-\s*([A-Za-z0-9_.]+)\s+on\s+[^:]+:\s*"([\s\S]*)"\.?\s*$/.exec(og);
      out.username = m ? m[1] : null;
      out.caption = m ? m[2].trim() : og;
      out.method = 'og';
      return out;
    }
    throw new Error('no caption found (post may be private, deleted, or login-only)');
  } catch (err) {
    out.error = String(err.message || err).split('\n')[0];
    return out;
  }
}

(async () => {
  const urls = process.argv.slice(2);
  if (!urls.length) {
    console.error('usage: node tools/ig_read.js <instagram url> [...]');
    process.exit(2);
  }
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const browser = await chromium.launch(proxy ? { proxy: { server: proxy } } : {});
  const page = await (await browser.newContext({ locale: 'en-US' })).newPage();
  const results = [];
  for (const u of urls) results.push(await readOne(page, u.trim()));
  await browser.close();
  console.log(JSON.stringify(results, null, 1));
})();
