/*
 * 용액 레시피 메이커 — 계산 규칙 (SPEC.md 4·5·11장)
 *
 * 화면(app.js)과 전체 검증(tests/)이 이 파일 하나를 함께 쓴다.
 * 브라우저에서는 window.RecipeCalc, Node에서는 require('./calc.js')로 불러온다.
 * 반올림은 글자로 바꿀 때만 한다. 계산은 반올림 전 값으로 한다. (G4)
 */
(function (root) {
  'use strict';

  const IS_NODE = typeof module !== 'undefined' && module.exports;
  // 학교 시약표에서 옮긴 목록 (reagents.js). 이 파일을 빼면 내장 12종만으로 동작하고 시약표 탭은 숨는다.
  function loadSchool() {
    if (!IS_NODE) return root.SchoolReagents || [];
    try {
      return require('./reagents.js');
    } catch (error) {
      return [];
    }
  }
  const SCHOOL = loadSchool();

  const CUSTOM_ID = '__custom__';
  const UNITS = ['M', 'mM', 'mg/L', '% (w/v)']; // 고체 조제
  const DILUTION_UNITS = ['M', 'mM', 'mg/L', '%']; // 희석 (C1V1 = C2V2는 단위와 무관)
  const LIQUID_UNITS = ['M', 'mM']; // 액체 시약
  const CONVERT_UNITS = ['M', 'mM', 'g/L', 'mg/L', '% (w/v)'];
  const FLASKS = [10, 25, 50, 100, 250]; // 부피 플라스크 (mL)
  const DEFAULT_PURITY = '100';

  const LIMITS = {
    listRows: 12, // 조제 목록
    dilutionRows: 8, // 희석 목표 행
    labelsPerSheet: 12, // A4 한 장의 라벨 수 (2열 × 6행)
    purityMin: 50,
    purityMax: 100,
    pipetteMin: 1.0, // 원액 부피가 이보다 작으면 노란 표시 (mL)
    lowMass: 0.1, // 칭량 질량이 이보다 작으면 노란 표시 (g)
    flaskMargin: 1.1, // 권장 원액 조제량의 여유
    serialSteps: 10, // 연속 희석 단계 수
  };

  const TEXT = {
    hydrateBadge: '수화물 보정됨',
    pipette: '피펫 오차 큼 — 중간 희석 권장',
    tooStrong: '원액보다 진한 용액은 희석으로 만들 수 없음',
    caution: '취급 주의',
    needConcVolume: '농도와 부피는 0보다 큰 숫자로 입력하세요.',
    needPurity: '순도는 50~100% 사이로 입력하세요.',
    needCustom: '시약 이름과 몰질량을 입력하세요.',
    needStock: '원액 농도는 0보다 큰 숫자로 입력하세요.',
    needMolarMass: '이 시약은 시약표에 분자량이 없습니다. mg/L나 % (w/v) 단위를 고르거나 직접 입력으로 몰질량을 넣으세요.',
    needPercentDensity: '함량은 0보다 크고 100 이하인 숫자로, 밀도는 0보다 큰 숫자로 입력하세요.',
    liquidTooStrong: '시약 원액보다 진한 용액은 만들 수 없습니다.',
    needSerial: '시작 농도와 부피는 0보다 큰 숫자, 희석 배수는 1보다 큰 숫자, 단계 수는 1~10의 정수로 입력하세요.',
    needNumbers: '모든 칸에 0보다 큰 숫자를 입력하세요.',
    needConvert: '값을 0보다 큰 숫자로 입력하세요.',
    convertNeedsMolarMass: '몰 농도와 질량 농도를 오가려면 몰질량이 필요합니다.',
    veryDilute: '매우 묽어서 물의 자동 이온화를 무시할 수 없습니다. 이 값은 참고만 하세요.',
    listFull: '조제 목록은 12행까지입니다.',
    overFlask: '원액이 250 mL보다 많이 필요함 — 나누어 조제',
    lowMass: '저울 오차 큼 — 더 큰 부피로 조제 권장',
    mgNote: 'mg/L는 고른 시약 자체의 질량 기준',
    pctNote: '% (w/v)는 용액 100 mL에 든 시약 자체의 질량(g) 기준',
    emptyRecipe: '먼저 고체 조제나 희석 탭에서 용액을 추가하세요.',
    defaultSolutionName: '용액',
  };

  // 내장 시약 12종. 몰질량은 제작 계획서의 값이다.
  const REAGENTS = [
    { id: 'NaCl', korean: '염화 나트륨', molarMass: 58.44, hydrate: false, caution: false },
    { id: 'KCl', korean: '염화 칼륨', molarMass: 74.55, hydrate: false, caution: false },
    { id: 'MgCl2', korean: '염화 마그네슘', molarMass: 95.21, hydrate: false, caution: false },
    { id: 'MgCl2·6H2O', korean: '염화 마그네슘 육수화물', molarMass: 203.3, hydrate: true, caution: false },
    { id: 'CaCl2·2H2O', korean: '염화 칼슘 이수화물', molarMass: 147.01, hydrate: true, caution: false },
    { id: 'CuSO4·5H2O', korean: '황산 구리(II) 오수화물', molarMass: 249.68, hydrate: true, caution: true },
    { id: 'NaOH', korean: '수산화 나트륨', molarMass: 40.0, hydrate: false, caution: true },
    { id: 'KNO3', korean: '질산 칼륨', molarMass: 101.1, hydrate: false, caution: false },
    { id: '포도당', korean: '포도당', molarMass: 180.16, hydrate: false, caution: false },
    { id: '요소', korean: '요소', molarMass: 60.06, hydrate: false, caution: false },
    { id: '설탕', korean: '설탕', molarMass: 342.3, hydrate: false, caution: false },
    { id: '메틸렌 블루(무수)', korean: '메틸렌 블루', molarMass: 319.85, hydrate: false, caution: false },
  ];

  // 시판 진한 산·염기의 대표값. 출처: OpenStax Chemistry 2e 부록 F (Composition of Commercial Acids and Bases).
  // 병마다 함량과 밀도가 다르므로 화면에서 고쳐 쓸 수 있게 한다. 몰질량은 표준 원자량으로 계산한 값이다.
  const LIQUID_PRESETS = [
    { id: 'HCl', korean: '염산', label: '염산', formula: 'HCl', molarMass: 36.46, percent: '36', density: '1.18' },
    { id: 'H2SO4', korean: '황산', label: '황산', formula: 'H2SO4', molarMass: 98.07, percent: '96', density: '1.84' },
    { id: 'HNO3', korean: '질산', label: '질산', formula: 'HNO3', molarMass: 63.01, percent: '71', density: '1.42' },
    { id: 'CH3COOH', korean: '아세트산(빙초산)', label: '아세트산', formula: 'CH3COOH', molarMass: 60.05, percent: '99.5', density: '1.05' },
    { id: 'H3PO4', korean: '인산', label: '인산', formula: 'H3PO4', molarMass: 97.99, percent: '85', density: '1.70' },
    { id: 'NH3', korean: '암모니아수', label: '암모니아수', formula: 'NH3', molarMass: 17.03, percent: '28', density: '0.90' },
    // 과산화 수소수 30 % (w/w): 밀도 1.11 g/mL (20 °C). 출처: Sigma-Aldrich 제품 정보, Evonik 물성표. 약 9.8 M.
    { id: 'H2O2', korean: '과산화 수소수', label: '과산화 수소수', formula: 'H2O2', molarMass: 34.01, percent: '30', density: '1.11' },
  ];

  // 학교 시약표에서 고른 자주 쓰는 시약. 용액 조제의 시약 고르기에 묶음별로 바로 나온다.
  // 값은 시약표 번호(reagents.js의 id)이고, 이름·화학식·몰질량은 시약표의 것을 그대로 쓴다.
  const COMMON_GROUPS = [
    { name: '염기와 탄산염', ids: ['s317', 's101', 's068', 's365', 's360', 's311'] },
    { name: '완충·약산', ids: ['s355', 's356', 's326', 's327', 's383', 's049', 's286', 's470', 's062', 's221', 's075'] },
    { name: '산화·환원과 적정', ids: ['s323', 's390', 's319', 's318', 's382', 's053', 's216', 's218', 's353'] },
    { name: '그 밖의 염', ids: ['s099', 's388', 's245', 's379', 's055', 's058', 's455', 's310', 's330', 's067'] },
    { name: '수화물', ids: ['s434', 's126', 's141', 's104', 's040', 's389'] },
  ];
  // 시약표의 액체 시약 가운데 자주 쓰는 것. 함량과 밀도는 병마다 달라 비워 두고 병 라벨을 보고 넣게 한다.
  const COMMON_LIQUID_IDS = ['s172', 's254', 's196', 's223', 's183', 's026'];

  // 용매의 끓는점·어는점과 몰랄 상수. 출처: OpenStax Chemistry 2e 표 11.2.
  const SOLVENTS = [
    { id: 'water', korean: '물', kf: 1.86, kb: 0.512, fp: 0.0, bp: 100.0 },
    { id: 'acetic', korean: '아세트산', kf: 3.9, kb: 3.07, fp: 16.6, bp: 118.1 },
    { id: 'benzene', korean: '벤젠', kf: 5.12, kb: 2.53, fp: 5.5, bp: 80.1 },
    { id: 'chloroform', korean: '클로로폼', kf: 4.68, kb: 3.63, fp: -63.5, bp: 61.26 },
    { id: 'nitrobenzene', korean: '나이트로벤젠', kf: 8.1, kb: 5.24, fp: 5.67, bp: 210.9 },
  ];

  // [샘플: 총괄성 실험]이 불러오는 값. 숫자는 글자 그대로 둔다(0.100이 0.1로 바뀌지 않게).
  const SAMPLE = {
    solids: [
      { reagentId: 'NaCl', conc: '0.100', unit: 'M', volume: '250', purity: '100' },
      { reagentId: 'MgCl2·6H2O', conc: '0.100', unit: 'M', volume: '100', purity: '100' },
      { reagentId: '포도당', conc: '0.500', unit: 'M', volume: '100', purity: '100' },
      { reagentId: '요소', conc: '0.500', unit: 'M', volume: '100', purity: '100' },
    ],
    dilution: {
      name: '메틸렌 블루',
      stock: '1000',
      unit: 'mg/L',
      rows: [
        { conc: '10', volume: '50' },
        { conc: '20', volume: '50' },
        { conc: '50', volume: '50' },
        { conc: '100', volume: '50' },
      ],
    },
  };

  /* ---------- 숫자 다루기 ---------- */

  // 숫자가 아닌 입력은 빈칸과 같이 다룬다. (G5)
  // 숫자 읽기. 사람이 흔히 적는 꼴도 받는다:
  //   −0.76(유니코드 빼기), ０.５(전각), 1,000(세 자리 쉼표), 1.8×10^-5 · 1.8 × 10⁻⁵ · 1.8x10-5 · 1.8*10^-5(10의 거듭제곱), 1.8e-5
  const SUPER = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
  function parseNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    let text = String(value == null ? '' : value).trim();
    if (text === '') return NaN;
    text = text
      .replace(/[\uff10-\uff19]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
      .replace(/[．。]/g, '.')
      .replace(/[−–—－]/g, '-')
      .replace(/＋/g, '+')
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, (c) => SUPER[c])
      .replace(/\s+/g, '');
    if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) text = text.replace(/,/g, '');
    // 1.8×10^-5, 1.8x10-5, 1.8*10^-5, 1.8·10⁻⁵ → 1.8e-5
    const pow = text.match(/^([+-]?(?:\d+\.?\d*|\.\d+))[×xX*·]10\^?\(?([+-]?\d+)\)?$/);
    if (pow) text = `${pow[1]}e${pow[2]}`;
    if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(text)) return NaN;
    const n = Number(text);
    return Number.isFinite(n) ? n : NaN;
  }

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  // 5 이상 올림. 0.1 × 3 같은 부동소수점 꼬리를 먼저 정리한 뒤 반올림한다.
  function roundTo(x, digits) {
    const f = Math.pow(10, digits);
    return Math.round(Number((x * f).toPrecision(12))) / f;
  }

  function formatFixed(x, digits) {
    return roundTo(x, digits).toFixed(digits);
  }

  // 유효 숫자로 줄인 글자. 아주 작거나 큰 수는 "1.25 × 10⁻⁷" 꼴로 쓴다.
  function formatSig(x, digits) {
    const sig = digits || 3;
    if (!Number.isFinite(x)) return '';
    if (x === 0) return '0';
    const abs = Math.abs(x);
    if (abs >= 1e-4 && abs < 1e6) return String(Number(x.toPrecision(sig)));
    const [mantissa, exponent] = x.toExponential(sig - 1).split('e');
    const sup = String(Number(exponent)).replace(/[-0-9]/g, (c) => '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'['-0123456789'.indexOf(c)]);
    return `${Number(mantissa)} × 10${sup}`;
  }

  /* ---------- 시약 찾기 ---------- */

  const SCHOOL_CAUTION = ['NaOH', 'CuSO4·5H2O']; // 내장 시약의 "취급 주의"와 같은 물질

  function fromSchool(entry) {
    return {
      id: entry.id,
      school: true,
      korean: entry.ko,
      english: entry.en,
      formula: entry.f || '',
      molarMass: entry.mm == null ? null : entry.mm,
      hydrate: Boolean(entry.hydrate),
      liquid: Boolean(entry.liquid),
      caution: SCHOOL_CAUTION.includes(entry.f),
      source: entry.src || null,
      note: entry.note || '',
      // PubChem에서 받은 GHS 그림 문자 번호('05' 등). 빈 배열이면 분류에 해당하지 않음, null이면 정보 없음
      ghs: entry.ghs == null ? null : String(entry.ghs).split(',').filter(Boolean),
      signal: entry.sig || '',
      cid: entry.cid || null,
      added: Boolean(entry.add),
      use: entry.use || '',
    };
  }

  // GHS 그림 문자 번호 → 화면에 쓸 이름
  const GHS_NAMES = { '01': '폭발성', '02': '인화성', '03': '산화성', '04': '고압가스', '05': '부식성', '06': '급성 독성', '07': '자극성', '08': '건강 유해성', '09': '환경 유해성' };

  // 시약표가 있을 때만 값이 나온다. [{ name, reagents: [...] }]
  function commonReagents() {
    return COMMON_GROUPS.map((group) => ({
      name: group.name,
      reagents: group.ids.map((id) => SCHOOL.find((r) => r.id === id)).filter(Boolean).map(fromSchool),
    })).filter((group) => group.reagents.length > 0);
  }

  function commonLiquids() {
    return COMMON_LIQUID_IDS.map((id) => SCHOOL.find((r) => r.id === id)).filter(Boolean).map(fromSchool);
  }

  function findReagent(id) {
    const builtIn = REAGENTS.find((r) => r.id === id);
    if (builtIn) return builtIn;
    const school = SCHOOL.find((r) => r.id === id);
    return school ? fromSchool(school) : null;
  }

  function squash(text) {
    return String(text || '').toLowerCase().replace(/[\s·*.,()\[\]-]/g, '');
  }

  // 한글명·영문명·화학식 어디에든 검색어가 들어 있으면 찾는다. filter: 'all' | 'hydrate' | 'liquid' | 'nomass'
  function searchReagents(query, filter) {
    const q = squash(query);
    return SCHOOL.filter((e) => {
      if (filter === 'hydrate' && !e.hydrate) return false;
      if (filter === 'liquid' && !e.liquid) return false;
      if (filter === 'nomass' && e.mm != null) return false;
      if (q === '') return true;
      return squash(e.ko).includes(q) || squash(e.en).includes(q) || squash(e.f).includes(q);
    }).map(fromSchool);
  }

  function sourceNote(reagent) {
    if (!reagent || !reagent.school) return '';
    // 분자량이 없어 몰 농도로 계산할 수 없는 시약에만 알려 준다.
    // 시약표와 값이 달라 다시 계산했다는 알림은 화면에서 뺐다 (SPEC 19장). 어떤 행을 고쳤는지는 reagents.js의 src와 PROGRESS.md에 있다.
    if (reagent.note) return reagent.note;
    if (reagent.molarMass == null) return '분자량이 없어서 mg/L와 % (w/v)로만 계산해요.';
    return '';
  }

  function normalizeUnit(unit, list) {
    const units = list || UNITS;
    return units.includes(unit) ? unit : units[0];
  }

  /* ---------- 고체 조제 ---------- */

  /*
   * input: { reagentId, customName, customMolarMass, unit, conc, volume, purity }
   * 숫자는 입력 칸의 글자 그대로 받는다.
   * 계산할 수 없으면 { ok: false, messages: [...] }, 계산했으면 { ok: true, mass, massText, item, ... }.
   */
  function computeSolid(input) {
    const src = input || {};
    const unit = normalizeUnit(src.unit, UNITS);
    const isCustom = src.reagentId === CUSTOM_ID;
    const reagent = isCustom ? null : findReagent(src.reagentId);
    const conc = parseNumber(src.conc);
    const volume = parseNumber(src.volume);
    const purity = parseNumber(src.purity);
    const molarUnit = unit === 'M' || unit === 'mM';
    const messages = [];

    let displayName = '';
    let koreanName = '';
    let formula = '';
    let molarMass = NaN;
    let hydrate = false;
    let caution = false;

    if (isCustom || !reagent) {
      displayName = clean(src.customName);
      koreanName = displayName;
      molarMass = parseNumber(src.customMolarMass);
      if (displayName === '' || !(molarMass > 0)) messages.push(TEXT.needCustom);
    } else {
      displayName = reagent.school ? reagent.korean : reagent.id;
      koreanName = reagent.korean;
      formula = reagent.school ? reagent.formula : '';
      molarMass = reagent.molarMass == null ? NaN : reagent.molarMass;
      hydrate = reagent.hydrate;
      caution = reagent.caution;
      if (molarUnit && !(molarMass > 0)) messages.push(TEXT.needMolarMass);
    }

    if (!(conc > 0) || !(volume > 0)) messages.push(TEXT.needConcVolume);
    if (!(purity >= LIMITS.purityMin && purity <= LIMITS.purityMax)) messages.push(TEXT.needPurity);
    if (messages.length > 0) return { ok: false, messages };

    const liters = volume / 1000;
    let mass;
    if (unit === 'mg/L') {
      mass = (conc * liters) / 1000; // 고른 시약 자체의 질량 (G3)
    } else if (unit === '% (w/v)') {
      mass = (conc * volume) / 100; // 용액 100 mL에 시약 conc g
    } else {
      const molar = unit === 'mM' ? conc / 1000 : conc;
      mass = molar * liters * molarMass;
    }
    mass = mass / (purity / 100);

    const massText = formatFixed(mass, 3);
    const hydrateBadge = hydrate && molarUnit;
    const lowMass = roundTo(mass, 3) < LIMITS.lowMass;
    const custom = isCustom || !reagent;

    return {
      ok: true,
      messages: [],
      mass,
      massText,
      hydrateBadge,
      mgNote: unit === 'mg/L',
      massNote: unit === 'mg/L' ? TEXT.mgNote : unit === '% (w/v)' ? TEXT.pctNote : '',
      lowMass,
      molarMass,
      item: {
        kind: 'solid',
        isCustom: custom,
        school: Boolean(reagent && reagent.school),
        reagentId: custom ? CUSTOM_ID : reagent.id,
        displayName,
        koreanName,
        formula,
        concText: clean(src.conc),
        unit,
        volumeText: clean(src.volume),
        purityText: clean(src.purity),
        mass,
        massText,
        amountText: `${massText} g`,
        hydrateBadge,
        caution,
        lowMass,
        // 넣은 값 그대로. 목록을 링크나 브라우저에 보관했다가 다시 계산할 때 쓴다(share.js).
        input: {
          reagentId: custom ? CUSTOM_ID : reagent.id,
          customName: custom ? clean(src.customName) : '',
          customMolarMass: custom ? clean(src.customMolarMass) : '',
          unit,
          conc: clean(src.conc),
          volume: clean(src.volume),
          purity: clean(src.purity),
        },
      },
    };
  }

  /* ---------- 액체 시약 (진한 산·염기 등) ---------- */

  /*
   * input: { name, label, formula, molarMass, percent, density, unit, conc, volume, caution }
   * 원액의 몰 농도 = 함량(%) ÷ 100 × 밀도(g/mL) × 1000 ÷ 몰질량
   * 취할 부피 = 목표 몰 농도 × 목표 부피 ÷ 원액의 몰 농도
   */
  function computeLiquid(input) {
    const src = input || {};
    const unit = normalizeUnit(src.unit, LIQUID_UNITS);
    const name = clean(src.name);
    const molarMass = parseNumber(src.molarMass);
    const percent = parseNumber(src.percent);
    const density = parseNumber(src.density);
    const conc = parseNumber(src.conc);
    const volume = parseNumber(src.volume);
    const messages = [];

    if (name === '' || !(molarMass > 0)) messages.push(TEXT.needCustom);
    const stockOk = percent > 0 && percent <= 100 && density > 0;
    if (!stockOk) messages.push(TEXT.needPercentDensity);
    if (!(conc > 0) || !(volume > 0)) messages.push(TEXT.needConcVolume);

    const stockMolarity = stockOk && molarMass > 0 ? ((percent / 100) * density * 1000) / molarMass : NaN;
    const stockMolarityText = Number.isFinite(stockMolarity) ? formatFixed(stockMolarity, 2) : '';
    if (messages.length > 0) return { ok: false, messages, stockMolarity, stockMolarityText };

    const target = unit === 'mM' ? conc / 1000 : conc;
    if (target > stockMolarity + 1e-12) {
      return { ok: false, messages: [TEXT.liquidTooStrong], stockMolarity, stockMolarityText };
    }
    const takeVolume = (target * volume) / stockMolarity;
    const takeMass = takeVolume * density;
    const takeVolumeText = formatFixed(takeVolume, 2);
    const pipetteWarning = roundTo(takeVolume, 2) < LIMITS.pipetteMin;
    const label = clean(src.label) || name;

    return {
      ok: true,
      messages: [],
      stockMolarity,
      stockMolarityText,
      takeVolume,
      takeVolumeText,
      takeMass,
      takeMassText: formatFixed(takeMass, 2),
      pipetteWarning,
      item: {
        kind: 'liquid',
        isCustom: true,
        school: false,
        reagentId: CUSTOM_ID,
        displayName: name,
        koreanName: label,
        formula: clean(src.formula),
        concText: clean(src.conc),
        unit,
        volumeText: clean(src.volume),
        purityText: clean(src.percent),
        percentText: clean(src.percent),
        densityText: clean(src.density),
        stockMolarityText,
        takeVolume,
        takeVolumeText,
        amountText: `${takeVolumeText} mL`,
        hydrateBadge: false,
        caution: Boolean(src.caution),
        lowMass: false,
        pipetteWarning,
        input: {
          name,
          label: clean(src.label),
          formula: clean(src.formula),
          molarMass: clean(src.molarMass),
          percent: clean(src.percent),
          density: clean(src.density),
          unit,
          conc: clean(src.conc),
          volume: clean(src.volume),
          caution: Boolean(src.caution),
        },
      },
    };
  }

  /* ---------- 희석 계열 ---------- */

  /*
   * input: { unit, stock, rows: [{ conc, volume }] }
   * 행의 상태: blank(둘 다 빈칸) · invalid(비었거나 0 이하) · too-strong(원액보다 진함) · ok
   * 합계와 권장 조제량에는 ok인 행만 들어간다. (G6)
   */
  function computeDilution(input) {
    const src = input || {};
    const unit = normalizeUnit(src.unit, DILUTION_UNITS);
    const stockText = clean(src.stock);
    const stock = parseNumber(stockText);
    const rowsIn = Array.isArray(src.rows) ? src.rows : [];

    if (!(stock > 0)) {
      return { ok: false, message: TEXT.needStock, unit, stockText, rows: [], validRows: [], hasValid: false };
    }

    const rows = rowsIn.map((row, index) => {
      const concText = clean(row && row.conc);
      const volumeText = clean(row && row.volume);
      const base = { index, concText, volumeText };
      if (concText === '' && volumeText === '') return Object.assign(base, { status: 'blank' });
      const conc = parseNumber(concText);
      const volume = parseNumber(volumeText);
      if (!(conc > 0) || !(volume > 0)) return Object.assign(base, { status: 'invalid' });
      if (conc > stock) return Object.assign(base, { status: 'too-strong', message: TEXT.tooStrong });
      const stockVolume = (conc * volume) / stock;
      const waterVolume = Math.max(0, volume - stockVolume);
      return Object.assign(base, {
        status: 'ok',
        conc,
        volume,
        stockVolume,
        waterVolume,
        stockVolumeText: formatFixed(stockVolume, 2),
        waterVolumeText: formatFixed(waterVolume, 2),
        pipetteWarning: roundTo(stockVolume, 2) < LIMITS.pipetteMin,
      });
    });

    const validRows = rows.filter((r) => r.status === 'ok');
    const total = validRows.reduce((sum, r) => sum + r.stockVolume, 0);
    const need = total * LIMITS.flaskMargin;
    let flask = null;
    for (const size of FLASKS) {
      if (need <= size + 1e-9) {
        flask = size;
        break;
      }
    }
    const hasValid = validRows.length > 0;

    return {
      ok: true,
      unit,
      stock,
      stockText,
      rows,
      validRows,
      hasValid,
      total,
      totalText: formatFixed(total, 2),
      flask: hasValid ? flask : null,
      overFlask: hasValid && flask === null,
    };
  }

  /* ---------- 연속 희석 ---------- */

  /*
   * input: { start, unit, factor, steps, volume }
   * 단계마다 앞 용액에서 (부피 ÷ 배수)만큼 옮기고 증류수로 부피를 맞춘다.
   * k단계의 농도 = 시작 농도 ÷ 배수^k
   */
  function computeSerial(input) {
    const src = input || {};
    const unit = normalizeUnit(src.unit, DILUTION_UNITS);
    const start = parseNumber(src.start);
    const factor = parseNumber(src.factor);
    const steps = parseNumber(src.steps);
    const volume = parseNumber(src.volume);
    const stepsOk = Number.isInteger(steps) && steps >= 1 && steps <= LIMITS.serialSteps;
    if (!(start > 0) || !(factor > 1) || !stepsOk || !(volume > 0)) {
      return { ok: false, message: TEXT.needSerial, unit, rows: [] };
    }
    const transfer = volume / factor;
    const diluent = volume - transfer;
    const rows = [];
    for (let k = 1; k <= steps; k += 1) {
      const conc = start / Math.pow(factor, k);
      rows.push({
        step: k,
        conc,
        concText: formatSig(conc, 3),
        from: k === 1 ? '시작 용액' : `${k - 1}단계 용액`,
        left: k === steps ? volume : volume - transfer,
        leftText: formatFixed(k === steps ? volume : volume - transfer, 2),
      });
    }
    return {
      ok: true,
      unit,
      transfer,
      diluent,
      transferText: formatFixed(transfer, 2),
      diluentText: formatFixed(diluent, 2),
      pipetteWarning: roundTo(transfer, 2) < LIMITS.pipetteMin,
      totalFactorText: formatSig(Math.pow(factor, steps), 3),
      rows,
    };
  }

  /* ---------- 계산 도구 ---------- */

  // 농도 환산. 몰 농도 ↔ 질량 농도는 몰질량이 있어야 한다.
  function convertConcentration(input) {
    const src = input || {};
    const unit = normalizeUnit(src.unit, CONVERT_UNITS);
    const value = parseNumber(src.value);
    const molarMass = parseNumber(src.molarMass);
    if (!(value > 0)) return { ok: false, message: TEXT.needConvert };
    const hasMass = molarMass > 0;
    const molarInput = unit === 'M' || unit === 'mM';
    let molar = NaN; // mol/L
    let gramsPerLiter = NaN;
    if (unit === 'M') molar = value;
    else if (unit === 'mM') molar = value / 1000;
    else if (unit === 'g/L') gramsPerLiter = value;
    else if (unit === 'mg/L') gramsPerLiter = value / 1000;
    else gramsPerLiter = value * 10; // % (w/v) = g/100 mL
    if (hasMass) {
      if (molarInput) gramsPerLiter = molar * molarMass;
      else molar = gramsPerLiter / molarMass;
    }
    const text = (x) => (Number.isFinite(x) ? formatSig(x, 4) : '');
    return {
      ok: true,
      partial: !hasMass,
      message: hasMass ? '' : TEXT.convertNeedsMolarMass,
      values: {
        M: text(molar),
        mM: text(molar * 1000),
        'g/L': text(gramsPerLiter),
        'mg/L': text(gramsPerLiter * 1000),
        '% (w/v)': text(gramsPerLiter / 10),
      },
    };
  }

  // 중화 적정: n1 × M1 × V1 = n2 × M2 × V2 에서 M2를 구한다.
  function computeTitration(input) {
    const src = input || {};
    const n1 = parseNumber(src.n1);
    const c1 = parseNumber(src.c1);
    const v1 = parseNumber(src.v1);
    const n2 = parseNumber(src.n2);
    const v2 = parseNumber(src.v2);
    if (![n1, c1, v1, n2, v2].every((x) => x > 0)) return { ok: false, message: TEXT.needNumbers };
    const c2 = (n1 * c1 * v1) / (n2 * v2);
    return { ok: true, c2, c2Text: formatSig(c2, 4), molesText: formatSig((n1 * c1 * v1) / 1000, 4) };
  }

  // 총괄성: 몰랄 농도 m = 용질의 몰 ÷ 용매의 kg, ΔTf = i·Kf·m, ΔTb = i·Kb·m (이상 용액 가정)
  function computeColligative(input) {
    const src = input || {};
    const soluteMass = parseNumber(src.soluteMass);
    const molarMass = parseNumber(src.molarMass);
    const solventMass = parseNumber(src.solventMass);
    const i = parseNumber(src.i);
    const kf = parseNumber(src.kf);
    const kb = parseNumber(src.kb);
    const fp = parseNumber(src.fp);
    const bp = parseNumber(src.bp);
    if (![soluteMass, molarMass, solventMass, i, kf, kb].every((x) => x > 0) || Number.isNaN(fp) || Number.isNaN(bp)) {
      return { ok: false, message: '질량·몰질량·i·상수는 0보다 큰 숫자로, 어는점과 끓는점은 숫자로 입력하세요.' };
    }
    const molality = soluteMass / molarMass / (solventMass / 1000);
    const dTf = i * kf * molality;
    const dTb = i * kb * molality;
    return {
      ok: true,
      molality,
      dTf,
      dTb,
      freezing: fp - dTf,
      boiling: bp + dTb,
      molalityText: formatSig(molality, 4),
      dTfText: formatFixed(dTf, 2),
      dTbText: formatFixed(dTb, 2),
      freezingText: formatFixed(fp - dTf, 2),
      boilingText: formatFixed(bp + dTb, 2),
    };
  }

  // 강산·강염기의 pH (25 °C, 완전히 이온화한다고 가정)
  function computePH(input) {
    const src = input || {};
    const kind = src.kind === 'base' ? 'base' : 'acid';
    const conc = parseNumber(src.conc);
    const n = parseNumber(src.n);
    if (!(conc > 0) || !(n > 0)) return { ok: false, message: TEXT.needNumbers };
    const ion = conc * n; // [H+] 또는 [OH-]
    const p = -Math.log10(ion);
    const pH = kind === 'acid' ? p : 14 - p;
    return {
      ok: true,
      kind,
      pH,
      pHText: formatFixed(pH, 2),
      pOHText: formatFixed(14 - pH, 2),
      ionText: formatSig(ion, 3),
      note: ion < 1e-6 ? TEXT.veryDilute : '',
    };
  }

  /* ---------- 레시피 카드 (G8) ---------- */

  function solutionName(text) {
    const name = clean(text);
    return name === '' ? TEXT.defaultSolutionName : name;
  }

  function halfVolumeText(volumeText) {
    const half = parseNumber(volumeText) / 2;
    if (!(half > 0)) return '0';
    const whole = formatFixed(half, 0);
    return whole === '0' ? String(roundTo(half, 2)) : whole;
  }

  function solidCard(item) {
    return {
      kind: 'solid',
      title: `${item.koreanName} ${item.concText} ${item.unit} ${item.volumeText} mL`,
      steps: [
        `${item.koreanName} ${item.massText} g을 칭량한다.`,
        `비커에서 증류수 약 ${halfVolumeText(item.volumeText)} mL에 완전히 녹인다.`,
        `${item.volumeText} mL 부피 플라스크에 옮기고 표선까지 증류수를 채운다.`,
      ],
      hydrateBadge: item.hydrateBadge,
      caution: item.caution,
      summary: '',
    };
  }

  // 진한 산·염기는 물을 먼저 넣고 시약을 나중에 넣는다.
  function liquidCard(item) {
    return {
      kind: 'liquid',
      title: `${item.koreanName} ${item.concText} ${item.unit} ${item.volumeText} mL`,
      steps: [
        `${item.volumeText} mL 부피 플라스크에 증류수를 약 ${halfVolumeText(item.volumeText)} mL 넣는다.`,
        `${item.displayName}(${item.percentText}%) ${item.takeVolumeText} mL를 피펫으로 취해 천천히 넣고 섞는다.`,
        '식힌 뒤 표선까지 증류수를 채운다.',
      ],
      hydrateBadge: false,
      caution: item.caution,
      summary: '',
    };
  }

  function dilutionCard(nameText, result) {
    if (!result || !result.ok || !result.hasValid) return null;
    const unit = result.unit;
    const summary = result.overFlask
      ? `원액은 모두 ${result.totalText} mL 필요하다. ${TEXT.overFlask}.`
      : `원액은 모두 ${result.totalText} mL 필요하다. 권장 원액 조제량 ${result.flask} mL.`;
    return {
      kind: 'dilution',
      title: `${solutionName(nameText)} 희석 계열 (원액 ${result.stockText} ${unit})`,
      steps: result.validRows.map(
        (r) =>
          `원액 ${r.stockVolumeText} mL에 증류수 ${r.waterVolumeText} mL를 더해 ${r.concText} ${unit} ${r.volumeText} mL를 만든다.`
      ),
      hydrateBadge: false,
      caution: false,
      summary,
    };
  }

  function buildCards(items, nameText, dilutionResult) {
    const cards = (items || []).map((item) => (item.kind === 'liquid' ? liquidCard(item) : solidCard(item)));
    const dilution = dilutionCard(nameText, dilutionResult);
    if (dilution) cards.push(dilution);
    return cards;
  }

  /* ---------- 라벨 (G9) ---------- */

  // 'YYYY-MM-DD' → '2026. 11. 17.'  날짜가 아니면 빈 글자.
  function formatDate(iso) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(clean(iso));
    if (!m) return '';
    return `${Number(m[1])}. ${Number(m[2])}. ${Number(m[3])}.`;
  }

  // 조제 목록의 용액 전부, 그다음 희석 계열의 유효한 행 전부.
  function buildLabels(items, nameText, dilutionResult, dateText, makerText) {
    const date = clean(dateText);
    const maker = clean(makerText);
    const labels = (items || []).map((item) => ({
      name: item.koreanName,
      conc: `${item.concText} ${item.unit}`,
      date,
      maker,
      caution: Boolean(item.caution),
    }));
    if (dilutionResult && dilutionResult.ok) {
      const name = solutionName(nameText);
      for (const r of dilutionResult.validRows) {
        labels.push({ name, conc: `${r.concText} ${dilutionResult.unit}`, date, maker, caution: false });
      }
    }
    return labels;
  }

  function paginate(list, perSheet) {
    const size = perSheet || LIMITS.labelsPerSheet;
    const sheets = [];
    for (let i = 0; i < list.length; i += size) sheets.push(list.slice(i, i + size));
    return sheets;
  }

  const api = {
    CUSTOM_ID,
    UNITS,
    DILUTION_UNITS,
    LIQUID_UNITS,
    CONVERT_UNITS,
    FLASKS,
    DEFAULT_PURITY,
    LIMITS,
    TEXT,
    REAGENTS,
    SCHOOL_COUNT: SCHOOL.length,
    GHS_NAMES,
    LIQUID_PRESETS,
    COMMON_GROUPS,
    COMMON_LIQUID_IDS,
    commonReagents,
    commonLiquids,
    SOLVENTS,
    SAMPLE,
    parseNumber,
    roundTo,
    formatFixed,
    formatSig,
    findReagent,
    searchReagents,
    sourceNote,
    computeSolid,
    computeLiquid,
    computeDilution,
    computeSerial,
    convertConcentration,
    computeTitration,
    computeColligative,
    computePH,
    solutionName,
    solidCard,
    liquidCard,
    dilutionCard,
    buildCards,
    formatDate,
    buildLabels,
    paginate,
  };

  if (IS_NODE) module.exports = api;
  else root.RecipeCalc = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
