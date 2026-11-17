// 전체 검증 (24장: 폐액 버리기): `node --test`
// 테스트 이름 맨 앞의 A번호가 SPEC.md 24장의 수용 기준이다.
const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('../waste.js');
const C = require('../calc.js');
const B = require('../experiments.js');

const bin = (ids, ph) => W.decide(ids, ph).bin;

test('A92 폐액 통: 유기계 → 산 → 알칼리 → 무기계 차례로 묻고, 암모니아와 아세트산은 유기계다', () => {
  assert.equal(bin(['ice', 'acid-any']), 'acid'); // 산이 조금 들어간 얼음물
  assert.equal(bin(['water', 'hcl']), 'acid');
  assert.equal(bin(['naoh']), 'alkali');
  assert.equal(bin(['caoh2']), 'alkali');
  assert.equal(bin(['salt']), 'inorganic');
  assert.equal(bin(['cu']), 'inorganic');
  assert.equal(bin(['sugar']), 'organic');
  assert.equal(bin(['ethanol', 'water']), 'organic');
  // 유기물이 있으면 산성·염기성이어도 유기계가 먼저다
  assert.equal(bin(['acetic']), 'organic');
  assert.equal(bin(['acetic', 'naoh', 'indicator']), 'organic');
  assert.equal(bin(['nh3', 'cu']), 'organic');
  assert.equal(bin(['naoh', 'sugar', 'dye']), 'organic');
  // 지시약 몇 방울은 통을 바꾸지 않는다
  assert.equal(bin(['hcl', 'indicator']), 'acid');
  assert.equal(bin(['salt', 'starch']), 'inorganic');
  // 시약이 닿지 않은 물만
  assert.equal(bin(['ice']), 'sink');
  assert.equal(bin(['water']), 'sink');
  // 산과 염기가 함께 있으면 pH를 재야 한다
  const both = W.decide(['hcl', 'naoh', 'indicator']);
  assert.equal(both.bin, null);
  assert.equal(both.needPh, true);
  assert.equal(bin(['hcl', 'naoh'], 'acid'), 'acid');
  assert.equal(bin(['hcl', 'naoh'], 'base'), 'alkali');
  assert.equal(bin(['hcl', 'naoh'], 'neutral'), 'inorganic');
  // 따로 모으는 것
  assert.equal(bin(['hg']), 'special');
  assert.equal(bin(['cr6', 'water']), 'special');
  assert.equal(bin(['unknown']), 'special');
  assert.equal(bin(['h2o2']), 'special'); // 쓰고 남은 과산화 수소
  assert.equal(bin(['ag', 'nh3']), 'special'); // 섞으면 위험
  assert.equal(bin(['bleach', 'hcl']), 'special');
  // 고체와 유리는 따로
  const solid = W.decide(['hcl', 'precipitate', 'glass']);
  assert.deepEqual(solid.bins, ['acid', 'solid', 'glass']);
  assert.ok(solid.extra.some((t) => t.includes('걸러서')));
  assert.ok(solid.extra.some((t) => t.includes('맨손')));
  assert.equal(W.decide(['paper']).bin, null);
  assert.deepEqual(W.decide(['paper']).bins, ['solid']);
  // 아무것도 고르지 않으면 안내만
  assert.equal(W.decide([]).ok, false);
});

test('A92 폐액 통: 이유, 금속 기록, 주의, 붓는 법이 함께 나온다', () => {
  const ice = W.decide(['ice', 'acid-any']);
  assert.match(ice.reasons[0], /산이 들어 있어 산성이에요\. 물이 많아 묽어도 산 폐액이에요\./);
  assert.ok(ice.extra.includes('얼음은 다 녹인 뒤 부어요.'));
  assert.equal(ice.steps.length, W.POUR.length);
  const nh3 = W.decide(['nh3']);
  assert.ok(nh3.reasons.includes('암모니아가 든 폐액은 유기계에 모아요.'));
  const cu = W.decide(['cu', 'h2so4']);
  assert.equal(cu.bin, 'acid');
  assert.deepEqual(cu.metals, ['구리']);
  assert.ok(cu.reasons.some((t) => t.includes('구리') && t.includes('기록지')));
  // 섞으면 안 되는 것
  const levels = (ids) => W.decide(ids).warnings.map((w) => w.level);
  assert.deepEqual(levels(['bleach', 'hcl']), ['danger']);
  assert.deepEqual(levels(['hno3', 'ethanol']), ['danger', 'warn']);
  assert.deepEqual(levels(['h2o2', 'cu']), ['warn']);
  assert.deepEqual(levels(['thio', 'hcl']), ['warn']);
  assert.deepEqual(levels(['metalpiece', 'hcl']), ['warn']);
  assert.deepEqual(levels(['salt']), []);
  // 싱크대와 따로 모으기에는 붓는 법이 없다
  assert.equal(W.decide(['water']).steps.length, 0);
  assert.equal(W.decide(['hg']).steps.length, 0);
  // 헷갈리는 경우는 모두 답이 있다 (중화가 끝난 용액은 pH를 재서)
  for (const c of W.CASES) {
    const r = W.decide(c.parts);
    assert.ok(r.ok && (r.bins.length > 0 || r.needPh), c.q);
  }
});

test('A93 폐액: 짧은 글을 알아듣고, 실험 33개 모두에 폐액 안내가 있다', () => {
  const ids = (text) => W.partsOfText(text);
  assert.deepEqual(ids('얼음 있는데 산이 조금 들어간 얼음물'), ['ice', 'acid-any']);
  assert.deepEqual(ids('hcl이랑 naoh'), ['hcl', 'naoh']);
  assert.deepEqual(ids('질산 은 용액'), ['ag']); // "질산"이 아니다
  assert.deepEqual(ids('질산 철(III) 구수화물'), ['fe']);
  assert.deepEqual(ids('아세트산 나트륨'), ['acetate']);
  assert.deepEqual(ids('완충 용액 (인산염, 탄산염 계열)'), ['salt']);
  assert.deepEqual(ids('소금물'), ['salt']);
  assert.deepEqual(ids('10 mg 포도당'), ['sugar']); // mg은 마그네슘이 아니다
  assert.deepEqual(ids('깨진 비커'), ['glass']);
  assert.deepEqual(ids('아무 말'), []);
  const kinds = new Set();
  for (const lab of B.EXPERIMENTS) {
    const w = W.forLab(lab, C);
    const lines = W.labLines(lab, C);
    assert.ok(lines.length > 0, lab.id);
    if (w.solidOnly) {
      assert.ok(w.notes.length > 0, lab.id);
      continue;
    }
    assert.ok(w.mixed.bin || w.mixed.needPh, lab.id);
    kinds.add(w.mixed.bin || 'ph');
  }
  // 실험의 폐액은 여러 통에 고루 나뉜다
  assert.deepEqual([...kinds].sort(), ['acid', 'alkali', 'inorganic', 'organic', 'ph']);
  const lab = (id) => W.forLab(B.EXPERIMENTS.find((e) => e.id === id), C);
  assert.equal(lab('vinegar').mixed.bin, 'organic');
  assert.deepEqual(lab('vinegar').each.map((e) => `${e.label}:${e.bin}`), ['수산화 나트륨:alkali', '식초:organic']);
  assert.equal(lab('limiting').mixed.bin, 'acid');
  assert.equal(lab('metal-activity').mixed.bin, 'inorganic');
  assert.deepEqual(lab('metal-activity').mixed.metals, ['구리', '은', '아연']);
  assert.equal(lab('neutralization-heat').mixed.needPh, true);
  assert.equal(lab('graham').solidOnly, true);
  assert.equal(lab('iodine-clock').each.find((e) => e.label === '과산화 수소수').bin, 'special');
});
