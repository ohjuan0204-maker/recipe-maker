// 폐액 버리기: 무엇이 섞였는지 고르면 어느 통에 버리는지 알려 준다 (SPEC 24장).
// 나누는 법은 과학실험 안전 매뉴얼(고등학교, 한국과학창의재단 2021)의 4-4 "폐수, 폐시약 관리 및 처리"를 따랐다.
//   - 폐액은 유기계 · 산 · 알칼리 · 무기계 넷으로 나누고, 유기계인가 → 산인가 → 알칼리인가 차례로 묻는다. 어디에도 들지 않으면 무기계.
//   - 암모니아가 든 폐액과 아세트산은 유기계에 모은다.
//   - 시약이 섞인 물은 아무리 적어도 폐액이다. 시약을 담았던 기구를 처음 헹군 물(2~3번째까지)도 모은다.
//   - 장갑·휴지·거름종이 같은 고체는 액체 통에 넣지 않는다. 깨진 유리와 플라스틱 스포이트 등은 따로 모은다.
// 학교마다 통의 이름과 나누는 법이 조금씩 다르다. 바꿀 곳: BINS(통의 이름과 설명), PARTS(성분과 부르는 말), LAB_NOTES(실험마다 덧붙이는 말).
(function () {
  'use strict';

  // 통. order는 화면에 늘어놓는 차례다.
  const BINS = [
    { id: 'organic', name: '유기계 폐액', what: '유기물(탄소 화합물)이나 암모니아가 든 폐액', examples: '아세트산·식초, 에탄올, 아세톤, 포도당·설탕물, 비타민 C, 암모니아수, 메틸렌 블루 같은 색소' },
    { id: 'acid', name: '산 폐액', what: '유기물이 없고 산성인 폐액', examples: '염산, 황산, 질산, 인산이 들어간 것 (물이 많아도)' },
    { id: 'alkali', name: '알칼리 폐액', what: '유기물이 없고 염기성인 폐액', examples: '수산화 나트륨, 수산화 칼슘(석회수), 탄산 나트륨이 들어간 것' },
    { id: 'inorganic', name: '무기계 폐액', what: '유기물이 없고 산성도 염기성도 아닌 폐액. 금속 이온이 든 중성 용액도 여기에 모아요', examples: '소금물, 황산 구리 수용액, 아이오딘화 칼륨, 중화가 끝난 용액' },
    { id: 'special', name: '따로 모으기', what: '통에 붓지 말고 선생님께 가져가요. 독성이 큰 것, 진한 산·염기, 섞으면 위험한 것, 뭔지 모르는 것', examples: '수은·카드뮴·크로뮴산, 병째 남은 진한 염산, 남은 과산화 수소, 뭐가 섞였는지 모르는 용액' },
    { id: 'solid', name: '고체 폐기물', what: '시약이 묻은 고체. 액체 통에는 넣지 않아요', examples: '거름종이와 앙금, 장갑, 휴지, pH 시험지, 플라스틱 스포이트, 남은 고체 시약' },
    { id: 'glass', name: '깨진 유리', what: '깨진 비커·시험관·유리 막대. 맨손으로 줍지 않아요', examples: '깨진 비커, 시험관, 슬라이드 글라스' },
    { id: 'sink', name: '싱크대', what: '시약이 전혀 닿지 않은 물과 얼음만', examples: '비커 바깥의 물중탕 물, 손 씻은 물' },
  ];

  // 성분. kind: water 물 · acid 산 · base 염기 · neutral 그 밖의 녹은 것 · solid 고체 · glass 깨진 유리
  // organic: 유기계로 보내는 성분. trace: 몇 방울만 넣는 지시약처럼 통을 바꾸지 않는 것.
  // metal: 기록지에 적을 금속 이름. special: 따로 모으는 것.
  // keys: 이 성분을 부르는 말. 긴 말부터 맞춰 보고, 맞은 글자는 지운 뒤 짧은 말을 맞춘다(질산 은 → 은, 질산이 아님).
  // word: 낱말 하나로만 맞는 짧은 말(산, 염기 등).
  const GROUPS = [
    ['water', '물·얼음'],
    ['acid', '산'],
    ['base', '염기'],
    ['organic', '유기물'],
    ['metal', '금속 이온'],
    ['etc', '그 밖의 시약'],
    ['solid', '고체·유리'],
  ];
  const PARTS = [
    // 물·얼음
    { id: 'water', group: 'water', name: '물', kind: 'water', keys: ['증류수', '수돗물', '맹물'], word: ['물'] },
    { id: 'ice', group: 'water', name: '얼음', kind: 'water', ice: true, keys: ['얼음물', '얼음', '얼음물중탕'] },
    // 산
    { id: 'hcl', group: 'acid', name: '염산', kind: 'acid', keys: ['진한 염산', '묽은 염산', '염산', '염화 수소', 'HCl'] },
    { id: 'h2so4', group: 'acid', name: '황산', kind: 'acid', keys: ['진한 황산', '묽은 황산', '황산', 'H2SO4'] },
    { id: 'hno3', group: 'acid', name: '질산', kind: 'acid', nitric: true, keys: ['진한 질산', '묽은 질산', '질산', 'HNO3'] },
    { id: 'h3po4', group: 'acid', name: '인산', kind: 'acid', keys: ['인산', 'H3PO4'] },
    { id: 'acetic', group: 'acid', name: '아세트산·식초', kind: 'acid', organic: true, acetic: true, keys: ['아세트산', '빙초산', '초산', '식초', 'CH3COOH'] },
    { id: 'citric', group: 'acid', name: '시트르산·레몬즙', kind: 'acid', organic: true, keys: ['시트르산', '구연산', '레몬즙', '레몬'] },
    { id: 'acid-any', group: 'acid', name: '산 (이름 모름)', kind: 'acid', keys: ['산성 용액'], word: ['산', '산성'] },
    // 염기
    { id: 'naoh', group: 'base', name: '수산화 나트륨', kind: 'base', keys: ['수산화 나트륨', '수산화나트륨', '가성 소다', 'NaOH'] },
    { id: 'koh', group: 'base', name: '수산화 칼륨', kind: 'base', keys: ['수산화 칼륨', 'KOH'] },
    { id: 'caoh2', group: 'base', name: '수산화 칼슘·석회수', kind: 'base', keys: ['수산화 칼슘', '석회수', 'Ca(OH)2'] },
    { id: 'carbonate', group: 'base', name: '탄산 나트륨·탄산수소 나트륨', kind: 'base', keys: ['탄산수소 나트륨', '탄산 나트륨', '베이킹 소다', '베이킹소다', 'NaHCO3', 'Na2CO3'] },
    { id: 'nh3', group: 'base', name: '암모니아수', kind: 'base', organic: true, ammonia: true, keys: ['진한 암모니아수', '암모니아수', '암모니아', 'NH3'] },
    { id: 'base-any', group: 'base', name: '염기 (이름 모름)', kind: 'base', keys: ['염기성 용액'], word: ['염기', '염기성', '알칼리'] },
    // 유기물
    { id: 'ethanol', group: 'organic', name: '에탄올·알코올', kind: 'neutral', organic: true, burn: true, keys: ['에탄올', '에틸 알코올', '알코올', '소독용 알코올', 'C2H5OH'] },
    { id: 'acetone', group: 'organic', name: '아세톤', kind: 'neutral', organic: true, burn: true, keys: ['아세톤'] },
    { id: 'sugar', group: 'organic', name: '포도당·설탕', kind: 'neutral', organic: true, keys: ['포도당', '설탕', '사이다', 'C6H12O6', 'C12H22O11'] },
    { id: 'urea', group: 'organic', name: '요소', kind: 'neutral', organic: true, keys: ['요소'] },
    { id: 'vitc', group: 'organic', name: '비타민 C', kind: 'acid', organic: true, keys: ['비타민 C', '비타민C', '아스코르브산'] },
    { id: 'dye', group: 'organic', name: '색소 (메틸렌 블루, 인디고 카민)', kind: 'neutral', organic: true, keys: ['메틸렌 블루', '메틸렌블루', '인디고 카민', '인디고카민', '적양배추', '색소'] },
    { id: 'acetate', group: 'organic', name: '아세트산 나트륨', kind: 'neutral', organic: true, keys: ['아세트산 나트륨', 'CH3COONa'] },
    { id: 'soap', group: 'organic', name: '비눗물·세제', kind: 'base', organic: true, keys: ['비눗물', '비누', '세제'] },
    { id: 'indicator', group: 'organic', name: '지시약 몇 방울', kind: 'neutral', organic: true, trace: true, keys: ['페놀프탈레인', '메틸 오렌지', '메틸오렌지', 'BTB', '브로모티몰 블루', '리트머스', '지시약'] },
    { id: 'starch', group: 'organic', name: '녹말 용액 조금', kind: 'neutral', organic: true, trace: true, keys: ['녹말 용액', '녹말', '전분'] },
    { id: 'organic-any', group: 'organic', name: '유기 용매 (이름 모름)', kind: 'neutral', organic: true, burn: true, keys: ['유기 용매', '유기용매'] },
    // 금속 이온
    { id: 'cu', group: 'metal', name: '구리 (황산 구리 등)', kind: 'neutral', metal: '구리', keys: ['황산 구리', '황산구리', '염화 구리', '질산 구리', '구리 이온', '구리', 'CuSO4', 'CuCl2', 'Cu2+'] },
    { id: 'ag', group: 'metal', name: '은 (질산 은)', kind: 'neutral', metal: '은', silver: true, keys: ['질산 은', '질산은', '은 이온', 'AgNO3', 'Ag+'] },
    { id: 'co', group: 'metal', name: '코발트 (염화 코발트)', kind: 'neutral', metal: '코발트', keys: ['염화 코발트', '염화코발트', '코발트', 'CoCl2'] },
    { id: 'mn', group: 'metal', name: '망간 (과망가니즈산 칼륨)', kind: 'neutral', metal: '망간', oxidizer: true, keys: ['과망가니즈산 칼륨', '과망간산 칼륨', '과망가니즈산', '과망간산', 'KMnO4'] },
    { id: 'ni', group: 'metal', name: '니켈', kind: 'neutral', metal: '니켈', keys: ['황산 니켈', '염화 니켈', '니켈', 'NiSO4', 'NiCl2'] },
    { id: 'pb', group: 'metal', name: '납', kind: 'neutral', metal: '납', keys: ['질산 납', '아세트산 납', '납', 'Pb(NO3)2'] },
    { id: 'fe', group: 'metal', name: '철 (염화 철, 질산 철)', kind: 'neutral', metal: '철', keys: ['염화 철', '질산 철', '황산 철', '철 이온', 'FeCl3', 'Fe(NO3)3', 'FeSO4'] },
    { id: 'zn', group: 'metal', name: '아연 (황산 아연)', kind: 'neutral', metal: '아연', keys: ['황산 아연', '염화 아연', '아연 이온', '아연', 'ZnSO4', 'ZnCl2'] },
    { id: 'cr6', group: 'metal', name: '크로뮴산·다이크로뮴산', kind: 'neutral', metal: '크로뮴', special: true, keys: ['다이크로뮴산 칼륨', '중크롬산 칼륨', '다이크로뮴산', '크로뮴산', '크롬산', 'K2Cr2O7', 'K2CrO4'] },
    { id: 'hg', group: 'metal', name: '수은', kind: 'neutral', metal: '수은', special: true, keys: ['수은', 'Hg'] },
    { id: 'cd', group: 'metal', name: '카드뮴', kind: 'neutral', metal: '카드뮴', special: true, keys: ['카드뮴', 'Cd'] },
    // 그 밖의 시약
    { id: 'salt', group: 'etc', name: '소금물·염 (염화 나트륨 등)', kind: 'neutral', keys: ['염화 나트륨', '염화나트륨', '소금물', '소금', '염화 칼륨', '염화 마그네슘', '염화 칼슘', '질산 칼륨', '질산 나트륨', '황산 나트륨', '황산 마그네슘', '인산염', '탄산염', '인산 나트륨', '인산 칼륨', 'NaCl', 'KCl', 'MgCl2', 'CaCl2', 'KNO3', 'Na2SO4'] },
    { id: 'ammonium', group: 'etc', name: '질산 암모늄·염화 암모늄', kind: 'neutral', keys: ['질산 암모늄', '염화 암모늄', 'NH4NO3', 'NH4Cl'] },
    { id: 'iodine', group: 'etc', name: '아이오딘·아이오딘화 칼륨', kind: 'neutral', keys: ['아이오딘화 칼륨', '아이오딘 용액', '아이오딘', '요오드화 칼륨', '요오드', 'KI', 'I2'] },
    { id: 'thio', group: 'etc', name: '티오황산 나트륨', kind: 'neutral', thio: true, keys: ['티오황산 나트륨', '싸이오황산 나트륨', '티오황산', 'Na2S2O3'] },
    { id: 'scn', group: 'etc', name: '싸이오사이안산 칼륨', kind: 'neutral', keys: ['싸이오사이안산 칼륨', '티오시안산 칼륨', '싸이오사이안산', 'KSCN'] },
    { id: 'h2o2', group: 'etc', name: '과산화 수소', kind: 'neutral', peroxide: true, keys: ['과산화 수소수', '과산화 수소', '과산화수소', 'H2O2'] },
    { id: 'bleach', group: 'etc', name: '락스 (차아염소산 나트륨)', kind: 'base', bleach: true, keys: ['차아염소산 나트륨', '차아염소산', '락스', 'NaClO'] },
    { id: 'unknown', group: 'etc', name: '뭐가 섞였는지 모름', kind: 'neutral', special: true, keys: ['모르는 용액', '모름'] },
    // 고체·유리
    { id: 'precipitate', group: 'solid', name: '앙금·거름종이', kind: 'solid', keys: ['앙금', '침전', '거름종이', '여과지'] },
    { id: 'paper', group: 'solid', name: '장갑·휴지·pH 시험지', kind: 'solid', keys: ['장갑', '휴지', '키친타월', 'pH 시험지', '시험지', '솜'] },
    { id: 'dropper', group: 'solid', name: '플라스틱 스포이트·홈판', kind: 'solid', keys: ['스포이트', '홈판', '일회용'] },
    { id: 'powder', group: 'solid', name: '남은 고체 시약 가루', kind: 'solid', keys: ['남은 가루', '시약 가루', '가루', '알갱이', '탄산 칼슘', 'CaCO3'] },
    { id: 'metalpiece', group: 'solid', name: '남은 금속 조각 (마그네슘·아연·구리판)', kind: 'solid', keys: ['마그네슘 리본', '마그네슘', '아연판', '구리판', '금속 조각', '전극', '구리선', 'Mg'] },
    { id: 'glass', group: 'solid', name: '깨진 유리', kind: 'glass', keys: ['깨진 비커', '깨진 시험관', '깨진 유리', '유리 조각', '깨진'] },
  ];
  const PART = Object.fromEntries(PARTS.map((part) => [part.id, part]));
  const BIN = Object.fromEntries(BINS.map((bin) => [bin.id, bin]));

  // 통에 붓는 법 (액체 통이면 모두)
  const POUR = [
    '깔때기를 대고 천천히 부어요.',
    '통에 붙은 기록지에 무엇을 얼마나 넣었는지 적어요.',
    '시약이 담겼던 기구를 처음 헹군 물(2~3번째까지)도 같은 통에 모아요.',
    '장갑·휴지·거름종이 같은 고체는 통에 넣지 않아요.',
    '다 부으면 뚜껑을 닫아요.',
  ];

  // 헷갈리기 쉬운 경우. 누르면 그 성분이 골라진다.
  const CASES = [
    { q: '산이 조금 들어간 얼음물', parts: ['ice', 'acid-any'] },
    { q: '시약이 닿지 않은 물중탕·얼음 중탕의 바깥 물', parts: ['ice'] },
    { q: '염산과 수산화 나트륨으로 중화가 끝난 용액', parts: ['hcl', 'naoh', 'indicator'] },
    { q: '식초를 적정하고 남은 용액', parts: ['acetic', 'naoh', 'indicator'] },
    { q: '암모니아수가 조금 들어간 용액', parts: ['water', 'nh3'] },
    { q: '황산 구리 수용액', parts: ['cu'] },
    { q: '소금물', parts: ['salt'] },
    { q: '설탕물·포도당 용액', parts: ['sugar'] },
    { q: '앙금이 생긴 시험관 (질산 은 + 소금물)', parts: ['ag', 'salt', 'precipitate'] },
    { q: '마그네슘 리본이 남은 염산', parts: ['hcl', 'metalpiece'] },
    { q: '쓰고 남은 과산화 수소', parts: ['h2o2'] },
    { q: 'pH 시험지·장갑·휴지', parts: ['paper'] },
    { q: '깨진 비커', parts: ['glass'] },
  ];

  // 실험마다 덧붙이는 말. 성분은 실험의 시약에서 자동으로 읽는다(forLab).
  const LAB_NOTES = {
    hydrate: { solidOnly: true, notes: ['가열하고 도가니에 남은 황산 구리 가루는 고체 시약으로 모아요(구리 화합물). 물에 녹였다면 무기계 폐액에 붓고 "구리"라고 적어요.'] },
    mgo: { solidOnly: true, notes: ['도가니에 남은 산화 마그네슘(흰 가루)과 다 타지 않은 마그네슘은 고체 폐기물로 모아요.'] },
    limiting: { notes: ['녹지 않고 남은 탄산 칼슘 가루는 가라앉힌 뒤 윗물만 붓고, 가루는 고체 폐기물로 모아요.'] },
    precipitate: { notes: ['앙금(염화 은, 수산화 구리 등)은 가라앉히거나 걸러서 고체 폐기물로 모아요. 은과 구리가 들었다고 적어요.', '질산 은이 손에 묻으면 며칠 동안 검게 남아요. 장갑을 껴요.'] },
    graham: { solidOnly: true, notes: ['진한 암모니아수와 진한 염산을 적신 솜은 후드 안에서 비닐봉지에 넣어 묶고 고체 폐기물로 모아요.', '유리관 안의 흰 고리(염화 암모늄)는 물로 헹구고, 헹군 물은 무기계 폐액에 모아요.'] },
    standard: { notes: ['남은 표준 용액은 라벨을 붙여 두면 다른 실험에 다시 쓸 수 있어요. 버릴 때는 무기계 폐액이에요.'] },
    'neutralization-heat': { notes: ['섞고 난 용액은 거의 중성이지만, pH 시험지로 확인하고 버려요.'] },
    hess: { notes: ['반응이 끝난 용액은 pH 시험지로 확인하고 버려요. 녹지 않은 수산화 나트륨 알갱이가 남지 않게 다 녹여요.'] },
    ksp: { notes: ['녹지 않고 남은 수산화 칼슘은 걸러서 고체 폐기물로 모아요. 거른 포화 용액은 알칼리 폐액이에요.'] },
    'cobalt-eq': { notes: ['진한 염산을 쓴 용액이에요. 많이 남았으면 통에 붓지 말고 선생님께 가져가요.'] },
    'copper-ammine': { notes: ['암모니아가 든 폐액은 유기계에 모아요. 기록지에 "구리"도 적어요.'] },
    permanganate: { notes: ['적정에 쓰고 남은 과산화 수소는 폐액통에 붓지 말고 선생님께 돌려드려요.'] },
    'iodine-clock': { notes: ['쓰고 남은 과산화 수소 용액은 폐액통에 붓지 말고 선생님께 돌려드려요.'] },
    daniell: { notes: ['아연판과 구리판은 물로 헹궈 말려 두면 다시 쓸 수 있어요. 염다리의 거름종이는 고체 폐기물이에요.'] },
    electrolysis: { notes: ['전극(구리판)은 헹궈서 다시 쓰고, 처음 헹군 물은 무기계 폐액에 모아요.'] },
    'metal-activity': { notes: ['용액에서 건진 금속 조각(은이 붙은 구리 등)은 헹궈서 따로 모아요. 처음 헹군 물은 폐액이에요.'] },
    'blue-bottle': { notes: ['포도당과 색소가 든 염기성 용액이에요. 유기물이 들어 있어 유기계에 모아요.'] },
    'traffic-light': { notes: ['포도당과 색소가 든 염기성 용액이에요. 유기물이 들어 있어 유기계에 모아요.'] },
    'rate-conc': { notes: ['티오황산 나트륨에 산이 들어가 황 앙금이 생겨요. 시험관 바닥의 노란 앙금은 가라앉혀 고체로 모아요.'] },
    'rate-temp': { notes: ['티오황산 나트륨에 산이 들어가 황 앙금이 생겨요. 시험관 바닥의 노란 앙금은 가라앉혀 고체로 모아요.'] },
  };

  const LATIN = /^[A-Za-z0-9()+·]+$/;
  const PARTICLE = /(이랑|랑|이나|이고|이에요|예요|이요|으로|로|에서|에|의|은|는|이|가|을|를|와|과|도|만|좀)$/;

  // 긴 말부터 맞춰 보고, 맞은 자리는 지운다. 로마자 화학식은 앞뒤가 다른 로마자·숫자와 붙어 있지 않을 때만 맞는다.
  const KEYS = PARTS.flatMap((part) => part.keys.map((key) => ({ key, part: part.id })))
    .sort((a, b) => b.key.length - a.key.length);

  function escapeRe(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function keyPattern(key) {
    // 세 글자 이상은 대소문자를 가리지 않는다(hcl, naoh). Mg·Hg·Cd·KI·I2처럼 짧은 것은 단위(mg)와 헷갈리지 않게 그대로.
    if (LATIN.test(key)) return new RegExp(`(^|[^A-Za-z0-9])${escapeRe(key)}(?![a-z0-9])`, key.length >= 3 ? 'i' : '');
    return new RegExp(escapeRe(key).replace(/ /g, '\\s*'));
  }
  let PATTERNS = KEYS.map(({ key, part }) => ({ key, part, re: keyPattern(key) }));

  /* ---------- 시약표의 시약도 알아듣기 (SPEC 26장) ----------
     시약표(reagents.js)의 한글 이름·영문 이름·화학식을 성분으로 넣는다. 통은 화학식과 GHS 그림 문자로 정한다.
     위의 성분 목록에 있는 말과 같은 길이면 위의 것이 먼저다. 긴 말이 먼저 맞으므로 "아세트산 에틸"은 아세트산이 아니다. */
  const METAL_KO = { Cu: '구리', Ag: '은', Co: '코발트', Mn: '망간', Ni: '니켈', Pb: '납', Fe: '철', Zn: '아연', Cr: '크로뮴', Ba: '바륨', Sn: '주석', Sb: '안티모니', Bi: '비스무트', Mo: '몰리브데넘', V: '바나듐', W: '텅스텐', Ce: '세륨', Ti: '타이타늄', Zr: '지르코늄', Ga: '갈륨', In: '인듐', Pd: '팔라듐', Pt: '백금', Au: '금', Sr: '스트론튬', Cd: '카드뮴', Hg: '수은', Tl: '탈륨', As: '비소', Se: '셀레늄', La: '란타넘', Nd: '네오디뮴', Y: '이트륨', Ru: '루테늄', Rh: '로듐', Ir: '이리듐', Ge: '저마늄', Te: '텔루륨', Gd: '가돌리늄', Eu: '유로퓸', Sm: '사마륨', Er: '어븀', Yb: '이터븀', Dy: '디스프로슘', Ta: '탄탈럼', Nb: '나이오븀', U: '우라늄', Th: '토륨' };
  const ALKALI = ['Li', 'Na', 'K', 'Rb', 'Cs', 'Ca', 'Sr', 'Ba'];
  const METALS = Object.keys(METAL_KO).concat(ALKALI, ['Mg', 'Al']);
  // 옛 이름 ↔ 새 이름 (시약표는 옛 이름이 많다)
  const RENAME = [
    ['과망간산', '과망가니즈산'], ['망간', '망가니즈'], ['중크롬산', '다이크로뮴산'], ['크롬', '크로뮴'], ['요오드', '아이오딘'], ['티오', '싸이오'],
    ['시안', '사이안'], ['브롬', '브로민'], ['불화', '플루오린화'], ['구연산', '시트르산'], ['초산', '아세트산'], ['포름산', '폼산'],
    ['제1철', '철(II)'], ['제2철', '철(III)'], ['제1구리', '구리(I)'], ['제2구리', '구리(II)'], ['제1주석', '주석(II)'], ['제2주석', '주석(IV)'],
    ['헥산', '헥세인'], ['메탄', '메테인'], ['에탄', '에테인'], ['프로판', '프로페인'], ['부탄', '뷰테인'], ['옥탄', '옥테인'], ['펜탄', '펜테인'],
  ];

  function elementsOf(formula) {
    const main = String(formula || '').split(/[·•*]/).filter((part) => !/^\d*(\.\d+)?H2O$/.test(part)).join('');
    return { all: new Set((String(formula || '').match(/[A-Z][a-z]?/g) || [])), main: new Set((main.match(/[A-Z][a-z]?/g) || [])), text: main };
  }

  function variants(ko) {
    const out = new Set();
    const add = (x) => {
      const t = String(x || '').replace(/\s+/g, ' ').trim();
      if (t.replace(/\s/g, '').length >= 2) out.add(t);
    };
    const base = String(ko || '');
    add(base);
    add(base.replace(/\([^)]*\)/g, ' '));
    for (const m of base.matchAll(/\(([^)]+)\)/g)) if (!/^(I{1,3}|IV|V|VI|무수|\d+|[가-힣]{0,1})$/.test(m[1].trim())) for (const piece of m[1].split(/[\/,]/)) add(piece);
    for (const piece of base.split(/[\/,]/)) add(piece.replace(/\([^)]*\)/g, ' '));
    // 수화물·무수·용액 같은 말을 뺀 이름도 (사람은 "EDTA 이나트륨", "염화칼슘"처럼 줄여 쓴다)
    for (const name of Array.from(out)) add(name.replace(/(무수|[일이삼사오육칠팔구십]+수화물|\d+\s*수화물|n?수화물|\d+(\.\d+)?\s*%\s*|용액|수용액|가루|분말|과립)/g, ' '));
    for (const name of Array.from(out)) {
      for (const [a, b] of RENAME) {
        if (name.includes(a)) add(name.split(a).join(b));
        else if (name.includes(b)) add(name.split(b).join(a));
      }
    }
    return Array.from(out);
  }

  function englishKeys(en) {
    const out = new Set();
    const clean = (x) => String(x || '').replace(/[>≥~]?\s*\d+(\.\d+)?\+?\s*(~\s*\d+(\.\d+)?)?\s*%/g, ' ').replace(/,?\s*\d*\s*[xn]?\s*H2O\b/g, ' ').replace(/\b(anhydrous|andydrous|powder|granular|solution|crystals?|extra pure|for analysis)\b/gi, ' ').replace(/[,;]+\s/g, ' ').replace(/\s+/g, ' ').trim();
    const base = String(en || '');
    out.add(clean(base.replace(/\s\([^)]*\)|\[[^\]]*\]/g, ' ')));
    for (const m of base.matchAll(/\s\(([^)]+)\)|\[([^\]]+)\]/g)) for (const piece of (m[1] || m[2]).split('/')) out.add(clean(piece));
    return Array.from(out).filter((x) => x.replace(/[^A-Za-z]/g, '').length >= 4);
  }

  function classify(r) {
    const { all, main, text } = elementsOf(r.f);
    const en = `${r.en || ''}`;
    const ko = `${r.ko || ''}`;
    const ghs = String(r.ghs || '').split(',');
    const part = { id: `r:${r.id}`, group: 'table', name: ko.replace(/\s+/g, ' ').trim(), kind: 'neutral', keys: [], table: r.id };
    const has = (el) => main.has(el);
    const metalsHere = [...main].filter((el) => METALS.includes(el));
    const inorganicCarbon = /carbonate|bicarbonate|cyanide|cyanate|thiocyan|ferricyan|ferrocyan|carbide|carbon (?:di|mon)oxide|graphite|graphene|nanotube|activated carbon|charcoal|carbon black/i.test(en) || /CO3/.test(text.replace(/[()\[\]]/g, '')); // 탄산염(Na2CO3, NaHCO3, (NH4)2CO3)만. C8H8O3 같은 유기물은 아니다
    const noFormula = !r.f;
    // 고체로만 남는 것: 금속 덩어리(원소), 점토·제올라이트·실리카·탄소 재료
    const element = /^[A-Z][a-z]?\d*$/.test(String(r.f || '').trim()) && METALS.includes(String(r.f).replace(/\d/g, ''));
    if (String(r.f).trim() === 'Hg') {
      Object.assign(part, { metal: '수은', special: true });
      return part;
    }
    if (element) {
      Object.assign(part, { kind: 'solid', metalpiece: true });
      return part;
    }
    if (/clay|zeolite|celite|silica|diatom|nanotube|graphene|graphite|charcoal|activated carbon|carbon black|sand|glass/i.test(en)) {
      part.kind = 'solid';
      return part;
    }
    // 유기물: 탄소가 있고 무기 탄소(탄산염·사이안화물 등)가 아니다. 화학식이 없는 시약(고분자·기름·단백질)도 유기물로 본다.
    const organic = noFormula || (has('C') && !inorganicCarbon);
    if (organic) part.organic = true;
    // 따로 모으기: 수은, 카드뮴, 6가 크로뮴
    const cr6 = has('Cr') && (/chromate|dichromate|chromium\(VI\)|chromium trioxide/i.test(en) || /CrO4|Cr2O7|CrO3/.test(text.replace(/[()]/g, '')));
    if (has('Hg') || has('Cd') || cr6) part.special = true;
    const metal = metalsHere.find((el) => METAL_KO[el]);
    if (metal) part.metal = METAL_KO[metal];
    if (has('Ag')) part.silver = true;
    // 산과 염기
    const acidName = /acid/i.test(en) && !/\b(salt|sodium|potassium|ammonium|calcium|magnesium|lithium|zinc|copper|iron|disodium|trisodium|monosodium|dipotassium)\b/i.test(en);
    const inorganicAcid = !organic && /^H/.test(text.replace(/[()]/g, '')) && !metalsHere.length && !has('N') ? true : false;
    if ((acidName || inorganicAcid || /hydrogen sulfate|bisulfate|sulfamic/i.test(en)) && !/hydroxide/i.test(en)) part.kind = 'acid';
    const ammonia = /ammonia|ammonium hydroxide/i.test(en) || ['NH3', 'NH4OH'].includes(String(r.f).trim());
    const strongBase = /hydroxide/i.test(en) && metalsHere.some((el) => ALKALI.includes(el));
    const alkaliOxide = /oxide/i.test(en) && !/peroxide|dioxide/i.test(en) && metalsHere.length === 1 && ALKALI.includes(metalsHere[0]);
    const basicSalt = /\b(carbonate|silicate|sulfide|tribasic|tetraborate|borax|phosphate,? tribasic|trisodium phosphate|hypochlorite)\b/i.test(en) && !/hydrogen|bicarbonate|basic/i.test(en) && metalsHere.some((el) => ALKALI.includes(el));
    const amine = organic && /amine|aniline|pyridine|hydrazine|imidazole|TEMED|ethylenediamine(?! ?tetra)/i.test(en) && !/acid|salt|chloride|hydrochloride|rhodamine/i.test(en);
    if (ammonia) Object.assign(part, { kind: 'base', organic: true, ammonia: true });
    else if (strongBase || alkaliOxide || basicSalt || amine) part.kind = 'base';
    if (/hypochlorite/i.test(en)) part.bleach = true;
    if (/peroxide/i.test(en) && !has('C')) part.peroxide = true;
    if (/thiosulfate/i.test(en)) part.thio = true;
    if (/\bsulfide\b/i.test(en) && !/disulfide|dimethyl/i.test(en)) part.sulfide = true;
    if (/cyanide/i.test(en) && !/ferricyan|ferrocyan|hexacyano/i.test(en)) part.cyanide = true;
    // 아자이드화 나트륨은 산을 만나면 독성 기체가 나오고, 납·구리와 만나면 터지기 쉬운 물질이 된다
    if (/\bazide\b/i.test(en)) Object.assign(part, { special: true, azide: true });
    if (/nitric acid/i.test(en)) part.nitric = true;
    // GHS: 03 산화성, 02 인화성, 06 급성 독성
    if (ghs.includes('03') || /permanganate|dichromate|chlorate|persulfate|peroxodisulfate|bromate|periodate/i.test(en)) part.oxidizer = true;
    if (ghs.includes('02') && organic) part.burn = true;
    if (ghs.includes('06')) part.toxic = true;
    return part;
  }

  function koPattern(key) {
    const chars = Array.from(key.replace(/\s+/g, ''));
    return new RegExp(chars.map(escapeRe).join('\\s*'));
  }

  function enPattern(key) {
    const words = key.split(/\s+/).map(escapeRe);
    return new RegExp(`(^|[^A-Za-z])${words.join('[\\s-]*')}(?![A-Za-z])`, 'i');
  }

  const TABLE = [];
  // 위의 성분 목록에 화학식으로 이미 있는 시약(CuSO4, NaOH 등)은 그 성분으로 알아듣는다
  const FORMULA_PART = {};
  for (const part of PARTS) for (const key of part.keys) if (LATIN.test(key) && /[A-Z]/.test(key) && key.length >= 3) FORMULA_PART[key] = FORMULA_PART[key] || part.id;

  function useReagents(list) {
    for (const part of TABLE) delete PART[part.id];
    TABLE.length = 0;
    const table = [];
    for (const r of list || []) {
      const anhydrous = String(r.f || '').split('·')[0].replace(/\s/g, '');
      const alias = FORMULA_PART[anhydrous];
      const part = alias ? PART[alias] : classify(r);
      const keys = [];
      for (const k of variants(r.ko)) keys.push({ key: k, re: koPattern(k) });
      for (const k of englishKeys(r.en)) keys.push({ key: k, re: enPattern(k) });
      const f = String(r.f || '').trim();
      if (f.length >= 2 && /^[A-Za-z0-9()[\]·.]+$/.test(f) && !/^(I2|KI|Mg|Hg|Cd)$/.test(f)) {
        keys.push({ key: f, re: new RegExp(`(^|[^A-Za-z0-9])${escapeRe(f)}(?![a-z0-9])`) });
        const anhydrous = f.split('·')[0];
        if (anhydrous !== f && anhydrous.length >= 3) keys.push({ key: anhydrous, re: new RegExp(`(^|[^A-Za-z0-9])${escapeRe(anhydrous)}(?![a-z0-9·])`) });
      }
      if (!alias) {
        part.keys = keys.map((k) => k.key);
        TABLE.push(part);
        PART[part.id] = part;
      }
      for (const k of keys) table.push({ key: k.key, part: part.id, re: k.re, len: k.key.replace(/\s/g, '').length });
    }
    const fixed = KEYS.map(({ key, part }) => ({ key, part, re: keyPattern(key), len: key.replace(/\s/g, '').length, fixed: true }));
    // 긴 말부터. 길이가 같으면 위의 성분 목록이 먼저.
    PATTERNS = fixed.concat(table).sort((a, b) => b.len - a.len || (b.fixed ? 1 : 0) - (a.fixed ? 1 : 0));
    return TABLE.length;
  }

  // 글에서 성분을 찾는다. 결과는 PARTS의 차례로.
  function partsOfText(text) {
    let rest = ` ${String(text || '')} `;
    const found = new Set();
    for (const { part, re } of PATTERNS) {
      // 한 글에 같은 말이 여러 번 나와도 모두 지운다
      for (let i = 0; i < 5; i += 1) {
        const m = rest.match(re);
        if (!m) break;
        found.add(part);
        rest = rest.slice(0, m.index) + ' '.repeat(m[0].length) + rest.slice(m.index + m[0].length);
      }
    }
    // 낱말 하나로만 맞는 짧은 말 (산, 염기, 물)
    for (const raw of rest.split(/[\s,./·+&()~]+/)) {
      let word = raw.trim();
      if (!word) continue;
      for (let i = 0; i < 2 && word.length > 1; i += 1) word = word.replace(PARTICLE, '') || word;
      for (const part of PARTS) if (part.word && part.word.includes(word)) found.add(part.id);
    }
    // 낱말 안에 든 "물"(얼음물, 소금물)은 이미 다른 말로 맞았다. 물만 따로 맞았을 때만 물로 둔다.
    return PARTS.filter((part) => found.has(part.id)).map((part) => part.id).concat(TABLE.filter((part) => found.has(part.id)).map((part) => part.id));
  }

  const nameList = (parts) => parts.map((part) => part.name.replace(/ \(.*\)$/, '').replace(/·.*$/, '')).join(', ');
  // 조사: 받침이 있으면 앞의 것 (염산이, 황산은 / 수산화 나트륨이)
  function josa(word, withB, without) {
    const ch = String(word).trim().slice(-1);
    const code = ch.charCodeAt(0);
    const b = code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 !== 0 : /[013678LMNRlmnr]$/.test(ch);
    return `${word}${b ? withB : without}`;
  }

  // 섞으면 안 되는 것과 주의할 것
  function warningsOf(parts) {
    const has = (test) => parts.some(test);
    const out = [];
    const acid = has((p) => p.kind === 'acid');
    if (has((p) => p.bleach) && acid) out.push({ level: 'danger', text: '락스(차아염소산 나트륨)에 산이 들어가면 염소 기체가 나와요. 한 통에 붓지 말고, 이미 섞였다면 후드에 두고 선생님께 알려요.' });
    if (has((p) => p.silver) && has((p) => p.ammonia)) out.push({ level: 'danger', text: '질산 은과 암모니아가 섞인 용액은 오래 두면 터지기 쉬운 물질이 생길 수 있어요. 통에 붓지 말고 바로 선생님께 가져가요.' });
    if (has((p) => p.nitric) && has((p) => p.organic && !p.trace)) out.push({ level: 'danger', text: '질산과 유기물(에탄올 등)은 섞이면 세게 반응할 수 있어요. 한 통에 넣지 말아요.' });
    if (has((p) => p.peroxide) && has((p) => p.metal && ['구리', '철', '망간', '크로뮴'].includes(p.metal))) out.push({ level: 'warn', text: '과산화 수소가 구리·철·망간 이온을 만나면 산소가 나와 통이 부풀 수 있어요. 남은 과산화 수소는 따로 선생님께 가져가요.' });
    if (has((p) => p.peroxide) && has((p) => p.acetic)) out.push({ level: 'warn', text: '아세트산과 과산화물은 한 통에 섞지 않아요.' });
    if (has((p) => p.thio) && acid) out.push({ level: 'warn', text: '티오황산 나트륨에 산이 들어가면 자극적인 냄새(이산화 황)와 노란 황 앙금이 생겨요. 환기하고, 앙금은 가라앉혀 고체로 모아요.' });
    if (has((p) => p.id === 'metalpiece' || p.metalpiece) && acid) out.push({ level: 'warn', text: '남은 금속 조각은 건져서 따로 모아요. 산 폐액에 들어가면 수소 기체가 나와요.' });
    if (has((p) => p.sulfide) && acid) out.push({ level: 'danger', text: '황화물에 산이 들어가면 독성 기체(황화 수소)가 나와요. 한 통에 붓지 말고 후드에 둔 채 선생님께 알려요.' });
    if (has((p) => p.cyanide) && acid) out.push({ level: 'danger', text: '사이안화물에 산이 들어가면 독성 기체(사이안화 수소)가 나와요. 한 통에 붓지 말고 바로 선생님께 알려요.' });
    if (has((p) => p.azide)) out.push({ level: 'danger', text: '아자이드화 나트륨은 산을 만나면 독성 기체가 나오고, 배수관의 납·구리와 만나면 터지기 쉬운 물질이 생겨요. 싱크대나 폐액통에 붓지 말고 선생님께 가져가요.' });
    const tableBurn = parts.filter((p) => p.burn && p.table);
    if (tableBurn.length) out.push({ level: 'warn', text: `${josa(nameList(parts.filter((p) => p.burn)), '은', '는')} 불이 붙어요. 가열 기구 가까이에서 붓지 말아요.` });
    else if (has((p) => p.burn)) out.push({ level: 'warn', text: '에탄올·아세톤은 불이 붙어요. 가열 기구 가까이에서 붓지 말아요.' });
    const oxidizers = parts.filter((p) => p.oxidizer && p.table);
    if (oxidizers.length && has((p) => p.organic && !p.trace && !p.oxidizer)) out.push({ level: 'warn', text: `${josa(nameList(oxidizers), '은', '는')} 산화제예요. 진한 것이 유기물과 섞이면 열이 나거나 불이 붙을 수 있어요. 많이 남았으면 통에 붓지 말고 선생님께 여쭤봐요.` });
    const toxic = parts.filter((p) => p.toxic && p.table && !p.special);
    if (toxic.length) out.push({ level: 'warn', text: `${josa(nameList(toxic), '은', '는')} 독성이 큰 시약이에요(GHS 급성 독성). 담았던 기구를 헹군 물도 모으고, 많이 남았으면 선생님께 가져가요.` });
    return out;
  }

  // 고른 성분으로 통을 정한다. ph: '' 모름 · 'acid' · 'neutral' · 'base' (pH 시험지로 잰 결과)
  function decide(ids, ph) {
    const parts = (ids || []).map((id) => PART[id]).filter(Boolean);
    const liquid = parts.filter((p) => p.kind !== 'solid' && p.kind !== 'glass');
    const reagents = liquid.filter((p) => p.kind !== 'water');
    const solids = parts.filter((p) => p.kind === 'solid');
    const glass = parts.some((p) => p.kind === 'glass');
    const metals = [...new Set(liquid.filter((p) => p.metal).map((p) => p.metal))];
    const warnings = warningsOf(parts);
    const reasons = [];
    const extra = []; // 액체 말고 따로 할 일
    let bin = null;
    let needPh = false;

    if (!parts.length) return { ok: false, bin: null, reasons: [], warnings: [], extra: [], steps: [], metals: [], needPh: false, message: '무엇이 섞였는지 골라 주세요.' };

    const danger = warnings.some((w) => w.level === 'danger');
    const special = reagents.filter((p) => p.special);
    const organic = reagents.filter((p) => p.organic && !p.trace);
    const acids = reagents.filter((p) => p.kind === 'acid');
    const bases = reagents.filter((p) => p.kind === 'base');
    const peroxideOnly = reagents.some((p) => p.peroxide) && reagents.every((p) => p.peroxide || p.trace);

    if (!liquid.length) {
      bin = null; // 고체만
    } else if (special.length) {
      bin = 'special';
      reasons.push(special.some((p) => p.id === 'unknown') ? '무엇이 섞였는지 모르면 통에 붓지 말아요. 맞지 않는 통에 들어가면 위험한 반응이 일어날 수 있어요.' : `${josa(nameList(special), '은', '는')} 독성이 커서 다른 폐액과 섞지 않고 따로 모아요. 담았던 기구를 헹군 물도 3번째 이상까지 모아요.`);
    } else if (danger) {
      bin = 'special';
      reasons.push('함께 두면 위험한 것이 섞여 있어요(아래 주의). 통에 붓지 말고 선생님께 가져가요.');
    } else if (!reagents.length) {
      bin = 'sink';
      reasons.push('시약이 전혀 닿지 않은 물이라면 싱크대에 버려도 돼요. 조금이라도 섞였거나 잘 모르겠으면 폐액으로 모아요.');
    } else if (organic.length) {
      bin = 'organic';
      if (organic.some((p) => p.ammonia)) reasons.push('암모니아가 든 폐액은 유기계에 모아요.');
      if (organic.some((p) => p.acetic)) reasons.push('아세트산(식초)은 산이지만 유기물이라 유기계에 모아요.');
      const others = organic.filter((p) => !p.ammonia && !p.acetic);
      if (others.length) reasons.push(`${josa(nameList(others), '은', '는')} 유기물이라 유기계에 모아요.`);
      if (acids.length || bases.length) reasons.push('유기물이 들어 있으면 산성이나 염기성이어도 유기계가 먼저예요.');
    } else if (peroxideOnly) {
      bin = 'special';
      reasons.push('쓰고 남은 과산화 수소는 금속 이온이 든 폐액과 만나면 산소가 나와요. 통에 붓지 말고 선생님께 돌려드려요.');
    } else {
      let side = ph;
      if (!side) {
        if (acids.length && bases.length) needPh = true;
        else if (acids.length) side = 'acid';
        else if (bases.length) side = 'base';
        else side = 'neutral';
      }
      if (needPh) {
        bin = null;
        reasons.push('산과 염기가 함께 들어 있어 섞인 뒤의 pH에 따라 통이 달라요. pH 시험지로 재 보고 아래에서 골라 주세요.');
        reasons.push('산성이면 산 폐액, 염기성이면 알칼리 폐액, 거의 중성이면 무기계 폐액이에요.');
      } else if (side === 'acid') {
        bin = 'acid';
        reasons.push(acids.length ? `${josa(nameList(acids), '이', '가')} 들어 있어 산성이에요. 물이 많아 묽어도 산 폐액이에요.` : 'pH가 산성으로 나와 산 폐액에 모아요.');
      } else if (side === 'base') {
        bin = 'alkali';
        reasons.push(bases.length ? `${josa(nameList(bases), '이', '가')} 들어 있어 염기성이에요. 물이 많아 묽어도 알칼리 폐액이에요.` : 'pH가 염기성으로 나와 알칼리 폐액에 모아요.');
      } else {
        bin = 'inorganic';
        reasons.push(acids.length || bases.length ? 'pH가 거의 중성으로 나와 무기계 폐액에 모아요.' : `유기물이 없고 산성도 염기성도 아닌 용액(${nameList(reagents.filter((p) => !p.trace))})이라 무기계 폐액에 모아요.`);
      }
    }
    if (metals.length && bin && !['special', 'sink'].includes(bin)) reasons.push(`금속 이온(${metals.join(', ')})이 들어 있어요. 통의 기록지에 금속 이름을 꼭 적어요.`);
    if (liquid.some((p) => p.ice) && bin && bin !== 'sink') extra.push('얼음은 다 녹인 뒤 부어요.');
    if (solids.some((p) => p.id === 'precipitate')) extra.push(liquid.length ? '앙금은 가라앉히거나 거름종이로 걸러서 고체 폐기물로 모으고, 액체만 통에 부어요.' : '앙금과 거름종이는 고체 폐기물로 모아요.');
    if (solids.some((p) => p.id === 'paper')) extra.push('시약이 묻은 장갑·휴지·pH 시험지는 고체 폐기물로 모아요. 액체 통에는 넣지 않아요.');
    if (solids.some((p) => p.id === 'dropper')) extra.push('플라스틱 스포이트와 홈판은 고체 폐기물로 따로 모아요. 홈판을 헹군 물(처음 2~3번)은 폐액이에요.');
    if (solids.some((p) => p.id === 'powder')) extra.push('남은 고체 시약은 시약병에 되돌리지 말고 선생님이 정한 곳에 모아요.');
    if (solids.some((p) => p.id === 'metalpiece' || p.metalpiece)) extra.push('남은 금속 조각은 물로 헹궈 따로 모아요. 처음 헹군 물은 폐액이에요.');
    if (solids.some((p) => p.table && !p.metalpiece)) extra.push(`${josa(nameList(solids.filter((p) => p.table && !p.metalpiece)), '은', '는')} 물에 녹지 않는 고체예요. 고체 폐기물로 모아요.`);
    if (glass) extra.push('깨진 유리는 맨손으로 줍지 말고 빗자루와 쓰레받기로 모아 깨진 유리 통에 넣어요. 시약이 묻었다면 헹군 물은 폐액이에요.');
    const solidBins = [];
    if (solids.length) solidBins.push('solid');
    if (glass) solidBins.push('glass');
    const steps = bin && !['special', 'sink'].includes(bin) ? POUR.slice() : [];
    return { ok: true, bin, bins: [bin].filter(Boolean).concat(solidBins), reasons, warnings, extra, steps, metals, needPh, message: '' };
  }

  // 실험의 시약을 성분으로 읽는다. calc는 calc.js(LIQUID_PRESETS, REAGENTS). 없으면 이름만으로 읽는다.
  function lookup(r, calc) {
    const preset = r.preset && calc && calc.LIQUID_PRESETS ? calc.LIQUID_PRESETS.find((p) => p.id === r.preset) : null;
    const solid = r.id && calc && calc.REAGENTS ? calc.REAGENTS.find((x) => x.id === r.id) : null;
    return { preset, solid };
  }

  function reagentText(r, calc) {
    const { preset, solid } = lookup(r, calc);
    return [r.id, solid && solid.korean, preset ? `${preset.korean} ${preset.formula}` : r.preset, r.name, r.formula, r.text].filter(Boolean).join(' ');
  }

  function reagentLabel(r, calc) {
    const { preset, solid } = lookup(r, calc);
    const base = r.name || (preset && preset.korean) || (solid && solid.korean) || r.text || r.id || '';
    return base.replace(/\s*\(.*$/, '').replace(/ 같은 .*$/, '');
  }

  function forLab(lab, calc) {
    const note = LAB_NOTES[lab.id] || {};
    const each = [];
    const all = new Set();
    for (const r of lab.reagents || []) {
      const ids = partsOfText(reagentText(r, calc));
      ids.forEach((id) => all.add(id));
      const liquidIds = ids.filter((id) => !['solid', 'glass'].includes(PART[id].kind));
      // 물만 있거나 지시약·녹말 몇 방울뿐인 것은 따로 버릴 일이 없다
      if (!liquidIds.length || liquidIds.every((id) => PART[id].kind === 'water' || PART[id].trace)) continue;
      const label = reagentLabel(r, calc);
      if (each.some((e) => e.label === label)) continue;
      const one = decide(liquidIds);
      each.push({ label, parts: liquidIds, bin: one.bin, needPh: one.needPh });
    }
    const ids = PARTS.concat(TABLE).filter((p) => all.has(p.id)).map((p) => p.id);
    const mixed = note.solidOnly ? null : decide(ids.filter((id) => !['solid', 'glass'].includes(PART[id].kind)));
    return { id: lab.id, parts: ids, each, mixed, solidOnly: Boolean(note.solidOnly), notes: note.notes || [] };
  }

  // 실험의 폐액 안내를 짧은 글 몇 줄로 (계획서, 준비표에 쓴다)
  function labLines(lab, calc) {
    const w = forLab(lab, calc);
    const lines = [];
    if (w.mixed && w.mixed.bin) lines.push(`모두 섞였을 때: ${BIN[w.mixed.bin].name}`);
    else if (w.mixed && w.mixed.needPh) lines.push('모두 섞였을 때: pH 시험지로 재서 산성이면 산 폐액, 염기성이면 알칼리 폐액, 거의 중성이면 무기계 폐액');
    const separate = w.each.filter((e) => e.bin || e.needPh);
    if (separate.length > 1 || (separate.length === 1 && w.mixed && separate[0].bin !== w.mixed.bin)) {
      lines.push(`따로 버릴 때: ${separate.map((e) => `${e.label} → ${e.bin ? BIN[e.bin].name : 'pH를 재서'}`).join(', ')}`);
    }
    if (w.mixed && w.mixed.metals.length) lines.push(`기록지에 금속 이름(${w.mixed.metals.join(', ')})을 적어요.`);
    return lines.concat(w.notes);
  }

  const api = { BINS, BIN, GROUPS, PARTS, PART, CASES, LAB_NOTES, POUR, TABLE, partsOfText, decide, forLab, labLines, warningsOf, useReagents, classify, variants };
  // 브라우저에서는 시약표(reagents.js)가 먼저 불려 있으면 바로 넣는다.
  if (typeof window !== 'undefined' && window.SchoolReagents) useReagents(window.SchoolReagents);
  if (typeof window !== 'undefined') window.LabWaste = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
