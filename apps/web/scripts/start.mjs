import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const standalone = resolve(root, ".next/standalone");
if (!existsSync(resolve(standalone, "server.js"))) {
  throw new Error("Run npm run build before npm start.");
}
cpSync(resolve(root, ".next/static"), resolve(standalone, ".next/static"), {
  recursive: true,
});
if (existsSync(resolve(root, "public")))
  cpSync(resolve(root, "public"), resolve(standalone, "public"), {
    recursive: true,
  });
process.env.HOSTNAME = "0.0.0.0";
await import(pathToFileURL(resolve(standalone, "server.js")).href);
