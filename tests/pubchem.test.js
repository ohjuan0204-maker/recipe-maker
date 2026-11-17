// 전체 검증 (26장: PubChem으로 채운 시약표, 폐액에서 시약표 이름 알아듣기): `node --test`
// 테스트 이름 맨 앞의 A번호가 SPEC.md 26장의 수용 기준이다.
const test = require('node:test');
const assert = require('node:assert/strict');
const LIST = require('../reagents.js');
const C = require('../calc.js');
const W = require('../waste.js');
const B = require('../experiments.js');

const GHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09'];

// 시약표를 넣기 전의 실험별 폐액 안내를 먼저 적어 둔다 (A110에서 비교)
const BEFORE = Object.fromEntries(B.EXPERIMENTS.map((lab) => [lab.id, JSON.stringify(W.forLab(lab, C))]));
W.useReagents(LIST);

const byId = (id) => LIST.find((e) => e.id === id);
const partsOf = (text) => W.partsOfText(text).map((id) => W.PART[id]);

test('A109 시약표: PubChem 번호와 GHS 그림 문자, 더한 시약 40종', () => {
  const added = LIST.filter((e) => e.add);
  assert.equal(added.length, 40, '더한 시약은 40종');
  assert.ok(added.every((e) => /^p\d{3}$/.test(e.id) && e.mm > 0 && e.f), '더한 시약은 p번호, 화학식, 분자량이 있다');
  const withCid = LIST.filter((e) => e.cid);
  assert.ok(withCid.length >= 400, `PubChem 번호가 있는 시약 ${withCid.length}종`);
  assert.ok(withCid.every((e) => Number.isInteger(e.cid) && e.cid > 0));
  for (const e of LIST) {
    if (e.ghs == null) continue;
    const codes = e.ghs.split(',').filter(Boolean);
    assert.ok(codes.every((g) => GHS.includes(g)), `${e.id}: GHS 번호는 01~09`);
    assert.ok(!e.sig || ['D', 'W'].includes(e.sig), `${e.id}: 신호어는 D 또는 W`);
    // 수생 만성 2(H411)처럼 환경 그림 문자만 있고 신호어가 없는 분류도 있다
    if (codes.some((g) => g !== '09')) assert.ok(e.sig, `${e.id}: 그림 문자가 있으면 신호어도 있다`);
  }
  // 대표 시약: 수산화 나트륨은 부식성·위험, 염화 나트륨은 분류 없음
  const naoh = C.searchReagents('NaOH').find((r) => r.formula === 'NaOH');
  assert.ok(naoh.ghs.includes('05'));
  assert.equal(naoh.signal, 'D');
  const nacl = C.searchReagents('NaCl').find((r) => r.formula === 'NaCl');
  assert.deepEqual(nacl.ghs, []);
  // 화면에 쓰는 이름표
  assert.equal(C.GHS_NAMES['05'], '부식성');
  assert.equal(Object.keys(C.GHS_NAMES).length, 9);
  // 더한 시약은 시약표 목록에서 찾을 수 있고 "더한 시약"으로 표시된다
  const khp = C.searchReagents('프탈산수소').find((r) => r.added);
  assert.ok(khp && khp.molarMass > 204 && khp.molarMass < 204.3, 'KHP 204.22');
  assert.ok(khp.use.includes('표준'));
});

test('A109 시약표: PubChem 화학식으로 바로잡은 값', () => {
  // s486: 화학식과 분자량을 PubChem에 맞춰 고쳤다
  assert.equal(byId('s486').f, 'C23H15Na3O9S');
  assert.equal(byId('s486').mm, 536.39);
  // s472: 질산 철(III) 구수화물로 바로잡아 수화물 배지가 붙는다
  assert.equal(byId('s472').f, 'Fe(NO3)3·9H2O');
  assert.equal(byId('s472').hydrate, true);
  // 화학식이 비어 있던 시약 10종을 PubChem 화학식으로 채웠다 (src p)
  assert.ok(LIST.filter((e) => e.src === 'p' && !e.add).length >= 10);
  // 보관 위치는 여전히 넣지 않는다
  assert.ok(LIST.every((e) => !('cab' in e) && !('shelf' in e)));
});

test('A110 폐액: 시약표의 모든 시약 이름을 알아듣는다', () => {
  assert.equal(W.TABLE.length > 0, true);
  const missed = [];
  for (const e of LIST) {
    const ids = W.partsOfText(e.ko);
    if (!ids.length) missed.push(`${e.id} ${e.ko}`);
  }
  assert.deepEqual(missed, [], '한글 이름으로 못 알아들은 시약');
  // 사용자가 말한 예: 알긴산 나트륨 → 유기계
  const alg = partsOf('알긴산 나트륨');
  assert.equal(alg.length, 1);
  assert.equal(alg[0].name.replace(/\s+/g, ''), '알긴산나트륨');
  assert.equal(W.decide(alg.map((p) => p.id)).bin, 'organic');
  // 띄어쓰기를 바꿔도, 영어 이름이나 화학식으로도
  assert.equal(W.partsOfText('알긴산나트륨')[0], alg[0].id);
  assert.equal(W.partsOfText('sodium alginate')[0], alg[0].id);
  // 옛 이름과 새 이름 (과망간산 ↔ 과망가니즈산)
  const kmno4 = W.partsOfText('과망간산 칼륨');
  assert.deepEqual(W.partsOfText('과망가니즈산 칼륨'), kmno4);
  assert.equal(kmno4.length, 1);
  // 문장 속에서도: 고정 성분과 시약표 시약을 함께
  const mixed = W.partsOfText('물에 알긴산 나트륨이랑 염화 칼슘을 녹인 것');
  assert.ok(mixed.includes(alg[0].id));
  assert.ok(mixed.length >= 3);
});

test('A110 폐액: 시약표 시약의 성질에 따라 통과 주의가 나온다', () => {
  const pick = (text) => W.decide(W.partsOfText(text));
  // 황산 구리 오수화물은 기존 성분(cu)으로 묶여 무기계(중금속)
  assert.deepEqual(W.partsOfText('황산 구리(II) 오수화물'), ['cu']);
  // 아자이드화 나트륨: 통에 붓지 않는다는 위험 안내
  const az = pick('아자이드화 나트륨');
  assert.ok(az.warnings.some((w) => w.level === 'danger'), '아자이드 위험');
  // 황화 나트륨과 산을 섞으면 황화 수소 경고
  const sulfide = W.decide(W.partsOfText('황화 나트륨').concat('hcl'));
  assert.ok(sulfide.warnings.some((w) => w.level === 'danger' && w.text.includes('황화 수소')));
  // 유기 시약(바닐린)은 유기계
  assert.equal(pick('바닐린').bin, 'organic');
});

test('A110 폐액: 시약표를 넣어도 실험 33개의 폐액 안내는 그대로다', () => {
  const changed = B.EXPERIMENTS.filter((lab) => JSON.stringify(W.forLab(lab, C)) !== BEFORE[lab.id]).map((lab) => lab.id);
  assert.deepEqual(changed, []);
});
