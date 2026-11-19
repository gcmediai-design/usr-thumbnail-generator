#!/usr/bin/env node
// data/*.json 과 assets/images 가 서로 맞는지 검사합니다. 설치할 것 없이 `node tools/check-data.mjs` 로 실행합니다.
// 그림·가이드·분류를 추가한 뒤 push 하기 전에 한 번 돌려 주세요. 오류가 있으면 종료 코드 1로 끝납니다.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [], warnings = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);
const load = (p) => {
  try { return JSON.parse(readFileSync(join(root, p), "utf8")); }
  catch (e) { err(`${p}: JSON을 읽지 못했어요 (${e.message})`); return null; }
};

/** WebP·PNG 파일의 실제 가로·세로를 읽는다. 모르는 형식이면 null. */
function imageSize(buf) {
  if (buf.toString("latin1", 1, 4) === "PNG") return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  if (buf.toString("latin1", 0, 4) === "RIFF" && buf.toString("latin1", 8, 12) === "WEBP") {
    const kind = buf.toString("latin1", 12, 16);
    if (kind === "VP8X") return [buf.readUIntLE(24, 3) + 1, buf.readUIntLE(27, 3) + 1];
    if (kind === "VP8 ") return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
    if (kind === "VP8L") { const b = buf.readUInt32LE(21); return [(b & 0x3fff) + 1, ((b >> 14) & 0x3fff) + 1]; }
  }
  return null;
}
function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : n.startsWith(".") ? [] : [p];
  });
}

const lib = load("data/assets.json"), cats = load("data/categories.json"), presets = load("data/presets.json"), rules = load("data/rules.json");
if (lib && cats && presets && rules) {
  const series = lib.series ?? {}, assets = lib.assets ?? [];
  const ids = new Set(), hashes = new Map(), files = new Set();

  for (const a of assets) {
    const at = `assets.json › ${a.id ?? "(id 없음)"}`;
    for (const k of ["id", "series", "name", "kw", "w", "h", "file"]) if (a[k] === undefined || a[k] === "") err(`${at}: '${k}' 값이 없어요`);
    if (a.id && !/^[a-z0-9_]+$/.test(a.id)) err(`${at}: id는 영문 소문자·숫자·밑줄(_)만 쓸 수 있어요`);
    if (ids.has(a.id)) err(`${at}: 같은 id가 두 번 있어요`);
    ids.add(a.id);
    if (!(a.series in series)) err(`${at}: 시리즈 '${a.series}'가 series 목록에 없어요`);
    if (a.person && !rules.roles?.[a.role]) err(`${at}: 인물 에셋의 role '${a.role}'이 rules.json roles에 없어요`);
    if (!a.file) continue;
    const p = join(root, a.file);
    files.add(p);
    if (!existsSync(p)) { err(`${at}: 그림 파일이 없어요 → ${a.file}`); continue; }
    const buf = readFileSync(p), size = imageSize(buf);
    if (!size) warn(`${at}: 크기를 읽을 수 없는 형식이에요 (WebP·PNG 권장) → ${a.file}`);
    else if (size[0] !== a.w || size[1] !== a.h) err(`${at}: w·h(${a.w}×${a.h})가 실제 그림 크기(${size[0]}×${size[1]})와 달라요`);
    const h = createHash("sha256").update(buf).digest("hex");
    if (hashes.has(h)) warn(`${at}: '${hashes.get(h)}'와 똑같은 그림 파일이에요 (중복)`);
    hashes.set(h, a.id);
  }
  const imgDir = join(root, "assets/images");
  if (existsSync(imgDir)) for (const p of walk(imgDir)) if (!files.has(p)) warn(`어디에도 등록되지 않은 그림 파일이에요 → ${relative(root, p)}`);

  const catIds = new Set();
  for (const c of cats) {
    if (catIds.has(c.id)) err(`categories.json › ${c.id}: 같은 id가 두 번 있어요`);
    catIds.add(c.id);
    for (const k of ["label", "a", "b", "accent", "desc"]) if (!c[k]) err(`categories.json › ${c.id}: '${k}' 값이 없어요`);
    for (const k of ["a", "b", "accent"]) if (c[k] && !/^#[0-9a-fA-F]{6}$/.test(c[k])) err(`categories.json › ${c.id}: ${k}는 #RRGGBB 형식이어야 해요`);
  }

  const pfiles = new Set();
  for (const p of presets) {
    const at = `presets.json › ${p.file ?? p.title}`;
    if (!p.file || !p.title) err(`${at}: file과 title은 꼭 있어야 해요`);
    if (pfiles.has(p.file)) err(`${at}: 같은 file이 두 번 있어요`);
    pfiles.add(p.file);
    if (!catIds.has(p.cat)) err(`${at}: 분류 '${p.cat}'가 categories.json에 없어요`);
    if (!ids.has(p.main)) err(`${at}: main '${p.main}'이 assets.json에 없어요`);
    if (p.sub && !ids.has(p.sub)) err(`${at}: sub '${p.sub}'가 assets.json에 없어요`);
  }
  if (presets.filter((p) => p.default).length > 1) err("presets.json: default는 한 곳에만 둘 수 있어요");

  const refs = { claimOk: rules.claimOk, delivery: rules.delivery, faceRobot: rules.faceRobot, styleRefs: rules.styleRefs };
  for (const [k, v] of Object.entries(rules.affinity ?? {})) {
    refs[`affinity.${k}`] = v;
    if (!catIds.has(k)) warn(`rules.json › affinity.${k}: categories.json에 없는 분류예요`);
  }
  for (const [k, list] of Object.entries(refs)) for (const id of list ?? []) if (!ids.has(id)) err(`rules.json › ${k}: '${id}'가 assets.json에 없어요`);

  console.log(`에셋 ${assets.length}개 · 분류 ${cats.length}개 · 가이드 ${presets.length}개 확인`);
}
for (const w of warnings) console.log("주의  " + w);
for (const e of errors) console.log("오류  " + e);
console.log(errors.length ? `\n오류 ${errors.length}건이 있어요. 고친 뒤 다시 실행해 주세요.` : "\n문제 없어요.");
process.exit(errors.length ? 1 : 0);
