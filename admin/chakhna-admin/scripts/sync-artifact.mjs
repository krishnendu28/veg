import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const sourceDir = path.resolve(projectRoot, "..", "artifacts", "tabio", "dist", "public");
const outputDir = path.resolve(projectRoot, "dist");

async function main() {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  await cp(sourceDir, outputDir, { recursive: true });
  console.log(`Synced artifact from ${sourceDir} to ${outputDir}`);
}

main().catch((error) => {
  console.error("Failed to sync artifact:", error);
  process.exit(1);
});
