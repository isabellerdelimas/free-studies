const { createReadStream } = require("node:fs");
const { stat } = require("node:fs/promises");
const { createServer } = require("node:http");
const { extname, join, normalize, resolve, sep } = require("node:path");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 5173);
const ROOT = resolve(__dirname);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".heic": "image/heic",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function getFilePath(pathname) {
  const decodedPath = decodeURIComponent(pathname.split("?")[0]);
  const normalizedPath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = resolve(join(ROOT, normalizedPath));

  if (requestedPath !== ROOT && !requestedPath.startsWith(`${ROOT}${sep}`)) {
    return null;
  }

  return requestedPath;
}

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    let filePath = getFilePath(pathname);

    if (!filePath) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = join(filePath, "index.html");
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500);
    response.end(error.code === "ENOENT" ? "Not found" : "Server error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Free Studies is running at http://${HOST}:${PORT}/`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Try another port, for example: PORT=5174 npm start`);
  } else if (error.code === "EACCES" || error.code === "EPERM") {
    console.error(`Could not listen on ${HOST}:${PORT}. Check your permissions or try another port.`);
  } else {
    console.error(error.message);
  }

  process.exit(1);
});
