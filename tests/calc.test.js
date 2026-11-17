// 전체 검증: `node --test`
// 테스트 이름 맨 앞의 A번호가 SPEC.md 7장의 수용 기준이다. 검증값은 SPEC.md 5장의 V·N·D 표에서 옮겼다.
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../calc.js');

const TOLERANCE = 0.001; // g

function solid(reagentId, conc, unit, volume, purity = '100', extra = {}) {
  return C.computeSolid({ reagentId, conc, unit, volume, purity, ...extra });
}

function expectMass(label, result, expectedText) {
  assert.equal(result.ok, true, `${label}: 계산되어야 한다`);
  const expected = Number(expectedText);
  assert.ok(
    Math.abs(result.mass - expected) <= TOLERANCE + 1e-12,
    `${label}: ${result.mass} g이 ${expectedText} g의 ±${TOLERANCE} 안에 있어야 한다`
  );
  assert.equal(result.massText, expectedText, `${label}: 화면 글자`);
}

function expectRefused(label, result, message) {
  assert.equal(result.ok, false, `${label}: 계산하지 않아야 한다`);
  assert.ok(result.messages.includes(message), `${label}: 안내 문구 "${message}"`);
  assert.equal(result.mass, undefined, `${label}: 결과가 없어야 한다`);
}

function dilution(stock, unit, rows) {
  return C.computeDilution({ stock, unit, rows: rows.map(([conc, volume]) => ({ conc, volume })) });
}

const texts = (rows, key) => rows.map((r) => r[key]);

function sampleItems() {
  return C.SAMPLE.solids.map((s) => C.computeSolid(s).item);
}

function sampleDilution() {
  return C.computeDilution(C.SAMPLE_ABSORBANCE.dilution); // 2차 런: 희석 샘플은 흡광도 샘플로 옮겼다 (SPEC 27장)
}

test('A1 고체 조제 V1~V6: 기대값과 ±0.001 g 안에서 일치하고 소수 셋째 자리로 표시', () => {
  expectMass('V1', solid('NaCl', '0.100', 'M', '250'), '1.461');
  expectMass('V2', solid('MgCl2·6H2O', '0.100', 'M', '100'), '2.033');
  expectMass('V3', solid('포도당', '0.500', 'M', '100'), '9.008');
  expectMass('V4', solid('NaCl', '0.100', 'M', '250', '99'), '1.476');
  expectMass('V5', solid('CuSO4·5H2O', '0.100', 'M', '100'), '2.497');
  expectMass('V6', solid('메틸렌 블루(무수)', '1000', 'mg/L', '100'), '0.100');
});

test('A2 단위 mM·mg/L: V7~V11, V14가 기대값과 일치', () => {
  expectMass('V7', solid('KCl', '1.000', 'M', '100'), '7.455');
  expectMass('V8', solid('NaOH', '50', 'mM', '100'), '0.200');
  expectMass('V9', solid('요소', '500', 'mM', '200'), '6.006');
  expectMass('V10', solid('KNO3', '500', 'mg/L', '250'), '0.125');
  expectMass('V11', solid('NaOH', '0.100', 'M', '500', '97'), '2.062');
  expectMass('V14', solid('요소', '0.500', 'M', '100'), '3.003');
});

test('A3 수화물 배지: 수화물 3종의 M·mM에만 붙고 나머지 9종과 mg/L에는 붙지 않는다', () => {
  const hydrates = ['MgCl2·6H2O', 'CaCl2·2H2O', 'CuSO4·5H2O'];
  assert.equal(C.REAGENTS.length, 12);
  assert.deepEqual(C.REAGENTS.filter((r) => r.hydrate).map((r) => r.id), hydrates);
  for (const r of C.REAGENTS) {
    const expected = hydrates.includes(r.id);
    assert.equal(solid(r.id, '0.100', 'M', '100').hydrateBadge, expected, `${r.id} M`);
    assert.equal(solid(r.id, '100', 'mM', '100').hydrateBadge, expected, `${r.id} mM`);
    const mg = solid(r.id, '1000', 'mg/L', '100');
    assert.equal(mg.hydrateBadge, false, `${r.id} mg/L (G3)`);
    assert.equal(mg.mgNote, true, `${r.id} mg/L 안내`);
  }
  assert.equal(C.TEXT.hydrateBadge, '수화물 보정됨');
});

test('A4 순도: 처음 값 100, N1·N2는 계산하지 않고 안내, 50과 100은 계산 (V13)', () => {
  assert.equal(C.DEFAULT_PURITY, '100');
  expectRefused('N1 순도 49.9', solid('NaCl', '0.100', 'M', '250', '49.9'), C.TEXT.needPurity);
  expectRefused('N2 순도 100.1', solid('NaCl', '0.100', 'M', '250', '100.1'), C.TEXT.needPurity);
  expectRefused('순도 빈칸', solid('NaCl', '0.100', 'M', '250', ''), C.TEXT.needPurity);
  expectMass('V13 순도 50', solid('NaCl', '0.100', 'M', '250', '50'), '2.922');
  expectMass('V1 순도 100', solid('NaCl', '0.100', 'M', '250', '100'), '1.461');
  assert.equal(C.TEXT.needPurity, '순도는 50~100% 사이로 입력하세요.');
});

test('A5 농도·부피: N3~N6은 계산하지 않고 안내', () => {
  const msg = C.TEXT.needConcVolume;
  expectRefused('N3 부피 0', solid('NaCl', '0.100', 'M', '0'), msg);
  expectRefused('N4 부피 -5', solid('NaCl', '0.100', 'M', '-5'), msg);
  expectRefused('N5 부피 빈칸', solid('NaCl', '0.100', 'M', ''), msg);
  expectRefused('N6 농도 0', solid('NaCl', '0', 'M', '250'), msg);
  expectRefused('숫자가 아닌 농도 (G5)', solid('NaCl', '가나다', 'M', '250'), msg);
  assert.equal(msg, '농도와 부피는 0보다 큰 숫자로 입력하세요.');
});

test('A6 직접 입력: 이름과 몰질량으로 내장 시약과 같은 방식으로 계산 (V12)', () => {
  const custom = (name, mm, unit = 'M', conc = '0.050') =>
    solid(C.CUSTOM_ID, conc, unit, '200', '100', { customName: name, customMolarMass: mm });
  const v12 = custom('시트르산', '192.12');
  expectMass('V12', v12, '1.921');
  assert.equal(v12.item.koreanName, '시트르산');
  assert.equal(v12.hydrateBadge, false);
  expectRefused('이름 빈칸', custom('', '192.12'), C.TEXT.needCustom);
  expectRefused('몰질량 0', custom('시트르산', '0'), C.TEXT.needCustom);
  expectRefused('mg/L여도 몰질량 필요', custom('시트르산', '', 'mg/L', '500'), C.TEXT.needCustom);
  assert.equal(C.TEXT.needCustom, '시약 이름과 몰질량을 입력하세요.');
});

test('A7 희석 D1·D2·D5: 원액·증류수 부피, 원액 합계, 권장 원액 조제량', () => {
  const d1 = dilution('1000', 'mg/L', [['10', '50'], ['20', '50'], ['50', '50'], ['100', '50']]);
  assert.deepEqual(texts(d1.rows, 'stockVolumeText'), ['0.50', '1.00', '2.50', '5.00']);
  assert.deepEqual(texts(d1.rows, 'waterVolumeText'), ['49.50', '49.00', '47.50', '45.00']);
  assert.equal(d1.totalText, '9.00');
  assert.equal(d1.flask, 10);
  assert.equal(d1.overFlask, false);

  const d2 = dilution('1.00', 'M', [['0.10', '100'], ['0.25', '100'], ['0.50', '100']]);
  assert.deepEqual(texts(d2.rows, 'stockVolumeText'), ['10.00', '25.00', '50.00']);
  assert.deepEqual(texts(d2.rows, 'waterVolumeText'), ['90.00', '75.00', '50.00']);
  assert.equal(d2.totalText, '85.00');
  assert.equal(d2.flask, 100);

  const d5 = dilution('100', 'mg/L', [['100', '50']]);
  assert.equal(d5.rows[0].status, 'ok', '목표 = 원액은 오류가 아니다');
  assert.equal(d5.rows[0].stockVolumeText, '50.00');
  assert.equal(d5.rows[0].waterVolumeText, '0.00');
  assert.equal(d5.totalText, '50.00');
  assert.equal(d5.flask, 100);

  const noStock = dilution('', 'M', [['0.10', '100']]);
  assert.equal(noStock.ok, false);
  assert.equal(noStock.message, '원액 농도는 0보다 큰 숫자로 입력하세요.');
});

test('A8 노란 표시: 원액 부피 1.00 mL 미만인 행에만 (흡광도 샘플의 0.5·1 mg/L 행)', () => {
  const d1 = sampleDilution();
  assert.deepEqual(texts(d1.rows, 'pipetteWarning'), [true, true, false, false]);
  assert.equal(C.TEXT.pipette, '피펫 오차 큼 — 중간 희석 권장');
});

test('A9 원액보다 진한 행: 빨간 행이 되고 합계에서 빠진다 (D6)', () => {
  const d6 = dilution('1000', 'mg/L', [['1500', '50'], ['100', '50']]);
  assert.equal(d6.rows[0].status, 'too-strong');
  assert.equal(d6.rows[0].message, '원액보다 진한 용액은 희석으로 만들 수 없음');
  assert.equal(d6.rows[1].stockVolumeText, '5.00');
  assert.equal(d6.rows[1].waterVolumeText, '45.00');
  assert.equal(d6.validRows.length, 1);
  assert.equal(d6.totalText, '5.00');
  assert.equal(d6.flask, 10);

  const withEmpty = dilution('1000', 'mg/L', [['', ''], ['0', '50'], ['100', '']]);
  assert.deepEqual(texts(withEmpty.rows, 'status'), ['blank', 'invalid', 'invalid']);
  assert.equal(withEmpty.hasValid, false, '유효한 행이 없으면 합계와 권장 조제량을 보여 주지 않는다');
  assert.equal(withEmpty.flask, null);
});

test('A10 원액 총 사용량 × 1.1이 250 mL를 넘으면 권장 조제량 대신 경고 (D4)', () => {
  const d4 = dilution('1.00', 'M', [['0.50', '250'], ['0.50', '250']]);
  assert.deepEqual(texts(d4.rows, 'stockVolumeText'), ['125.00', '125.00']);
  assert.deepEqual(texts(d4.rows, 'waterVolumeText'), ['125.00', '125.00']);
  assert.equal(d4.totalText, '250.00');
  assert.equal(d4.overFlask, true);
  assert.equal(d4.flask, null);
  assert.equal(C.TEXT.overFlask, '원액이 250 mL보다 많이 필요함 — 나누어 조제');
});

test('A11 원액 합계 9.10 mL이면 권장 조제량 25 mL (D3)', () => {
  const d3 = dilution('100', 'mg/L', [['91', '10']]);
  assert.equal(d3.rows[0].stockVolumeText, '9.10');
  assert.equal(d3.rows[0].waterVolumeText, '0.90');
  assert.equal(d3.totalText, '9.10');
  assert.equal(d3.flask, 25);
});

test('A12 레시피 카드: 샘플에서 고체 4장과 희석 1장, G8의 문장 틀', () => {
  const cards = C.buildCards(sampleItems(), C.SAMPLE_ABSORBANCE.dilution.name, sampleDilution());
  assert.deepEqual(cards.map((c) => c.kind), ['solid', 'solid', 'solid', 'solid', 'dilution']);
  assert.equal(cards[0].title, '염화 나트륨 0.100 M 250 mL');
  assert.deepEqual(cards[0].steps, [
    '염화 나트륨 1.461 g을 칭량한다.',
    '비커에서 증류수 약 125 mL에 완전히 녹인다.',
    '250 mL 부피 플라스크에 옮기고 표선까지 증류수를 채운다.',
  ]);
  assert.equal(cards[1].title, '염화 마그네슘 육수화물 0.100 M 100 mL');
  assert.equal(cards[1].steps[0], '염화 마그네슘 육수화물 2.033 g을 칭량한다.');
  assert.equal(cards[4].title, '메틸렌 블루 희석 계열 (원액 100 mg/L)');
  assert.equal(cards[4].steps.length, 4);
  assert.equal(cards[4].steps[0], '원액 0.25 mL에 증류수 49.75 mL를 더해 0.5 mg/L 50 mL를 만든다.');
  assert.equal(cards[4].steps[3], '원액 2.00 mL에 증류수 48.00 mL를 더해 4 mg/L 50 mL를 만든다.');
  assert.equal(cards[4].summary, '원액은 모두 3.75 mL 필요하다. 권장 원액 조제량 10 mL.');
  assert.deepEqual(C.buildCards([], '', C.computeDilution({ stock: '', rows: [] })), []);
  assert.equal(C.dilutionCard('', sampleDilution()).title, '용액 희석 계열 (원액 100 mg/L)');
});

test('A13 라벨: 한 장에 최대 12개, 13번째부터 다음 장, 내용은 이름·농도·조제일·조제자', () => {
  const date = C.formatDate('2026-11-17');
  assert.equal(date, '2026. 11. 17.');
  assert.equal(C.formatDate(''), '');
  const labels = C.buildLabels(sampleItems(), C.SAMPLE_ABSORBANCE.dilution.name, sampleDilution(), date, '홍길동');
  assert.equal(labels.length, 8);
  assert.deepEqual(labels[0], { name: '염화 나트륨', conc: '0.100 M', date: '2026. 11. 17.', maker: '홍길동', caution: false });
  assert.deepEqual(labels[7], { name: '메틸렌 블루', conc: '4 mg/L', date: '2026. 11. 17.', maker: '홍길동', caution: false });
  assert.deepEqual(C.paginate(labels).map((s) => s.length), [8]);

  const twelve = Array.from({ length: 12 }, () => sampleItems()[0]);
  const many = C.buildLabels(twelve, '', sampleDilution(), date, '');
  assert.equal(many.length, 16);
  assert.deepEqual(C.paginate(many).map((s) => s.length), [12, 4]);
  assert.equal(many[12].name, '용액', '희석 용액 이름이 빈칸이면 "용액"');
  assert.equal(C.LIMITS.labelsPerSheet, 12);
});

test('A14 취급 주의: NaOH와 CuSO4·5H2O 라벨에만', () => {
  for (const r of C.REAGENTS) {
    const item = solid(r.id, '0.100', 'M', '100').item;
    const [label] = C.buildLabels([item], '', null, '', '');
    assert.equal(label.caution, r.id === 'NaOH' || r.id === 'CuSO4·5H2O', r.id);
  }
  assert.equal(C.TEXT.caution, '취급 주의');
});

test('A15 내장 시약의 라벨 이름: 화학식 없이 5장의 한글 이름', () => {
  const expected = {
    NaCl: '염화 나트륨',
    KCl: '염화 칼륨',
    MgCl2: '염화 마그네슘',
    'MgCl2·6H2O': '염화 마그네슘 육수화물',
    'CaCl2·2H2O': '염화 칼슘 이수화물',
    'CuSO4·5H2O': '황산 구리(II) 오수화물',
    NaOH: '수산화 나트륨',
    KNO3: '질산 칼륨',
    포도당: '포도당',
    요소: '요소',
    설탕: '설탕',
    '메틸렌 블루(무수)': '메틸렌 블루',
  };
  assert.deepEqual(C.REAGENTS.map((r) => r.id), Object.keys(expected));
  for (const r of C.REAGENTS) {
    const [label] = C.buildLabels([solid(r.id, '0.100', 'M', '100').item], '', null, '', '');
    assert.equal(label.name, expected[r.id]);
    assert.doesNotMatch(label.name.replace('(II)', ''), /[A-Za-z]/, `${r.id}: 화학식이 없어야 한다`);
  }
});

test('A16 샘플: 조제 목록 4행(글자 그대로), MgCl2·6H2O 행의 수화물 배지, 희석 값은 흡광도 샘플에', () => {
  const items = sampleItems();
  assert.deepEqual(
    items.map((i) => `${i.displayName} ${i.concText} ${i.unit} ${i.volumeText} mL ${i.purityText}% → ${i.massText} g`),
    [
      'NaCl 0.100 M 250 mL 100% → 1.461 g',
      'MgCl2·6H2O 0.100 M 100 mL 100% → 2.033 g',
      '포도당 0.500 M 100 mL 100% → 9.008 g',
      '요소 0.500 M 100 mL 100% → 3.003 g',
    ]
  );
  assert.deepEqual(items.map((i) => i.hydrateBadge), [false, true, false, false]);
  assert.equal(C.SAMPLE.dilution, undefined, '고체 샘플에는 희석이 없다 (SPEC 27장)');
  assert.deepEqual(C.SAMPLE_ABSORBANCE.dilution, {
    name: '메틸렌 블루',
    stock: '100',
    unit: 'mg/L',
    rows: [
      { conc: '0.5', volume: '50' },
      { conc: '1', volume: '50' },
      { conc: '2', volume: '50' },
      { conc: '4', volume: '50' },
    ],
  });
});

test('A21 (선택) 칭량 질량 0.100 g 미만이면 저울 오차 표시', () => {
  assert.equal(solid('메틸렌 블루(무수)', '1000', 'mg/L', '100').lowMass, false, '0.100 g은 경고 아님');
  assert.equal(solid('메틸렌 블루(무수)', '1000', 'mg/L', '99').lowMass, true, '0.099 g');
  assert.equal(solid('NaCl', '0.010', 'M', '100').lowMass, true, '0.058 g');
  assert.equal(solid('NaCl', '0.100', 'M', '250').lowMass, false);
  assert.equal(C.TEXT.lowMass, '저울 오차 큼 — 더 큰 부피로 조제 권장');
});
