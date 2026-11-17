// 전체 검증 (검색): `node --test`
// 테스트 이름 맨 앞의 A번호가 SPEC.md 21장의 수용 기준이다.
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../search.js');
const B = require('../experiments.js');
const L = require('../labcalc.js');

// 앱(app.js의 searchIndex)과 같은 꼴의 문서 목록
const BASIC = [
  ['convert', '농도 환산'],
  ['titration', '중화 적정'],
  ['colligative', '총괄성 (어는점 내림·끓는점 오름)'],
  ['ph-strong', '강산·강염기의 pH'],
];
const tools = BASIC.map(([id, title]) => ({ id, title, group: '기본 계산', hint: '' })).concat(L.CALCS.map((calc) => ({ id: calc.id, title: calc.title, group: calc.group, hint: calc.hint })));
const pages = [
  { id: 'gear', title: '준비물', keywords: '기구 도구 장비 실험 기구' },
  { id: 'theory', title: '이론값 계산', keywords: '이론값 예상 결과 예측 물질의 양' },
  { id: 'recipe', title: '레시피·라벨', keywords: '레시피 카드 라벨 인쇄 스티커 병' },
];
const docs = S.buildIndex({ B, L, tools, pages });

const find = (query) => S.search(query, docs);
const ids = (result, type) => result.results.filter((item) => item.doc.type === type).map((item) => item.doc.id);
const labsOfUnit = (unit) => B.EXPERIMENTS.filter((lab) => lab.unit === unit).map((lab) => lab.id);

test('A70 문서 목록: 실험 33, 기구 84, 계산 29, 화면은 준 만큼', () => {
  const count = (type) => docs.filter((doc) => doc.type === type).length;
  assert.equal(count('lab'), 33);
  assert.equal(count('gear'), 84);
  assert.equal(count('calc'), 29);
  assert.equal(count('page'), pages.length);
});

test('A70 "산염기"처럼 붙여 친 말: 산과 염기 단원의 실험 다섯이 맨 앞에 오고, 어떻게 알아들었는지 알려 준다', () => {
  const result = find('산염기');
  const labs = ids(result, 'lab');
  const unit = labsOfUnit('산과 염기');
  assert.equal(unit.length, 5);
  assert.deepEqual(labs.slice(0, 5).sort(), unit.slice().sort());
  assert.ok(labs.length > 5, '중화열처럼 가까운 실험도 뒤에 나온다');
  assert.ok(labs.includes('neutralization-heat'));
  assert.deepEqual(result.hints, [{ token: '산염기', as: ['산과 염기'] }]);
  // 계산과 기구도 같이 나온다
  assert.ok(ids(result, 'calc').includes('ph-weak'));
  assert.ok(ids(result, 'gear').includes('phmeter'));
  // 띄어 쓰거나 다르게 써도 같은 실험이 맨 앞
  for (const query of ['산 염기', '산과염기', '산성', '알칼리']) {
    assert.deepEqual(ids(find(query), 'lab').slice(0, 5).sort(), unit.slice().sort(), query);
  }
});

test('A70 초성: "ㅈㅎㅈㅈ" → 중화 적정, "ㅂㅌㅁ" → 비타민', () => {
  const result = find('ㅈㅎㅈㅈ');
  assert.deepEqual(ids(result, 'lab'), ['vinegar']);
  assert.deepEqual(ids(result, 'calc'), ['titration', 'vinegar']);
  assert.deepEqual(result.hints, [{ token: 'ㅈㅎㅈㅈ', as: ['중화 적정'] }]);
  assert.deepEqual(ids(find('ㅂㅌㅁ'), 'lab'), ['vitamin-c']);
  // 낱말 가운데의 초성과는 맞추지 않는다 ("ㅈㅈ"이 "적정"이 아닌 "측정 장치"의 가운데와 맞으면 안 된다)
  assert.equal(S.matchToken('ㅎㅈ', S.makeDoc('lab', 'x', '중화 적정', '', [['중화 적정', 10, '제목']]), true), null);
});

test('A70 틀린 글자: 뷰랫 → 뷰렛, 삼각플라스코 → 삼각 플라스크, 적졍 → 적정, 페놀프탈래인 → 페놀프탈레인', () => {
  const burette = find('뷰랫');
  assert.deepEqual(ids(burette, 'gear'), ['burette']);
  assert.deepEqual(ids(burette, 'lab').sort(), ['ksp', 'permanganate', 'vinegar', 'vitamin-c']);
  assert.deepEqual(burette.hints, [{ token: '뷰랫', as: ['뷰렛'] }]);
  assert.deepEqual(ids(find('삼각플라스코'), 'gear'), ['erlenmeyer']);
  assert.deepEqual(ids(find('적졍'), 'lab').sort(), ['ksp', 'permanganate', 'vinegar', 'vitamin-c']);
  assert.ok(ids(find('페놀프탈래인'), 'lab').includes('vinegar'));
  assert.deepEqual(ids(find('르샤틀리애'), 'lab'), ['le-chatelier']);
});

test('A70 그대로 찾아지는 말은 틀린 글자로 넓히지 않는다: "전지"가 "전기"로 번지지 않는다', () => {
  const result = find('전지');
  assert.deepEqual(ids(result, 'lab').sort(), ['daniell', 'ki-electrolysis', 'metal-activity']);
  assert.deepEqual(ids(result, 'calc'), ['cell']);
  assert.ok(result.results.every((item) => item.how === 'exact'));
  assert.deepEqual(result.hints, []);
});

test('A70 다르게 부르는 이름과 화학식: 메스플라스크, 비이커, HCl, 요오드, Ca(OH)2, 과망간산칼륨', () => {
  assert.deepEqual(ids(find('메스플라스크'), 'gear'), ['volumetric']);
  assert.equal(ids(find('비이커'), 'gear')[0], 'beaker');
  assert.equal(ids(find('비이커'), 'lab').length, 15);
  // 화학식으로 쳐도 이름으로 적힌 실험을 찾는다
  assert.deepEqual(ids(find('HCl'), 'lab').sort(), ids(find('염산'), 'lab').sort());
  assert.equal(ids(find('HCl'), 'lab').length, 13);
  assert.ok(ids(find('요오드'), 'lab').includes('vitamin-c'));
  assert.deepEqual(ids(find('Ca(OH)2'), 'lab'), ['ksp']);
  assert.deepEqual(ids(find('과망간산칼륨'), 'lab'), ['permanganate']);
  assert.deepEqual(ids(find('NaOH'), 'lab').length, 10);
});

test('A70 짧은 화학식은 띄어 쓴 낱말을 넘어 이어 붙여 찾지 않는다: "H2O2"가 "2H2O + 2e"와 맞지 않는다', () => {
  const doc = S.makeDoc('lab', 'x', '물의 전기 분해', '', [['(−)극: 2H₂O + 2e⁻ → H₂ + 2OH⁻', 3, '내용']]);
  assert.equal(S.matchToken('h2o2', doc, false), null);
  assert.ok(S.matchToken('h2o', doc, false));
  assert.ok(!ids(find('H2O2'), 'lab').includes('ki-electrolysis'));
  assert.ok(ids(find('H2O2'), 'lab').includes('permanganate'));
});

test('A70 여러 낱말: 모두 맞는 것이 먼저, 하나도 없으면 일부만 맞는 것을 보여 준다', () => {
  const all = find('산 염기 적정');
  assert.equal(ids(all, 'lab')[0], 'vinegar');
  assert.equal(all.partial, false);
  const some = find('없는말 적정');
  assert.equal(some.partial, true);
  assert.deepEqual(ids(some, 'lab').sort(), ['ksp', 'permanganate', 'vinegar', 'vitamin-c']);
});

test('A70 색, 준비물로도 찾는다: 색변화 → 색이 변하는 실험 16개, 온도계 → 그 기구와 쓰는 실험', () => {
  const colors = B.EXPERIMENTS.filter((lab) => lab.colors).map((lab) => lab.id);
  assert.equal(colors.length, 16);
  assert.deepEqual(ids(find('색변화'), 'lab').sort(), colors.slice().sort());
  assert.deepEqual(ids(find('색 변화'), 'lab').sort(), colors.slice().sort());
  const thermo = find('온도계');
  assert.deepEqual(ids(thermo, 'gear'), ['thermometer']);
  assert.ok(ids(thermo, 'lab').includes('neutralization-heat'));
});

test('A70 없는 말과 빈칸: 결과 0개', () => {
  for (const query of ['없는실험', '가나다라', '', '   ', '!!!']) {
    const result = find(query);
    assert.equal(result.results.length, 0, JSON.stringify(query));
    assert.equal(result.partial, false);
  }
});

test('A70 다듬기와 낱낱의 도구: norm, chosung, loose, distance', () => {
  assert.equal(S.norm(' H₂O₂ (30%) '), 'h2o230');
  assert.equal(S.norm('산과 염기'), '산과염기');
  assert.equal(S.chosung('중화적정'), 'ㅈㅎㅈㅈ');
  assert.equal(S.loose('산염기', '산과염기'), true);
  assert.equal(S.loose('산기', '산과염기'), false, '두 글자는 차례로 찾지 않는다');
  assert.equal(S.loose('산염기', '산화와환원그리고염기'), false, '사이에 한 글자까지만');
  assert.equal(S.distance(S.jamo('뷰랫'), S.jamo('뷰렛'), 1), 1);
  assert.equal(S.distance('abc', 'abcdef', 1), 2, '한도를 넘으면 한도 + 1');
});

test('A70 시약표에서 찾기: 꼭 맞는 것이 맨 앞, 같은 뜻의 말로도 찾고, 영문 한두 글자는 화학식의 첫머리와만 견준다', () => {
  const C = require('../calc.js');
  const all = C.searchReagents('', '');
  assert.equal(all.length, 467);
  const names = (query) => S.reagents(query, all).map((r) => r.korean);
  assert.equal(names('NaCl')[0], '염화나트륨');
  assert.equal(names('NaCl').length, 4);
  assert.equal(names('HCl')[0], '염산');
  assert.equal(names('염산')[0], '염산');
  assert.deepEqual(names('소금'), ['염화나트륨']);
  assert.deepEqual(names('양잿물'), ['수산화나트륨']);
  assert.deepEqual(names('pH'), [], '영문 이름 속의 ph(phosphate, phenol)와는 맞추지 않는다');
  assert.ok(S.reagents('na', all).every((r) => S.norm(r.formula).startsWith('na') || S.norm(r.korean).includes('na')), '화학식이 Na로 시작하거나 이름에 Na가 있는 시약만');
  assert.ok(S.reagents('na', all).length < C.searchReagents('na', '').length);
  // 예전처럼 영문 이름 전체, 한글 이름의 일부로도 찾는다
  assert.deepEqual(names('Potassium Chloride'), ['염화 칼륨']);
  assert.equal(names('염화').length, C.searchReagents('염화', '').length);
  assert.equal(names('chlor').length, C.searchReagents('chlor', '').length);
  assert.deepEqual(names('zzz없는시약'), []);
  assert.deepEqual(S.reagents('', all), []);
});
