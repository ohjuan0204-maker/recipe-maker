// 전체 검증 (홈, R&E 주제 추천, 간편 준비): `node --test`
// 테스트 이름 맨 앞의 A번호가 SPEC.md 13장의 수용 기준이다.
const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../topics.js');
const L = require('../labcalc.js');
const B = require('../experiments.js');

test('A39 R&E 주제 자료: 30개 주제가 연구 질문·변인·실험 방안·주의를 갖추고, 연결된 실험과 계산이 실제로 있다', () => {
  assert.equal(T.TOPICS.length, 30);
  assert.equal(new Set(T.TOPICS.map((t) => t.id)).size, 30);
  for (const t of T.TOPICS) {
    assert.ok(t.title && t.question && t.change && t.measure && t.fixed && t.caution && t.extend, `${t.id}: 글`);
    assert.ok(t.careers.length >= 1 && t.careers.every((c) => T.CAREERS.includes(c)), `${t.id}: 진로`);
    assert.ok(t.tools.every((x) => T.TOOLS.includes(x)), `${t.id}: 장비`);
    assert.ok([1, 2, 3].includes(t.level), `${t.id}: 난이도`);
    assert.ok(t.plan.length >= 4 && t.needs.length >= 3 && t.keywords.length >= 4, `${t.id}: 방안·준비물·키워드`);
    for (const id of t.labs) assert.ok(B.EXPERIMENTS.some((e) => e.id === id), `${t.id}: 실험 ${id}`);
    for (const id of t.calcs) assert.ok(L.find(id), `${t.id}: 계산 ${id}`);
  }
  for (const career of T.CAREERS) assert.ok(T.TOPICS.filter((t) => t.careers.includes(career)).length >= 3, `${career}: 주제 3개 이상`);
});

test('A40 주제 추천 규칙: 진로 +3, 키워드 +2, 장비 +1(없으면 −4), 난이도 +2', () => {
  // R1: 환경 + "흡착" + 분광 광도계 + 보통 → 1순위는 흡착제 주제, 8점
  const r1 = T.recommend({ careers: ['환경'], keyword: '흡착', tools: ['분광 광도계'], level: 2 });
  assert.equal(r1.length, 5);
  assert.equal(r1[0].topic.id, 'adsorb');
  assert.equal(r1[0].score, 8);
  assert.deepEqual(r1[0].why, ['진로: 환경', '키워드: 흡착', '가진 장비로 가능', '난이도 맞음']);
  // R2: 기본 유리 기구만 → 장비가 필요 없는 주제가 먼저 나온다
  const r2 = T.recommend({ careers: [], keyword: '', tools: [], level: 0, limit: 6 });
  assert.ok(r2.every((r) => r.topic.tools.length === 0), r2.map((r) => r.topic.id).join());
  assert.ok(r2.every((r) => r.why.includes('기본 기구로 가능')));
  // R3: 키워드 "배터리" → 알루미늄-공기 전지
  assert.equal(T.recommend({ keyword: '배터리' })[0].topic.id, 'al-air');
  // R4: 아무것도 고르지 않으면 목록의 앞에서부터 나온다
  assert.deepEqual(T.recommend({}).map((r) => r.topic.id), T.TOPICS.slice(0, 5).map((t) => t.id));
  // R5: AI·데이터 + 스마트폰 카메라만 → 그 장비로 되는 주제 둘이 먼저, pH 미터가 더 필요한 주제는 −1점으로 밀린다
  const r5 = T.recommend({ careers: ['AI·데이터'], tools: ['스마트폰 카메라'], limit: 30 });
  assert.deepEqual(r5.slice(0, 2).map((r) => r.topic.id), ['phone-color', 'diy-spectrometer']);
  assert.deepEqual(r5.slice(0, 2).map((r) => r.score), [4, 4]);
  const phModel = r5.find((r) => r.topic.id === 'ph-model');
  assert.equal(phModel.score, -1);
  assert.ok(phModel.why.includes('더 필요한 장비: pH 미터'));
});

test('A41 오늘의 추천: 같은 날에는 같은 것, 다음 날에는 다음 것', () => {
  const list = ['a', 'b', 'c'];
  const d1 = T.pickOfDay(list, '2026-11-17');
  assert.equal(T.pickOfDay(list, '2026-11-17'), d1);
  assert.equal(T.pickOfDay(list, '2026-11-18'), list[(list.indexOf(d1) + 1) % 3]);
  assert.equal(T.pickOfDay(list, '날짜 아님'), 'a');
  assert.ok(T.TOPICS.includes(T.pickOfDay(T.TOPICS, '2026-11-17')));
  assert.ok(B.EXPERIMENTS.includes(T.pickOfDay(B.EXPERIMENTS, '2026-11-17')));
});

test('A42 간편 준비: 조 수만큼 시약의 양이 늘어난다', () => {
  // Q1: 0.100 M NaOH 250 mL × 4조 → 1000 mL, 4.000 g
  const q1 = L.prepareReagent({ id: 'NaOH', conc: '0.100', unit: 'M', volume: '250' }, 4);
  assert.deepEqual([q1.target, q1.amount], ['0.100 M 1000 mL', '4.000 g']);
  // Q2: 1.00 M 염산 100 mL × 3조 → 300 mL, 25.75 mL
  const q2 = L.prepareReagent({ preset: 'HCl', conc: '1.00', unit: 'M', volume: '100' }, 3);
  assert.deepEqual([q2.target, q2.amount], ['1.00 M 300 mL', '25.75 mL']);
  // Q3: 계산이 없는 줄은 "× 3조"를 붙인다. 1조면 그대로다
  assert.equal(L.prepareReagent({ text: '식초', amount: '10.00 mL' }, 3).amount, '10.00 mL × 3조');
  assert.equal(L.prepareReagent({ id: 'NaOH', conc: '0.100', unit: 'M', volume: '250' }, 1).target, '0.100 M 250 mL');
  assert.equal(L.prepareReagent({ id: 'NaOH', conc: '0.100', unit: 'M', volume: '250' }).amount, '1.000 g');
});

// ---- SPEC.md 14장: 글의 유사도, 분야 읽기, 새 주제 만들기 ----

test('A48 유사도와 분야 읽기: 같은 글은 1, 겹치지 않는 글은 0. 글에서 읽은 분야의 몫은 더해서 1. 하나 빼고 학습 평가가 기준선보다 높다', () => {
  // S1~S3
  assert.ok(Math.abs(T.similarity('염료 흡착', '염료 흡착') - 1) < 1e-9);
  assert.equal(T.similarity('염료 흡착', '전지 전압'), 0);
  const alAir = T.TOPICS.find((t) => t.id === 'al-air');
  const adsorb = T.TOPICS.find((t) => t.id === 'adsorb');
  assert.ok(T.similarity('배터리 전해질', alAir.title + alAir.keywords.join(' ')) > T.similarity('배터리 전해질', adsorb.title + adsorb.keywords.join(' ')));
  // S4: 자유롭게 적은 글로도 가까운 주제가 먼저 나온다 (규칙 점수는 그대로)
  const free = T.recommend({ keyword: '배터리 전해질' });
  assert.equal(free[0].topic.id, 'al-air');
  assert.equal(free[0].score, 4);
  assert.ok(free[0].similarity > free[1].similarity);
  // C1~C3
  const read = T.inferCareers('배터리 전해질');
  assert.equal(read[0].career, '에너지·배터리');
  assert.ok(Math.abs(read.reduce((sum, r) => sum + r.share, 0) - 1) < 1e-9);
  assert.ok(read.every((r) => T.CAREERS.includes(r.career)));
  assert.equal(T.inferCareers('사진으로 농도 예측')[0].career, 'AI·데이터');
  assert.deepEqual(T.inferCareers('김치'), []);
  assert.deepEqual(T.inferCareers(''), []);
  // C4: 주제 하나를 빼고 학습해 그 분야를 맞히는 평가
  const score = T.evaluateInference();
  assert.deepEqual(score, { total: 30, top1: 19, top2: 24, baseline: 13 });
  assert.ok(score.top1 > score.baseline);
});

test('A49 새 주제 만들기: 조합 164가지가 겹치지 않게 나오고, 고른 장비로 할 수 있는 것만 나오며, 같은 입력에는 같은 결과가 나온다', () => {
  // 조사
  assert.equal(T.josa('염분', '을', '를'), '염분을');
  assert.equal(T.josa('온도', '이', '가'), '온도가');
  assert.equal(T.josa('용액의 pH', '이', '가'), '용액의 pH가');
  assert.equal(T.josa('귤껍질 가루', '을', '를'), '귤껍질 가루를');
  // 묶음의 자료
  assert.equal(T.BLOCKS.length, 10);
  for (const block of T.BLOCKS) {
    assert.ok(block.careers.every((c) => T.CAREERS.includes(c)), `${block.id}: 진로`);
    assert.ok(block.objects.length >= 3 && block.variables.length === 4 && block.steps.length === 2, `${block.id}: 재료·변인·과정`);
    for (const id of block.labs) assert.ok(B.EXPERIMENTS.some((e) => e.id === id), `${block.id}: 실험 ${id}`);
    for (const m of block.measures) {
      const measure = T.MEASURES[m];
      assert.ok(measure, `${block.id}: 재는 방법 ${m}`);
      assert.ok(measure.tool === null || T.TOOLS.includes(measure.tool), `${m}: 장비`);
      for (const id of (block.calcs || measure.calcs).concat(['stats'])) assert.ok(L.find(id), `${block.id}: 계산 ${id}`);
    }
  }
  assert.equal(T.countCombinations(), 164);
  // G1: 관심사 "배터리 전해질"
  const g1 = T.generate({ keyword: '배터리 전해질' });
  assert.equal(g1.length, 6);
  assert.equal(g1[0].title, '아연-구리 전지의 전압과 출력에 전해질의 농도가 미치는 영향');
  assert.equal(g1[0].question, '전해질의 농도를 바꾸면 아연-구리 전지의 전압과 출력은 어떻게 달라질까?');
  assert.equal(g1[0].nearestTitle, '알루미늄-공기 전지의 전해질과 출력');
  assert.equal(Math.round(g1[0].novelty * 100), 63);
  assert.deepEqual(g1.map((t) => t.id), T.generate({ keyword: '배터리 전해질' }).map((t) => t.id));
  // G2: 진로를 고르면 그 진로의 묶음에서 나온다
  const g2 = T.generate({ careers: ['식품·화장품'], count: 4 });
  assert.ok(g2.every((t) => t.careers.includes('식품·화장품')), g2.map((t) => t.title).join(' / '));
  // G3: 묶음을 넘기면 다른 주제가 나오고, 끝까지 넘기면 164가지가 한 번씩 나온 뒤 빈 배열이다
  const all = [];
  let round = 0;
  for (;;) {
    const page = T.generate({ round });
    if (!page.length) break;
    all.push(...page);
    round += 1;
  }
  assert.equal(all.length, 164);
  assert.equal(new Set(all.map((t) => t.title)).size, 164);
  assert.equal(new Set(all.map((t) => t.id)).size, 164);
  const old = new Set(T.TOPICS.map((t) => t.title));
  for (const t of all) {
    assert.ok(t.generated && t.id.startsWith('gen-') && !old.has(t.title), t.title);
    assert.ok(t.plan.length === 5 && t.needs.length >= 4 && t.question && t.change && t.measure && t.fixed && t.caution && t.extend, `${t.title}: 글`);
    assert.ok(t.novelty > 0 && t.novelty <= 1 && old.has(t.nearestTitle), `${t.title}: 새로움`);
    assert.ok(!(t.change.includes('온도') && t.measure === '온도의 변화'), `${t.title}: 바꾸는 것과 재는 것이 같음`);
    assert.ok(!/undefined|null|\{o/.test(JSON.stringify(t)), `${t.title}: 빈 자리`);
  }
  // G4: 기본 유리 기구만 → 장비가 필요 없는 84가지
  const basic = T.generate({ tools: [], count: 200 });
  assert.equal(basic.length, 84);
  assert.ok(basic.every((t) => t.tools.length === 0));
  // G5: 스마트폰 카메라만 → 스마트폰이거나 장비가 필요 없는 것만
  assert.ok(T.generate({ tools: ['스마트폰 카메라'], count: 200 }).every((t) => t.tools.every((x) => x === '스마트폰 카메라')));
});
