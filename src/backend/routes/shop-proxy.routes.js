const express = require("express");
const http = require("http");
const https = require("https");
const { URL } = require("url");
const router = express.Router();

/**
 * Shop Proxy Routes
 * Proxies /shop/* requests to Netlify-hosted pages so they appear
 * under the bubbleinvest.org domain.
 *
 * Mapping:
 *   /shop/articles  → bubble-articles.netlify.app
 *   /shop/sentinel  → bubble-sentinel.netlify.app
 *   /shop/articles/* → bubble-articles.netlify.app/*
 *   /shop/sentinel/* → bubble-sentinel.netlify.app/*
 */

const SHOP_TARGETS = {
  articles: { base: "https://bubble-articles.netlify.app", path: "/", pathEn: "/" },
  sentinel: { base: "https://bubble-sentinel.netlify.app", path: "/sentinel.html", pathEn: "/sentinel-en.html" },
  invest: { base: "https://bubble-sentinel.netlify.app", path: "/invest.html", pathEn: "/invest-en.html" },
  community: { base: "https://bubble-sentinel.netlify.app", path: "/community.html", pathEn: "/community-en.html" },
};

/**
 * Proxy a request to a Netlify target.
 * Rewrites HTML responses to fix internal links.
 */
function proxyToNetlify(targetBase, subPath, req, res) {
  const targetUrl = new URL(subPath || "/", targetBase);

  // Forward query params
  if (req.url.includes("?")) {
    targetUrl.search = req.url.split("?")[1];
  }

  const client = targetUrl.protocol === "https:" ? https : http;

  const proxyReq = client.get(
    targetUrl.toString(),
    {
      headers: {
        "User-Agent": req.headers["user-agent"] || "BubbleLaunch-Proxy/1.0",
        Accept: req.headers["accept"] || "*/*",
        "Accept-Encoding": "identity", // no gzip to simplify rewriting
      },
    },
    (proxyRes) => {
      // Follow redirects (Netlify often 301s)
      if (
        proxyRes.statusCode >= 300 &&
        proxyRes.statusCode < 400 &&
        proxyRes.headers.location
      ) {
        const redirectUrl = new URL(proxyRes.headers.location, targetBase);
        // If redirect stays on the same Netlify site, proxy it
        if (redirectUrl.origin === new URL(targetBase).origin) {
          return proxyToNetlify(targetBase, redirectUrl.pathname + redirectUrl.search, req, res);
        }
        // Otherwise pass through the redirect
        res.redirect(proxyRes.statusCode, proxyRes.headers.location);
        return;
      }

      // Set response headers
      const contentType = proxyRes.headers["content-type"] || "";
      res.status(proxyRes.statusCode);

      // Pass through relevant headers
      if (proxyRes.headers["content-type"]) {
        res.setHeader("Content-Type", proxyRes.headers["content-type"]);
      }
      if (proxyRes.headers["cache-control"]) {
        res.setHeader("Cache-Control", proxyRes.headers["cache-control"]);
      }

      // For HTML, collect body and rewrite links
      if (contentType.includes("text/html")) {
        let body = "";
        proxyRes.setEncoding("utf8");
        proxyRes.on("data", (chunk) => (body += chunk));
        proxyRes.on("end", () => {
          // Rewrite absolute Netlify URLs to relative /shop/ paths
          body = body.replace(
            /https?:\/\/bubble-articles\.netlify\.app/g,
            "/shop/articles"
          );
          body = body.replace(
            /https?:\/\/bubble-sentinel\.netlify\.app/g,
            "/shop/sentinel"
          );

          // Rewrite relative API calls to point directly at Netlify
          // so Stripe checkout and webhooks still work.
          // fetch('/api/...') → fetch('https://netlify-site/api/...')
          body = body.replace(
            /fetch\(\s*['"]\/api\//g,
            `fetch('${targetBase}/api/`
          );
          // Also catch any href="/api/..." patterns
          body = body.replace(
            /href=["']\/api\//g,
            `href="${targetBase}/api/`
          );
          // Fix /.netlify/functions/ paths
          body = body.replace(
            /['"]\/\.netlify\/functions\//g,
            `'${targetBase}/.netlify/functions/`
          );
          // Rewrite internal links to other pages on same Netlify site
          // e.g., /manage.html → stays as-is since it's on the same Netlify site
          // but /sentinel.html etc. should map to /shop/sentinel etc.
          body = body.replace(/href=["']\/sentinel\.html["']/g, 'href="/shop/sentinel"');
          body = body.replace(/href=["']\/invest\.html["']/g, 'href="/shop/invest"');
          body = body.replace(/href=["']\/community\.html["']/g, 'href="/shop/community"');

          res.send(body);
        });
      } else {
        // For non-HTML (CSS, JS, images), pipe through directly
        proxyRes.pipe(res);
      }
    }
  );

  proxyReq.on("error", (err) => {
    console.error(`Shop proxy error for ${targetUrl}:`, err.message);
    res.status(502).send("Service temporarily unavailable");
  });
}

// /shop → redirect to /shop/articles (default)
router.get("/", (req, res) => {
  res.redirect(302, "/shop/articles");
});

// /shop/:site → proxy root of that Netlify site
// /shop/:site/* → proxy subpaths
router.get("/:site", handleShopProxy);
router.get("/:site/*", handleShopProxy);

// POST routes for Stripe checkout (API calls)
router.post("/:site/api/*", handleShopApiProxy);

function handleShopProxy(req, res) {
  const { site } = req.params;
  const config = SHOP_TARGETS[site];

  if (!config) {
    return res.status(404).send("Shop section not found");
  }

  // Get the subpath after /shop/:site, or use the configured default path
  // Support ?lang=en for English version
  const isEnglish = req.query.lang === "en";
  const defaultPath = isEnglish && config.pathEn ? config.pathEn : config.path;
  const subPath = req.params[0] ? "/" + req.params[0] : defaultPath;
  proxyToNetlify(config.base, subPath, req, res);
}

function handleShopApiProxy(req, res) {
  const { site } = req.params;
  const config = SHOP_TARGETS[site];

  if (!config) {
    return res.status(404).send("Shop section not found");
  }

  // For API calls, we redirect to the actual Netlify URL
  // because Stripe callbacks need the real domain
  const apiPath = "/api/" + req.params[0];
  const targetUrl = new URL(apiPath, config.base);

  // Forward the POST body
  const client = https;
  const proxyReq = client.request(
    targetUrl.toString(),
    {
      method: "POST",
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        "User-Agent": req.headers["user-agent"] || "BubbleLaunch-Proxy/1.0",
      },
    },
    (proxyRes) => {
      res.status(proxyRes.statusCode);
      if (proxyRes.headers["content-type"]) {
        res.setHeader("Content-Type", proxyRes.headers["content-type"]);
      }
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (err) => {
    console.error(`Shop API proxy error:`, err.message);
    res.status(502).json({ error: "Service temporarily unavailable" });
  });

  // Pipe request body
  req.pipe(proxyReq);
}

module.exports = router;
