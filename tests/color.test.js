// 전체 검증 (색이 변하는 실험, 지시약의 색, 함께 넣은 글꼴): `node --test`
// 테스트 이름 맨 앞의 A번호가 SPEC.md 17장의 수용 기준이다.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const L = require('../labcalc.js');
const B = require('../experiments.js');

const ROOT = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(ROOT, name), 'utf8');

// 화학식의 식량을 표준 원자량으로 계산한다 (앱의 값과 따로 계산해 견주려는 것).
const ATOMIC = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, Na: 22.99, S: 32.06, Cl: 35.45, K: 39.098, Fe: 55.845, Co: 58.933, Zn: 65.38, Ag: 107.868, I: 126.904 };
function massOf(formula) {
  return formula.split('·').reduce((sum, part) => {
    const [, lead, body] = part.match(/^(\d*)(.*)$/);
    let mass = 0;
    for (const [, symbol, count] of body.matchAll(/([A-Z][a-z]?)(\d*)/g)) {
      assert.ok(ATOMIC[symbol], `원자량 없음: ${symbol} (${formula})`);
      mass += ATOMIC[symbol] * (count ? Number(count) : 1);
    }
    return sum + mass * (lead ? Number(lead) : 1);
  }, 0);
}

const NEW_LABS = ['indicator-range', 'red-cabbage', 'cobalt-eq', 'copper-ammine', 'iodine-clock', 'blue-bottle', 'traffic-light', 'metal-activity'];
// SPEC 20장에서 더한 실험 6개 (앞의 셋은 색이 변한다)
const MORE_LABS = ['precipitate', 'ki-electrolysis', 'vitamin-c', 'graham', 'dissolution-heat', 'conductivity'];

test('A54 색이 변하는 실험: 17장의 8개와 20장의 3개를 더해 16개이고, 색 자료와 시약의 몰질량이 맞다', () => {
  for (const id of NEW_LABS) assert.ok(B.EXPERIMENTS.some((e) => e.id === id), `실험 ${id}`);
  const colored = B.EXPERIMENTS.filter((e) => e.colors);
  assert.equal(colored.length, 16);
  assert.deepEqual(colored.map((e) => e.id).filter((id) => !NEW_LABS.includes(id) && !MORE_LABS.includes(id)), ['hydrate', 'le-chatelier', 'ksp', 'vinegar', 'permanganate']);
  assert.deepEqual(MORE_LABS.filter((id) => colored.some((e) => e.id === id)), ['precipitate', 'ki-electrolysis', 'vitamin-c']);
  for (const e of colored) {
    assert.ok(e.colors.steps.length >= 2, `${e.id}: 색이 둘 이상`);
    for (const [name, color] of e.colors.steps) {
      assert.ok(name, `${e.id}: 색 이름`);
      assert.match(color, /^#[0-9a-f]{6}$/, `${e.id}: ${name}`);
    }
    assert.ok(['→', '⇌', '·'].includes(e.colors.sep), `${e.id}: 색 사이의 기호`);
    assert.ok(e.colors.note, `${e.id}: 색이 변하는 조건`);
  }
  // 단원마다의 실험 수 (C1)
  const count = (unit) => B.EXPERIMENTS.filter((e) => e.unit === unit).length;
  assert.deepEqual(B.UNITS.map(count), [2, 2, 2, 2, 3, 2, 3, 4, 5, 8]);
  // 새 실험에서 이름과 화학식으로 적은 시약의 몰질량 (C2)
  for (const e of B.EXPERIMENTS.filter((x) => NEW_LABS.includes(x.id) || MORE_LABS.includes(x.id))) {
    for (const spec of e.reagents.filter((r) => r.formula)) {
      assert.ok(Math.abs(massOf(spec.formula) - Number(spec.mm)) < 0.01, `${e.id}: ${spec.formula} ${spec.mm} ≠ ${massOf(spec.formula).toFixed(3)}`);
    }
  }
  // 조제량 (C3): 손으로 계산한 값
  const amount = (id, index) => L.prepareReagent(B.EXPERIMENTS.find((e) => e.id === id).reagents[index]).amount;
  assert.equal(amount('iodine-clock', 0), '3.320 g'); // 0.200 M × 0.100 L × 166.00
  assert.equal(amount('iodine-clock', 1), '0.496 g'); // 0.0200 × 0.100 × 248.18
  assert.equal(amount('cobalt-eq', 0), '4.759 g'); // 0.400 × 0.050 × 237.93
  assert.equal(amount('red-cabbage', 2), '0.840 g'); // 0.100 × 0.100 × 84.01
  assert.equal(amount('metal-activity', 1), '0.849 g'); // 0.100 × 0.050 × 169.87
  assert.equal(amount('metal-activity', 2), '1.438 g'); // 0.100 × 0.050 × 287.54
  assert.equal(amount('blue-bottle', 0), '4.000 g'); // 0.400 × 0.250 × 40.00
  // 20장의 실험
  assert.equal(amount('precipitate', 0), '0.849 g'); // AgNO3 0.100 × 0.050 × 169.87
  assert.equal(amount('precipitate', 4), '1.351 g'); // FeCl3·6H2O 0.100 × 0.050 × 270.29
  assert.equal(amount('ki-electrolysis', 0), '8.300 g'); // KI 0.500 × 0.100 × 166.00
  assert.equal(amount('vitamin-c', 0), '0.635 g'); // I2 0.0100 × 0.250 × 253.81
  assert.equal(amount('conductivity', 1), '3.423 g'); // 설탕 0.100 × 0.100 × 342.30
  assert.equal(amount('conductivity', 3), '0.57 mL'); // 빙초산 99.5 %, 1.05 g/mL에서 0.100 M 100 mL
});

test('A55 지시약의 색: pH에 따라 변색 범위 밖에서는 한 가지 색, 안에서는 바뀌는 중으로 나온다', () => {
  const at = (ph) => {
    const result = L.run('indicator', { ph });
    assert.equal(result.ok, true, result.message);
    return (name) => result.rows.find((row) => row.label.startsWith(name));
  };
  assert.equal(L.INDICATORS.length, 10);
  assert.equal(L.run('indicator', { ph: '7' }).rows.length, 10);
  // I1: pH 7.0
  const seven = at('7.0');
  assert.equal(seven('BTB').label, 'BTB (6.0~7.6)');
  assert.equal(seven('BTB').value, '초록 (노랑에서 파랑으로 바뀌는 중)');
  assert.match(seven('BTB').swatch, /^#[0-9a-f]{6}$/);
  assert.equal(seven('페놀프탈레인').value, '무색');
  assert.equal(seven('페놀프탈레인').swatch, null);
  assert.equal(seven('메틸 오렌지').value, '노랑');
  assert.equal(seven('리트머스').value, '보라 (빨강에서 파랑으로 바뀌는 중)');
  assert.equal(seven('티몰 블루').label, '티몰 블루 (1.2~2.8, 8.0~9.6)');
  assert.equal(seven('티몰 블루').value, '노랑');
  // I2: 변색 범위의 양 끝은 바뀌기 전과 다 바뀐 색이다
  assert.equal(at('3.1')('메틸 오렌지').value, '빨강');
  assert.equal(at('3.75')('메틸 오렌지').value, '주황 (빨강에서 노랑으로 바뀌는 중)');
  assert.equal(at('4.4')('메틸 오렌지').value, '노랑');
  assert.equal(at('8.3')('페놀프탈레인').value, '무색');
  assert.equal(at('9.2')('페놀프탈레인').value, '옅은 분홍 (무색에서 붉은색으로 바뀌는 중)');
  assert.equal(at('10')('페놀프탈레인').value, '붉은색');
  assert.equal(at('10')('페놀프탈레인').swatch, '#e0218a');
  // I3: 티몰 블루는 두 번 변한다
  assert.deepEqual(['1', '2', '5', '8.8', '12'].map((ph) => at(ph)('티몰 블루').value.split(' ')[0]), ['빨강', '주황', '노랑', '초록', '파랑']);
  // I4: 적양배추 즙은 어림이라 "바뀌는 중"을 붙이지 않는다
  assert.equal(at('7')('적양배추').label, '적양배추 즙 (어림)');
  assert.deepEqual(['1', '6', '8', '13'].map((ph) => at(ph)('적양배추').value), ['빨강', '보라', '파랑', '노랑']);
  // I5: 범위를 벗어난 값과 빈칸은 계산하지 않는다
  for (const ph of ['', '-1', '14.1', '가']) {
    assert.deepEqual(L.run('indicator', { ph }), { ok: false, message: 'pH는 0에서 14 사이의 숫자로 입력하세요.' });
  }
  assert.equal(L.run('indicator', { ph: '0' }).ok, true);
  assert.equal(L.run('indicator', { ph: '14' }).ok, true);
  // I6: 색 섞기. 양 끝은 그대로이고, 무색과 섞으면 같은 색이 옅어진다
  assert.equal(L.mixColor('#f0cf1c', '#1e55c4', 0), '#f0cf1c');
  assert.equal(L.mixColor('#f0cf1c', '#1e55c4', 1), '#1e55c4');
  assert.equal(L.mixColor(null, '#e0218a', 1), '#e0218a');
  assert.equal(L.mixColor(null, '#e0218a', 0), '#ffffff');
});

test('A56 글꼴: 화면의 글자가 함께 넣은 글꼴에 모두 들어 있고, 밖에서 불러오는 글꼴이 없다', () => {
  const fontsCss = read('fonts/fonts.css');
  const faces = [...fontsCss.matchAll(/@font-face \{[^}]+\}/g)].map((m) => m[0]);
  assert.equal(faces.length, 6);
  for (const face of faces) {
    assert.match(face, /font-family: "RM Sans";/);
    assert.match(face, /font-display: swap;/);
    assert.match(face, /unicode-range: U\+/);
    // 같은 글꼴을 작은 woff2(먼저)와 예비 woff로 넣는다. 둘 다 앱 폴더 안의 파일이다.
    const files = [...face.matchAll(/url\("([^"]+)"\) format\("(woff2?)"\)/g)].map((m) => [m[1], m[2]]);
    assert.equal(files.length, 2, face);
    assert.match(files[0][0], /^(hangul|latin)-(400|500|700)\.woff2$/);
    assert.equal(files[0][1], 'woff2');
    assert.equal(files[1][0], files[0][0].replace(/2$/, ''));
    assert.equal(files[1][1], 'woff');
    const sizes = files.map(([file]) => fs.statSync(path.join(ROOT, 'fonts', file)).size);
    assert.ok(sizes[0] > 10000 && sizes[1] > 10000 && sizes[0] < sizes[1], `${files[0][0]} ${sizes}`);
  }
  // fonts/ 폴더에 쓰지 않는 글꼴 파일이 남아 있지 않다
  assert.deepEqual(fs.readdirSync(path.join(ROOT, 'fonts')).filter((f) => /\.woff2?$/.test(f)).length, 12);
  assert.ok(read('fonts/LICENSE.txt').includes('SIL OPEN FONT LICENSE Version 1.1'));
  // 글꼴 파일을 먼저 부르고, 글꼴 이름의 맨 앞이 함께 넣은 글꼴이다
  const html = read('index.html');
  assert.ok(html.indexOf('href="fonts/fonts.css"') > 0 && html.indexOf('href="fonts/fonts.css"') < html.indexOf('href="style.css"'));
  const css = read('style.css');
  assert.match(css, /--font: "RM Sans",/);
  // 밖에서 불러오는 글꼴과 스타일이 없다
  assert.doesNotMatch(css + fontsCss, /url\(\s*["']?(https?:)?\/\//);
  assert.doesNotMatch(css + fontsCss, /@import/);
  assert.doesNotMatch(html, /<link[^>]+href="https?:/);
  // 넣은 글꼴의 굵기는 400·500·700뿐이라, 다른 굵기를 쓰면 브라우저가 흉내 낸 글자가 나온다
  const weights = new Set([...css.matchAll(/font-weight: (\d+)/g)].map((m) => m[1]));
  assert.deepEqual([...weights].sort(), ['400', '500', '700'].filter((w) => weights.has(w)));
  // 앱의 글(화면과 자료)에 나오는 글자가 글꼴에 모두 들어 있다. 실패하면 `python3 tools/build_fonts.py`를 다시 돌린다.
  const have = new Set(read('fonts/chars.txt'));
  const missing = new Set();
  for (const name of fs.readdirSync(ROOT).filter((f) => /\.(js|html)$/.test(f))) {
    for (const ch of read(name)) if (ch.codePointAt(0) > 0x7f && !have.has(ch)) missing.add(ch);
  }
  assert.deepEqual([...missing], []);
});

test('A60 화면의 글에 출처 표기가 없다 (출처는 README와 코드의 주석에 둔다)', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /출처|OpenStax|Sigma|선행 연구 찾아보기/);
  assert.doesNotMatch(html, /<a [^>]*href="https?:/);
  for (const calc of L.CALCS) {
    assert.doesNotMatch(`${calc.title} ${calc.hint}`, /출처|OpenStax/, calc.id);
    for (const input of calc.inputs) assert.doesNotMatch(input.label, /출처|OpenStax/, calc.id);
  }
  // 따옴표 안의 글(화면에 나올 수 있는 글)만 본다. 주석은 괜찮다.
  const strings = read('app.js').match(/'[^'\n]*'|`[^`]*`/g) || [];
  assert.deepEqual(strings.filter((text) => /출처|OpenStax/.test(text)), []);
});

test('A61 빼기로 한 말이 화면에 없다: 시약표와 다르다는 알림, 한 줄 소개, 맨 아래의 안내', () => {
  const C = require('../calc.js');
  const html = read('index.html');
  assert.doesNotMatch(html, /칭량·희석|한 번에|입력한 값은 저장|샘플의 값은 가상/);
  assert.match(html, /<title>용액 레시피 메이커<\/title>/);
  assert.doesNotMatch(read('app.js'), /칭량·희석 계산과 한글 라벨/);
  // 시약표의 모든 시약: 알림은 분자량이 없어 몰 농도로 계산할 수 없을 때만 나오고, 시약표를 탓하는 말이 없다
  const all = C.searchReagents('');
  assert.equal(all.length, 467);
  const flagged = [];
  for (const reagent of all) {
    const note = C.sourceNote(reagent);
    assert.doesNotMatch(note, /시약표|다시 계산|맞지 않/, reagent.id);
    if (reagent.molarMass == null) assert.ok(note.length > 0, reagent.id);
    else if (note) flagged.push(`${reagent.id} ${note}`);
  }
  // 분자량이 있는데도 알림이 붙는 것은 화학식과 분자량 가운데 어느 쪽이 맞는지 정하지 못한 두 시약뿐이다
  assert.deepEqual(flagged, ['s257 병 라벨의 분자량을 확인하고 쓰세요.', 's486 병 라벨의 분자량을 확인하고 쓰세요.']);
  // R&E 주제 추천은 메뉴에서 뺐다: 머리의 링크는 숨겨 두고, 스위치는 꺼져 있다
  assert.match(html, /<a href="#topics" data-nav="topics" hidden>/);
  assert.match(read('app.js'), /const TOPIC_MENU = false;/);
});

test('A67 준비물: 기구 84가지가 여섯 종류로 나뉘고, 실험의 준비물 줄이 모두 기구에 이어진다', () => {
  assert.deepEqual(B.GEAR_CATS.map(([value]) => value), ['glass', 'measure', 'heat', 'electric', 'etc', 'safety']);
  assert.equal(B.EQUIPMENT.length, 84);
  assert.equal(new Set(B.EQUIPMENT.map((g) => g.id)).size, 84);
  for (const g of B.EQUIPMENT) {
    assert.ok(B.GEAR_CATS.some(([value]) => value === g.cat), g.id);
    assert.ok(g.name && g.desc && g.keys, g.id);
  }
  // 기구에 이어지지 않는 줄은 재료 하나뿐이다
  const loose = [];
  for (const e of B.EXPERIMENTS) for (const line of e.materials) if (!B.gearOfLine(line).length) loose.push(line);
  assert.deepEqual(loose, ['적양배추 잎 두세 장']);
  // 줄 하나가 여러 기구에 이어질 수 있다
  assert.deepEqual(B.gearOfLine('눈금 피펫 10 mL와 피펫 필러'), ['gradpipette', 'filler']);
  assert.deepEqual(B.gearOfLine('시험관 5개와 시험관대'), ['testtube', 'rack']);
  assert.deepEqual(B.gearOfLine('도가니 집게'), ['tongs']);
  assert.deepEqual(B.gearOfLine('뷰렛, 뷰렛 스탠드와 뷰렛 클램프'), ['burette', 'stand', 'clamp']);
  assert.deepEqual(B.gearOfLine('깔때기, 거름종이와 깔때기대'), ['funnel', 'funnelstand']);
  assert.deepEqual(B.gearOfLine('시험관 집게'), ['testtube', 'tubeholder']);
  // 실험마다 기본으로 챙기는 것(always) 여섯은 준비물 줄에 적지 않는다.
  // 25장에서 더한 심화 기구(adv) 25가지는 33개 실험의 준비물 줄에 나오지 않는다. 나머지는 모두 실험 하나 이상에 쓰인다.
  const use = B.gearUse();
  const always = B.EQUIPMENT.filter((g) => g.always);
  assert.deepEqual(always.map((g) => g.name), ['유성펜과 라벨', '보안경', '실험복', '실험용 장갑', '폐액통', '세척 솔']);
  assert.equal(B.EQUIPMENT.filter((g) => g.adv).length, 25);
  for (const g of B.EQUIPMENT) assert.equal(use[g.id].length > 0, !g.always && !g.adv, g.id);
  for (const ids of Object.values(use)) assert.equal(new Set(ids).size, ids.length);
  assert.equal(use.beaker.length, 15);
  assert.deepEqual(use.burette, ['ksp', 'vinegar', 'permanganate', 'vitamin-c']);
  // 22장에서 더한 것: 스탠드와 클램프는 적정 넷과 기체 둘, 어는점 내림에 쓴다
  assert.deepEqual(use.stand, ['gas-constant', 'graham', 'freezing', 'ksp', 'vinegar', 'permanganate', 'vitamin-c']);
  assert.deepEqual(use.clamp, use.stand);
  assert.deepEqual(use.tubeholder, ['le-chatelier', 'cobalt-eq']);
  assert.deepEqual(use.funnelstand, ['ksp']);
  assert.deepEqual(use.wipes, ['conductivity']);
});

