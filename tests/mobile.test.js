// 전체 검증 (23장: 야간 개선 합치기 — 아래 탭 바, 처음 열 때 그리기): `node --test`
// 테스트 이름 맨 앞의 A번호가 SPEC.md 23장의 수용 기준이다. 화면에서 보는 것(위치, 크기, 눌림)은 화면 확인이 맡는다.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(ROOT, name), 'utf8');

test('A86 아래 탭 바: 다섯 자리의 주소가 모두 있는 화면이고, 화면 끝까지 쓰는 틀과 위쪽 띠 색이 들어 있다', () => {
  const html = read('index.html');
  const bar = html.match(/<nav class="tabbar no-print" id="tabbar"[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(bar, '탭 바가 없다');
  const links = [...bar[1].matchAll(/<a href="#([a-z]+)" data-nav="([a-z]+)">/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(links.map(([href]) => href), ['home', 'solid', 'labs', 'tools', 'recipe']);
  for (const [href, nav] of links) {
    assert.equal(nav, href);
    assert.ok(html.includes(`id="panel-${href}"`), `${href} 화면이 없다`);
  }
  assert.deepEqual([...bar[1].matchAll(/<span class="tabbar__text">([^<]+)<\/span>/g)].map((m) => m[1]), ['홈', '용액 조제', '실험', '계산 도구', '레시피·라벨']);
  assert.ok(bar[1].includes('id="tabbar-count"'), '라벨 수를 보여 줄 자리가 없다');
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/);
  assert.equal([...html.matchAll(/<meta name="theme-color" /g)].length, 2);
  // 개발 기록이 길어져도 제목이 파일 앞 8KB 안에 있어야 게시한 곳에서 제목을 읽는다
  assert.ok(Buffer.byteLength(html.slice(0, html.indexOf('<title>')), 'utf8') < 7000, '개발 기록이 너무 길다');
  const css = read('style.css');
  // 넓은 화면에서는 감추고 640px 이하에서만 보인다. 화면 끝의 자리(노치, 홈 바)를 비운다
  assert.match(css, /\n\.tabbar \{\n  display: none;\n\}/);
  assert.match(css, /@media \(max-width: 640px\) \{[\s\S]*?\n  \.tabbar \{\n    position: fixed;/);
  assert.match(css, /env\(safe-area-inset-bottom, 0px\)/);
  assert.match(css, /@media print \{\n  \.tabbar,\n  body::before \{\n    display: none !important;/);
});

test('A89 처음 열 때 그리기: 미뤄 둔 화면은 모두 있는 화면이고, 다른 화면에서 바로 여는 함수는 먼저 그 화면을 그린다', () => {
  const js = read('app.js');
  const html = read('index.html');
  const table = js.match(/const FIRST_DRAW = \{([\s\S]*?)\n  \};/);
  assert.ok(table, 'FIRST_DRAW가 없다');
  const names = [...table[1].matchAll(/\n    ([a-z]+): \(\) => /g)].map((m) => m[1]);
  assert.deepEqual(names, ['reagents', 'labs', 'colors', 'gear', 'tools', 'theory', 'curve', 'report', 'error', 'prep', 'plan', 'waste', 'topics', 'search']);
  for (const name of names) assert.ok(html.includes(`id="panel-${name}"`), `${name} 화면이 없다`);
  // 시작할 때 이 화면들을 미리 그리지 않는다 (init 안에는 그리는 호출이 없다)
  const init = js.slice(js.indexOf('\n  function init() {'));
  for (const call of ['setupTools();', 'setupTheory();', 'setupCurve();', 'setupReport();', 'setupPrep();']) assert.ok(!init.includes(`\n    ${call}`) && !init.includes(`) ${call}`), `init이 ${call}를 부른다`);
  // 그 화면을 연 적이 없어도 버튼으로 바로 열 수 있다
  const body = (name) => {
    const start = js.indexOf(`\n  function ${name}(`);
    assert.ok(start > 0, name);
    return js.slice(start, js.indexOf('\n  }\n', start));
  };
  assert.ok(body('openCalc').includes("ensureDrawn('tools')"));
  assert.ok(body('openTheory').includes("ensureDrawn('theory')"));
  assert.ok(body('openCurve').includes("ensureDrawn('curve')"));
  assert.ok(body('openReport').includes("ensureDrawn('report')"));
  assert.ok(body('openPrep').includes("ensureDrawn('prep')"));
  assert.ok(body('openPlan').includes("ensureDrawn('plan')"));
  assert.ok(body('openWaste').includes("ensureDrawn('waste')"));
  assert.ok(body('openError').includes("ensureDrawn('error')"));
  assert.ok(body('openReportDoc').includes("ensureDrawn('report')"));
  assert.ok(body('renderPage').includes('ensureDrawn(name)'));
});
