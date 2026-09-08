function isNewsletterSourcePath(originalUrl) {
  let candidate = String(originalUrl || "").split("?", 1)[0];
  for (let pass = 0; pass < 3; pass += 1) {
    const normalized = candidate.replaceAll("\\", "/").toLowerCase();
    if (
      normalized === "/newsletter-editions" ||
      normalized.startsWith("/newsletter-editions/")
    ) {
      return true;
    }
    try {
      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) break;
      candidate = decoded;
    } catch (_error) {
      return true;
    }
  }
  return false;
}

function denyNewsletterSource(req, res, next) {
  if (isNewsletterSourcePath(req.originalUrl)) return res.sendStatus(404);
  return next();
}

module.exports = { denyNewsletterSource, isNewsletterSourcePath };
