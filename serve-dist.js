const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "dist", "moc-angular-prototype", "browser");
const host = "127.0.0.1";
const port = Number(process.env.PORT || 4300);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    const requestPath = decodeURIComponent(req.url.split("?")[0]);
    const resolved = path.normalize(path.join(root, requestPath === "/" ? "index.html" : requestPath));

    if (!resolved.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(resolved, (error, data) => {
      if (error) {
        fs.readFile(path.join(root, "index.html"), (indexError, indexData) => {
          if (indexError) {
            res.writeHead(404);
            res.end("Not found");
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(indexData);
        });
        return;
      }

      res.writeHead(200, { "Content-Type": contentTypes[path.extname(resolved)] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(port, host, () => {
    console.log(`Angular build served at http://${host}:${port}/`);
  });
