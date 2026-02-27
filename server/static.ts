import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { getRouteMeta, type RouteMeta } from "./seo-routes";

function injectMeta(html: string, meta: RouteMeta): string {
  let result = html;

  // Title
  result = result.replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`);

  // Description
  result = result.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${meta.description}$2`,
  );

  // Canonical
  result = result.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    `$1${meta.canonical}$2`,
  );

  // Robots (only replace if meta has an explicit robots override)
  if (meta.robots) {
    result = result.replace(
      /(<meta\s+name="robots"\s+content=")[^"]*(")/,
      `$1${meta.robots}$2`,
    );
  }

  // OG tags
  result = result.replace(
    /(<meta\s+property="og:url"\s+content=")[^"]*(")/,
    `$1${meta.canonical}$2`,
  );
  result = result.replace(
    /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
    `$1${meta.title}$2`,
  );
  result = result.replace(
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    `$1${meta.description}$2`,
  );

  // Twitter tags
  result = result.replace(
    /(<meta\s+name="twitter:url"\s+content=")[^"]*(")/,
    `$1${meta.canonical}$2`,
  );
  result = result.replace(
    /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/,
    `$1${meta.title}$2`,
  );
  result = result.replace(
    /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,
    `$1${meta.description}$2`,
  );

  return result;
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Cache index.html at startup — mutate a per-request copy, never the source
  const indexHtmlPath = path.resolve(distPath, "index.html");
  const indexHtmlTemplate = fs.readFileSync(indexHtmlPath, "utf8");

  app.use(express.static(distPath));

  function sendIndex(urlPath: string, res: express.Response) {
    const meta = getRouteMeta(urlPath);
    const html = meta ? injectMeta(indexHtmlTemplate, meta) : indexHtmlTemplate;
    res.type("text/html").send(html);
  }

  // fall through to index.html if the file doesn't exist (Express 5 catch-all)
  // Express 5 / path-to-regexp requires named wildcard: *splat not *
  app.get("/", (req, res) => {
    sendIndex(req.path, res);
  });
  app.get("/*splat", (req, res) => {
    sendIndex(req.path, res);
  });
}
