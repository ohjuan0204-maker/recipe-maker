// 2차 런 B2 (SPEC 27장): 흡광도 샘플, 예상 흡광도, 원액 조제 안내, 샘플 버튼과 1분 체험
// 기대값은 Node로 따로 계산했다: A = 74000 × (mg/L ÷ 1000 ÷ 319.85)
//   0.5 → 0.11568, 1 → 0.23136, 2 → 0.46272, 4 → 0.92543
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../calc.js');

const read = (name) => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const near = (actual, expected, tol, label) => assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} (기대 ${expected} ± ${tol})`);

test('B2 샘플이 둘로 나뉜다: 고체 샘플에는 희석이 없고, 흡광도 샘플은 100 mg/L 원액에 0.5·1·2·4 mg/L 각 50 mL', () => {
  assert.equal(C.SAMPLE.solids.length, 4);
  assert.equal('dilution' in C.SAMPLE, false);
  const d = C.SAMPLE_ABSORBANCE.dilution;
  assert.equal(d.name, '메틸렌 블루');
  assert.equal(d.stock, '100');
  assert.equal(d.unit, 'mg/L');
  assert.deepEqual(d.rows.map((r) => `${r.conc}/${r.volume}`), ['0.5/50', '1/50', '2/50', '4/50']);
});

test('B2 흡광도 샘플의 원액 부피는 0.25 / 0.50 / 1.00 / 2.00 mL, 합 3.75 mL, 권장 원액 조제량 10 mL', () => {
  const r = C.computeDilution(C.SAMPLE_ABSORBANCE.dilution);
  assert.equal(r.ok, true);
  assert.deepEqual(r.rows.map((x) => x.stockVolumeText), ['0.25', '0.50', '1.00', '2.00']);
  assert.deepEqual(r.rows.map((x) => x.waterVolumeText), ['49.75', '49.50', '49.00', '48.00']);
  assert.equal(r.totalText, '3.75');
  assert.equal(r.flask, 10); // 3.75 × 1.1 = 4.125 → 10 mL
  assert.deepEqual(r.rows.map((x) => x.pipetteWarning), [true, true, false, false]);
});

test('B2 예상 흡광도: 0.116 / 0.231 / 0.463 / 0.925 (±0.002), 모두 1.0 이하라 경고 없음', () => {
  const d = C.SAMPLE_ABSORBANCE.dilution;
  const info = C.expectedAbsorbance(d.name, C.computeDilution(d));
  assert.equal(info.show, true);
  const want = [0.116, 0.231, 0.463, 0.925];
  info.rows.forEach((row, i) => near(row.value, want[i], 0.002, `${row.concText} mg/L`));
  assert.deepEqual(info.rows.map((row) => row.text), ['0.116', '0.231', '0.463', '0.925']);
  assert.deepEqual(info.rows.map((row) => row.over), [false, false, false, false]);
  assert.equal(info.note, 'ε 7.4×10⁴ L/(mol·cm), 무수물 기준, 1 cm 셀 가정 — 기기마다 다름');
  assert.equal(C.ABSORB.epsilon, 74000);
  assert.equal(C.ABSORB.molarMass, 319.85);
});

test('B2 예상 흡광도는 이름에 "메틸렌 블루"가 있을 때만 보이고, 1.0을 넘는 칸에는 경고가 붙는다', () => {
  const d = C.SAMPLE_ABSORBANCE.dilution;
  assert.equal(C.expectedAbsorbance('염화 나트륨', C.computeDilution(d)).show, false);
  assert.equal(C.expectedAbsorbance('', C.computeDilution(d)).show, false);
  assert.equal(C.expectedAbsorbance('메틸렌 블루 수용액', C.computeDilution(d)).show, true);
  // 예전 샘플(1000 mg/L → 10·20·50·100 mg/L)은 2.31 ~ 23.1이라 모두 경고다
  const old = C.computeDilution({ stock: '1000', unit: 'mg/L', rows: [['10', '50'], ['20', '50'], ['50', '50'], ['100', '50']].map(([conc, volume]) => ({ conc, volume })) });
  const info = C.expectedAbsorbance('메틸렌 블루', old);
  assert.deepEqual(info.rows.map((row) => row.over), [true, true, true, true]);
  near(info.rows[3].value, 23.136, 0.002, '100 mg/L');
  assert.equal(C.TEXT.absorbOver, '측정 범위를 넘을 수 있음 — 더 묽게');
  // 경계: 정확히 1.0은 경고가 아니다 (A > 1.0일 때만)
  const edge = C.computeDilution({ stock: '1', unit: 'M', rows: [{ conc: String(1 / 74000), volume: '10' }] });
  assert.equal(C.expectedAbsorbance('메틸렌 블루', edge).rows[0].over, false);
  // %는 계산하지 않는다
  assert.equal(C.expectedAbsorbance('메틸렌 블루', C.computeDilution({ stock: '10', unit: '%', rows: [{ conc: '1', volume: '10' }] })).show, false);
});

test('B2 원액 조제 안내: 흡광도 샘플이면 "10.00 mL를 100 mL로", 필요 없을 때는 나오지 않는다', () => {
  const r = C.computeDilution(C.SAMPLE_ABSORBANCE.dilution);
  assert.equal(r.stockGuide, '1000 mg/L 원액(시약 0.250 g → 250 mL)을 먼저 만든 뒤 10.00 mL를 100 mL로 묽히기');
  assert.ok(r.stockGuide.includes('10.00 mL'));
  // 원액이 1000 mg/L 이상이면 묽힐 것이 없다
  assert.equal(C.computeDilution({ stock: '1000', unit: 'mg/L', rows: [{ conc: '10', volume: '50' }] }).stockGuide, '');
  // mg/L가 아니면 안내하지 않는다
  assert.equal(C.computeDilution({ stock: '0.1', unit: 'M', rows: [{ conc: '0.01', volume: '50' }] }).stockGuide, '');
  // 시약이 0.1 g 이상 들면(500 mg/L × 250 mL = 0.125 g) 저울로 달 수 있으니 안내하지 않는다
  assert.equal(C.stockGuide('mg/L', 500, 250), '');
  assert.equal(C.stockGuide('mg/L', 500, 100), '1000 mg/L 원액(시약 0.250 g → 250 mL)을 먼저 만든 뒤 50.00 mL를 100 mL로 묽히기');
  // 계산할 행이 없으면 빈 글
  assert.equal(C.computeDilution({ stock: '100', unit: 'mg/L', rows: [{ conc: '', volume: '' }] }).stockGuide, '');
});

test('B2 화면: [샘플: 흡광도 실험] 버튼, 예상 흡광도 줄과 안내 줄의 자리, 1분 체험 3단계', () => {
  const html = read('index.html');
  const app = read('app.js');
  // 버튼 이름: 머리의 [샘플: 총괄성 실험]은 그대로, 그 옆에 [샘플: 흡광도 실험]
  assert.match(html, /id="btn-sample">샘플<span class="btn-sample__more">: 총괄성 실험<\/span><\/button>/);
  const abs = html.match(/<button[^>]*id="btn-sample-abs"[^>]*>([\s\S]*?)<\/button>/);
  assert.ok(abs, 'btn-sample-abs 버튼이 있다');
  // 버튼 안의 띄어쓰기는 줄어들지 않게 &nbsp;로 적었다 (좁은 화면에서는 "흡광도"만 보인다)
  assert.equal(abs[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' '), '샘플: 흡광도 실험');
  assert.ok(html.indexOf('id="btn-sample-abs"') > html.indexOf('id="btn-sample"'), '총괄성 샘플 버튼 옆(뒤)');
  // 예상 흡광도는 희석표 아래, 안내는 #dil-summary 안
  assert.ok(html.indexOf('id="dil-absorb"') > html.indexOf('id="dil-result"'));
  assert.ok(html.indexOf('id="dil-absorb"') < html.indexOf('id="dil-summary"'));
  const summary = html.slice(html.indexOf('id="dil-summary"'), html.indexOf('</div>', html.indexOf('id="dil-summary"')));
  assert.ok(summary.includes('id="dil-guide"'));
  // 좁은 화면에서는 머리의 버튼을 숨기고(색 점 자리), 희석 탭 안의 같은 이름 버튼으로 누른다
  assert.match(html, /<button type="button" class="btn" id="btn-sample-abs-dil">샘플: 흡광도 실험<\/button>/);
  assert.ok(html.indexOf('id="btn-sample-abs-dil"') > html.indexOf('id="btn-add-row"'));
  assert.match(read('style.css'), /@media \(max-width: 700px\) \{\s*\.site-util #btn-sample-abs \{\s*display: none;/);
  // 버튼이 하는 일
  assert.match(app, /\$\('btn-sample-abs'\)\.addEventListener\('click', loadAbsorbanceSample\)/);
  assert.match(app, /\$\('btn-sample-abs-dil'\)\.addEventListener\('click', loadAbsorbanceSample\)/);
  const loadSample = app.slice(app.indexOf('function loadSample()'), app.indexOf('function loadAbsorbanceSample()'));
  assert.ok(!loadSample.includes('dil-'), '고체 샘플은 희석 탭을 건드리지 않는다');
  const loadAbs = app.slice(app.indexOf('function loadAbsorbanceSample()'), app.indexOf('function renderAll()'));
  assert.ok(loadAbs.includes('C.SAMPLE_ABSORBANCE.dilution'));
  assert.ok(!loadAbs.includes('state.list ='), '흡광도 샘플은 조제 목록을 그대로 둔다');
  // 1분 체험: 1단계는 고체 샘플, 3단계는 흡광도 샘플을 불러오고 희석표를 비춘다
  const tour = app.slice(app.indexOf('const TOUR = ['), app.indexOf('function tourSpot('));
  const steps = tour.split(/\n    \{\n/).slice(1);
  assert.equal(steps.length, 7);
  assert.ok(steps[0].includes('loadSample()') && !steps[0].includes('loadAbsorbanceSample'));
  assert.ok(steps[2].includes("title: '원액 하나로 여러 농도'"));
  assert.ok(steps[2].includes('100 mg/L 원액 하나로 4가지 농도'));
  assert.ok(steps[2].includes('loadAbsorbanceSample()'));
  assert.ok(steps[2].includes("spot: '#dil-table'"));
  // 화면에 출처 문구를 넣지 않는다
  assert.ok(!/출처|참고 문헌|doi|http/i.test(C.TEXT.absorbNote + C.TEXT.absorbOver));
});

test('B2 1분 체험을 끝까지 하면 레시피 카드 5장, 라벨 8장', () => {
  const items = C.SAMPLE.solids.map((s) => C.computeSolid(s).item);
  const d = C.SAMPLE_ABSORBANCE.dilution;
  const dil = C.computeDilution(d);
  assert.equal(C.buildCards(items, d.name, dil).length, 5);
  assert.equal(C.buildLabels(items, d.name, dil, '2026. 11. 17.', '').length, 8);
});
