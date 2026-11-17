// tools/check_pages.mjs — GitHub Pages 배포 확인 도구 (사이트 코드 아님)
// 쓰는 법:
//   node tools/check_pages.mjs --local                     커밋·경로만 점검
//   node tools/check_pages.mjs https://<id>.github.io/recipe-maker/   공개 주소 대조
//   ... --wait 15        모두 같아질 때까지 60초마다 다시 본다(최대 15분, 백그라운드로 돌릴 것)
//   ... --html <파일>    index.html 대신 이 파일에서 경로를 모은다(저장소 맨 위에 있는 것처럼 푼다)
// Node 기본 기능만 쓴다(fetch, crypto, fs, path, child_process).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = process.cwd();
const TITLE = '<title>용액 레시피 메이커</title>';
const EXTRA_PATHS = []; // PG3: 스크립트 안 fetch/Worker/import 경로 — 찾은 것 없음

// ---------- 인자 ----------
const args = process.argv.slice(2);
let local = false, url = null, waitMin = 0, htmlFile = null;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--local') local = true;
  else if (a === '--wait') { waitMin = Number(args[++i]) || 0; }
  else if (a === '--html') { htmlFile = args[++i] || null; }
  else if (/^https?:\/\//i.test(a)) url = a;
  else { console.log('알 수 없는 인자: ' + a); process.exit(2); }
}
if (!local && !url) {
  console.log('쓰는 법: node tools/check_pages.mjs --local | <공개 주소> [--wait N] [--html <파일>]');
  process.exit(2);
}

// ---------- git ----------
const GIT_CANDIDATES = ['git', 'C:\\Program Files\\Git\\cmd\\git.exe'];
let GIT = null;
for (const g of GIT_CANDIDATES) {
  try { execFileSync(g, ['--version'], { stdio: ['ignore', 'pipe', 'ignore'] }); GIT = g; break; } catch { /* 다음 후보 */ }
}
function git(argv, opts = {}) {
  return execFileSync(GIT, argv, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024, ...opts });
}

// ---------- index.html ----------
const indexPath = path.join(ROOT, 'index.html');
let indexOk = false;
try { indexOk = statSync(indexPath).isFile(); } catch { indexOk = false; }
if (!indexOk) { console.log('index.html 없음 — 랄프톤 폴더 맨 위에서 실행하세요'); process.exit(2); }
if (!GIT) { console.log('git을 찾을 수 없음'); process.exit(2); }

// ---------- 참조 모으기 ----------
function skipRef(r) {
  return r === '' || r.startsWith('data:') || r.startsWith('#') || /^mailto:/i.test(r);
}
function stripQuery(r) { return r.replace(/[?#].*$/, ''); }
function normJoin(base, rel) {
  // base: 'fonts' 같은 저장소 안 폴더('' = 맨 위). 결과는 / 구분 저장소 경로.
  const joined = path.posix.normalize((base ? base + '/' : '') + rel);
  return joined.replace(/^\.\//, '');
}

function collectRefs() {
  const refs = []; // { raw, from, path }
  const srcHtml = htmlFile ? path.resolve(ROOT, htmlFile) : indexPath;
  const html = readFileSync(srcHtml, 'utf8');
  const fromName = htmlFile ? htmlFile.replace(/\\/g, '/') : 'index.html';
  const re = /\b(?:src|href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/gi;
  let m;
  while ((m = re.exec(html))) {
    const raw = (m[1] ?? m[2] ?? m[3] ?? '').trim();
    if (skipRef(raw)) continue;
    refs.push({ raw, from: fromName, path: normJoin('', stripQuery(raw)) });
  }
  // fonts/fonts.css의 url()
  let css = null;
  try { css = readFileSync(path.join(ROOT, 'fonts', 'fonts.css'), 'utf8'); } catch { css = null; }
  if (css !== null) {
    const ure = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/gi;
    while ((m = ure.exec(css))) {
      const raw = (m[1] ?? m[2] ?? m[3] ?? '').trim();
      if (skipRef(raw)) continue;
      refs.push({ raw, from: 'fonts/fonts.css', path: normJoin('fonts', stripQuery(raw)) });
    }
  }
  for (const p of EXTRA_PATHS) refs.push({ raw: p, from: '(스크립트)', path: normJoin('', p) });
  return refs;
}

function sitePaths(refs) {
  // 사이트 파일 목록: index.html, fonts/fonts.css(있으면), 상대 참조들 (중복 제거, 순서 유지)
  const out = ['index.html'];
  try { if (statSync(path.join(ROOT, 'fonts', 'fonts.css')).isFile()) out.push('fonts/fonts.css'); } catch { /* 없음 */ }
  for (const r of refs) {
    if (isExternal(r.raw) || /^[\\/]/.test(r.raw) || r.raw.includes('\\')) continue;
    if (!out.includes(r.path)) out.push(r.path);
  }
  return out;
}
function isExternal(r) { return /^https?:\/\//i.test(r) || r.startsWith('//'); }

// ---------- --local ----------
function existsExact(rel) {
  // 부모 폴더의 readdirSync 목록과 글자 그대로 견준다(existsSync는 윈도우에서 대소문자 무시).
  const segs = rel.split('/');
  let dir = ROOT;
  for (const s of segs) {
    if (s === '' || s === '.' || s === '..') return false;
    let names;
    try { names = readdirSync(dir); } catch { return false; }
    if (!names.includes(s)) return false;
    dir = path.join(dir, s);
  }
  return true;
}

function runLocal() {
  let tracked = null;
  try {
    const out = git(['ls-files', '-z'], { encoding: 'utf8' });
    const list = out.split('\0').filter(Boolean);
    if (list.length > 0) tracked = new Set(list);
  } catch { tracked = null; }
  console.log(tracked ? '목록: git ls-files' : '목록: 폴더');
  const has = (p) => (tracked ? tracked.has(p) : existsExact(p));

  const refs = collectRefs();
  const self = [{ raw: 'index.html', from: '(도구)', path: 'index.html' }];
  if (has('fonts/fonts.css') || existsExact('fonts/fonts.css')) self.push({ raw: 'fonts/fonts.css', from: '(도구)', path: 'fonts/fonts.css' });
  const all = [...self, ...refs];
  const seen = new Set();
  let n = 0, k = 0;
  for (const r of all) {
    const key = r.from + '\0' + r.raw;
    if (seen.has(key)) continue;
    seen.add(key);
    n++;
    const probs = [];
    if (/^[\\/]/.test(r.raw) || r.raw.includes('\\')) probs.push('/나 \\로 시작하거나 \\가 있음');
    if (isExternal(r.raw)) probs.push('http://·https://·//로 시작함(외부 주소)');
    else if (!has(r.path)) probs.push('없음(글자 그대로 같은 파일이 목록에 없음)');
    for (const p of probs) { k++; console.log(`문제  ${r.from}: "${r.raw}" — ${p}`); }
  }
  console.log(`경로 ${n}개, 문제 ${k}개`);
  return k === 0;
}

// ---------- 공개 주소 ----------
const EXPECT = {
  '.html': ['text/html'],
  '.js': ['text/javascript', 'application/javascript'],
  '.css': ['text/css'],
  '.woff2': ['font/woff2'],
  '.woff': ['font/woff'],
  '.txt': ['text/plain'],
};
const sha = (buf) => createHash('sha256').update(buf).digest('hex');

async function runRemote() {
  const base = url.endsWith('/') ? url : url + '/';
  let short = '없음';
  try { short = git(['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* 커밋 없음 */ }
  const files = sitePaths(collectRefs());
  let same = 0, diff = 0, nf = 0, other = 0;
  for (const p of files) {
    let want = null;
    try {
      want = sha(execFileSync(GIT, ['show', 'HEAD:' + p], { cwd: ROOT, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }));
    } catch { want = null; }
    let res;
    try {
      res = await fetch(base + encodeURI(p), { cache: 'no-store' });
    } catch (e) {
      other++;
      console.log(`오류 ${p} — ${e && (e.cause?.code || e.message) || e}`);
      continue;
    }
    const ct = res.headers.get('content-type') || '(없음)';
    const buf = Buffer.from(await res.arrayBuffer());
    let verdict;
    if (res.status === 404) { nf++; verdict = '404'; }
    else if (res.status !== 200) { other++; verdict = '그 밖'; }
    else if (want === null) { other++; verdict = '커밋에 없음'; }
    else if (sha(buf) === want) { same++; verdict = '같음'; }
    else { diff++; verdict = '다름'; }
    console.log(`${res.status} ${ct}  ${verdict}  ${p}`);
    const exp = EXPECT[path.posix.extname(p).toLowerCase()];
    if (res.status === 200 && exp && !exp.some((e) => ct.toLowerCase().startsWith(e))) {
      console.log(`경고  ${p}: content-type ${ct} (기대 ${exp.join(' 또는 ')})`);
    }
  }
  let titleOk = false;
  try {
    const r = await fetch(base, { cache: 'no-store' });
    const t = await r.text();
    titleOk = r.status === 200 && t.includes(TITLE);
    console.log(`첫 화면 ${r.status}  제목 ${titleOk ? '있음' : '없음'}  ${base}`);
  } catch (e) {
    console.log(`첫 화면 오류 — ${e && (e.cause?.code || e.message) || e}`);
  }
  const n = files.length;
  console.log(`파일 ${n}개: 같음 ${same}/${n}, 다름 ${diff}, 404 ${nf}, 그 밖 ${other} (커밋 ${short})`);
  return same === n && titleOk;
}

// ---------- 실행 ----------
let ok = true;
if (local) ok = runLocal() && ok;
if (url) {
  const deadline = Date.now() + waitMin * 60 * 1000;
  let r = await runRemote();
  while (!r && waitMin > 0 && Date.now() + 60 * 1000 <= deadline) {
    console.log('60초 뒤 다시 봅니다…');
    await new Promise((res) => setTimeout(res, 60 * 1000));
    r = await runRemote();
  }
  ok = r && ok;
}
process.exit(ok ? 0 : 1);
