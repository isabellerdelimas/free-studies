const { cp, mkdir, rm, stat } = require("node:fs/promises");
const { join } = require("node:path");

const root = join(__dirname, "..");
const dist = join(root, "dist");
const staticEntries = ["index.html", "quiz.js", "math-visuals.js", "styles.css", "data", "images"];
const ignoredFiles = new Set([".DS_Store"]);

async function buildStaticSite() {
  await rm(dist, { force: true, recursive: true });
  await mkdir(dist, { recursive: true });

  await Promise.all(
    staticEntries.map(async (entry) => {
      const sourcePath = join(root, entry);
      const sourceExists = await stat(sourcePath)
        .then(() => true)
        .catch((error) => {
          if (error.code === "ENOENT") return false;
          throw error;
        });

      if (!sourceExists) return;

      return cp(sourcePath, join(dist, entry), {
        filter: (source) => !ignoredFiles.has(source.split(/[\\/]/).pop()),
        recursive: true,
      });
    }),
  );
}

buildStaticSite().catch((error) => {
  console.error(error);
  process.exit(1);
});
