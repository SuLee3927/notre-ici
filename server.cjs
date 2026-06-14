const express = require("express");
const path = require("path");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;
const DESIRE_HOST = "129.226.158.222";
const DESIRE_PORT = 8765;

// proxy /api/desire/* → VPS desire server
app.use("/api/desire", (req, res) => {
  const options = {
    hostname: DESIRE_HOST,
    port: DESIRE_PORT,
    path: "/api/desire" + req.path + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""),
    method: req.method,
    headers: { "content-type": req.headers["content-type"] || "application/json" },
  };
  const proxy = http.request(options, (proxyRes) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.status(proxyRes.statusCode);
    proxyRes.pipe(res);
  });
  proxy.on("error", () => res.status(502).json({ error: "desire server unreachable" }));
  if (req.method !== "GET") req.pipe(proxy);
  else proxy.end();
});

// serve built frontend
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

app.listen(PORT, () => console.log(`notre-ici on :${PORT}`));
