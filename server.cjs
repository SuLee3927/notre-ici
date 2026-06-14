const express = require("express");
const path = require("path");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;
const DESIRE_HOST = "129.226.158.222";
const DESIRE_PORT = 8765;
const SLOT_PORT   = 3000;

function makeProxy(hostname, port, basePath) {
  return (req, res) => {
    const options = {
      hostname, port,
      path: basePath + req.path + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""),
      method: req.method,
      headers: { "content-type": req.headers["content-type"] || "application/json" },
    };
    const proxy = http.request(options, (proxyRes) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.status(proxyRes.statusCode);
      proxyRes.pipe(res);
    });
    proxy.on("error", () => res.status(502).json({ error: "upstream unreachable" }));
    if (req.method !== "GET") req.pipe(proxy);
    else proxy.end();
  };
}

app.use(express.json());
app.use("/api/desire", makeProxy(DESIRE_HOST, DESIRE_PORT, "/api/desire"));
app.use("/api/slot",   makeProxy("127.0.0.1",  SLOT_PORT,   "/api"));

// serve built frontend
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

app.listen(PORT, () => console.log(`notre-ici on :${PORT}`));
