import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const WORKTREE_DIR = path.join(ROOT, ".tmp", "starter-worktree");
const TEMPLATE_ROOT = path.join(ROOT, "template");
const README_TEMPLATE = path.join(ROOT, "README.template.md");
const MERMAID_MANIFEST_PATH = "src/lib/feed/mermaid-manifest.json";
const TARGET_BRANCH = readArg("--branch") || "starter";
const PUBLISH = hasFlag("--publish");
const ALLOW_DIRTY = hasFlag("--allow-dirty");

main();

function main() {
  assertGitRepo();
  ensureTemplateInputs();

  const dirty = git(["status", "--porcelain"], { cwd: ROOT }).stdout.trim();
  if (dirty && !ALLOW_DIRTY) {
    throw new Error(
      "Working tree is not clean. Commit/stash first, or rerun with --allow-dirty."
    );
  }

  mkdirSync(path.dirname(WORKTREE_DIR), { recursive: true });
  safelyRemoveWorktree();

  git(["worktree", "add", "--force", WORKTREE_DIR, "HEAD"], { cwd: ROOT });

  try {
    if (dirty && ALLOW_DIRTY) {
      overlayDirtyChanges(ROOT, WORKTREE_DIR);
    }

    git(["checkout", "-B", TARGET_BRANCH], { cwd: WORKTREE_DIR });
    applyStarterTemplate(WORKTREE_DIR);

    const mermaidManifest = path.join(WORKTREE_DIR, MERMAID_MANIFEST_PATH);
    if (existsSync(path.dirname(mermaidManifest))) {
      writeFileSync(mermaidManifest, "{}\n");
    }

    commitSnapshot(WORKTREE_DIR);

    if (PUBLISH) {
      git(["push", "-f", "origin", TARGET_BRANCH], { cwd: WORKTREE_DIR });
      console.log(`Published template branch: ${TARGET_BRANCH}`);
    } else {
      console.log(`Template branch prepared locally: ${TARGET_BRANCH}`);
      console.log("Use --publish (npm run publish) to push to remote.");
    }
  } finally {
    safelyRemoveWorktree();
  }
}

function applyStarterTemplate(worktreeRoot) {
  // Remove maintainer-only files/directories from starter branch.
  rmSync(path.join(worktreeRoot, "template"), { recursive: true, force: true });
  rmSync(path.join(worktreeRoot, "docs"), { recursive: true, force: true });
  rmSync(path.join(worktreeRoot, ".idea"), { recursive: true, force: true });
  rmSync(path.join(worktreeRoot, "README.template.md"), { force: true });
  rmSync(path.join(worktreeRoot, "scripts"), { recursive: true, force: true });
  rmSync(path.join(worktreeRoot, ".contentlayer"), { recursive: true, force: true });
  rmSync(path.join(worktreeRoot, ".github", "workflows", "publish-starter.yml"), { force: true });

  // Reset content layer.
  rmSync(path.join(worktreeRoot, "data", "content", "blog"), { recursive: true, force: true });
  rmSync(path.join(worktreeRoot, "data", "content", "pages"), { recursive: true, force: true });
  mkdirSync(path.join(worktreeRoot, "data", "content", "blog"), { recursive: true });
  mkdirSync(path.join(worktreeRoot, "data", "content", "pages"), { recursive: true });

  cpSync(
    path.join(TEMPLATE_ROOT, "data", "content", "blog"),
    path.join(worktreeRoot, "data", "content", "blog"),
    { recursive: true }
  );
  cpSync(
    path.join(TEMPLATE_ROOT, "data", "content", "pages"),
    path.join(worktreeRoot, "data", "content", "pages"),
    { recursive: true }
  );

  copyFile(
    path.join(TEMPLATE_ROOT, "data", "microblog.yaml"),
    path.join(worktreeRoot, "data", "microblog.yaml")
  );
  copyFile(
    path.join(TEMPLATE_ROOT, "data", "links.yaml"),
    path.join(worktreeRoot, "data", "links.yaml")
  );
  copyFile(
    path.join(TEMPLATE_ROOT, "data", "sitemetadata.js"),
    path.join(worktreeRoot, "data", "sitemetadata.js")
  );
  copyFile(
    path.join(TEMPLATE_ROOT, "data", "headerNavLinks.js"),
    path.join(worktreeRoot, "data", "headerNavLinks.js")
  );

  // Reset static assets for starter.
  rmSync(path.join(worktreeRoot, "public", "static"), { recursive: true, force: true });
  mkdirSync(path.join(worktreeRoot, "public", "static"), { recursive: true });
  cpSync(path.join(TEMPLATE_ROOT, "public", "static"), path.join(worktreeRoot, "public", "static"), {
    recursive: true,
  });

  // Remove stale secondary static directory if present.
  rmSync(path.join(worktreeRoot, "src", "public"), { recursive: true, force: true });

  // Use starter README on the published branch.
  copyFile(README_TEMPLATE, path.join(worktreeRoot, "README.md"));

  // Drop maintainer publish scripts from starter package.json.
  patchStarterPackageJson(worktreeRoot);
}

function patchStarterPackageJson(worktreeRoot) {
  const packageJsonPath = path.join(worktreeRoot, "package.json");
  if (!existsSync(packageJsonPath)) return;

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts = packageJson.scripts || {};
  delete packageJson.scripts.publish;
  delete packageJson.scripts["publish:dry"];
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function commitSnapshot(cwd) {
  git(["add", "-A"], { cwd });
  const check = spawnSync("git", ["diff", "--cached", "--quiet"], { cwd, encoding: "utf8" });
  if (check.status === 0) {
    console.log("No template changes to commit.");
    return;
  }

  git(["commit", "-m", "chore: sync starter template snapshot"], { cwd });
}

function overlayDirtyChanges(sourceRoot, worktreeRoot) {
  const modified = splitLines(git(["diff", "--name-only"], { cwd: sourceRoot }).stdout);
  const staged = splitLines(git(["diff", "--name-only", "--cached"], { cwd: sourceRoot }).stdout);
  const untracked = splitLines(
    git(["ls-files", "--others", "--exclude-standard"], { cwd: sourceRoot }).stdout
  );
  const deleted = new Set([
    ...splitLines(git(["diff", "--name-only", "--diff-filter=D"], { cwd: sourceRoot }).stdout),
    ...splitLines(git(["diff", "--name-only", "--cached", "--diff-filter=D"], { cwd: sourceRoot }).stdout),
  ]);

  const toCopy = new Set([...modified, ...staged, ...untracked]);
  for (const rel of toCopy) {
    if (!rel || deleted.has(rel) || rel.startsWith(".git")) continue;
    const source = path.join(sourceRoot, rel);
    const dest = path.join(worktreeRoot, rel);
    if (!existsSync(source)) continue;
    copyPath(source, dest);
  }

  for (const rel of deleted) {
    if (!rel || rel.startsWith(".git")) continue;
    rmSync(path.join(worktreeRoot, rel), { recursive: true, force: true });
  }
}

function copyPath(source, dest) {
  const sourceStat = statSync(source);
  if (sourceStat.isDirectory()) {
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(path.dirname(dest), { recursive: true });
    cpSync(source, dest, { recursive: true });
    return;
  }

  mkdirSync(path.dirname(dest), { recursive: true });
  copyFile(source, dest);
}

function copyFile(source, dest) {
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, readFileSync(source));
}

function safelyRemoveWorktree() {
  if (!existsSync(WORKTREE_DIR)) return;
  const removeResult = spawnSync("git", ["worktree", "remove", "--force", WORKTREE_DIR], {
    cwd: ROOT,
    encoding: "utf8",
  });

  if (removeResult.status !== 0) {
    try {
      rmSync(WORKTREE_DIR, { recursive: true, force: true });
    } catch {
      console.warn(`warning: unable to remove worktree directory: ${WORKTREE_DIR}`);
    }
  }
}

function ensureTemplateInputs() {
  const required = [
    TEMPLATE_ROOT,
    README_TEMPLATE,
    path.join(TEMPLATE_ROOT, "data", "content", "blog", "hello-prologue.md"),
    path.join(TEMPLATE_ROOT, "data", "content", "pages", "about.md"),
    path.join(TEMPLATE_ROOT, "data", "sitemetadata.js"),
    path.join(TEMPLATE_ROOT, "data", "headerNavLinks.js"),
    path.join(TEMPLATE_ROOT, "data", "links.yaml"),
    path.join(TEMPLATE_ROOT, "data", "microblog.yaml"),
  ];

  for (const target of required) {
    if (!existsSync(target)) {
      throw new Error(`Missing template input: ${target}`);
    }
  }
}

function assertGitRepo() {
  const result = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0 || !result.stdout.includes("true")) {
    throw new Error("This script must run inside a git repository.");
  }
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function splitLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function git(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: options.cwd || ROOT,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed\n${result.stderr || result.stdout || ""}`.trim()
    );
  }
  return result;
}
