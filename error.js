// 오차 분석: 결과 정리에 넣은 값으로 정확도와 정밀도를 보고, 튀는 값(Q 검정)과 기구의 불확도, 실험마다 흔한 오차의 방향을 정리한다 (SPEC 25장).
// 화면은 app.js가 그린다. 여기에는 계산 규칙과 기구의 허용 오차, 실험별 오차 원인만 있다.
(function (root) {
  'use strict';

  const IS_NODE = typeof module !== 'undefined' && module.exports;

  /* ---------- 기구의 허용 오차 ----------
     부피 기구는 A급(ASTM·ISO에서 정한 허용 오차) 기준이다. B급은 대개 두 배다. 기구에 적힌 값이 있으면 그것을 쓴다.
     reads: 한 값을 얻으려고 읽는 횟수. 두 번 읽어 뺀 값(저울로 잰 질량, 온도 차)은 2다.
     once: 모든 회차에 똑같이 들어가는 것(같은 용액의 농도, 한 번 묽힌 것). 정밀도를 볼 때는 뺀다. */
  const TOOLS = [
    { id: 'pipette10', name: '홀 피펫 10 mL', value: 10, u: 0.02, unit: 'mL', reads: 1 },
    { id: 'pipette20', name: '홀 피펫 20 mL', value: 20, u: 0.03, unit: 'mL', reads: 1 },
    { id: 'pipette25', name: '홀 피펫 25 mL', value: 25, u: 0.03, unit: 'mL', reads: 1 },
    { id: 'gradpipette10', name: '눈금 피펫 10 mL', value: 10, u: 0.05, unit: 'mL', reads: 1 },
    { id: 'flask100', name: '부피 플라스크 100 mL', value: 100, u: 0.08, unit: 'mL', reads: 1, once: true },
    { id: 'flask250', name: '부피 플라스크 250 mL', value: 250, u: 0.12, unit: 'mL', reads: 1, once: true },
    { id: 'burette', name: '뷰렛 50 mL (넣은 부피)', value: 20, u: 0.05, unit: 'mL', reads: 1 },
    { id: 'cyl10', name: '눈금 실린더 10 mL', value: 10, u: 0.1, unit: 'mL', reads: 1 },
    { id: 'cyl50', name: '눈금 실린더 50 mL', value: 50, u: 0.25, unit: 'mL', reads: 1 },
    { id: 'cyl100', name: '눈금 실린더 100 mL', value: 100, u: 0.5, unit: 'mL', reads: 1 },
    { id: 'bal01', name: '전자저울 0.01 g', value: 2, u: 0.01, unit: 'g', reads: 2 },
    { id: 'bal001', name: '전자저울 0.001 g', value: 0.5, u: 0.001, unit: 'g', reads: 2 },
    { id: 'bal0001', name: '분석용 저울 0.0001 g', value: 0.5, u: 0.0001, unit: 'g', reads: 2 },
    { id: 'thermo01', name: '온도계 0.1 °C (온도 차)', value: 5, u: 0.1, unit: '°C', reads: 2 },
    { id: 'thermo1', name: '온도계 1 °C 눈금 (온도 차)', value: 5, u: 0.5, unit: '°C', reads: 2 },
    { id: 'timer', name: '초시계 (손으로 누름)', value: 30, u: 0.2, unit: 's', reads: 1 },
    { id: 'ruler', name: '자 1 mm 눈금', value: 30, u: 0.1, unit: 'cm', reads: 1 },
    { id: 'ammeter', name: '전류계', value: 0.5, u: 0.01, unit: 'A', reads: 1 },
    { id: 'conc', name: '용액의 농도 (조제·표정 값, ±1%)', value: 0.1, u: 0.001, rel: 1, unit: 'M', reads: 1, once: true },
    { id: 'other', name: '직접 적기', value: 1, u: 0.01, unit: '', reads: 1 },
  ];
  const TOOL = Object.fromEntries(TOOLS.map((t) => [t.id, t]));

  // 실험마다 계산에 들어가는 측정: [기구, 이름, 처음 값, 이론값 계산의 입력 id(있으면 그 값을 쓴다), 곱할 수]
  // 값이 'mean'인 줄은 결과 정리의 평균을 값으로 쓴다(잰 값 그 자체).
  const BUDGETS = {
    hydrate: [['bal001', '오수화물의 질량', 2.0, 'm'], ['bal001', '가열 후 남은 질량', 'mean']],
    mgo: [['bal001', '마그네슘의 질량', 0.25, 'm'], ['bal001', '산화 마그네슘의 질량', 'mean']],
    limiting: [['bal01', '탄산 칼슘의 질량', 1.0, 'm'], ['cyl50', '염산의 부피', 50, 'vol'], ['bal01', '줄어든 질량', 'mean']],
    precipitate: [['pipette10', '질산 은 수용액의 부피', 10, 'va'], ['conc', '질산 은의 농도', 0.1, 'ca'], ['bal001', '말린 앙금의 질량', 'mean']],
    'gas-constant': [['bal001', '마그네슘의 질량', 0.04, 'm'], ['cyl100', '모은 수소의 부피', 'mean']],
    graham: [['ruler', '유리관의 길이', 60, 'len'], ['ruler', '흰 고리까지의 거리', 'mean']],
    'neutralization-heat': [['cyl50', '염산의 부피', 50, 'va'], ['cyl50', '수산화 나트륨 수용액의 부피', 50, 'vb'], ['thermo01', '온도 변화', 'mean']],
    hess: [['bal01', '수산화 나트륨의 질량', 2.0, 'm'], ['cyl100', '용액의 부피', 100], ['thermo01', '온도 변화', 'mean']],
    'dissolution-heat': [['bal01', '녹인 물질의 질량', 5.0, 'm'], ['cyl50', '물의 부피', 50, 'water'], ['thermo01', '온도 변화', 'mean']],
    freezing: [['bal01', '용질의 질량', 3.0, 'm'], ['bal01', '물의 질량', 50, 'water'], ['thermo01', '어는점 내림', 'mean']],
    ksp: [['pipette25', '거른 포화 용액의 부피', 25, 'sample'], ['conc', '염산의 농도', 0.05, 'c'], ['burette', '넣은 염산', 'mean']],
    vinegar: [['pipette10', '식초 덜어 내기', 10], ['flask100', '묽히기', 100], ['pipette20', '묽힌 식초 덜어 내기', 20, 'sample'], ['conc', '수산화 나트륨의 농도', 0.1, 'c'], ['burette', '넣은 수산화 나트륨', 'mean']],
    'weak-acid': [['pipette10', '아세트산 덜어 내기', 10], ['flask100', '묽히기', 100]],
    permanganate: [['pipette10', '과산화 수소수 덜어 내기', 10], ['flask100', '묽히기', 100], ['pipette10', '묽힌 용액 덜어 내기', 10, 'sample'], ['conc', '과망가니즈산 칼륨의 농도', 0.02, 'c'], ['burette', '넣은 과망가니즈산 칼륨', 'mean']],
    'ki-electrolysis': [['ammeter', '전류', 0.2, 'i'], ['timer', '전류를 흘린 시간 (초)', 180, 't', 60]],
    'vitamin-c': [['flask100', '녹여서 채운 부피', 100, 'flask'], ['pipette10', '덜어 낸 부피', 10, 'sample'], ['conc', '아이오딘 용액의 농도', 0.01, 'c'], ['burette', '넣은 아이오딘 용액', 'mean']],
  };

  // 실험의 불확도 표 첫 줄들. values: 이론값 계산에 넣은 값 { id: '글' }, mean: 결과 정리의 평균(단위가 기구와 같을 때만 쓴다)
  function budgetRows(labId, values, mean, unit) {
    return (BUDGETS[labId] || []).map(([toolId, label, value, input, factor]) => {
      const tool = TOOL[toolId];
      let v = value === 'mean' ? NaN : value;
      if (input && values && values[input] != null && String(values[input]).trim() !== '') {
        const got = Number(String(values[input]).replace(/,/g, ''));
        if (Number.isFinite(got) && got > 0) v = got * (factor || 1);
      }
      if (value === 'mean') v = finite(mean) && (!unit || !tool.unit || unit === tool.unit) ? Math.abs(mean) : tool.value;
      const u = tool.rel ? (Math.abs(v) * tool.rel) / 100 : tool.u;
      return { tool: toolId, label, value: v, u, reads: tool.reads, unit: tool.unit, mean: value === 'mean', once: Boolean(tool.once) };
    });
  }

  /* ---------- 실험마다 흔한 오차와 그 방향 ----------
     dir: 결과 정리에서 잰 값(이론값 계산의 대표값)이 1 커진다, -1 작아진다, 0 어느 쪽으로든 흔들린다, 'x' 잰 값에는 영향이 거의 없다.
     abs: true면 크기(절댓값)로 견준다 (흡열이라 값이 음수인 실험). */
  const CAUSES = {
    hydrate: { what: '가열 후 남은 질량', items: [
      [1, '덜 가열해 결정수가 남았다', '결정수 x는 작게 나온다'],
      [-1, '너무 세게 가열해 황산 구리(II)가 분해되었다 (검게 변함)', '결정수 x는 크게 나온다'],
      [1, '식히는 동안 공기 중의 수분을 다시 흡수했다', '데시케이터에서 식혀야 한다'],
      [-1, '가열할 때 결정이 튀어 나갔다', '뚜껑을 조금 열어 덮고 약하게 시작한다'],
      [-1, '빈 도가니를 미리 가열해 말리지 않았다', '도가니에 있던 물이 함께 날아가 남은 질량이 작게 계산된다'],
    ] },
    mgo: { what: '산화 마그네슘의 질량', items: [
      [-1, '마그네슘이 다 타지 않았다', '산소 비율이 작게 나온다'],
      [-1, '흰 연기(산화 마그네슘)가 도가니 밖으로 날아갔다', '뚜껑을 조금씩만 연다'],
      [-1, '공기 중의 질소와 반응해 질화 마그네슘이 생겼다', '물을 몇 방울 넣고 다시 가열하면 산화 마그네슘으로 바뀐다'],
      [-1, '사포로 겉의 산화막을 닦지 않았다', '처음 질량에 이미 산소가 들어 있다'],
    ] },
    limiting: { what: '줄어든 질량 (빠져나간 이산화 탄소)', items: [
      [-1, '이산화 탄소가 용액에 조금 녹아 남았다', ''],
      [1, '거품과 함께 물방울(수증기)도 빠져나갔다', '솜으로 입구를 막으면 줄일 수 있다'],
      [-1, '반응이 끝나기 전에 질량을 쟀다', '거품이 멈출 때까지 기다린다'],
      [1, '플라스크 겉에 묻은 물이 마르면서 질량이 줄었다', ''],
    ] },
    precipitate: { what: '말린 앙금의 질량', items: [
      [1, '앙금을 덜 말렸다', '질량이 더 줄지 않을 때까지 말린다'],
      [-1, '고운 앙금이 거름종이를 빠져나갔다', ''],
      [1, '앙금을 증류수로 씻지 않아 녹아 있던 물질이 함께 말랐다', ''],
      [-1, '염화 은이 빛을 받아 일부 분해되었다 (보라·회색)', '어두운 곳에서 다룬다'],
    ] },
    'gas-constant': { what: '모은 수소의 부피', items: [
      [-1, '마그네슘 겉의 산화막을 닦지 않았다', '실제로 반응한 마그네슘이 적다'],
      [-1, '고무마개나 관에서 기체가 샜다', ''],
      [1, '반응열로 데워진 기체를 식기 전에 읽었다', '실온이 된 뒤 읽는다'],
      [1, '눈금 실린더 안쪽 수면이 수조 수면보다 높은 채로 읽었다', '기체 압력이 대기압보다 낮아 부피가 커 보인다. 두 수면을 맞추고 읽는다'],
      ['x', '수증기압을 빼지 않고 계산했다', '부피는 그대로지만 R을 구할 때 수소의 압력이 크게 잡혀 R이 크게 나온다'],
    ] },
    graham: { what: '암모니아 쪽 끝에서 흰 고리까지의 거리', items: [
      [1, '암모니아 솜을 먼저 넣었다', ''],
      [-1, '염화 수소(진한 염산) 솜을 먼저 넣었다', '두 솜을 동시에 넣고 동시에 막는다'],
      [1, '암모니아수를 더 많이 적셨다', ''],
      [0, '고리가 넓게 퍼진 뒤에 재었다', '처음 보이는 자리를 바로 표시한다'],
      [0, '관 주변에 바람이 불거나 관이 기울었다', ''],
    ] },
    'neutralization-heat': { what: '온도 변화', items: [
      [-1, '열이 컵 밖으로 빠져나갔다 (뚜껑이 없거나 한 겹 컵)', ''],
      [-1, '가장 높은 온도를 지나 늦게 읽었다', '시간에 따라 적고 그래프로 최고 온도를 찾는다'],
      [-1, '열량계와 온도계가 흡수한 열을 빼먹었다', '열량계의 열용량을 따로 구한다'],
      [-1, '수산화 나트륨 수용액이 공기 중 이산화 탄소를 흡수해 묽어졌다', ''],
      [0, '두 용액의 처음 온도가 달랐는데 한쪽만 쟀다', '두 온도의 평균을 처음 온도로 쓴다'],
    ] },
    hess: { what: '온도 변화', items: [
      [-1, '수산화 나트륨 고체가 공기 중 수분을 흡수해 실제 양이 적었다', '빨리 달고 바로 넣는다'],
      [-1, '열이 컵 밖으로 빠져나갔다', ''],
      [-1, '고체가 천천히 녹아 그동안 열이 빠졌다', '잘 젓는다'],
    ] },
    'dissolution-heat': { what: '온도 변화의 크기', abs: true, items: [
      [-1, '주변과 열을 주고받았다 (뚜껑이 없거나 한 겹 컵)', ''],
      [-1, '다 녹기 전에 온도를 읽었다', ''],
      [-1, '염화 칼슘이 이미 공기 중 수분을 먹었다', '무수물 병은 바로 닫는다'],
      [0, '젓지 않아 온도가 고르지 않았다', ''],
    ] },
    freezing: { what: '어는점 내림', items: [
      [1, '용액이 과냉각된 가장 낮은 온도를 어는점으로 읽었다', '과냉각이 풀려 다시 올라간 뒤 평평한 온도를 읽는다'],
      [1, '얼음이 많이 생겨 남은 용액이 진해진 뒤에 읽었다', ''],
      [-1, '용질이 다 녹지 않았다', ''],
      ['x', '온도계의 0점이 조금 어긋나 있었다', '같은 온도계로 물과 용액을 재면 차이에서 상쇄된다'],
    ] },
    ksp: { what: '넣은 염산의 부피', items: [
      [-1, '포화 용액이 공기 중 이산화 탄소를 흡수해 탄산 칼슘이 생겼다', ''],
      [1, '거를 때 녹지 않은 수산화 칼슘이 섞여 들어갔다', ''],
      [-1, '포화 용액의 온도가 높았다', '수산화 칼슘은 온도가 오르면 덜 녹는다'],
      [1, '뷰렛을 염산으로 헹구지 않았다', '염산이 묽어져 더 많이 넣게 된다'],
      [1, '종말점을 지나쳤다', ''],
    ] },
    vinegar: { what: '넣은 수산화 나트륨의 부피', items: [
      [1, '뷰렛 끝의 공기 방울을 빼지 않고 시작했다', '방울이 빠진 만큼 부피가 크게 읽힌다'],
      [1, '뷰렛을 수산화 나트륨 수용액으로 헹구지 않았다', '남은 물에 묽어진다'],
      [1, '종말점을 지나쳐 분홍이 진해졌다', '연분홍이 30초 남을 때 멈춘다'],
      [1, '수산화 나트륨 수용액이 공기 중 이산화 탄소를 흡수했다', ''],
      [-1, '피펫을 식초로 헹구지 않았다', '식초가 묽어진다'],
      [1, '피펫 끝의 마지막 방울을 불어 냈다', '식초가 조금 더 들어간다'],
      ['x', '삼각 플라스크에 증류수가 남아 있었다', '아세트산의 몰수는 그대로라 영향이 없다'],
    ] },
    'weak-acid': { what: 'pH', items: [
      [0, 'pH 미터를 보정하지 않았거나 완충 용액이 오래되었다', 'pH가 0.1만 달라도 Ka는 약 1.6배 달라진다'],
      [1, '전극을 헹군 물을 닦지 않고 넣었다', '시료가 묽어져 pH가 올라간다'],
      [1, '묽힐 때 표선을 넘겼다', '더 묽어져 pH가 올라간다'],
      [0, '숫자가 멈추기 전에 읽었다', ''],
    ] },
    buffer: { what: '넣은 뒤의 pH', items: [
      [0, 'pH 미터를 보정하지 않았다', ''],
      [0, '스포이트 한 방울의 부피가 생각과 달랐다', '눈금 피펫으로 넣으면 줄일 수 있다'],
      [0, '넣고 충분히 젓지 않았다', ''],
    ] },
    permanganate: { what: '넣은 과망가니즈산 칼륨의 부피', items: [
      [1, '황산을 덜 넣어 갈색 앙금(이산화 망가니즈)이 생겼다', '이온 하나가 받는 전자가 줄어 더 많이 넣게 된다'],
      [1, '종말점을 지나쳤다', ''],
      [1, '과망가니즈산 칼륨 용액이 빛을 받아 일부 분해되었다', '갈색 병에 둔다'],
      [-1, '과산화 수소수가 오래되어 분해되었다', ''],
      ['x', '진한 보라색이라 메니스커스의 윗면으로 읽었다', '처음과 나중을 같은 방식으로 읽으면 상쇄된다'],
    ] },
    'ki-electrolysis': { what: '생긴 아이오딘의 양', items: [
      [-1, '전지가 약해져 전류가 줄었다', '전류계로 전류를 함께 잰다'],
      [-1, '(+)극에서 산소도 함께 생겼다', ''],
      [-1, '아이오딘이 일부 날아갔다', ''],
    ] },
    'vitamin-c': { what: '넣은 아이오딘 용액의 부피', items: [
      [-1, '비타민 C 용액을 오래 두어 공기 중 산소에 산화되었다', '녹인 뒤 바로 적정한다'],
      [1, '아이오딘 용액이 날아가 묽어졌다', ''],
      [1, '종말점을 지나쳤다', ''],
      ['x', '정제의 녹지 않는 가루를 거르지 않았다', '반응하지 않아 거의 영향이 없다'],
    ] },
  };
  const COMMON = [
    [0, '눈금을 위나 아래에서 비스듬히 읽었다 (시차)', '눈높이를 눈금에 맞춘다'],
    [0, '회차마다 다루는 사람이나 조건(온도, 시간)이 달랐다', ''],
    [0, '기구 자체의 허용 오차', '아래 기구 불확도 표가 그 크기다'],
  ];

  function causes(labId) {
    const own = CAUSES[labId];
    const list = (own ? own.items : []).concat(COMMON);
    return { what: own ? own.what : '잰 값', abs: Boolean(own && own.abs), items: list.map(([dir, text, why]) => ({ dir, text, why: why || '' })) };
  }

  /* ---------- 계산 ---------- */

  const finite = (x) => typeof x === 'number' && Number.isFinite(x);

  // 평균, 표준 편차(n − 1), 상대 표준 편차(%), 평균의 표준 오차
  function stats(values) {
    const xs = (values || []).filter(finite);
    const n = xs.length;
    if (!n) return { n: 0, mean: NaN, sd: NaN, rsd: NaN, sem: NaN };
    const mean = xs.reduce((s, x) => s + x, 0) / n;
    const sd = n >= 2 ? Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1)) : NaN;
    const rsd = n >= 2 && mean !== 0 ? (sd / Math.abs(mean)) * 100 : NaN;
    return { n, mean, sd, rsd, sem: n >= 2 ? sd / Math.sqrt(n) : NaN };
  }

  // 딕슨의 Q 검정 임계값 (n = 3 ~ 10)
  const Q90 = { 3: 0.941, 4: 0.765, 5: 0.642, 6: 0.56, 7: 0.507, 8: 0.468, 9: 0.437, 10: 0.412 };
  const Q95 = { 3: 0.97, 4: 0.829, 5: 0.71, 6: 0.625, 7: 0.568, 8: 0.526, 9: 0.493, 10: 0.466 };

  // 가장 튀는 값 하나를 본다. 돌려주는 값: null(3개 미만·10개 초과·모두 같음) 또는
  // { n, index(원래 차례), value, q, q90, q95, drop90, drop95, gap, range }
  function qTest(values) {
    const list = (values || []).map((v, index) => ({ v, index })).filter((x) => finite(x.v));
    const n = list.length;
    if (n < 3 || n > 10) return null;
    const sorted = list.slice().sort((a, b) => a.v - b.v);
    const range = sorted[n - 1].v - sorted[0].v;
    if (range === 0) return null;
    const low = (sorted[1].v - sorted[0].v) / range;
    const high = (sorted[n - 1].v - sorted[n - 2].v) / range;
    const pick = high >= low ? { item: sorted[n - 1], gap: sorted[n - 1].v - sorted[n - 2].v, q: high } : { item: sorted[0], gap: sorted[1].v - sorted[0].v, q: low };
    return { n, index: pick.item.index, value: pick.item.v, q: pick.q, q90: Q90[n], q95: Q95[n], drop90: pick.q > Q90[n], drop95: pick.q > Q95[n], gap: pick.gap, range };
  }

  // 기구 불확도. rows: [{ label, value, u, reads }] → 줄마다 상대 불확도(%)와 몫, 합친 상대 불확도(%).
  // 곱하고 나누는 계산에 들어가는 값이면 상대 불확도를 제곱해 더한 뒤 제곱근을 한다.
  function budget(rows) {
    const out = [];
    let sum = 0;
    for (const row of rows || []) {
      const value = Number(row.value);
      const u = Number(row.u);
      const reads = Math.max(1, Math.round(Number(row.reads) || 1));
      if (!finite(value) || !finite(u) || value === 0 || u < 0) {
        out.push({ label: row.label, ok: false, rel: NaN, share: NaN });
        continue;
      }
      const rel = ((u * Math.sqrt(reads)) / Math.abs(value)) * 100;
      sum += rel * rel;
      out.push({ label: row.label, ok: true, rel, share: 0 });
    }
    for (const row of out) if (row.ok) row.share = sum > 0 ? (row.rel * row.rel) / sum : 0;
    const total = out.some((r) => r.ok) ? Math.sqrt(sum) : NaN;
    const top = out.filter((r) => r.ok).sort((a, b) => b.share - a.share)[0] || null;
    // 회차마다 새로 생기는 몫만 (같은 용액의 농도, 한 번 묽힌 것처럼 모든 회차에 똑같이 들어가는 줄은 뺀다)
    const repRows = out.filter((r, i) => r.ok && !(rows[i] && rows[i].once));
    const rep = repRows.length ? Math.sqrt(repRows.reduce((t, r) => t + r.rel * r.rel, 0)) : NaN;
    return { rows: out, total, top, rep };
  }

  // 퍼센트 글: 10 미만은 소수 둘째 자리, 그 위는 첫째 자리. sign이면 +·− 부호를 붙인다.
  function pct(x, sign) {
    if (!finite(x)) return '—';
    const a = Math.abs(x);
    const body = a < 10 ? a.toFixed(2) : a.toFixed(1);
    return `${sign ? (x > 0 ? '+' : x < 0 ? '−' : '') : ''}${body} %`;
  }

  // 오차율과 흩어짐을 기구 불확도와 견준다.
  //   s: stats, theory: 이론값, ub: 기구 불확도(%), abs: 크기로 견줄지, rep: 회차마다 새로 생기는 불확도(%) — 정밀도의 기준
  // 돌려주는 값: { error, expanded, accuracy: 'ok'|'off'|'unknown', precision: 'good'|'fair'|'poor'|'unknown', kind, lines[](화면), doc[](보고서 문체) }
  function diagnose(s, theory, ub, abs, rep) {
    const lines = [];
    const doc = [];
    const has = finite(theory) && theory !== 0 && s && s.n >= 1 && finite(s.mean);
    const mean = has && abs ? Math.abs(s.mean) : s ? s.mean : NaN;
    const ref = has && abs ? Math.abs(theory) : theory;
    const error = has ? ((mean - ref) / Math.abs(ref)) * 100 : NaN;
    // 흩어짐(평균의 표준 오차)과 기구 불확도를 합쳐 두 배 한 것을 '이 정도 차이는 날 수 있는 폭'으로 본다 (약 95%).
    const semRel = s && s.n >= 2 && finite(s.rsd) ? s.rsd / Math.sqrt(s.n) : NaN;
    const parts = [ub, semRel].filter(finite);
    const expanded = parts.length ? 2 * Math.sqrt(parts.reduce((t, x) => t + x * x, 0)) : NaN;

    // 정밀도는 회차마다 새로 생기는 불확도(피펫, 뷰렛 읽기, 저울…)와 견준다. 표준 용액의 농도처럼 모든 회차에 똑같이 들어가는 것은 빼고 본다.
    let precision = 'unknown';
    if (s && s.n >= 2 && finite(s.rsd)) {
      const base = finite(rep) && rep > 0 ? rep : NaN;
      const good = finite(base) ? Math.max(2 * base, 0.5) : 2;
      const fair = finite(base) ? Math.max(5 * base, 2) : 5;
      precision = s.rsd <= good ? 'good' : s.rsd <= fair ? 'fair' : 'poor';
    }
    let accuracy = 'unknown';
    if (finite(error) && finite(expanded)) accuracy = Math.abs(error) <= expanded ? 'ok' : 'off';

    const r = s ? pct(s.rsd) : '';
    if (precision === 'good') {
      lines.push(`정밀도: 회차끼리 고르게 나왔어요 (상대 표준 편차 ${r}).`);
      doc.push(`정밀도: 상대 표준 편차가 ${r}로 회차끼리 고르게 나왔다.`);
    } else if (precision === 'fair') {
      lines.push(`정밀도: 조금 흩어졌어요 (상대 표준 편차 ${r}). 회차마다 다룬 방법이나 조건이 조금씩 달랐을 수 있어요.`);
      doc.push(`정밀도: 상대 표준 편차가 ${r}로 조금 흩어졌다. 회차마다 다룬 방법이나 조건이 조금씩 달랐을 수 있다.`);
    } else if (precision === 'poor') {
      lines.push(`정밀도: 많이 흩어졌어요 (상대 표준 편차 ${r}). 기구 눈금만으로는 설명되지 않아요. 종말점 판단, 온도, 다룬 사람이 회차마다 달랐는지 보세요.`);
      doc.push(`정밀도: 상대 표준 편차가 ${r}로 많이 흩어졌다. 기구 눈금만으로는 설명되지 않으므로 종말점 판단, 온도처럼 회차마다 달라진 조건이 있었다고 본다.`);
    } else if (s && s.n === 1) {
      lines.push('정밀도: 한 번만 재서 흩어짐을 알 수 없어요. 3회 이상 재면 볼 수 있어요.');
      doc.push('정밀도: 한 번만 재어 판단할 수 없다.');
    }

    const e = pct(error, true);
    const u = pct(expanded);
    if (accuracy === 'ok') {
      lines.push(`정확도: 이론값과 ${e} 차이로, 측정이 가질 수 있는 폭(±${u}) 안이에요. 이론값과 맞는다고 볼 수 있어요.`);
      doc.push(`정확도: 오차율 ${e}는 측정이 가질 수 있는 폭(±${u}) 안이므로 이론값과 맞는다고 볼 수 있다.`);
    } else if (accuracy === 'off') {
      lines.push(`정확도: 이론값과 ${e} 차이로, 측정이 가질 수 있는 폭(±${u})보다 커요. 한쪽으로 치우치게 만든 원인(계통 오차)이 있었다고 볼 수 있어요.`);
      doc.push(`정확도: 오차율 ${e}는 측정이 가질 수 있는 폭(±${u})보다 커서 계통 오차가 있었다고 본다.`);
    } else if (finite(error)) {
      lines.push(`정확도: 이론값과 ${e} 차이예요. 기구 불확도를 넣으면 이 차이가 '날 수 있는 만큼'인지 판단할 수 있어요.`);
      doc.push(`정확도: 이론값과의 오차율은 ${e}이다.`);
    }

    let kind = 'unknown';
    if (accuracy === 'off' && (precision === 'good' || precision === 'unknown')) kind = 'systematic';
    else if (accuracy === 'off') kind = 'both';
    else if (precision === 'poor' || precision === 'fair') kind = 'random';
    else if (accuracy === 'ok') kind = 'ok';
    const way = error > 0 ? '크게' : '작게';
    if (kind === 'systematic') {
      lines.push(`값이 모여 있는데 한쪽(${way})으로 비켜 있어요. 아래에서 결과를 ${way} 만드는 원인부터 보세요.`);
      doc.push(`값들은 모여 있으나 이론값보다 ${way} 치우쳐 있어, 결과를 ${way} 만드는 원인이 있었다고 본다.`);
    }
    if (kind === 'both') {
      lines.push('흩어짐도 크고 한쪽으로도 치우쳤어요. 우연 오차와 계통 오차가 함께 있어요.');
      doc.push('흩어짐도 크고 한쪽으로도 치우쳐 우연 오차와 계통 오차가 함께 있었다.');
    }
    return { error, expanded, accuracy, precision, kind, lines, doc };
  }

  // 오차율의 부호와 같은 쪽으로 결과를 움직이는 원인인가 (오차가 작으면 판단하지 않는다)
  function matchesSign(dir, error, expanded) {
    if (!finite(error) || (dir !== 1 && dir !== -1)) return false;
    if (finite(expanded) && Math.abs(error) <= expanded) return false;
    return Math.sign(error) === dir;
  }

  // 원인 한 줄을 고찰에 쓸 문장으로: "…했다. → 잰 값이 크게 나온다 (까닭)"
  const DIR_TEXT = { 1: '크게', '-1': '작게', 0: '어느 쪽으로든', x: '' };
  function hasBatchim(word) {
    const ch = String(word || '').trim().slice(-1);
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
    return /[013678LMNRlmnr]$/.test(ch);
  }
  function causeLine(item, what) {
    const subject = `${what}${hasBatchim(String(what).replace(/\s*\(.*\)$/, '')) ? '이' : '가'}`;
    let effect;
    if (item.dir === 1 || item.dir === -1) effect = `${subject} ${DIR_TEXT[item.dir]} 나온다`;
    else if (item.dir === 0) effect = `${subject} 회차마다 흔들린다`;
    else effect = `${subject}에는 영향이 거의 없다`.replace(/(이|가)에는/, '에는');
    return `${item.text}. → ${effect}${item.why ? ` (${item.why})` : ''}.`;
  }

    // Q 검정을 한 문장으로. doc이면 보고서 문체. shown: 그 값을 보여 줄 글(단위 포함)
  function qLine(q, n, shown, dropped, doc) {
    if (n < 3) return doc ? '3회 미만이라 Q 검정은 하지 않았다.' : '3회 이상 재야 튀는 값을 볼 수 있어요.';
    if (n > 10) return doc ? 'Q 검정은 10회까지만 할 수 있어 하지 않았다.' : 'Q 검정은 10회까지만 봐요.';
    if (!q) return doc ? '값이 모두 같아 튀는 값이 없었다.' : '값이 모두 같아 튀는 값이 없어요.';
    if (doc) {
      const verdict = q.drop95 ? '95% 기준값보다도 커서 버릴 수 있다' : q.drop90 ? '90% 기준값보다는 크지만 95% 기준값보다는 작다' : '기준값보다 작아 남겼다';
      return `Q 검정: ${q.index + 1}회 값 ${shown}의 Q는 ${q.q.toFixed(3)}로, ${q.n}회의 기준값(90% ${q.q90}, 95% ${q.q95})과 견주면 ${verdict}.${dropped ? ' 이 값을 빼고 평균을 구했다.' : ''}`;
    }
    const verdict = q.drop95 ? '95% 기준으로도 버려도 되는 값이에요.' : q.drop90 ? '90% 기준으로는 버릴 수 있지만, 95% 기준으로는 남겨요.' : '기준값보다 작아 버리지 않아요.';
    return `가장 튀는 값은 ${q.index + 1}회의 ${shown} (Q = ${q.q.toFixed(3)}). ${q.n}회일 때 기준값은 90%에서 ${q.q90}, 95%에서 ${q.q95}이에요. ${verdict}${dropped ? ' 이 값을 빼고 평균을 다시 구했어요.' : ''}`;
  }

  const api = { TOOLS, TOOL, BUDGETS, budgetRows, CAUSES, COMMON, causes, causeLine, DIR_TEXT, stats, qTest, qLine, Q90, Q95, budget, diagnose, matchesSign, pct };
  if (IS_NODE) module.exports = api;
  else root.LabError = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
