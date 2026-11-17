/*
 * 용액 레시피 메이커 — 화면 동작 (SPEC.md 4·11~14장)
 * 계산은 모두 calc.js(window.RecipeCalc)가 한다. 이 파일은 입력을 읽고 결과를 그리기만 한다.
 */
(function () {
  'use strict';

  const C = window.RecipeCalc;
  const L = window.LabCalc; // 실험 계산 모음 (labcalc.js)
  const B = window.LabBook; // 실험 자료 (experiments.js)
  const T = window.TopicBook; // R&E 주제와 추천 규칙 (topics.js)
  const TH = window.LabTheory; // 이론값 계산 (theory.js)
  const S = window.SiteSearch; // 검색 (search.js)
  const CU = window.LabCurve; // 적정 곡선 (curve.js)
  const SH = window.ListShare; // 조제 목록을 글자로 싸고 풀기 (share.js)
  const W = window.LabWaste; // 폐액 버리기 (waste.js)
  const FI = window.FileIn; // 파일 읽기 (filein.js)
  const P = window.LabPlan; // 실험 계획서 (plan.js)
  const E = window.LabError; // 오차 분석 (error.js)

  // 체험 완료 코드 (SPEC 8장). 운영진 안내를 받은 뒤 이 한 줄만 바꾼다.
  const COMPLETION_CODE = '1004';

  // R&E 주제 추천 화면을 메뉴에 넣을지. 팀이 2026. 11. 13.에 우선 빼기로 했다 (SPEC 19장).
  // false면 홈의 "오늘의 R&E 주제"로 주제 하나만 열어 볼 수 있다. true로 바꾸면 메뉴와 추천 화면이 돌아온다.
  const TOPIC_MENU = false;

  // 화면 이름. 주소의 # 뒤에 붙는 이름이기도 하다.
  const PAGES = {
    home: '홈',
    labs: '실험',
    colors: '색이 변하는 실험',
    gear: '준비물',
    topics: TOPIC_MENU ? 'R&E 주제 추천' : '오늘의 R&E 주제',
    tools: '계산 도구',
    reagents: '시약표',
    solid: '고체 조제',
    liquid: '액체 시약',
    dilution: '희석',
    recipe: '레시피·라벨',
    theory: '이론값 계산',
    curve: '적정 곡선',
    report: '결과 정리',
    error: '오차 분석',
    prep: '여러 실험 준비',
    plan: '실험 계획서',
    waste: '폐액 버리기',
    search: '검색',
  };
  const TABS = Object.keys(PAGES);
  // 화면마다 위쪽 제목 띠에 보이는 이름(없으면 PAGES의 이름)과 한 줄 설명
  const PAGE_TITLE = { labs: '실험 라이브러리', colors: '실험 라이브러리', gear: '실험 라이브러리', prep: '실험 라이브러리', plan: '실험 라이브러리', waste: '실험 라이브러리', curve: '이론값 계산', report: '이론값 계산', error: '이론값 계산', topics: TOPIC_MENU ? 'R&E 주제 찾기' : '오늘의 R&E 주제', solid: '용액 조제', liquid: '용액 조제', dilution: '용액 조제' };
  const PAGE_DESC = {
    labs: '일반화학 10개 단원에서 고른 실험이에요. 누르면 과정과 준비물, 시약 양이 나와요.',
    colors: '반응하면 색이 바뀌는 실험만 모았어요. 수업 시연에 쓰기 좋아요.',
    gear: '실험에 쓰는 기구를 종류별로 모았어요. 어떤 실험에 쓰는지도 함께 보여 줘요.',
    topics: TOPIC_MENU ? '관심 분야를 고르면 맞는 주제를 골라 드려요. 마음에 드는 게 없으면 새로 조합해 볼 수도 있어요.' : '',
    tools: '실험하다 보면 꼭 나오는 계산을 모아 뒀어요. 값만 넣으면 돼요.',
    reagents: '이름이나 화학식을 조금만 쳐도 찾아져요.',
    solid: '가루 시약을 몇 g 달아야 하는지 계산해요.',
    liquid: '진한 염산이나 황산을 몇 mL 떠야 하는지 계산해요.',
    dilution: '원액 하나로 여러 농도를 만들 때 각각 몇 mL씩 넣는지 계산해요.',
    recipe: '목록에 담은 용액을 만드는 순서와 병에 붙일 라벨로 바꿔 줘요.',
    theory: '할 실험을 고르고 넣을 양을 적으면, 이론대로일 때 나와야 할 값을 미리 계산해요.',
    curve: '산이나 염기를 조금씩 넣을 때 pH가 어떻게 변하는지 그려요. 어떤 지시약이 맞는지도 알려 줘요.',
    report: '여러 번 잰 값을 넣거나 엑셀·한글 파일을 넣으면 평균과 오차율을 정리해요. 실험 보고서로도 뽑을 수 있어요.',
    error: '결과 정리에 넣은 값으로 정확도와 정밀도, 튀는 값, 기구 불확도, 오차의 원인을 정리해요.',
    prep: '실험을 여러 개 고르면 필요한 기구와 시약을 한 장에 모아 줘요.',
    plan: '실험을 고르면 목적, 준비물, 시약 양, 과정, 안전, 폐액까지 채운 계획서 초안이 나와요. 학교 양식 파일을 넣으면 그 차례에 맞춰요.',
    waste: '무엇이 섞였는지 고르면 어느 폐액통에 버리는지 알려 줘요.',
    search: '짧게 쳐도 돼요. 실험, 계산, 준비물, 시약을 한 번에 찾아요.',
  };
  // 실험 목록에서 색이 변하는 실험만 모아 보는 칸의 값 (단원 이름이 아니다)
  const COLOR_CAT = '색 변화';
  // 홈의 큰 버튼: [화면, 이름, 설명]. 처음 온 사람이 바로 누를 수 있게 할 일만 남겼다.
  const NAV = [
    ['solid', '용액 조제', '몇 g 달지, 몇 mL 뜰지 계산해요'],
    ['labs', '실험', '과정이랑 준비물, 시약 양을 봐요'],
    ['tools', '계산 도구', 'pH, 적정, 기체, 열량을 계산해요'],
    ['theory', '이론값 계산', '넣을 양으로 나올 값을 미리 봐요'],
    ['curve', '적정 곡선', 'pH 곡선과 맞는 지시약을 봐요'],
    ['report', '결과 정리', '잰 값이나 파일로 평균·오차율 정리'],
    ['plan', '실험 계획서', '실험을 고르면 계획서 초안이 채워져요'],
    ['waste', '폐액 버리기', '이 폐액, 어느 통에 버릴지 알려 줘요'],
  ].concat(TOPIC_MENU ? [['topics', 'R&E 주제', '뭘 연구할지 막막할 때 눌러 보세요']] : []);
  // 배너가 스스로 다음 장으로 넘어가는 간격 (밀리초)
  const SLIDE_MS = 5000;
  // 고른 화면 색을 브라우저에 기억해 두는 이름. 입력한 값은 여기에 넣지 않는다.
  const THEME_KEY = 'recipe-maker-theme';
  // 큰 버튼 아래의 작은 버튼
  const NAV_MORE = [
    ['reagents', '시약표에서 찾기'],
    ['recipe', '라벨 뽑기'],
  ];
  // 화면 맨 아래의 "다음" 버튼
  const NEXT = {
    solid: ['dilution', 'recipe'],
    liquid: ['solid', 'recipe'],
    dilution: ['recipe', 'solid'],
    tools: ['labs', 'solid'],
    reagents: ['solid', 'liquid'],
    labs: ['tools', 'solid'],
    colors: ['labs', 'gear'],
    gear: ['labs', 'solid'],
    topics: ['labs', 'tools'],
    recipe: ['solid', 'labs'],
    theory: ['curve', 'report'],
    curve: ['theory', 'report'],
    report: ['error', 'theory'],
    error: ['report', 'theory'],
    prep: ['solid', 'recipe'],
    plan: ['prep', 'report'],
    waste: ['labs', 'prep'],
  };
  // 머리 메뉴에서 같은 자리로 묶이는 화면과 제목 띠의 작은 탭
  // 용액 조제 = 고체 조제·액체 시약·희석, 실험 = 실험 목록·색이 변하는 실험·준비물
  const PREP = ['solid', 'liquid', 'dilution'];
  const SUBS = {
    solid: [['solid', '고체 조제'], ['liquid', '액체 시약'], ['dilution', '희석']],
    labs: [['labs', '실험 목록'], ['colors', '색이 변하는 실험'], ['gear', '준비물'], ['prep', '준비표'], ['plan', '계획서'], ['waste', '폐액']],
    theory: [['theory', '실험별 이론값'], ['curve', '적정 곡선'], ['report', '결과 정리'], ['error', '오차 분석']],
  };
  const SECTION_NAME = { solid: '용액 조제', labs: '실험', theory: '이론값 계산' };
  // 산·염기 적정 실험과 그에 맞는 적정 곡선의 종류
  const LAB_CURVE = { vinegar: 'wa-sb', ksp: 'sb-sa' };
  const sectionOf = (name) => Object.keys(SUBS).find((key) => SUBS[key].some(([page]) => page === name)) || name;
  // 단원의 색(색상환의 각도). style.css의 .unit-0 ~ .unit-9와 같은 값이다.
  const UNIT_HUE = [222, 262, 172, 95, 14, 200, 32, 145, 335, 300];
  // 화면 색: 밝기 둘과 색 다섯
  const MODES = [['light', '라이트'], ['dark', '다크']];
  const ACCENTS = [['blue', '파랑'], ['green', '초록'], ['yellow', '노랑'], ['purple', '보라'], ['pink', '분홍']];
  // 홈 카드의 그림 (24×24 선 그림)
  const ICONS = {
    labs: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7.5 15h9',
    topics: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z',
    tools: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
    reagents: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4zM5 17a3 3 0 0 1 3-3h11M9 8h6',
    solid: 'M12 4v16M7 20h10M5 8h14M6 8l-3 6a3 3 0 0 0 6 0l-3-6M18 8l-3 6a3 3 0 0 0 6 0l-3-6',
    liquid: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
    dilution: 'M4 5h6v12a3 3 0 0 1-6 0V5zM14 9h6v8a3 3 0 0 1-6 0V9zM4 12h6M14 14h6',
    recipe: 'M4 4h8l8 8-8 8-8-8V4zM8.5 8.5h.01',
    theory: 'M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    curve: 'M4 4v16h16M7 17c4.5 0 3.5-10 8-10h4',
    report: 'M7 3h7l4 4v14H7V3zM14 3v4h4M10 12h5M10 16h5',
    error: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 11.2v1.6M16.5 6.5l3-3',
    prep: 'M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9',
    plan: 'M9 3h6v3H9zM9 4.5H6v16.5h12V4.5h-3M9 11h6M9 15h6M9 19h3',
    waste: 'M10 3h4v3h-4zM7 6h10a2 2 0 0 1 2 2v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a2 2 0 0 1 2-2zM9 11v6M12 11v6M15 11v6',
    file: 'M12 15V4M7.5 8.5L12 4l4.5 4.5M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4',
  };
  // 단원을 나타내는 기호. 실험 카드의 머리와 홈의 단원 버튼에 쓴다.
  // 변수는 기울인 글씨, 단위와 pH는 바로 선 글씨로 쓴다. [글자, 아래 첨자, 바로 선 글씨인가]
  const UNIT_MARKS = [['mol', '', true], ['a : b'], ['M', '', true], ['PV = nRT'], ['ΔH'], ['ΔT', 'f'], ['k'], ['K', 'c'], ['pH', '', true], ['E°']];
  const trail = []; // 지나온 화면
  let currentPage = '';
  const PAGE = 40; // 시약표에서 한 번에 보여 주는 수
  const state = {
    list: [], // 조제 목록(고체와 액체). 추가한 때의 값으로 고정된다.
    solid: null, // 지금 고체 조제 칸의 계산 결과
    liquid: null, // 지금 액체 시약 칸의 계산 결과
    liquidOptions: {}, // 액체 시약 선택지: 값 → { name, label, formula, molarMass, percent, density, caution, info }
    labels: [],
    cards: [], // 지금 목록과 희석 계열로 만든 레시피 카드의 내용
    shown: PAGE, // 시약표에서 지금 보여 주는 수
    previewOpen: false,
    previewOpened: false, // 라벨 미리보기를 한 번이라도 열었는가
    lab: { id: '', quick: false, groups: 1, from: 'labs' }, // 열어 둔 실험과 간편 준비 상태, 어느 화면에서 열었는지
    tool: 'convert', // 계산 도구에서 열어 둔 계산
    theory: '', // 이론값 계산에서 고른 실험
    theoryValue: null, // 지금 이론값 계산의 대표값 { label, value, unit }
    theoryValues: null, // 지금 이론값 계산에 넣은 값들
    curve: null, // 지금 그린 적정 곡선 { p, limit, indicator, info }
    report: { lab: '', result: null, values: null }, // 결과 정리에서 고른 실험과 그 계산
    err: { lab: null, rows: null, drop: false, picked: {} },
    reportDoc: { mode: 'sheet', template: null, edits: {}, addMissing: false },
    tour: -1, // 1분 체험의 지금 단계 (-1이면 꺼짐)
    tourDone: {}, // 1분 체험에서 이미 한 일(샘플 불러오기, 라벨 열기) // 결과 정리의 실험 보고서 (SPEC 25장) // 오차 분석: 불확도 표의 줄, 튀는 값을 뺄지, 고른 원인(실험마다)
    prep: { labs: [], groups: 1, solutions: [] }, // 여러 실험 준비에서 고른 실험과 조 수
    reportFile: null, // 결과 정리에 넣은 파일 { name, doc, analysis, table, q }
    plan: { lab: '', groups: 1, template: null, edits: {}, guess: null, addMissing: false }, // 계획서: 고른 실험, 양식 { name, sections }, 종이에서 고친 글
    waste: { parts: [], ph: '' }, // 폐액 버리기에서 고른 성분과 잰 pH
    index: null, // 검색에 쓰는 문서 목록
    gearCat: '', // 준비물 화면에서 고른 종류 (빈칸이면 전체)
    colorUnit: '', // 색이 변하는 실험 화면에서 고른 단원 (빈칸이면 전체)
    gearOpen: {}, // 준비물 카드에서 실험 목록을 펼친 기구
    gearHowOpen: {}, // 준비물 카드에서 사용법을 펼친 기구
    gearHowOnly: false, // 사용법이 있는 기구만 보기
    topicOpen: false, // 홈의 오늘의 R&E 주제로 주제 하나를 열어 두었는가
    generated: [], // 지금 보여 주는 새 주제
    round: 0, // 새 주제의 몇 번째 묶음인가
  };
  const timers = {};

  // 처음 열 때 한 번만 그리는 화면. 시작할 때는 지금 보이는 화면만 그리고, 나머지는 그 화면을 처음 열 때 그린다.
  // (보이지 않는 화면 여덟 개를 미리 그리던 것이 시작 시간의 절반쯤이었다.)
  const FIRST_DRAW = {
    reagents: () => renderReagents(),
    labs: () => renderLabList(),
    colors: () => renderColors(),
    gear: () => renderGear(),
    tools: () => setupTools(),
    theory: () => setupTheory(),
    curve: () => setupCurve(),
    report: () => setupReport(),
    error: () => setupError(),
    prep: () => setupPrep(),
    plan: () => setupPlan(),
    waste: () => setupWaste(),
    topics: () => renderTopics(),
    search: () => renderSearch(),
  };
  const drawn = {}; // 한 번이라도 그린 화면
  // 같은 입력으로 다시 그리지 않도록, 마지막으로 그린 입력을 글자로 기억해 둔다.
  const lastKey = {};
  let recipeStale = false; // 레시피·라벨 화면이 안 보이는 동안 미뤄 둔 그리기가 있는가

  const $ = (id) => document.getElementById(id);

  function ensureDrawn(name) {
    if (drawn[name] || !FIRST_DRAW[name]) return;
    drawn[name] = true;
    FIRST_DRAW[name]();
  }

  // 입력이 지난번과 같으면 true. (input과 change가 잇달아 오거나, 값이 그대로인 채 초점만 옮긴 경우)
  function sameInput(name, input) {
    const key = JSON.stringify(input);
    if (lastKey[name] === key) return true;
    lastKey[name] = key;
    return false;
  }

  function setText(node, text) {
    if (node.textContent !== text) node.textContent = text;
  }

  // replaceChildren·append는 null을 글자 "null"로 넣는다. 조건부로 빠지는 자식은 이것으로 걸러서 넘긴다.
  function kids(...list) {
    return list.flat().filter((child) => child != null && child !== false);
  }

  function el(tag, props, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : value);
    }
    for (const child of children.flat()) {
      if (child != null && child !== false) node.append(child);
    }
    return node;
  }

  // 화학식의 원자 수만 아래 첨자로 보여 준다. 글자(textContent)는 그대로다.
  function formula(text) {
    const span = el('span', { class: 'formula' });
    let plain = '';
    let prevSub = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      const prev = i > 0 ? text[i - 1] : '';
      const isDigit = ch >= '0' && ch <= '9';
      const isSub = isDigit && (/[A-Za-z)\]]/.test(prev) || (prevSub && prev >= '0' && prev <= '9'));
      if (isSub) {
        if (plain) span.append(plain);
        plain = '';
        span.append(el('sub', { text: ch }));
      } else {
        plain += ch;
      }
      prevSub = isSub;
    }
    if (plain) span.append(plain);
    return span;
  }

  function icon(d) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', width: '26', height: '26', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) {
      svg.setAttribute(key, value);
    }
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
    return svg;
  }

  function unitIndex(unit) {
    return B ? Math.max(0, B.UNITS.indexOf(unit)) : 0;
  }

  function unitMark(unit) {
    const [text, sub, roman] = UNIT_MARKS[unitIndex(unit)] || [''];
    return el('span', { class: roman ? 'mark mark--roman' : 'mark', 'aria-hidden': 'true' }, text, sub ? el('sub', { text: sub }) : null);
  }

  const flat = (text) => String(text).toLowerCase().replace(/\s+/g, '');

  // 색 한 칸. 색이 없으면(무색) 빈 칸으로 그린다.
  function swatch(color) {
    const node = el('span', { class: color ? 'swatch' : 'swatch swatch--none', 'aria-hidden': 'true' });
    if (color) node.style.setProperty('--c', color);
    return node;
  }

  // 색이 변하는 실험의 색 차례: ● 분홍 ⇌ ● 파랑. 이름을 숨기면 점만 보이고 글은 화면 낭독기에만 읽힌다.
  function colorSteps(colors, withNames) {
    const parts = [];
    colors.steps.forEach(([name, color], i) => {
      if (i > 0) parts.push(el('span', { class: 'swatches__sep', 'aria-hidden': 'true', text: colors.sep }));
      parts.push(el('span', { class: 'swatches__item' }, swatch(color), el('span', { class: withNames ? null : 'visually-hidden', text: name })));
    });
    return el('span', { class: 'swatches' }, parts);
  }

  const colorNames = (colors) => colors.steps.map((step) => step[0]).join(` ${colors.sep} `);

  function badge(kind, text) {
    return el('span', { class: `badge badge--${kind}`, text });
  }

  function flash(id, text, ms) {
    const node = $(id);
    node.textContent = text;
    clearTimeout(timers[id]);
    if (text && ms) {
      timers[id] = setTimeout(() => {
        node.textContent = '';
      }, ms);
    }
  }

  function todayISO() {
    const d = new Date();
    const two = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
  }

  function fillSelect(id, values) {
    for (const value of values) $(id).append(el('option', { value, text: value }));
  }

  function onForm(id, handler) {
    $(id).addEventListener('input', handler);
    $(id).addEventListener('change', handler);
    $(id).addEventListener('submit', (event) => event.preventDefault());
  }

  /* ---------- 화면 이동: 홈에서 카드를 눌러 들어가고, 새 화면은 옆에서 밀려 들어온다 ---------- */

  function available(name) {
    if (!PAGES[name] || !$(`panel-${name}`)) return false;
    if (name === 'reagents') return C.SCHOOL_COUNT > 0;
    if (name === 'labs' || name === 'colors' || name === 'gear' || name === 'prep') return Boolean(L && B);
    if (name === 'plan') return Boolean(P && L && B && W);
    if (name === 'waste') return Boolean(W);
    if (name === 'theory' || name === 'report') return Boolean(TH && L && B);
    if (name === 'error') return Boolean(TH && L && B && E);
    if (name === 'curve') return Boolean(CU && L);
    if (name === 'search') return Boolean(S);
    if (name === 'topics') return Boolean(T);
    return true;
  }

  function renderPage(requested) {
    let name = available(requested) ? requested : 'home';
    if (name === 'topics' && !TOPIC_MENU && !state.topicOpen) name = 'home'; // 추천 화면은 메뉴에서 뺐다
    const first = !drawn[name];
    ensureDrawn(name);
    if (name === 'recipe' && recipeStale) drawRecipe();
    // 오차 분석은 결과 정리의 값을 읽으므로 열 때마다 다시 그린다
    if (name === 'error' && !first) renderError();
    const back = trail.length >= 2 && trail[trail.length - 2] === name;
    if (back) trail.pop();
    else if (trail[trail.length - 1] !== name) trail.push(name);
    for (const page of TABS) {
      const panel = $(`panel-${page}`);
      panel.hidden = page !== name;
      panel.classList.remove('enter-forward', 'enter-back');
    }
    if (currentPage && currentPage !== name) {
      const panel = $(`panel-${name}`);
      void panel.offsetWidth; // 애니메이션을 다시 시작시킨다
      panel.classList.add(back || name === 'home' ? 'enter-back' : 'enter-forward');
    }
    currentPage = name;
    $('crumb').hidden = name === 'home';
    $('crumb-here').textContent = PAGES[name];
    $('page-band').hidden = name === 'home';
    $('page-title').textContent = PAGE_TITLE[name] || PAGES[name];
    $('page-desc').textContent = PAGE_DESC[name] || '';
    const section = sectionOf(name);
    for (const link of document.querySelectorAll('[data-nav]')) {
      if (link.dataset.nav === section) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    const subs = SUBS[section];
    $('subnav').hidden = !subs;
    $('subnav').setAttribute('aria-label', SECTION_NAME[section] || '');
    $('subnav').replaceChildren(...(subs || []).filter(([page]) => available(page)).map(([page, text]) => el('a', { href: `#${page}`, 'data-sub': page, text })));
    markSub(name === 'labs' && !$('lab-detail').hidden ? state.lab.from : name);
    setMenu(false);
    setSearch(false);
    window.scrollTo(0, 0);
  }

  // 제목 띠의 작은 탭에서 지금 화면을 표시한다.
  function markSub(name) {
    for (const link of document.querySelectorAll('[data-sub]')) {
      if (link.dataset.sub === name) {
        link.setAttribute('aria-current', 'page');
        // 작은 탭이 옆으로 넘칠 때(좁은 화면의 실험 탭 여섯) 지금 탭이 보이게 민다
        const bar = link.parentElement;
        if (bar && bar.scrollWidth > bar.clientWidth + 1) bar.scrollLeft = Math.max(0, link.offsetLeft - (bar.clientWidth - link.offsetWidth) / 2);
      } else link.removeAttribute('aria-current');
    }
  }

  // 돋보기를 누르면 검색 칸이 열린다. 열린 채로 다시 누르면 찾고, 빈칸이면 닫는다.
  function setSearch(open) {
    $('site-search-form').classList.toggle('is-open', open);
    $('site-search').hidden = !open;
    $('btn-search').setAttribute('aria-expanded', open ? 'true' : 'false');
    $('btn-search').setAttribute('aria-label', open ? '검색' : '검색 열기');
    if (open) {
      setMenu(false);
      $('site-search').focus();
    }
  }

  /* ---------- 화면 색: 밝기와 색 ---------- */

  // 고른 적이 없으면 기기 설정을 따른다(어두운 화면이면 다크, 아니면 라이트). 색은 파랑이다.
  // 화면 색은 둘로 나뉜다: 밝기(라이트·다크)와 색(파랑·초록·노랑·보라·분홍). 어느 밝기에서나 색을 고를 수 있다.
  function currentMode() {
    const root = document.documentElement;
    if (root.dataset.theme === 'dark' || root.dataset.theme === 'light') return root.dataset.theme;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function currentAccent() {
    const accent = document.documentElement.dataset.accent;
    return ACCENTS.some(([value]) => value === accent) ? accent : 'blue';
  }

  function showTheme() {
    const mode = currentMode();
    const accent = currentAccent();
    for (const button of document.querySelectorAll('[data-mode-pick]')) button.setAttribute('aria-pressed', button.dataset.modePick === mode ? 'true' : 'false');
    for (const button of document.querySelectorAll('[data-accent-pick]')) button.setAttribute('aria-pressed', button.dataset.accentPick === accent ? 'true' : 'false');
    syncThemeColor();
  }

  // 브라우저 위쪽 띠의 색(theme-color)을 지금 보이는 머리 줄의 색에 맞춘다. 색 값은 style.css에만 둔다.
  function syncThemeColor() {
    const bar = document.querySelector('.site-util');
    if (!bar) return;
    const color = window.getComputedStyle(bar).backgroundColor;
    if (!color) return;
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) meta.setAttribute('content', color);
  }

  function applyTheme(mode, accent) {
    const root = document.documentElement;
    root.dataset.theme = mode === 'dark' ? 'dark' : 'light';
    if (accent && accent !== 'blue') root.dataset.accent = accent;
    else delete root.dataset.accent;
  }

  function setTheme(mode, accent) {
    applyTheme(mode, accent);
    try {
      window.localStorage.setItem(THEME_KEY, `${currentMode()}:${currentAccent()}`);
    } catch (error) {
      // 기억해 둘 수 없는 환경이면 이번에만 바꾼다.
    }
    showTheme();
  }

  // 기억해 둔 값 읽기. 예전 값(blue, green, dark, light)도 알아듣는다.
  function readTheme(saved) {
    const old = { blue: 'light:blue', light: 'light:blue', green: 'light:green', dark: 'dark:blue' };
    const [mode, accent] = String(old[saved] || saved || '').split(':');
    if ((mode !== 'light' && mode !== 'dark') || !ACCENTS.some(([value]) => value === accent)) return null;
    return { mode, accent };
  }

  function setupTheme() {
    let saved = null;
    try {
      saved = window.localStorage.getItem(THEME_KEY);
    } catch (error) {
      saved = null;
    }
    const theme = readTheme(saved);
    if (theme) applyTheme(theme.mode, theme.accent);
    $('mode-pick').replaceChildren(
      ...MODES.map(([value, text]) => el('button', { type: 'button', class: 'mode-pick__btn', 'data-mode-pick': value, 'aria-pressed': 'false', onclick: () => setTheme(value, currentAccent()) }, text))
    );
    $('theme-pick').replaceChildren(
      ...ACCENTS.map(([value, text]) =>
        el(
          'button',
          { type: 'button', class: `theme-pick__btn theme-pick__btn--${value}`, 'data-accent-pick': value, 'aria-pressed': 'false', 'aria-label': text, title: text, onclick: () => setTheme(currentMode(), value) },
          el('span', { class: 'theme-pick__dot', 'aria-hidden': 'true' })
        )
      )
    );
    showTheme();
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', showTheme);
  }

  /* ---------- 홈의 배너: 여러 장이 일정 시간마다 옆으로 넘어간다 ---------- */

  function setupHero() {
    const slides = Array.from(document.querySelectorAll('#hero-track .slide'));
    if (!slides.length) return;
    const hero = $('hero');
    // 움직임을 줄여 달라고 한 기기에서는 스스로 넘기지 않는다.
    const calm = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    let index = 0;
    let timer = null;
    let paused = calm;
    let hover = false;
    let focus = false;
    slides.forEach((slide, i) => slide.setAttribute('aria-label', `${i + 1} / ${slides.length}`));
    const dots = slides.map((slide, i) =>
      el('button', {
        type: 'button',
        class: 'hero__dot',
        'aria-label': `${i + 1}번째 장 보기`,
        onclick: () => {
          show(i);
          restart();
        },
      })
    );
    $('hero-dots').replaceChildren(...dots);
    function show(next) {
      index = (next + slides.length) % slides.length;
      $('hero-track').style.transform = `translateX(${-100 * index}%)`;
      slides.forEach((slide, i) => {
        const on = i === index;
        slide.classList.toggle('is-on', on);
        slide.setAttribute('aria-hidden', on ? 'false' : 'true');
        slide.inert = !on; // 안 보이는 장의 버튼에는 초점이 가지 않는다
      });
      dots.forEach((dot, i) => {
        if (i === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      hero.dataset.slide = String(index + 1);
    }
    function restart() {
      clearInterval(timer);
      timer = null;
      if (paused || hover || focus) return;
      timer = setInterval(() => {
        if (!$('panel-home').hidden) show(index + 1);
      }, SLIDE_MS);
    }
    function showPause() {
      $('hero-pause').setAttribute('aria-label', paused ? '자동으로 넘기기' : '자동 넘김 멈추기');
      $('hero-pause').classList.toggle('is-paused', paused);
      hero.dataset.auto = paused ? 'off' : 'on';
    }
    $('hero-prev').addEventListener('click', () => {
      show(index - 1);
      restart();
    });
    $('hero-next').addEventListener('click', () => {
      show(index + 1);
      restart();
    });
    $('hero-pause').addEventListener('click', () => {
      paused = !paused;
      showPause();
      restart();
    });
    hero.addEventListener('mouseenter', () => { hover = true; restart(); });
    hero.addEventListener('mouseleave', () => { hover = false; restart(); });
    // 키보드로 초점을 옮겨 왔을 때만 멈춘다. 마우스로 누른 버튼에 남은 초점 때문에 계속 멈춰 있으면 안 된다.
    hero.addEventListener('focusin', (event) => { focus = event.target.matches(':focus-visible'); restart(); });
    hero.addEventListener('focusout', () => { focus = false; restart(); });
    // 손가락으로 옆으로 밀어도 넘어간다.
    let startX = null;
    hero.addEventListener('touchstart', (event) => { startX = event.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', (event) => {
      if (startX == null) return;
      const moved = event.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(moved) < 40) return;
      show(index + (moved < 0 ? 1 : -1));
      restart();
    });
    show(0);
    showPause();
    restart();
  }

  // 실험을 연다. from은 돌아갈 화면(실험 목록, 색이 변하는 실험, 준비물)이다.
  function openLab(id, from) {
    navigate('labs');
    showLab(id, false, from || 'labs');
  }

  // 계산 도구에서 계산 하나를 열어 보여 준다.
  function openCalc(id) {
    ensureDrawn('tools');
    pickTool(id);
    navigate('tools');
  }

  function setMenu(open) {
    if (open) setSearch(false);
    $('site-menu').classList.toggle('is-open', open);
    $('btn-menu').setAttribute('aria-expanded', open ? 'true' : 'false');
    $('btn-menu').textContent = open ? '닫기' : '메뉴';
  }

  // 머리와 꼬리의 메뉴로 들어가면 그 화면의 처음 모습(목록)부터 보여 준다.
  function openPage(name) {
    if (name === 'labs' && available('labs')) closeLab();
    if (name === 'topics' && available('topics')) closeTopic();
    navigate(name);
  }

  // 검색에 쓰는 문서 목록은 처음 찾을 때 한 번 만든다.
  function searchIndex() {
    if (!state.index) {
      const pages = [
        { id: 'labs', title: '실험 목록', keywords: '실험 라이브러리 단원 과정 준비물' },
        { id: 'colors', title: '색이 변하는 실험', keywords: '색 변화 색깔 시연' },
        { id: 'gear', title: '준비물', keywords: '기구 도구 장비 실험 기구' },
        { id: 'tools', title: '계산 도구', keywords: '계산기 계산 공식' },
        { id: 'theory', title: '이론값 계산', keywords: '이론값 예상 결과 예측 물질의 양' },
        { id: 'curve', title: '적정 곡선', keywords: '적정 곡선 pH 곡선 그래프 당량점 반당량점 지시약 고르기 중화 적정' },
        { id: 'report', title: '결과 정리', keywords: '결과 정리 실험 보고서 보고서 양식 평균 표준 편차 오차율 측정값 여러 번 잰 값 인쇄' },
        { id: 'error', title: '오차 분석', keywords: '오차 분석 오차 원인 계통 오차 우연 오차 정확도 정밀도 불확도 허용 오차 Q 검정 이상값 튀는 값 고찰' },
        { id: 'prep', title: '여러 실험 준비', keywords: '준비표 준비물 합치기 여러 실험 기구 시약 체크리스트 조 수 인쇄' },
        { id: 'plan', title: '실험 계획서', keywords: '계획서 실험 계획 탐구 계획서 보고서 양식 한글 hwpx 워드 목적 가설 변인 과정 초안 미리 만들기' },
        { id: 'waste', title: '폐액 버리기', keywords: '폐액 폐수 폐액통 버리기 버리는 곳 뒷정리 산 폐액 알칼리 폐액 유기계 무기계 얼음물 깨진 유리 싱크대' },
        { id: 'solid', title: '고체 조제', keywords: '용액 조제 용액 만들기 칭량 질량 몰 농도 가루 시약' },
        { id: 'liquid', title: '액체 시약', keywords: '용액 조제 진한 산 염기 염산 황산 질산 암모니아수 함량 밀도' },
        { id: 'dilution', title: '희석', keywords: '용액 조제 묽히기 연속 희석 원액 희석 계열' },
        { id: 'reagents', title: '시약표', keywords: '시약 분자량 몰질량 화학식 찾기' },
        { id: 'recipe', title: '레시피·라벨', keywords: '레시피 카드 라벨 인쇄 스티커 병' },
      ].filter((page) => available(page.id));
      state.index = S.buildIndex({ B: available('labs') ? B : null, L, tools: toolList().map((t) => ({ id: t.id, title: t.title, group: t.group, hint: t.calc ? t.calc.hint : t.basic.desc })), pages });
    }
    return state.index;
  }

  // 머리의 돋보기에서 찾으면 검색 화면으로 간다.
  function searchSite(query) {
    if (!available('search')) return;
    $('search-input').value = String(query || '').trim();
    drawn.search = true;
    renderSearch();
    navigate('search');
  }

  const SEARCH_SUGGEST = ['산염기', '적정', '색 변화', '전지', '뷰렛', 'pH', '비타민', 'NaCl'];
  const SEARCH_KIND = { lab: '실험', calc: '계산 도구', gear: '준비물', page: '바로 가기' };

  function searchRow(result) {
    const { doc } = result;
    const open = { lab: () => openLab(doc.id, 'search'), calc: () => openCalc(doc.id), gear: () => openGear(doc.id), page: () => openPage(doc.id) }[doc.type];
    const why = result.why && !['제목', '이름', '단원', '묶음'].includes(result.why) ? `${result.why}에서 찾음` : '';
    const lab = doc.type === 'lab' ? B.EXPERIMENTS.find((e) => e.id === doc.id) : null;
    return el(
      'li',
      { class: 'search-row' },
      el(
        'button',
        { type: 'button', class: 'search-row__main', 'data-kind': doc.type, 'data-id': doc.id, onclick: open },
        el('span', { class: 'search-row__sub', text: doc.sub }),
        el('strong', { class: 'search-row__title', text: doc.title }),
        lab && lab.colors ? el('span', { class: 'search-row__colors' }, colorSteps(lab.colors, false)) : null,
        why ? el('span', { class: 'search-row__why', text: why }) : null
      ),
      lab && available('theory') && TH.find(lab.id) ? el('button', { type: 'button', class: 'search-row__more', onclick: () => openTheory(lab.id), text: '이론값 계산' }) : null
    );
  }

  function renderSearch() {
    const query = $('search-input').value.trim();
    const found = query ? S.search(query, searchIndex()) : { results: [], hints: [], partial: false };
    const reagents = query && available('reagents') ? findReagents(query, '') : [];
    const sections = [];
    for (const kind of ['lab', 'calc', 'gear', 'page']) {
      const rows = found.results.filter((r) => r.doc.type === kind);
      if (!rows.length) continue;
      sections.push(
        el('section', { class: 'search-sec', 'data-sec': kind }, el('h3', { class: 'search-sec__title' }, SEARCH_KIND[kind], el('span', { class: 'count', text: `${rows.length}개` })), el('ul', { class: 'search-list' }, rows.map(searchRow)))
      );
    }
    if (reagents.length) {
      sections.push(
        el(
          'section',
          { class: 'search-sec', 'data-sec': 'reagent' },
          el('h3', { class: 'search-sec__title' }, '시약표', el('span', { class: 'count', text: `${reagents.length}종` })),
          el(
            'ul',
            { class: 'search-list' },
            reagents.slice(0, 6).map((r) =>
              el(
                'li',
                { class: 'search-row' },
                el(
                  'button',
                  { type: 'button', class: 'search-row__main', 'data-kind': 'reagent', onclick: () => openReagents(r.korean || r.english) },
                  el('span', { class: 'search-row__sub', text: r.molarMass == null ? '분자량 없음' : `${r.molarMass.toFixed(2)} g/mol` }),
                  el('strong', { class: 'search-row__title' }, r.korean, r.formula ? el('small', { class: 'cell-sub' }, ' ', formula(r.formula)) : null)
                )
              )
            )
          ),
          reagents.length > 6 ? el('button', { type: 'button', class: 'btn btn--small', id: 'search-reagents-all', text: `시약 ${reagents.length}종 모두 보기`, onclick: () => openReagents(query) }) : null
        )
      );
    }
    const total = found.results.length + reagents.length;
    $('search-results').replaceChildren(...sections);
    $('search-suggest').hidden = Boolean(query);
    $('search-empty').hidden = !query || total > 0;
    $('search-empty').textContent = query ? `'${query}'(으)로는 찾지 못했어요. 더 짧게 치거나 다른 말로 쳐 보세요.` : '';
    // 친 말을 어떻게 알아들었는지 한 줄로 알려 준다.
    const hints = found.hints.map((h) => `'${h.token}' → ${h.as.join(', ')}`);
    const parts = [];
    if (query && total) parts.push(`${total}개를 찾았어요.`);
    if (hints.length) parts.push(`이렇게 알아들었어요: ${hints.join(' / ')}`);
    if (found.partial) parts.push('모든 낱말이 맞는 것은 없어서, 하나라도 맞는 것을 보여 드려요.');
    $('search-hint').textContent = parts.join(' ');
    $('search-hint').hidden = !parts.length;
  }

  function openReagents(query) {
    $('rg-query').value = query;
    $('rg-filter').value = 'all';
    state.shown = PAGE;
    drawn.reagents = true;
    renderReagents();
    navigate('reagents');
  }

  // 준비물 화면에서 그 기구의 카드를 펼쳐 보여 준다.
  function openGear(id) {
    state.gearCat = '';
    state.gearHowOnly = false;
    $('gear-query').value = '';
    state.gearOpen[id] = true;
    drawn.gear = true;
    renderGear();
    navigate('gear');
    const card = $('gear-list').querySelector(`[data-gear="${id}"]`);
    if (card) card.scrollIntoView({ block: 'center' });
  }

  function navigate(name) {
    renderPage(name);
    if (window.location.hash.slice(1) !== currentPage) {
      try {
        window.location.hash = currentPage;
      } catch (error) {
        // 주소를 바꿀 수 없는 환경이어도 화면은 이미 바뀌었다.
      }
    }
  }

  // 주소의 # 뒤를 지금 보이는 화면에 맞춘다. 메뉴에서 뺀 화면의 주소로 들어오면 홈이 보이므로 주소도 홈으로 고친다.
  function syncHash() {
    if (window.location.hash.slice(1) === currentPage) return;
    try {
      window.history.replaceState(null, '', `#${currentPage}`);
    } catch (error) {
      // 주소를 바꿀 수 없는 환경이어도 화면은 이미 맞다.
    }
  }

  function showTab(name) {
    navigate(name);
  }

  function goBack() {
    navigate(trail.length >= 2 ? trail[trail.length - 2] : 'home');
  }

  function setupHome() {
    $('nav-cards').replaceChildren(
      ...NAV.filter(([page]) => available(page)).map(([page, title, text], i) =>
        el(
          'button',
          { type: 'button', class: i === 0 ? 'nav-card nav-card--main' : 'nav-card', 'data-go': page },
          el('span', { class: 'nav-card__icon' }, icon(ICONS[page])),
          el('strong', { class: 'nav-card__title', text: title }),
          el('span', { class: 'nav-card__text', text })
        )
      )
    );
    $('nav-more').replaceChildren(...NAV_MORE.filter(([page]) => available(page)).map(([page, text]) => el('button', { type: 'button', class: 'nav-more__btn', 'data-go': page, text })));
    // 오늘의 추천은 배너의 두 장이다 (SPEC 24장). 날마다 실험 하나와 R&E 주제 하나를 고른다.
    const today = todayISO();
    if (available('labs')) {
      const lab = T ? T.pickOfDay(B.EXPERIMENTS, today) : B.EXPERIMENTS[0];
      $('today-lab-title').textContent = lab.title;
      $('today-lab-text').textContent = lab.colors ? `${lab.unit} · 색이 ${lab.colors.steps.map(([name]) => name).join(` ${lab.colors.sep || '→'} `)}로 바뀌어요` : `${lab.unit} · 과정, 준비물, 시약 양을 한 번에 봐요`;
      $('today-lab').addEventListener('click', () => openLab(lab.id));
      $('today-lab-art').replaceChildren(
        ...kids(
          el('span', { class: `today-art__mark unit-${unitIndex(lab.unit)}` }, unitMark(lab.unit)),
          lab.colors ? el('span', { class: 'today-art__colors' }, lab.colors.steps.map(([name, color]) => el('span', { class: 'today-art__swatch', style: `background:${color}`, title: name }))) : null
        )
      );
    } else {
      $('slide-today-lab').remove();
    }
    if (available('topics')) {
      const topic = T.pickOfDay(T.TOPICS, today);
      $('today-topic-title').textContent = topic.title;
      $('today-topic-text').textContent = topic.question;
      $('today-topic').addEventListener('click', () => openTopic(topic.id));
      $('today-topic-art').replaceChildren(el('span', { class: 'today-art__mark today-art__mark--topic' }, icon(ICONS.topics)));
    } else {
      $('slide-today-topic').remove();
    }
    const colorLabs = available('labs') ? B.EXPERIMENTS.filter((e) => e.colors) : [];
    // 배너의 장마다 있는 버튼과 그림
    $('slide-color-count').textContent = String(colorLabs.length);
    $('slide-colors-btn').addEventListener('click', () => navigate('colors'));
    $('slide-indicator-btn').addEventListener('click', () => openCalc('indicator'));
    if (L && L.INDICATORS) {
      const phs = Array.from({ length: 13 }, (_, i) => i + 1);
      const rows = ['methyl-orange', 'btb', 'phenolphthalein'].map((id) => L.INDICATORS.find((x) => x.id === id)).filter(Boolean);
      $('slide-indicator-art').replaceChildren(
        el('div', { class: 'ph-strip__row' }, el('span', { class: 'ph-strip__name', text: 'pH' }), ...phs.map((ph) => el('span', { class: 'ph-strip__num', text: String(ph) }))),
        ...rows.map((indicator) =>
          el(
            'div',
            { class: 'ph-strip__row' },
            el('span', { class: 'ph-strip__name', text: indicator.name }),
            ...phs.map((ph) => {
              const color = L.indicatorColor(indicator, ph).color;
              const cell = el('span', { class: color ? 'ph-strip__cell' : 'ph-strip__cell ph-strip__cell--none' });
              if (color) cell.style.setProperty('--c', color);
              return cell;
            })
          )
        )
      );
    }
    setupHero();
    for (const [page, targets] of Object.entries(NEXT)) {
      const panel = $(`panel-${page}`);
      if (!panel) continue;
      panel.append(
        el(
          'nav',
          { class: 'next-nav no-print', 'aria-label': '다음으로' },
          el('span', { class: 'next-nav__label', text: '다음으로' }),
          targets.filter(available).map((target, i) => el('button', { type: 'button', class: i === 0 ? 'btn btn--primary' : 'btn', 'data-go': target, text: PAGES[target] }))
        )
      );
    }
  }

  /* ---------- 조제 목록 (고체와 액체가 함께 쓴다) ---------- */

  function addItem(result, noteId) {
    if (!result || !result.ok) return;
    if (state.list.length >= C.LIMITS.listRows) {
      flash(noteId, C.TEXT.listFull);
      return;
    }
    state.list.push(result.item);
    const count = `${state.list.length} / ${C.LIMITS.listRows}`;
    flash(
      noteId,
      noteId === 'list-note'
        ? `${result.item.koreanName} 용액을 목록에 추가했습니다.`
        : `${result.item.koreanName} 용액을 조제 목록에 추가했습니다 (${count}). 목록은 고체 조제 탭 아래에 있습니다.`,
      noteId === 'list-note' ? 2500 : 5000
    );
    renderList();
    renderRecipe();
  }

  function removeItem(index) {
    state.list.splice(index, 1);
    flash('list-note', '');
    flash('liq-note', '');
    renderList();
    renderRecipe();
  }

  function itemName(item) {
    if (item.kind === 'liquid') return [item.displayName, el('small', { class: 'cell-sub', text: '액체 시약' })];
    if (item.school) return [item.displayName, item.formula ? el('small', { class: 'cell-sub' }, formula(item.formula)) : null];
    return item.isCustom ? item.displayName : formula(item.displayName);
  }

  function renderList() {
    const body = $('prep-list');
    body.replaceChildren();
    state.list.forEach((item, index) => {
      const marks = el('td', { class: 'cell-marks', 'data-label': '표시' });
      if (item.hydrateBadge) marks.append(badge('hydrate', C.TEXT.hydrateBadge));
      if (item.lowMass) marks.append(badge('warn', C.TEXT.lowMass));
      if (item.pipetteWarning) marks.append(badge('warn', C.TEXT.pipette));
      if (!marks.hasChildNodes()) marks.classList.add('cell-empty');
      const liquid = item.kind === 'liquid';
      body.append(
        el(
          'tr',
          null,
          el('td', { class: 'cell-name', 'data-label': '시약' }, itemName(item)),
          el('td', { 'data-label': '농도', text: `${item.concText} ${item.unit}` }),
          el('td', { 'data-label': '부피', text: `${item.volumeText} mL` }),
          el('td', { 'data-label': liquid ? '함량' : '순도', text: `${item.purityText}%` }),
          el('td', { class: 'cell-strong', 'data-label': liquid ? '취할 부피' : '칭량 질량', text: item.amountText }),
          marks,
          el(
            'td',
            { class: 'cell-action' },
            // 누르면 #prep-list에 걸어 둔 리스너 하나가 받아서 지운다 (행마다 리스너를 달지 않는다).
            el('button', {
              type: 'button',
              class: 'btn btn--small',
              'data-remove': String(index),
              'aria-label': `${index + 1}행 ${item.displayName} 삭제`,
              text: '삭제',
            })
          )
        )
      );
    });
    $('prep-table').hidden = state.list.length === 0;
    $('list-empty').hidden = state.list.length > 0;
    $('list-count').textContent = `${state.list.length} / ${C.LIMITS.listRows}`;
  }

  /* ---------- 고체 조제 ---------- */

  function readSolid() {
    return {
      reagentId: $('reagent').value,
      customName: $('custom-name').value,
      customMolarMass: $('custom-mm').value,
      unit: $('unit').value,
      conc: $('conc').value,
      volume: $('volume').value,
      purity: $('purity').value,
    };
  }

  function formulaLine(input, result) {
    const purity = `(${input.purity.trim()} ÷ 100)`;
    if (input.unit === '% (w/v)') {
      return `${input.conc.trim()} g/100 mL × ${input.volume.trim()} mL ÷ ${purity}`;
    }
    const liters = C.roundTo(C.parseNumber(input.volume) / 1000, 6);
    if (input.unit === 'mg/L') {
      return `${input.conc.trim()} mg/L × ${liters} L ÷ 1000 ÷ ${purity}`;
    }
    const molar = input.unit === 'mM' ? `${input.conc.trim()} mM ÷ 1000` : `${input.conc.trim()} mol/L`;
    return `${molar} × ${liters} L × ${result.molarMass.toFixed(2)} g/mol ÷ ${purity}`;
  }

  function renderReagentInfo(reagent, isCustom) {
    const info = $('reagent-info');
    info.replaceChildren();
    if (isCustom) {
      info.textContent = '이름과 몰질량을 직접 넣어 주세요.';
      return;
    }
    if (!reagent) return;
    const parts = [reagent.korean];
    if (reagent.school && reagent.formula) parts.push(reagent.formula);
    parts.push(reagent.molarMass == null ? '분자량 없음' : `몰질량 ${reagent.molarMass.toFixed(2)} g/mol`);
    if (reagent.hydrate) parts.push('수화물');
    info.append(parts.join(' · '));
    const note = C.sourceNote(reagent);
    if (note) info.append(el('span', { class: 'field__warn', text: note }));
    const ghs = ghsLine(reagent);
    if (ghs) info.append(ghs);
  }

  function renderSolid() {
    const input = readSolid();
    if (sameInput('solid', input)) return;
    const isCustom = input.reagentId === C.CUSTOM_ID;
    $('custom-fields').hidden = !isCustom;
    renderReagentInfo(C.findReagent(input.reagentId), isCustom);

    const result = C.computeSolid(input);
    state.solid = result;
    $('solid-card').dataset.state = result.ok ? 'ok' : 'wait';
    $('btn-add').disabled = !result.ok;

    const box = $('solid-result');
    box.replaceChildren(el('p', { class: 'result__label', text: '칭량 질량' }));
    if (!result.ok) {
      box.append(
        el('p', { class: 'result__wait', 'aria-hidden': 'true', text: '— g' }),
        el('ul', { class: 'hints', id: 'solid-messages' }, result.messages.map((m) => el('li', { text: m })))
      );
      return;
    }
    const marks = el('div', { class: 'marks', id: 'solid-marks' });
    if (result.hydrateBadge) marks.append(badge('hydrate', C.TEXT.hydrateBadge));
    if (result.lowMass) marks.append(badge('warn', C.TEXT.lowMass));
    box.append(
      el('p', { class: 'result__value', id: 'mass' }, el('span', { class: 'result__num', text: result.massText }), ' g'),
      marks,
      el('p', { class: 'result__formula', text: formulaLine(input, result) })
    );
    if (result.massNote) box.append(el('p', { class: 'result__note', id: 'mg-note', text: result.massNote }));
  }

  // 시약표에서 고른 시약을 고체 조제의 선택 칸에 넣는다.
  function useInSolid(id) {
    const reagent = C.findReagent(id);
    if (!reagent) return;
    const group = $('reagent-school');
    if (!Array.from(group.children).some((option) => option.value === id)) {
      group.append(el('option', { value: id, text: reagent.formula ? `${reagent.korean} (${reagent.formula})` : reagent.korean }));
    }
    group.hidden = false;
    $('reagent').value = id;
    if (reagent.molarMass == null && ($('unit').value === 'M' || $('unit').value === 'mM')) $('unit').value = '% (w/v)';
    showTab('solid');
    renderSolid();
    $('conc').focus();
  }

  /* ---------- 액체 시약 ---------- */

  function liquidOption() {
    return state.liquidOptions[$('liq-reagent').value] || state.liquidOptions[C.CUSTOM_ID];
  }

  function applyLiquidOption() {
    const option = liquidOption();
    const custom = $('liq-reagent').value === C.CUSTOM_ID;
    $('liq-name-field').hidden = !custom;
    $('liq-mm').value = option.molarMass;
    $('liq-percent').value = option.percent;
    $('liq-density').value = option.density;
    $('liq-info').textContent = option.info;
  }

  function readLiquid() {
    const option = liquidOption();
    const custom = $('liq-reagent').value === C.CUSTOM_ID;
    const name = custom ? $('liq-name').value : option.name;
    return {
      name,
      label: custom ? name : option.label,
      formula: option.formula,
      molarMass: $('liq-mm').value,
      percent: $('liq-percent').value,
      density: $('liq-density').value,
      unit: $('liq-unit').value,
      conc: $('liq-conc').value,
      volume: $('liq-volume').value,
      caution: option.caution,
    };
  }

  function renderLiquid() {
    const input = readLiquid();
    if (sameInput('liquid', input)) return;
    const result = C.computeLiquid(input);
    state.liquid = result;
    $('liq-card').dataset.state = result.ok ? 'ok' : 'wait';
    $('btn-liq-add').disabled = !result.ok;

    const box = $('liq-result');
    box.replaceChildren(el('p', { class: 'result__label', text: '취할 부피' }));
    if (!result.ok) {
      box.append(
        el('p', { class: 'result__wait', 'aria-hidden': 'true', text: '— mL' }),
        el('ul', { class: 'hints', id: 'liq-messages' }, result.messages.map((m) => el('li', { text: m })))
      );
      if (result.stockMolarityText) {
        box.append(el('p', { class: 'result__sub', id: 'liq-stock', text: `시약 원액의 농도 ${result.stockMolarityText} M` }));
      }
      return;
    }
    const marks = el('div', { class: 'marks', id: 'liq-marks' });
    if (result.pipetteWarning) marks.append(badge('warn', C.TEXT.pipette));
    box.append(
      el('p', { class: 'result__value', id: 'liq-take' }, el('span', { class: 'result__num', text: result.takeVolumeText }), ' mL'),
      marks,
      el('p', { class: 'result__sub', id: 'liq-stock', text: `시약 원액의 농도 ${result.stockMolarityText} M` }),
      el('p', { class: 'result__sub', id: 'liq-mass', text: `질량으로는 ${result.takeMassText} g` }),
      el('p', {
        class: 'result__formula',
        text: `${input.percent.trim()} ÷ 100 × ${input.density.trim()} g/mL × 1000 ÷ ${input.molarMass.trim()} g/mol = ${result.stockMolarityText} M`,
      })
    );
  }

  // 시약표의 액체 시약을 액체 시약 탭으로 보낸다. 대표값이 있는 산·염기는 그 선택지를 고른다.
  // 시약표의 액체 시약을 고르는 칸에 넣는다. 함량과 밀도는 비워 둔다.
  function registerLiquid(reagent) {
    if (state.liquidOptions[reagent.id]) return;
    state.liquidOptions[reagent.id] = {
      name: reagent.korean,
      label: reagent.korean,
      formula: reagent.formula,
      molarMass: reagent.molarMass == null ? '' : String(reagent.molarMass),
      percent: '',
      density: '',
      caution: false,
      info: '병 라벨에 적힌 함량(%)과 밀도를 입력하세요.',
    };
    const group = $('liq-school');
    group.append(el('option', { value: reagent.id, text: reagent.formula ? `${reagent.korean} (${reagent.formula})` : reagent.korean }));
    group.hidden = false;
  }

  function useInLiquid(id) {
    const reagent = C.findReagent(id);
    if (!reagent) return;
    const glacial = /glacial/i.test(reagent.english || '');
    const presetId = { HCl: 'HCl', H2SO4: 'H2SO4', HNO3: 'HNO3', H3PO4: 'H3PO4', NH4OH: 'NH3', H2O2: 'H2O2' }[reagent.formula] || (glacial ? 'CH3COOH' : '');
    if (presetId) {
      $('liq-reagent').value = presetId;
    } else {
      registerLiquid(reagent);
      $('liq-reagent').value = id;
    }
    applyLiquidOption();
    showTab('liquid');
    renderLiquid();
    $(presetId ? 'liq-conc' : 'liq-percent').focus();
  }

  /* ---------- 희석 ---------- */

  function dilRowNode(conc, volume) {
    const concInput = el('input', { class: 'dil-conc', type: 'text', inputmode: 'decimal' });
    const volumeInput = el('input', { class: 'dil-vol', type: 'text', inputmode: 'decimal' });
    concInput.value = conc || '';
    volumeInput.value = volume || '';
    return el(
      'div',
      { class: 'dil-row' },
      el('span', { class: 'dil-row__no', 'aria-hidden': 'true' }),
      el('div', { class: 'suffix suffix--wide' }, concInput, el('span', { class: 'dil-unit-suffix' })),
      el('div', { class: 'suffix' }, volumeInput, el('span', { text: 'mL' })),
      el('button', { type: 'button', class: 'btn btn--small dil-del', text: '삭제' })
    );
  }

  function addDilRow(conc, volume) {
    const rows = $('dil-rows');
    if (rows.children.length >= C.LIMITS.dilutionRows) return null;
    const row = dilRowNode(conc, volume);
    rows.append(row);
    return row;
  }

  function removeDilRow(row) {
    const rows = $('dil-rows');
    if (rows.children.length <= 1) {
      row.querySelector('.dil-conc').value = '';
      row.querySelector('.dil-vol').value = '';
    } else {
      row.remove();
    }
  }

  function readDilution() {
    return {
      name: $('dil-name').value,
      stock: $('dil-stock').value,
      unit: $('dil-unit').value,
      rows: Array.from($('dil-rows').children, (row) => ({
        conc: row.querySelector('.dil-conc').value,
        volume: row.querySelector('.dil-vol').value,
      })),
    };
  }

  // 예상 흡광도 (SPEC 27장): 용액 이름에 "메틸렌 블루"가 있을 때만 희석표 아래에 보인다.
  function renderAbsorbance(input) {
    if (sameInput('absorbance', { name: input.name, stock: input.stock, unit: input.unit, rows: input.rows })) return;
    const box = $('dil-absorb');
    const info = C.expectedAbsorbance(input.name, C.computeDilution(input));
    box.hidden = !info.show;
    if (!info.show) {
      box.replaceChildren();
      return;
    }
    const parts = [el('strong', { text: '예상 흡광도' })];
    info.rows.forEach((r) => {
      parts.push(' ', el('span', { class: 'absorb__item' }, `${r.concText} ${r.unit} → `, el('strong', { text: r.text })));
      if (r.over) parts.push(' ', badge('warn', C.TEXT.absorbOver));
    });
    parts.push(' ', el('span', { class: 'mark-muted', text: info.note }));
    box.replaceChildren(...parts);
  }

  function renderDilution() {
    const input = readDilution();
    const rowNodes = Array.from($('dil-rows').children);
    // 행 번호와 단위 표시는 행 수나 단위가 바뀔 때만 달라진다. 같은 값이면 건드리지 않는다.
    rowNodes.forEach((row, i) => {
      if (row.dataset.no === `${i + 1}|${input.unit}`) return;
      row.dataset.no = `${i + 1}|${input.unit}`;
      row.querySelector('.dil-row__no').textContent = String(i + 1);
      row.querySelector('.dil-unit-suffix').textContent = input.unit;
      row.querySelector('.dil-conc').setAttribute('aria-label', `${i + 1}행 목표 농도 (${input.unit})`);
      row.querySelector('.dil-vol').setAttribute('aria-label', `${i + 1}행 부피 (mL)`);
      row.querySelector('.dil-del').setAttribute('aria-label', `${i + 1}행 삭제`);
    });
    const full = rowNodes.length >= C.LIMITS.dilutionRows;
    $('btn-add-row').disabled = full;
    setText($('dil-row-note'), full ? `목표 행은 ${C.LIMITS.dilutionRows}행까지입니다.` : '');

    // 예상 흡광도는 용액 이름에 따라 보이므로 이름이 바뀔 때도 다시 본다.
    renderAbsorbance(input);

    // 계산에 들어가는 값(원액 농도, 단위, 행)이 그대로면 결과 표는 다시 그리지 않는다. 용액 이름은 결과 표와 상관없다.
    if (sameInput('dilution', { stock: input.stock, unit: input.unit, rows: input.rows })) return;

    const result = C.computeDilution(input);
    const message = $('dil-message');
    const table = $('dil-table');
    const body = $('dil-result');
    const summary = $('dil-summary');

    const shown = result.ok ? result.rows.filter((r) => r.status !== 'blank') : [];
    if (!result.ok || shown.length === 0) {
      body.replaceChildren();
      message.textContent = result.ok ? '목표 농도와 부피를 넣으면 여기에 결과가 나와요.' : result.message;
      message.hidden = false;
      table.hidden = true;
      summary.hidden = true;
      return;
    }
    message.hidden = true;
    table.hidden = false;

    // 바뀐 행만 갈아 끼운다. 행마다 그린 내용을 글자(data-sig)로 적어 두고, 같으면 그대로 둔다.
    shown.forEach((r, i) => {
      const ok = r.status === 'ok';
      const sig = [r.status, r.concText, r.volumeText, result.unit, ok ? r.stockVolumeText : '', ok ? r.waterVolumeText : '', ok && r.pipetteWarning ? 'w' : ''].join('|');
      const old = body.children[i];
      if (old && old.dataset.sig === sig) return;
      const mark = el('td', { class: 'cell-marks', 'data-label': '표시' });
      if (ok && r.pipetteWarning) mark.append(badge('warn', C.TEXT.pipette));
      else if (r.status === 'too-strong') mark.append(badge('danger', r.message));
      else if (r.status === 'invalid') mark.append(el('span', { class: 'mark-muted', text: '농도와 부피를 0보다 큰 숫자로 입력' }));
      if (!mark.hasChildNodes()) mark.classList.add('cell-empty');
      const node = el(
        'tr',
        { 'data-status': r.status, 'data-sig': sig },
        el('td', { 'data-label': '목표 농도', text: r.concText === '' ? '—' : `${r.concText} ${result.unit}` }),
        el('td', { 'data-label': '부피', text: r.volumeText === '' ? '—' : `${r.volumeText} mL` }),
        el('td', { class: 'cell-strong', 'data-label': '원액 부피', text: ok ? `${r.stockVolumeText} mL` : '—' }),
        el('td', { 'data-label': '증류수 부피', text: ok ? `${r.waterVolumeText} mL` : '—' }),
        mark
      );
      if (old) old.replaceWith(node);
      else body.append(node);
    });
    while (body.children.length > shown.length) body.lastElementChild.remove();

    summary.hidden = !result.hasValid;
    if (!result.hasValid) return;
    $('dil-total').replaceChildren(
      el('span', { class: 'stat__label', text: '원액 총 사용량' }),
      ' ',
      el('strong', { text: `${result.totalText} mL` })
    );
    // 원액을 만들 시약이 너무 적어 저울로 달 수 없으면 진한 원액을 먼저 만들라고 알려 준다 (SPEC 27장).
    $('dil-guide').hidden = !result.stockGuide;
    setText($('dil-guide'), result.stockGuide || '');
    $('dil-flask').hidden = result.overFlask;
    $('dil-over').hidden = !result.overFlask;
    if (result.overFlask) {
      $('dil-over').textContent = C.TEXT.overFlask;
    } else {
      $('dil-flask').replaceChildren(
        el('span', { class: 'stat__label', text: '권장 원액 조제량' }),
        ' ',
        el('strong', { text: `${result.flask} mL` })
      );
    }
  }

  /* ---------- 연속 희석 ---------- */

  function renderSerial() {
    const unit = $('ser-unit').value;
    const input = {
      start: $('ser-start').value,
      unit,
      factor: $('ser-factor').value,
      steps: $('ser-steps').value,
      volume: $('ser-volume').value,
    };
    if (sameInput('serial', input)) return;
    const result = C.computeSerial(input);
    const body = $('ser-result');
    body.replaceChildren();
    $('ser-message').hidden = result.ok;
    $('ser-table').hidden = !result.ok;
    $('ser-summary').hidden = !result.ok;
    if (!result.ok) {
      $('ser-message').textContent = result.message;
      return;
    }
    $('ser-summary').replaceChildren(
      `단계마다 앞 용액 ${result.transferText} mL에 증류수 ${result.diluentText} mL를 더합니다. 마지막 단계는 시작 농도의 1/${result.totalFactorText}입니다.`
    );
    if (result.pipetteWarning) $('ser-summary').append(' ', badge('warn', C.TEXT.pipette));
    for (const r of result.rows) {
      body.append(
        el(
          'tr',
          null,
          el('td', { class: 'cell-name', 'data-label': '단계', text: `${r.step}단계` }),
          el('td', { class: 'cell-strong', 'data-label': '농도', text: `${r.concText} ${unit}` }),
          el('td', { 'data-label': '옮겨 올 용액', text: `${r.from} ${result.transferText} mL` }),
          el('td', { 'data-label': '증류수', text: `${result.diluentText} mL` }),
          el('td', { 'data-label': '남는 부피', text: `${r.leftText} mL` })
        )
      );
    }
  }

  /* ---------- 계산 도구 ---------- */

  // rows: [{ label, value, main }]  message: 계산할 수 없을 때의 안내
  function showResult(id, rows, message, note) {
    fillResult($(id), rows, message, note);
  }

  function fillResult(box, rows, message, note, steps) {
    box.replaceChildren();
    if (message) box.append(el('p', { class: 'hint hint--flat', text: message }));
    if (rows && rows.length) {
      box.append(
        el(
          'dl',
          { class: 'kv' },
          rows.map((row) =>
            el(
              'div',
              { class: row.main ? 'kv__row kv__row--main' : 'kv__row' },
              el('dt', { text: row.label }),
              row.swatch !== undefined ? el('dd', { class: 'kv__color' }, swatch(row.swatch), el('span', { text: row.value })) : el('dd', { text: row.value })
            )
          )
        )
      );
    }
    if (note) box.append(el('p', { class: 'field__warn', text: note }));
    if (steps && steps.length) box.append(el('details', { class: 'steps', open: true }, el('summary', { text: '풀이 과정' }), el('ol', { class: 'recipe__steps' }, steps.map((step) => el('li', { text: step })))));
  }

  function renderConvert() {
    const unit = $('cv-unit').value;
    const result = C.convertConcentration({ value: $('cv-value').value, unit, molarMass: $('cv-mm').value });
    if (!result.ok) {
      showResult('cv-result', null, result.message);
      return;
    }
    const rows = C.CONVERT_UNITS.filter((u) => result.values[u] !== '').map((u) => ({
      label: u === unit ? `${u} (입력)` : u,
      value: `${result.values[u]} ${u}`,
      main: u !== unit,
    }));
    showResult('cv-result', rows, '', result.message);
  }

  function renderTitration() {
    const result = C.computeTitration({
      n1: $('ti-n1').value,
      c1: $('ti-c1').value,
      v1: $('ti-v1').value,
      n2: $('ti-n2').value,
      v2: $('ti-v2').value,
    });
    if (!result.ok) {
      showResult('ti-result', null, result.message);
      return;
    }
    showResult('ti-result', [
      { label: '모르는 용액의 농도', value: `${result.c2Text} M`, main: true },
      { label: '중화에 쓰인 H⁺ 또는 OH⁻', value: `${result.molesText} mol` },
    ]);
  }

  function applySolvent() {
    const solvent = C.SOLVENTS.find((s) => s.id === $('co-solvent').value);
    if (!solvent) {
      // 직접 입력: 칸을 고칠 때 저절로 고르는 경우가 아니면(사람이 고른 경우) 첫 칸으로 옮겨 간다
      if (document.activeElement === $('co-solvent')) $('co-kf').focus();
      return;
    }
    $('co-kf').value = String(solvent.kf);
    $('co-kb').value = String(solvent.kb);
    $('co-fp').value = String(solvent.fp);
    $('co-bp').value = String(solvent.bp);
  }

  function renderColligative() {
    const result = C.computeColligative({
      soluteMass: $('co-mass').value,
      molarMass: $('co-mm').value,
      solventMass: $('co-solvent-mass').value,
      i: $('co-i').value,
      kf: $('co-kf').value,
      kb: $('co-kb').value,
      fp: $('co-fp').value,
      bp: $('co-bp').value,
    });
    if (!result.ok) {
      showResult('co-result', null, result.message);
      return;
    }
    showResult(
      'co-result',
      [
        { label: '몰랄 농도', value: `${result.molalityText} m` },
        { label: '어는점 내림 ΔTf', value: `${result.dTfText} °C` },
        { label: '예상 어는점', value: `${result.freezingText} °C`, main: true },
        { label: '끓는점 오름 ΔTb', value: `${result.dTbText} °C` },
        { label: '예상 끓는점', value: `${result.boilingText} °C`, main: true },
      ],
      '',
      ''
    );
  }

  function renderPH() {
    const result = C.computePH({ kind: $('ph-kind').value, conc: $('ph-conc').value, n: $('ph-n').value });
    if (!result.ok) {
      showResult('ph-result', null, result.message);
      return;
    }
    showResult(
      'ph-result',
      [
        { label: 'pH', value: result.pHText, main: true },
        { label: 'pOH', value: result.pOHText },
        { label: result.kind === 'acid' ? '[H⁺]' : '[OH⁻]', value: `${result.ionText} M` },
      ],
      '',
      result.note
    );
  }

  /* ---------- 시약표 ---------- */

  function reagentNode(r) {
    const note = C.sourceNote(r);
    return el(
      'li',
      { class: 'rg-item' },
      el(
        'div',
        { class: 'rg-main' },
        el('p', { class: 'rg-name' }, el('strong', { text: r.korean }), r.formula ? el('span', { class: 'rg-f' }, formula(r.formula)) : null),
        el('p', { class: 'rg-en', text: r.english })
      ),
      el(
        'div',
        { class: 'rg-meta' },
        el('span', { class: 'rg-mm', text: r.molarMass == null ? '분자량 없음' : `${r.molarMass.toFixed(2)} g/mol` }),
        r.hydrate ? badge('hydrate', '수화물') : null,
        r.liquid ? el('span', { class: 'tag', text: '액체' }) : null,
        r.added ? el('span', { class: 'tag tag--added', title: '학교 시약표에 없어 자주 쓰는 시약으로 더한 것', text: '더한 시약' }) : null,
        note ? el('span', { class: 'rg-note', text: note }) : null,
        ghsLine(r)
      ),
      el(
        'div',
        { class: 'rg-actions' },
        el('button', { type: 'button', class: 'btn btn--small', 'data-use': 'solid', 'data-id': r.id, text: '고체 조제' }),
        r.liquid && r.molarMass != null
          ? el('button', { type: 'button', class: 'btn btn--small', 'data-use': 'liquid', 'data-id': r.id, text: '액체 시약' })
          : null
      )
    );
  }

  // 시약의 GHS 그림 문자를 낱말 칩으로. 정보가 없으면 아무것도 그리지 않는다.
  function ghsLine(r) {
    if (!r || r.ghs == null) return null;
    if (!r.ghs.length) return el('p', { class: 'rg-ghs rg-ghs--none', text: 'GHS 분류에 해당하지 않아요' });
    return el(
      'p',
      { class: 'rg-ghs', 'aria-label': `GHS ${r.signal === 'D' ? '위험' : r.signal === 'W' ? '경고' : ''} ${r.ghs.map((g) => C.GHS_NAMES[g]).join(', ')}` },
      r.signal ? el('span', { class: `ghs-sig ghs-sig--${r.signal === 'D' ? 'danger' : 'warn'}`, text: r.signal === 'D' ? '위험' : '경고' }) : null,
      ...r.ghs.map((g) => el('span', { class: `ghs ghs--${g}`, text: C.GHS_NAMES[g] }))
    );
  }

  // 시약표에서 찾기. 검색 화면과 시약표 화면이 같은 방법을 쓴다 (꼭 맞는 것부터, 같은 뜻의 말로도).
  function findReagents(query, filter) {
    const all = C.searchReagents('', filter === 'all' ? '' : filter);
    if (!String(query || '').trim()) return all;
    return S ? S.reagents(query, all) : C.searchReagents(query, filter === 'all' ? '' : filter);
  }

  function renderReagents() {
    const results = findReagents($('rg-query').value, $('rg-filter').value);
    const shown = results.slice(0, state.shown);
    $('rg-count').textContent = `${results.length}종 / 전체 ${C.SCHOOL_COUNT}종`;
    $('rg-list').replaceChildren(...shown.map(reagentNode));
    $('rg-empty').hidden = results.length > 0;
    const left = results.length - shown.length;
    $('rg-more').hidden = left <= 0;
    $('rg-more').textContent = `더 보기 (${left}종 남음)`;
  }

  /* ---------- 실험 계산 모음: labcalc.js의 계산 하나를 입력 칸과 결과로 그린다 ---------- */

  // 음수나 지수(1.8e-5)를 적을 수 있어야 하는 칸인가
  function signedField(input) {
    const text = `${input.label || ''} ${input.unit || ''} ${input.value || ''} ${input.placeholder || ''}`;
    return /°C|kJ|J\/mol|E°|전위|엔탈피|ΔH|어는점|끓는점|\bK[abp]?\b|Ka|Kb|Ksp|pKa|상수|e-\d|^-|\s-\d/.test(text) || /(^|\s)V(\s|$)/.test(input.unit || '');
  }

  function calcForm(calc, prefix, bare, onResult) {
    const form = el('form', { class: 'calc', id: `${prefix}-${calc.id}`, autocomplete: 'off', novalidate: true });
    const fields = el('div', { class: 'calc__fields' });
    const result = el('div', { class: 'tool__result', 'aria-live': 'polite' });
    const controls = {};
    for (const input of calc.inputs) {
      const id = `${prefix}-${calc.id}-${input.id}`;
      let control;
      let readout = null;
      if (input.type === 'select' || input.type === 'preset') {
        control = el('select', { id }, input.options.map(([value, label]) => el('option', { value, text: label })));
        if (input.value != null) control.value = input.value;
      } else if (input.type === 'range') {
        control = el('input', { id, type: 'range', min: String(input.min), max: String(input.max), step: String(input.step) });
        control.value = input.value;
        readout = el('output', { class: 'range__value', for: id });
        const show = () => {
          readout.textContent = `${input.label} ${Number(control.value).toFixed(1)}`;
        };
        control.addEventListener('input', show);
        show();
      } else {
        control = el('input', {
          id,
          type: 'text',
          // 휴대폰의 숫자 자판(decimal)에는 빼기(−)와 e가 없다. 온도·전위·열·K처럼 음수나 1.8e-5를 적는 칸은 일반 자판을 띄운다.
          inputmode: input.type === 'list' || signedField(input) ? 'text' : 'decimal',
          enterkeyhint: 'done',
          placeholder: input.placeholder ? `예: ${input.placeholder}` : null,
        });
        control.value = input.value || '';
      }
      controls[input.id] = control;
      const body = readout
        ? el('div', { class: 'range' }, control, readout)
        : input.unit
          ? el('div', { class: input.unit.length > 5 ? 'suffix suffix--long' : 'suffix suffix--wide' }, control, el('span', { text: input.unit }))
          : control;
      fields.append(el('div', { class: input.type === 'list' || readout ? 'field field--wide' : 'field' }, el('label', { for: id, text: input.label }), body));
      if (input.type === 'preset') {
        control.addEventListener('change', () => {
          const fills = input.fills[control.value];
          if (fills) {
            for (const [key, value] of Object.entries(fills)) controls[key].value = value;
            return;
          }
          // 직접 입력: 미리 채워 둔 값을 비우고 첫 칸으로 옮겨 가 바로 적게 한다
          const keys = [...new Set(Object.values(input.fills).flatMap((f) => Object.keys(f)))].filter((key) => controls[key] && controls[key].tagName === 'INPUT');
          for (const key of keys) controls[key].value = '';
          if (keys.length) controls[keys[0]].focus();
        });
      }
    }
    const update = () => {
      const values = {};
      for (const key of Object.keys(controls)) values[key] = controls[key].value;
      const r = calc.compute(values);
      fillResult(result, r.ok ? r.rows : null, r.ok ? '' : r.message, r.ok ? r.note : '', r.ok ? r.steps : null);
      if (onResult) onResult(r, values);
    };
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', (event) => event.preventDefault());
    if (bare) form.append(fields, result);
    else form.append(el('h3', { class: 'calc__title', text: calc.title }), el('p', { class: 'field__hint', text: calc.hint }), fields, result);
    update();
    return form;
  }

  /* ---------- 실험 ---------- */

  function renderLabList() {
    const unit = $('lab-unit').value;
    const raw = $('lab-query').value.trim();
    const inCat = (e, name) => !name || e.unit === name;
    // 찾기 칸에 친 말은 검색(search.js)으로 견준다. 잘 맞는 실험부터 나온다.
    const hits = raw && S ? S.search(raw, searchIndex()).results.filter((r) => r.doc.type === 'lab').map((r) => r.doc.id) : null;
    const inQuery = (e) => !raw || (hits ? hits.includes(e.id) : flat(`${e.title} ${e.concept} ${e.unit}`).includes(flat(raw)));
    const items = B.EXPERIMENTS.filter((e) => inCat(e, unit) && inQuery(e));
    if (hits) items.sort((a, b) => hits.indexOf(a.id) - hits.indexOf(b.id));
    $('lab-count').textContent = `${items.length}개 / 전체 ${B.EXPERIMENTS.length}개`;
    $('lab-list').replaceChildren(
      ...items.map((e) =>
        el(
          'li',
          null,
          el(
            'button',
            { type: 'button', class: `lab-item lab-item--thumb unit-${unitIndex(e.unit)}`, 'data-lab': e.id },
            el('span', { class: 'lab-item__thumb' }, unitMark(e.unit)),
            el(
              'span',
              { class: 'lab-item__body' },
              el('span', { class: 'lab-item__unit', text: e.unit }),
              el('strong', { class: 'lab-item__title', text: e.title }),
              e.colors ? el('span', { class: 'lab-item__colors' }, el('span', { class: 'visually-hidden', text: '색 변화: ' }), colorSteps(e.colors, false)) : null
            )
          )
        )
      )
    );
    $('lab-list').hidden = items.length === 0;
    $('lab-empty').hidden = items.length > 0;
    const catItem = (name, label) =>
      el(
        'li',
        null,
        el(
          'button',
          { type: 'button', class: 'lnb__item', 'data-cat': name, 'aria-current': name === unit ? 'true' : null },
          el('span', { text: label }),
          el('span', { class: 'lnb__count', text: String(B.EXPERIMENTS.filter((e) => inCat(e, name) && inQuery(e)).length) })
        )
      );
    $('lab-cats').replaceChildren(...[''].concat(B.UNITS).map((name) => catItem(name, name || '전체')));
    $('lab-everywhere').hidden = !raw || !available('search');
    $('lab-everywhere').textContent = `'${raw}' 계산·준비물·시약에서도 찾기`;
  }

  function reagentRow(spec, groups) {
    const prep = L.prepareReagent(spec, groups);
    const canAdd = Boolean(prep.result && prep.result.ok);
    return el(
      'tr',
      null,
      el('td', { class: 'cell-name', 'data-label': '시약' }, prep.name, prep.formula ? el('small', { class: 'cell-sub' }, formula(prep.formula)) : null),
      el('td', { 'data-label': '만들 용액', class: prep.target ? null : 'cell-empty', text: prep.target }),
      el('td', { class: 'cell-strong', 'data-label': '필요한 양', text: prep.amount }),
      el(
        'td',
        { class: canAdd ? 'cell-action' : 'cell-action cell-empty' },
        canAdd ? el('button', { type: 'button', class: 'btn btn--small', text: '목록에 추가', onclick: () => addItem(prep.result, 'lab-note') }) : null
      )
    );
  }

  // 간편 준비: 계산되는 시약을 한 번에 조제 목록에 넣는다.
  function addAllReagents(lab, groups) {
    let added = 0;
    let skipped = 0;
    for (const spec of lab.reagents) {
      const prep = L.prepareReagent(spec, groups);
      if (!prep.result || !prep.result.ok) continue;
      if (state.list.length >= C.LIMITS.listRows) {
        skipped += 1;
        continue;
      }
      state.list.push(prep.result.item);
      added += 1;
    }
    renderList();
    renderRecipe();
    flash(
      'lab-note',
      skipped
        ? `시약 ${added}개를 넣었습니다. 조제 목록이 가득 차 ${skipped}개는 넣지 못했습니다.`
        : `시약 ${added}개를 조제 목록에 넣었습니다 (${state.list.length} / ${C.LIMITS.listRows}). 레시피·라벨에서 라벨을 만들 수 있습니다.`
    );
  }

  function checkItem(text) {
    return el('li', null, el('label', { class: 'check' }, el('input', { type: 'checkbox' }), el('span', { text })));
  }

  function showLab(id, keep, from) {
    const lab = B.EXPERIMENTS.find((e) => e.id === id);
    if (!lab) return;
    if (!keep) state.lab = { id, quick: false, groups: 1, from: from || 'labs' };
    const { quick, groups } = state.lab;
    const heading = (text) => el('h3', { class: 'lab-h', text });
    const backTo = state.lab.from;
    const head = [
      el('button', { type: 'button', class: 'link-btn', id: 'lab-back', text: `← ${backTo === 'labs' ? '실험 목록' : PAGES[backTo]}`, onclick: () => backFromLab() }),
      el('p', { class: 'lab-item__unit', text: lab.unit }),
      el('h2', { class: 'lab-detail__title', id: 'lab-title', text: lab.title }),
      el('p', { text: lab.concept }),
      lab.colors
        ? el('p', { class: 'color-change', id: 'lab-colors' }, el('strong', { class: 'color-change__label', text: '색 변화' }), colorSteps(lab.colors, true), el('span', { class: 'color-change__note', text: lab.colors.note }))
        : null,
      el(
        'div',
        { class: 'mode-bar' },
        el('button', {
          type: 'button',
          class: quick ? 'btn' : 'btn btn--primary',
          id: 'lab-quick-btn',
          text: quick ? '자세히 보기' : '간편 준비',
          onclick: () => {
            state.lab.quick = !state.lab.quick;
            showLab(id, true);
          },
        }),
        available('theory') && TH.find(id) ? el('button', { type: 'button', class: 'btn', id: 'lab-theory-btn', text: '이론값 계산', onclick: () => openTheory(id) }) : null,
        available('curve') && LAB_CURVE[id] ? el('button', { type: 'button', class: 'btn', id: 'lab-curve-btn', text: '적정 곡선', onclick: () => openCurve(LAB_CURVE[id]) }) : null,
        available('prep') ? el('button', { type: 'button', class: 'btn', id: 'lab-prep-btn', text: '준비표에 담기', onclick: () => openPrep(id) }) : null,
        available('plan') ? el('button', { type: 'button', class: 'btn', id: 'lab-plan-btn', text: '계획서 만들기', onclick: () => openPlan(id) }) : null,
        el('span', { class: 'field__hint', text: quick ? '준비물과 시약을 체크리스트 한 장에 모았어요.' : '준비물이 많으면 눌러 보세요. 체크리스트로 바뀌고 시약을 한 번에 담을 수 있어요.' })
      ),
    ];
    const cautions = [heading('주의'), el('ul', { class: 'safety-list' }, lab.caution.map((c) => el('li', { text: c })))];
    if (available('waste')) {
      cautions.push(
        heading('폐액'),
        el('ul', { class: 'safety-list waste-lines', id: 'lab-waste' }, W.labLines(lab, C).map((line) => el('li', { text: line }))),
        el('button', { type: 'button', class: 'btn btn--small', id: 'lab-waste-btn', text: '폐액 버리기에서 자세히', onclick: () => openWaste(id) })
      );
    }
    let body;
    if (quick) {
      const groupInput = el('input', { id: 'lab-groups', type: 'text', inputmode: 'numeric' });
      groupInput.value = String(groups);
      groupInput.addEventListener('change', () => {
        const n = Math.round(C.parseNumber(groupInput.value));
        state.lab.groups = n >= 1 && n <= 12 ? n : 1;
        showLab(id, true);
      });
      body = [
        el(
          'div',
          { class: 'quick-bar' },
          el('div', { class: 'field' }, el('label', { for: 'lab-groups', text: '조 수 (1~12)' }), el('div', { class: 'suffix' }, groupInput, el('span', { text: '조' }))),
          el('button', { type: 'button', class: 'btn btn--primary', id: 'lab-add-all', text: '시약 모두 목록에 추가', onclick: () => addAllReagents(lab, state.lab.groups) })
        ),
        el('p', { class: 'note', id: 'lab-note', role: 'status' }),
        heading('준비 체크리스트'),
        el(
          'ul',
          { class: 'checklist', id: 'lab-checklist' },
          lab.materials.map(checkItem),
          lab.reagents.map((spec) => {
            const prep = L.prepareReagent(spec, groups);
            return checkItem([prep.name, prep.target, prep.amount].filter(Boolean).join(' — '));
          })
        ),
        heading('핵심 과정'),
        el('ol', { class: 'recipe__steps' }, lab.steps.map((step) => el('li', { text: step }))),
        ...cautions,
      ];
    } else {
      const calcs = lab.calcs.map((calcId) => L.find(calcId)).filter(Boolean);
      body = [
        heading('준비물'),
        el('ul', { class: 'chips' }, lab.materials.map((m) => el('li', { text: m }))),
        heading('시약 준비'),
        el(
          'table',
          { class: 'table', id: 'lab-reagents' },
          el('thead', null, el('tr', null, ['시약', '만들 용액', '필요한 양', ''].map((t) => el('th', { scope: 'col', text: t })))),
          el('tbody', null, lab.reagents.map((spec) => reagentRow(spec, 1)))
        ),
        el('p', { class: 'note', id: 'lab-note', role: 'status' }),
        heading('실험 과정'),
        el('ol', { class: 'recipe__steps' }, lab.steps.map((step) => el('li', { text: step }))),
        calcs.length ? heading('계산') : null,
        calcs.length ? el('div', { class: 'lab-calcs' }, calcs.map((calc) => calcForm(calc, 'lab'))) : null,
        ...cautions,
        heading('결과 정리'),
        el('p', { text: lab.wrap }),
      ];
    }
    $('lab-detail').replaceChildren(...head.filter(Boolean), ...body.filter(Boolean));
    $('lab-index').hidden = true;
    $('lab-detail').hidden = false;
    if (currentPage === 'labs') markSub(state.lab.from);
    if (!keep) {
      window.scrollTo(0, 0);
      $('lab-back').focus();
    }
  }

  function closeLab() {
    $('lab-detail').hidden = true;
    $('lab-index').hidden = false;
    markSub(currentPage);
  }

  // 상세의 [← …]: 연 곳으로 돌아간다.
  function backFromLab() {
    const from = state.lab.from || 'labs';
    closeLab();
    if (from !== 'labs') navigate(from);
  }

  /* ---------- 색이 변하는 실험 ---------- */

  function colorCard(lab) {
    const band = el('span', { class: 'color-card__band', 'aria-hidden': 'true' });
    band.style.setProperty('--g', `linear-gradient(90deg, ${lab.colors.steps.map((step) => step[1]).join(', ')})`);
    return el(
      'li',
      null,
      el(
        'button',
        { type: 'button', class: `color-card unit-${unitIndex(lab.unit)}`, 'data-lab': lab.id },
        band,
        el('span', { class: 'color-card__unit', text: lab.unit }),
        el('strong', { class: 'color-card__title', text: lab.title }),
        el('span', { class: 'color-card__steps' }, colorSteps(lab.colors, true)),
        el('span', { class: 'color-card__note', text: lab.colors.note })
      )
    );
  }

  // 종류를 고르는 알약 버튼 (색이 변하는 실험의 단원, 준비물의 종류)
  function filterChip(attr, value, text, count, current) {
    return el('button', { type: 'button', class: 'filter-chip', [attr]: value, 'aria-pressed': value === current ? 'true' : 'false' }, el('span', { text }), el('span', { class: 'filter-chip__count', text: String(count) }));
  }

  function renderColors() {
    const colored = B.EXPERIMENTS.filter((e) => e.colors);
    const unit = state.colorUnit;
    const shown = colored.filter((e) => !unit || e.unit === unit);
    $('colors-count').textContent = `${colored.length}개`;
    $('colors-units').replaceChildren(
      filterChip('data-color-unit', '', '전체', colored.length, unit),
      ...B.UNITS.filter((u) => colored.some((e) => e.unit === u)).map((u) => filterChip('data-color-unit', u, u, colored.filter((e) => e.unit === u).length, unit))
    );
    $('colors-list').replaceChildren(...shown.map(colorCard));
  }

  /* ---------- 준비물 ---------- */

  const GEAR_ICONS = {
    glass: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7.5 15h9',
    measure: 'M4 17a8 8 0 0 1 16 0M12 17l4-5M6.5 13.5l1 .6M12 9v1.2M17.5 13.5l-1 .6M3 17h18',
    heat: 'M12 3c1 3 4.5 4.5 4.5 9a4.5 4.5 0 0 1-9 0c0-2 1-3 2-4 0 2 1 3 2.5 3 0-3-1-5.5.5-8zM6 21h12',
    electric: 'M13 2L5 13h6l-1 9 8-11h-6l1-9z',
    etc: 'M4 8l8-4 8 4-8 4-8-4zM4 8v8l8 4 8-4V8M12 12v8',
    safety: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zM9 12l2 2 4-4',
  };

  // 준비물 찾기 칸: 검색(search.js)으로 이름·종류·설명을 견주고(오타도 고쳐 준다), 사용법 글은 그대로 찾는다.
  function gearMatches(raw) {
    if (!raw) return null;
    const hits = S ? S.search(raw, searchIndex()).results.filter((r) => r.doc.type === 'gear').map((r) => r.doc.id) : [];
    const words = raw.split(/\s+/).filter(Boolean).map(flat);
    for (const g of B.EQUIPMENT) {
      if (hits.includes(g.id)) continue;
      const text = flat(`${g.name} ${g.desc} ${(g.how || []).join(' ')} ${g.warn || ''}`);
      if (words.every((w) => text.includes(w))) hits.push(g.id);
    }
    return hits;
  }

  function renderGear() {
    const use = B.gearUse();
    const cat = state.gearCat;
    const raw = $('gear-query').value.trim();
    const hits = gearMatches(raw);
    const howOnly = state.gearHowOnly;
    const order = B.GEAR_CATS.map(([value]) => value);
    const score = (g) => (g.adv ? 0 : 100) + use[g.id].length + (g.better || []).length / 10;
    // 종류 차례대로, 같은 종류 안에서는 많이 쓰는 기구부터, 심화 기구는 뒤에
    const all = B.EQUIPMENT.slice().sort((a, b) => order.indexOf(a.cat) - order.indexOf(b.cat) || score(b) - score(a));
    const items = all.filter((g) => (!hits || hits.includes(g.id)) && (!howOnly || (g.how && g.how.length)));
    if (hits) items.sort((a, b) => hits.indexOf(a.id) - hits.indexOf(b.id)); // 찾을 때는 잘 맞는 기구부터
    const shown = items.filter((g) => !cat || g.cat === cat);
    $('gear-cats').replaceChildren(
      filterChip('data-gear-cat', '', '전체', items.length, cat),
      ...B.GEAR_CATS.map(([value, text]) => filterChip('data-gear-cat', value, text, items.filter((g) => g.cat === value).length, cat))
    );
    $('gear-how-only').setAttribute('aria-pressed', howOnly ? 'true' : 'false');
    $('gear-how-count').textContent = String(B.EQUIPMENT.filter((g) => (!hits || hits.includes(g.id)) && g.how && g.how.length).length);
    const title = (id) => B.EXPERIMENTS.find((e) => e.id === id).title;
    $('gear-list').replaceChildren(
      ...shown.map((g) => {
        const labs = use[g.id];
        const better = labs.length ? [] : g.better || [];
        const open = Boolean(state.gearOpen[g.id]);
        const howOpen = Boolean(state.gearHowOpen[g.id]);
        const list = labs.length ? labs : better;
        let foot;
        if (labs.length) foot = el('button', { type: 'button', class: 'gear-card__toggle', 'data-more': g.id, 'aria-expanded': open ? 'true' : 'false', text: `실험 ${labs.length}개에서 써요` });
        else if (g.always) foot = el('span', { class: 'gear-card__always', text: '모든 실험에서 기본으로 챙겨요' });
        else if (better.length) foot = el('button', { type: 'button', class: 'gear-card__toggle', 'data-more': g.id, 'aria-expanded': open ? 'true' : 'false', text: `있으면 더 정확한 실험 ${better.length}개` });
        else if (g.facility) foot = el('span', { class: 'gear-card__always', text: '실험실 설비라 자리를 미리 알아 둬요' });
        else foot = el('span', { class: 'gear-card__always', text: '33개 실험 밖의 심화 탐구에서 써요' });
        return el(
          'li',
          { class: `gear-card gear-card--${g.cat}${g.adv ? ' gear-card--adv' : ''}${(open && list.length) || (howOpen && g.how) ? ' gear-card--open' : ''}`, 'data-gear': g.id },
          el(
            'span',
            { class: 'gear-card__top' },
            el('span', { class: 'gear-card__icon' }, icon(GEAR_ICONS[g.cat])),
            el('span', { class: 'gear-card__cat', text: B.GEAR_CATS.find(([value]) => value === g.cat)[1] }),
            g.adv ? el('span', { class: 'gear-card__adv', text: g.facility ? '설비' : '심화' }) : null
          ),
          el('strong', { class: 'gear-card__name', text: g.name }),
          el('span', { class: 'gear-card__desc', text: g.desc }),
          el(
            'span',
            { class: 'gear-card__foot' },
            foot,
            g.how && g.how.length ? el('button', { type: 'button', class: 'gear-card__toggle gear-card__how-btn', 'data-how': g.id, 'aria-expanded': howOpen ? 'true' : 'false', text: '사용법' }) : null
          ),
          open && list.length ? el('span', { class: 'gear-card__labs' }, list.map((id) => el('button', { type: 'button', class: 'gear-lab', 'data-lab': id, text: title(id) }))) : null,
          howOpen && g.how
            ? el(
                'div',
                { class: 'gear-how' },
                el('ol', { class: 'gear-how__steps' }, g.how.map((step) => el('li', { text: step }))),
                g.warn ? el('p', { class: 'gear-how__warn', text: g.warn }) : null
              )
            : null
        );
      })
    );
    $('gear-count').textContent = raw || howOnly ? `${shown.length}가지 / 전체 ${B.EQUIPMENT.length}가지` : `${shown.length}가지`;
    $('gear-list').hidden = shown.length === 0;
    $('gear-empty').hidden = shown.length > 0;
    $('gear-empty').textContent = raw ? `'${raw}'에 맞는 기구가 ${cat ? '이 종류에는 ' : ''}없어요. 짧게 줄이거나 다른 말로 찾아보세요.` : '이 종류에는 사용법이 적힌 기구가 없어요.';
  }

  /* ---------- 이론값 계산: 실험을 고르고 넣을 양을 적으면 나와야 할 값을 보여 준다 ---------- */

  function theoryLabs() {
    return B.EXPERIMENTS.filter((e) => TH.find(e.id));
  }

  function renderCompare() {
    const primary = state.theoryValue;
    $('theory-compare').hidden = !primary;
    if (!primary) return;
    $('theory-compare-label').textContent = `실제로 잰 값 (${primary.label})`;
    $('theory-compare-unit').textContent = primary.unit;
    $('theory-compare-unit').hidden = !primary.unit;
    const measured = C.parseNumber($('theory-measured').value);
    const error = TH.percentError(measured, primary.value);
    const out = $('theory-compare-out');
    if ($('theory-measured').value.trim() === '') out.textContent = '실험이 끝나면 잰 값을 넣어 보세요. 이론값과 얼마나 다른지 알려 줘요.';
    else if (Number.isNaN(error)) out.textContent = '숫자로 입력하세요.';
    else out.textContent = `이론값 ${C.formatSig(primary.value, 4)}${primary.unit ? ` ${primary.unit}` : ''}보다 ${C.formatSig(Math.abs(error), 3)} % ${error >= 0 ? '커요' : '작아요'}. (오차율 ${error >= 0 ? '+' : '−'}${C.formatSig(Math.abs(error), 3)} %)`;
  }

  function pickTheory(id) {
    const labs = theoryLabs();
    const lab = labs.find((e) => e.id === id) || labs[0];
    const model = TH.find(lab.id);
    state.theory = lab.id;
    const head = $('theory-head');
    head.style.setProperty('--g', String(UNIT_HUE[unitIndex(lab.unit)]));
    head.replaceChildren(
      el('span', { class: 'tool-tag', text: lab.unit }),
      el('h2', { class: 'tool-head__title', id: 'theory-title', text: lab.title }),
      el('p', { class: 'tool-formula' }, el('span', { class: 'tool-formula__label', text: /[→⇌]/.test(model.equation) ? '반응' : '식' }), el('span', { class: 'tool-formula__text' }, formula(model.equation))),
      el('div', { class: 'tool-labs' }, el('span', { class: 'tool-labs__label', text: '넣을 양을 바꿔 가며 미리 계산해 보세요.' }), el('button', { type: 'button', class: 'gear-lab', 'data-lab': lab.id, text: '실험 과정 보기' }))
    );
    $('theory-measured').value = '';
    $('theory-box').replaceChildren(
      calcForm({ id: lab.id, title: lab.title, hint: model.equation, inputs: model.inputs, compute: model.compute }, 'th', true, (r, values) => {
        state.theoryValue = r.ok && r.primary ? r.primary : null;
        state.theoryValues = values;
        renderCompare();
      })
    );
    for (const button of document.querySelectorAll('[data-theory]')) {
      if (button.dataset.theory === lab.id) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
    $('theory-pick').value = lab.id;
  }

  function openTheory(id) {
    ensureDrawn('theory');
    pickTheory(id);
    navigate('theory');
  }

  function setupTheory() {
    const labs = theoryLabs();
    const units = B.UNITS.filter((unit) => labs.some((e) => e.unit === unit));
    $('theory-count').textContent = `${labs.length}개`;
    const rest = B.EXPERIMENTS.length - labs.length;
    if (rest > 0) $('theory-note').textContent += ` 색 변화만 보는 실험처럼 숫자로 미리 알기 어려운 실험 ${rest}개는 여기에 없어요.`;
    $('theory-nav').replaceChildren(
      ...units.map((unit) => {
        const box = el(
          'div',
          { class: 'tool-group' },
          el('h3', { class: 'tool-group__name' }, el('span', { class: 'tool-dot', 'aria-hidden': 'true' }), unit),
          el('ul', { class: 'lnb' }, labs.filter((e) => e.unit === unit).map((e) => el('li', null, el('button', { type: 'button', class: 'lnb__item', 'data-theory': e.id, text: e.title }))))
        );
        box.style.setProperty('--g', String(UNIT_HUE[unitIndex(unit)]));
        return box;
      })
    );
    $('theory-pick').replaceChildren(...units.map((unit) => el('optgroup', { label: unit }, labs.filter((e) => e.unit === unit).map((e) => el('option', { value: e.id, text: e.title })))));
    $('theory-nav').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-theory]');
      if (!button) return;
      pickTheory(button.dataset.theory);
      if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches) $('theory-head').scrollIntoView();
    });
    $('theory-pick').addEventListener('change', () => pickTheory($('theory-pick').value));
    $('theory-measured').addEventListener('input', renderCompare);
    $('theory-compare').addEventListener('submit', (event) => event.preventDefault());
    $('theory-report').addEventListener('click', () => openReport(state.theory, state.theoryValues));
    pickTheory(state.theory);
  }

  /* ---------- 적정 곡선: 넣은 부피에 따른 pH를 그리고, 지시약이 맞는지 따진다 (SPEC 22장) ---------- */

  const SVG_NS = 'http://www.w3.org/2000/svg';
  // 그래프의 크기와 여백 (viewBox의 단위). 좁은 화면에서는 글자가 작아지지 않게 그림을 좁게 그린다.
  const PLOT_WIDE = { w: 640, h: 390, l: 44, r: 16, t: 30, b: 44 };
  const PLOT_NARROW = { w: 300, h: 300, l: 28, r: 10, t: 26, b: 40 };
  const NARROW = '(max-width: 520px)';
  let PLOT = PLOT_WIDE;

  function svg(tag, attrs, ...children) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value == null || value === false) continue;
      if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value);
    }
    for (const child of children.flat()) if (child) node.append(child);
    return node;
  }

  // 적양배추 즙처럼 어림값인 것은 뺀다.
  const curveIndicators = () => L.INDICATORS.filter((indicator) => !indicator.rough);
  const plotX = (v, limit) => PLOT.l + (v / limit) * (PLOT.w - PLOT.l - PLOT.r);
  const plotY = (ph) => PLOT.t + ((14 - Math.min(14, Math.max(0, ph))) / 14) * (PLOT.h - PLOT.t - PLOT.b);

  function readCurve() {
    const kind = CU.findKind($('cu-kind').value) || CU.KINDS[0];
    return {
      kind: kind.id,
      c0: C.parseNumber($('cu-c0').value),
      v0: C.parseNumber($('cu-v0').value),
      ct: C.parseNumber($('cu-ct').value),
      k: kind.weak ? C.parseNumber($('cu-k').value) * 1e-5 : NaN,
    };
  }

  function drawCurve(p, indicator, limit, info) {
    const right = PLOT.w - PLOT.r;
    const bottom = PLOT.h - PLOT.b;
    const x = (v) => plotX(v, limit);
    const acid = info.kind.analyte === 'acid';
    const defs = svg('defs');
    const bands = [];
    // 지시약의 변색 범위: 가로 띠. 아래쪽(낮은 pH)의 색에서 위쪽(높은 pH)의 색으로 이어진다.
    CU.ranges(indicator).forEach(([lo, hi], i) => {
      const low = L.indicatorColor(indicator, lo).color;
      const high = L.indicatorColor(indicator, hi).color;
      const id = `cu-band-${i}`;
      defs.append(
        svg(
          'linearGradient',
          { id, x1: '0', y1: '1', x2: '0', y2: '0' },
          svg('stop', { offset: '0', 'stop-color': low || high, 'stop-opacity': low ? '0.5' : '0.06' }),
          svg('stop', { offset: '1', 'stop-color': high || low, 'stop-opacity': high ? '0.5' : '0.06' })
        )
      );
      bands.push(svg('rect', { class: 'cu-band', x: PLOT.l, y: plotY(hi), width: right - PLOT.l, height: plotY(lo) - plotY(hi), fill: `url(#${id})` }));
      // 이름표는 곡선이 지나가지 않는 쪽에 둔다 (산에 염기를 넣으면 왼쪽 위가 비어 있다).
      bands.push(svg('text', { class: 'cu-label', x: acid ? PLOT.l + 8 : right - 8, y: plotY(hi) - 6, 'text-anchor': acid ? 'start' : 'end', text: `${indicator.name} ${lo.toFixed(1)}~${hi.toFixed(1)}` }));
    });
    const grid = [];
    for (let ph = 0; ph <= 14; ph += 2) {
      grid.push(svg('line', { class: ph === 7 ? 'cu-grid cu-grid--mid' : 'cu-grid', x1: PLOT.l, x2: right, y1: plotY(ph), y2: plotY(ph) }));
      grid.push(svg('text', { class: 'cu-tick', x: PLOT.l - 8, y: plotY(ph) + 4, 'text-anchor': 'end', text: String(ph) }));
    }
    for (let i = 0; i <= 5; i += 1) {
      const v = (limit * i) / 5;
      grid.push(svg('line', { class: 'cu-grid', x1: x(v), x2: x(v), y1: PLOT.t, y2: bottom }));
      grid.push(svg('text', { class: 'cu-tick', x: x(v), y: bottom + 18, 'text-anchor': 'middle', text: C.formatSig(v, 3) }));
    }
    const path = CU.points(p, limit)
      .map(([v, ph], i) => `${i ? 'L' : 'M'}${x(v).toFixed(2)},${plotY(ph).toFixed(2)}`)
      .join('');
    const eqX = x(info.veq);
    const eqY = plotY(info.atEq);
    const marks = [
      svg('line', { class: 'cu-eq', x1: eqX, x2: eqX, y1: PLOT.t, y2: bottom }),
      svg('circle', { class: 'cu-dot', cx: eqX, cy: eqY, r: 5 }),
      svg('text', { class: 'cu-label cu-label--strong', x: eqX + 10, y: eqY + 4, text: PLOT === PLOT_NARROW ? `당량점 pH ${C.formatFixed(info.atEq, 2)}` : `당량점 ${C.formatFixed(info.veq, 2)} mL · pH ${C.formatFixed(info.atEq, 2)}` }),
    ];
    if (info.half != null) {
      const hx = x(info.veq / 2);
      const hy = plotY(info.half);
      marks.push(svg('circle', { class: 'cu-dot cu-dot--open', cx: hx, cy: hy, r: 4 }));
      marks.push(svg('text', { class: 'cu-label', x: hx, y: acid ? hy + 20 : hy - 12, 'text-anchor': 'middle', text: `반당량점 pH ${C.formatFixed(info.half, 2)}` }));
    }
    return svg(
      'svg',
      { class: 'cu-svg', id: 'cu-svg', viewBox: `0 0 ${PLOT.w} ${PLOT.h}`, role: 'img', 'aria-label': `${info.kind.name}의 적정 곡선. 당량점은 ${C.formatFixed(info.veq, 2)} mL, pH ${C.formatFixed(info.atEq, 2)}` },
      defs,
      bands,
      grid,
      svg('rect', { class: 'cu-frame', x: PLOT.l, y: PLOT.t, width: right - PLOT.l, height: bottom - PLOT.t }),
      svg('text', { class: 'cu-axis', x: PLOT.l - 8, y: PLOT.t - 14, 'text-anchor': 'end', text: 'pH' }),
      svg('text', { class: 'cu-axis', x: (PLOT.l + right) / 2, y: PLOT.h - 6, 'text-anchor': 'middle', text: PLOT === PLOT_NARROW ? '넣은 부피 (mL)' : `넣은 ${info.kind.burette}의 부피 (mL)` }),
      svg('path', { class: 'cu-line', d: path }),
      marks,
      svg('line', { class: 'cu-now', id: 'cu-now-line', x1: 0, x2: 0, y1: PLOT.t, y2: bottom }),
      svg('circle', { class: 'cu-mark', id: 'cu-mark', cx: 0, cy: 0, r: 7 })
    );
  }

  // 넣은 부피를 옮기면 그 자리의 pH와 지시약의 색을 보여 준다.
  function updateCurveMark() {
    const cur = state.curve;
    if (!cur) return;
    const v = Math.min(cur.limit, Math.max(0, Number($('cu-v').value) || 0));
    const ph = CU.ph(cur.p, v);
    const color = L.indicatorColor(cur.indicator, ph);
    const mx = plotX(v, cur.limit);
    const mark = $('cu-mark');
    mark.setAttribute('cx', mx.toFixed(2));
    mark.setAttribute('cy', plotY(ph).toFixed(2));
    mark.style.fill = color.color || 'var(--surface)';
    $('cu-now-line').setAttribute('x1', mx.toFixed(2));
    $('cu-now-line').setAttribute('x2', mx.toFixed(2));
    $('curve-now').replaceChildren(
      swatch(color.color),
      el('span', { class: 'curve__now-text' }, el('strong', { text: `${C.formatFixed(v, 2)} mL` }), ` 넣었을 때 pH `, el('strong', { text: C.formatFixed(ph, 2) }), ` · ${cur.indicator.name}: ${color.name}`)
    );
  }

  function curveVerdict(judge) {
    const size = judge.percent == null ? '' : C.formatSig(Math.abs(judge.percent), 2);
    const when = judge.diff >= 0 ? '늦게' : '먼저';
    if (judge.verdict === 'good') return '알맞아요. 당량점과 한 방울 안쪽으로 맞고 색도 한 번에 바뀌어요.';
    if (judge.never) return '맞지 않아요. 이 적정에서는 색이 변하지 않아요.';
    if (judge.verdict === 'bad') return `맞지 않아요. 당량점보다 ${size} % ${when} 색이 변해요.`;
    if (Math.abs(judge.percent) <= CU.GOOD) return '쓸 수는 있지만 색이 천천히 바뀌어서 종말점을 잡기 어려워요.';
    return `쓸 수는 있지만 당량점보다 ${size} % ${when} 색이 변해요.`;
  }

  function renderCurve() {
    const kind = CU.findKind($('cu-kind').value) || CU.KINDS[0];
    $('cu-example').replaceChildren(`${kind.example} · `, formula(kind.equation));
    $('cu-flask-legend').textContent = `삼각 플라스크: ${kind.flask}`;
    $('cu-burette-legend').textContent = `뷰렛: ${kind.burette}`;
    $('cu-k-field').hidden = !kind.weak;
    if (kind.weak) $('cu-k-label').textContent = `${kind.flask}의 이온화 상수 ${kind.constant}`;
    const p = readCurve();
    const message = CU.check(p);
    const indicator = curveIndicators().find((item) => item.id === $('cu-ind').value) || curveIndicators()[0];
    $('curve-empty').textContent = message;
    $('curve-empty').hidden = !message;
    $('curve-chart').hidden = Boolean(message);
    $('curve-slide').hidden = Boolean(message);
    $('curve-title').textContent = `${kind.name}`;
    if (message) {
      state.curve = null;
      fillResult($('curve-result'), null, '조건을 넣으면 여기에 값이 나와요.');
      return;
    }
    const limit = CU.span(p);
    const info = CU.describe(p);
    PLOT = window.matchMedia && window.matchMedia(NARROW).matches ? PLOT_NARROW : PLOT_WIDE;
    state.curve = { p, limit, indicator, info };
    const slider = $('cu-v');
    slider.max = String(limit);
    slider.step = String(limit / 1000);
    if (Number(slider.value) > limit) slider.value = String(limit);
    $('curve-chart').replaceChildren(drawCurve(p, indicator, limit, info));
    updateCurveMark();
    const judge = CU.judge(p, indicator);
    const fit = curveIndicators()
      .filter((item) => CU.judge(p, item).verdict === 'good')
      .map((item) => item.name);
    const far = judge.diff == null ? '' : Math.abs(judge.diff) < 0.005 ? '당량점과 0.01 mL 안쪽으로 같아요' : `당량점보다 ${C.formatFixed(Math.abs(judge.diff), 2)} mL ${judge.diff >= 0 ? '늦어요' : '일러요'}`;
    const rows = [
      { label: `당량점까지 넣는 ${kind.burette}`, value: `${C.formatFixed(info.veq, 2)} mL`, main: true },
      { label: '당량점의 pH', value: C.formatFixed(info.atEq, 2) },
      { label: '처음 pH', value: C.formatFixed(info.start, 2) },
      info.half != null ? { label: `반당량점 (${C.formatFixed(info.veq / 2, 2)} mL)의 pH`, value: `${C.formatFixed(info.half, 2)} (${kind.analyte === 'acid' ? 'pKa' : '짝산의 pKa'}와 거의 같아요)` } : null,
      { label: '곡선이 곧게 서는 구간 (당량점의 0.2 % 앞뒤)', value: `pH ${C.formatFixed(Math.min(...info.jump), 2)} ~ ${C.formatFixed(Math.max(...info.jump), 2)}` },
      { label: `${indicator.name}의 변색 범위`, value: `pH ${L.indicatorRange(indicator)}` },
      { label: `${indicator.name}의 색이 바뀌는 때`, value: judge.never ? '색이 변하지 않아요' : `${C.formatFixed(judge.volume, 2)} mL (${far})` },
      { label: '이 지시약은', value: curveVerdict(judge) },
      { label: '이 적정에 알맞은 지시약', value: fit.length ? fit.join(', ') : '알맞은 것이 없어요' },
    ].filter(Boolean);
    fillResult($('curve-result'), rows, '');
  }

  function setupCurve() {
    $('cu-kind').replaceChildren(...CU.KINDS.map((kind) => el('option', { value: kind.id, text: `${kind.name} (${kind.example})` })));
    $('cu-ind').replaceChildren(...curveIndicators().map((indicator) => el('option', { value: indicator.id, text: `${indicator.name} (pH ${L.indicatorRange(indicator)})` })));
    const applyKind = () => {
      const kind = CU.findKind($('cu-kind').value);
      $('cu-ind').value = kind.indicator;
      if (kind.weak) $('cu-k').value = C.formatSig(kind.k * 1e5, 3);
      $('cu-v').value = '0';
    };
    $('cu-kind').value = 'wa-sb';
    applyKind();
    $('cu-kind').addEventListener('change', applyKind);
    onForm('curve-form', renderCurve);
    $('cu-v').addEventListener('input', updateCurveMark);
    // 그래프를 누르거나 끌어도 넣은 부피가 따라온다.
    const seek = (event) => {
      const cur = state.curve;
      const chart = $('cu-svg');
      if (!cur || !chart) return;
      const box = chart.getBoundingClientRect();
      const at = ((event.clientX - box.left) / box.width) * PLOT.w;
      const v = ((at - PLOT.l) / (PLOT.w - PLOT.l - PLOT.r)) * cur.limit;
      const step = cur.limit / 1000;
      $('cu-v').value = String(Math.min(cur.limit, Math.max(0, Math.round(v / step) * step)));
      updateCurveMark();
    };
    let dragging = false;
    $('curve-chart').addEventListener('pointerdown', (event) => {
      dragging = true;
      seek(event);
    });
    $('curve-chart').addEventListener('pointermove', (event) => {
      if (dragging) seek(event);
    });
    window.addEventListener('pointerup', () => {
      dragging = false;
    });
    // 화면이 좁아지거나 넓어지면 그림을 다시 그린다.
    if (window.matchMedia) window.matchMedia(NARROW).addEventListener('change', renderCurve);
    renderCurve();
  }

  function openCurve(kindId) {
    ensureDrawn('curve');
    if (kindId && CU.findKind(kindId)) {
      $('cu-kind').value = kindId;
      $('cu-kind').dispatchEvent(new Event('change', { bubbles: true }));
    }
    navigate('curve');
  }

  /* ---------- 종이 한 장으로 뽑는 화면들(결과 정리표, 준비표)이 함께 쓰는 것 ---------- */

  // 화면에 보이는 종이(.paper)만 인쇄한다. 인쇄가 끝나면 표시를 지운다.
  function printPaper(noteId) {
    const done = () => {
      document.body.classList.remove('print-paper');
      window.removeEventListener('afterprint', done);
    };
    document.body.classList.add('print-paper');
    window.addEventListener('afterprint', done);
    try {
      window.print();
    } catch (error) {
      done();
    }
    if (window.self !== window.top) flash(noteId, '인쇄 창이 열리지 않으면 이 페이지를 공개 주소로 따로 열어서 인쇄하세요.', 8000);
  }

  // 글자를 클립보드에 넣는다. 되면 true.
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      // 아래의 옛 방법으로 넘어간다.
    }
    const area = el('textarea', { class: 'visually-hidden', 'aria-hidden': 'true', tabindex: '-1' });
    area.value = text;
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (error) {
      ok = false;
    }
    area.remove();
    return ok;
  }

  function paperHead(kind, title, meta) {
    return el('header', { class: 'paper__head' }, el('p', { class: 'paper__kind', text: kind }), el('h2', { class: 'paper__title', text: title }), el('p', { class: 'paper__meta', text: meta }));
  }

  const paperSection = (title, ...children) => el('section', { class: 'paper__sec' }, el('h3', { class: 'paper__h', text: title }), ...children);

  function paperTable(heads, rows, className) {
    return el(
      'table',
      { class: className ? `paper__table ${className}` : 'paper__table' },
      el('thead', null, el('tr', null, heads.map((text) => el('th', { scope: 'col', text })))),
      el('tbody', null, rows.map((cells) => el('tr', null, cells.map((cell) => (cell instanceof Node ? el('td', null, cell) : el('td', { text: cell == null ? '' : String(cell) }))))))
    );
  }

  // 손으로 표시할 빈 네모
  const tickBox = () => el('span', { class: 'paper__tick', 'aria-hidden': 'true' });

  /* ---------- 결과 정리: 여러 번 잰 값을 평균·오차율과 함께 한 장으로 (SPEC 22장) ---------- */

  const REPORT_CUSTOM = '__custom__';
  const TRIALS = { start: 3, max: 8 };
  const signed = (x, digits) => `${x >= 0 ? '+' : '−'}${C.formatSig(Math.abs(x), digits)}`;
  const signedFixed = (x, places) => `${x >= 0 ? '+' : '−'}${C.formatFixed(Math.abs(x), places)}`;

  // 대표값 하나가 나오는 실험만 결과를 정리할 수 있다.
  function reportLabs() {
    return theoryLabs().filter((e) => {
      const r = TH.run(e.id, TH.defaults(e.id));
      return r.ok && r.primary;
    });
  }

  function addTrial(value) {
    const box = $('report-trials');
    const n = box.children.length + 1;
    if (n > TRIALS.max) return null;
    const id = `report-trial-${n}`;
    const input = el('input', { id, type: 'text', inputmode: 'text', enterkeyhint: 'next', class: 'trial__input' });
    input.value = value || '';
    box.append(el('div', { class: 'field trial' }, el('label', { for: id, text: `${n}회` }), el('div', { class: 'suffix suffix--wide' }, input, el('span', { class: 'trial__unit' }))));
    $('report-add').hidden = box.children.length >= TRIALS.max;
    return input;
  }

  // 화면에 넣은 것을 한데 모은다. 종이와 복사할 글이 이것을 함께 쓴다.
  function reportData() {
    const custom = state.report.lab === REPORT_CUSTOM;
    const lab = custom ? null : B.EXPERIMENTS.find((e) => e.id === state.report.lab);
    const result = custom ? null : state.report.result;
    const data = { custom, title: '', unitName: lab ? lab.unit : '', equation: '', amounts: [], rows: [], steps: [], primary: null, problem: '' };
    if (custom) {
      data.title = $('report-what').value.trim() || '직접 넣은 값';
      const theory = C.parseNumber($('report-theory').value);
      data.primary = { label: data.title, value: theory, unit: $('report-unit').value.trim() };
      if ($('report-theory').value.trim() !== '' && Number.isNaN(theory)) data.problem = '이론값은 숫자로 입력하세요.';
    } else {
      const model = TH.find(lab.id);
      data.title = lab.title;
      data.equation = model.equation;
      if (result && result.ok) {
        data.rows = result.rows;
        data.steps = result.steps || [];
        data.primary = result.primary;
        const values = state.report.values || {};
        data.amounts = model.inputs.map((input) => {
          const raw = String(values[input.id] == null ? '' : values[input.id]).trim();
          const option = input.options ? input.options.find(([value]) => value === raw) : null;
          return { label: input.label, value: option ? option[1] : raw, unit: input.unit || '' };
        });
      } else {
        data.problem = result ? result.message : '';
      }
    }
    const theory = data.primary ? data.primary.value : NaN;
    data.unit = data.primary ? data.primary.unit : '';
    data.trials = Array.from(document.querySelectorAll('#report-trials input'), (input, i) => {
      const text = input.value.trim();
      return { n: i + 1, text, value: text === '' ? NaN : C.parseNumber(text) };
    });
    data.badTrial = data.trials.some((trial) => trial.text !== '' && Number.isNaN(trial.value));
    // 평균과 표준 편차는 잰 값의 소수 자리보다 한 자리 더 보여 준다.
    data.places = Math.min(6, Math.max(0, ...data.trials.filter((trial) => !Number.isNaN(trial.value)).map((trial) => (trial.text.split('.')[1] || '').replace(/[^0-9].*$/, '').length)) + 1);
    data.sum = TH.summarize(data.trials.map((trial) => trial.value), theory);
    data.hasTheory = Number.isFinite(theory);
    data.memo = $('report-memo').value.trim();
    data.date = C.formatDate(todayISO());
    return data;
  }

  function renderReport() {
    const data = reportData();
    const withUnit = (text) => (data.unit ? `${text} ${data.unit}` : text);
    for (const span of document.querySelectorAll('#report-trials .trial__unit')) {
      span.textContent = data.unit;
      span.hidden = !data.unit;
    }
    if (state.reportDoc.mode === 'doc') {
      renderReportDoc();
      flash('report-note', data.badTrial ? '잰 값은 숫자로 입력하세요. 숫자가 아닌 칸은 계산에서 뺐어요.' : '');
      return;
    }
    const { sum } = data;
    const mean = sum.n ? C.formatFixed(sum.mean, data.places) : '';
    const trialRows = data.trials.map((trial) => {
      const ok = !Number.isNaN(trial.value);
      return [
        `${trial.n}회`,
        trial.text ? (ok ? withUnit(trial.text) : `${trial.text} (숫자가 아니에요)`) : '',
        ok && sum.n >= 2 ? signedFixed(trial.value - sum.mean, data.places) : '',
        ok && data.hasTheory ? `${signed(TH.percentError(trial.value, data.primary.value), 3)} %` : '',
      ];
    });
    const summary = [
      ['잰 횟수', sum.n ? `${sum.n}회` : ''],
      ['평균', sum.n ? withUnit(mean) : ''],
      ['표준 편차', sum.n >= 2 ? withUnit(C.formatFixed(sum.sd, data.places)) : sum.n === 1 ? '두 번 넘게 재야 나와요' : ''],
      ['상대 표준 편차', sum.n >= 2 && !Number.isNaN(sum.rsd) ? `${C.formatSig(sum.rsd, 2)} %` : ''],
      ['오차율 (평균과 이론값)', sum.n && data.hasTheory && !Number.isNaN(sum.error) ? `${signed(sum.error, 3)} %` : ''],
    ];
    const theoryLine = data.primary && data.hasTheory ? withUnit(C.formatSig(data.primary.value, 4)) : '';
    $('report-paper').replaceChildren(
      ...[
      paperHead('실험 결과 정리', data.title, [data.unitName, data.date].filter(Boolean).join(' · ')),
      el('p', { class: 'paper__who' }, el('span', { text: '학번·이름' }), el('span', { class: 'paper__blank' }), el('span', { text: '조' }), el('span', { class: 'paper__blank paper__blank--short' })),
      data.problem ? el('p', { class: 'paper__warn', text: data.problem }) : null,
      data.amounts.length ? paperSection('넣은 양', paperTable(['넣은 것', '값'], data.amounts.map((a) => [a.label, a.unit ? `${a.value} ${a.unit}` : a.value]), 'paper__table--kv')) : null,
      paperSection(
        '이론값',
        data.equation ? el('p', { class: 'paper__eq' }, formula(data.equation)) : null,
        el('p', { class: 'paper__main' }, el('span', { text: data.primary ? data.primary.label : '이론값' }), el('strong', { id: 'report-theory-value', text: theoryLine || '—' })),
        data.steps.length ? el('ol', { class: 'paper__steps' }, data.steps.map((step) => el('li', { text: step }))) : null
      ),
      paperSection('잰 값', paperTable(['회차', '잰 값', '평균과의 차이', '이론값과의 오차율'], trialRows, 'paper__table--trials')),
      paperSection('정리', paperTable(['항목', '값'], summary, 'paper__table--kv paper__table--sum')),
      paperSection('메모', data.memo ? el('p', { class: 'paper__memo', text: data.memo }) : el('div', { class: 'paper__lines', 'aria-hidden': 'true' })),
      FI ? reportFileSection() : null,
      ].filter(Boolean)
    );
    flash('report-note', data.badTrial ? '잰 값은 숫자로 입력하세요. 숫자가 아닌 칸은 계산에서 뺐어요.' : '');
  }

  // 결과 정리를 글로 바꾼다 (보고서에 붙여 넣을 때).
  function reportText() {
    if (state.reportDoc.mode === 'doc') return reportDocText();
    const data = reportData();
    const withUnit = (text) => (data.unit ? `${text} ${data.unit}` : text);
    const lines = [`실험 결과 정리 — ${data.title}`, data.date];
    if (data.amounts.length) lines.push(`넣은 양: ${data.amounts.map((a) => `${a.label} ${a.value}${a.unit ? ` ${a.unit}` : ''}`).join(', ')}`);
    if (data.hasTheory) lines.push(`이론값: ${data.primary.label} ${withUnit(C.formatSig(data.primary.value, 4))}`);
    const good = data.trials.filter((trial) => !Number.isNaN(trial.value));
    if (good.length) lines.push(`잰 값: ${good.map((trial) => trial.text).join(', ')}${data.unit ? ` ${data.unit}` : ''}`);
    if (data.sum.n) {
      const parts = [`평균 ${withUnit(C.formatFixed(data.sum.mean, data.places))}`];
      if (data.sum.n >= 2) parts.push(`표준 편차 ${withUnit(C.formatFixed(data.sum.sd, data.places))} (${C.formatSig(data.sum.rsd, 2)} %)`);
      if (data.hasTheory && !Number.isNaN(data.sum.error)) parts.push(`오차율 ${signed(data.sum.error, 3)} %`);
      lines.push(parts.join(', '));
    }
    if (data.memo) lines.push(`메모: ${data.memo}`);
    if (FI) lines.push(...reportFileText());
    return lines.join('\n');
  }

  // values를 주면 그 값으로 넣을 양을 채운다 (이론값 계산 화면에서 넘어올 때).
  function pickReport(id, values) {
    const labs = reportLabs();
    const custom = id === REPORT_CUSTOM;
    const lab = custom ? null : labs.find((e) => e.id === id) || labs.find((e) => e.id === 'vinegar') || labs[0];
    if (state.report.lab !== (custom ? REPORT_CUSTOM : lab.id)) state.reportDoc.edits = {};
    state.report.lab = custom ? REPORT_CUSTOM : lab.id;
    state.report.result = null;
    state.report.values = null;
    $('report-pick').value = state.report.lab;
    $('report-custom').hidden = !custom;
    if (custom) {
      $('report-box').replaceChildren();
    } else {
      const model = TH.find(lab.id);
      const inputs = values ? model.inputs.map((input) => (values[input.id] != null ? Object.assign({}, input, { value: values[input.id] }) : input)) : model.inputs;
      $('report-box').replaceChildren(
        calcForm({ id: lab.id, title: lab.title, hint: model.equation, inputs, compute: model.compute }, 'rp', true, (r, vals) => {
          state.report.result = r;
          state.report.values = vals;
          renderReport();
        })
      );
    }
    renderReport();
  }

  function openReport(id, values) {
    ensureDrawn('report');
    if (id && reportLabs().some((e) => e.id === id)) pickReport(id, values);
    navigate('report');
  }

  function setupReport() {
    const labs = reportLabs();
    const units = B.UNITS.filter((unit) => labs.some((e) => e.unit === unit));
    $('report-pick').replaceChildren(
      ...units.map((unit) => el('optgroup', { label: unit }, labs.filter((e) => e.unit === unit).map((e) => el('option', { value: e.id, text: e.title })))),
      el('optgroup', { label: '그 밖의 실험' }, el('option', { value: REPORT_CUSTOM, text: '직접 넣기 (이론값을 내가 적어요)' }))
    );
    for (let i = 0; i < TRIALS.start; i += 1) addTrial('');
    setupReportFile();
    setupStopwatch();
    // 실험 보고서는 오차 분석(error.js)의 판단을 쓴다. 그 파일이 없으면 결과 정리표만 둔다.
    if (E) setupReportDoc();
    else $('panel-report').querySelector('.seg').hidden = true;
    $('report-pick').addEventListener('change', () => pickReport($('report-pick').value));
    onForm('report-custom', renderReport);
    onForm('report-form', renderReport);
    $('report-add').addEventListener('click', () => {
      const input = addTrial('');
      renderReport();
      if (input) input.focus();
    });
    $('report-print').addEventListener('click', () => printPaper('report-note'));
    $('report-copy').addEventListener('click', async () => {
      const ok = await copyText(reportText());
      flash('report-note', ok ? (state.reportDoc.mode === 'doc' ? '보고서를 글로 복사했어요. 한글이나 워드에 붙여 넣으세요.' : '글로 복사했어요. 보고서에 붙여 넣으세요.') : '복사하지 못했어요. 종이를 끌어서 직접 복사하세요.', 4000);
    });
    pickReport(state.report.lab);
  }

  /* ---------- 오차 분석: 결과 정리의 값으로 정확도·정밀도, 튀는 값, 기구 불확도, 오차의 원인 (SPEC 25장) ---------- */

  const numText = (x) => (Number.isFinite(x) ? String(Number(x.toPrecision(6))) : '');
  const pctText = (x) => E.pct(x);

  // 불확도 표의 줄. 실험이 바뀌면 그 실험의 기본 줄로 새로 만들고, 같은 실험이면 손대지 않은 줄만 결과 정리의 값을 따라간다.
  function errRows(data) {
    const lab = data.custom ? REPORT_CUSTOM : state.report.lab;
    const fresh = (data.custom ? [] : E.budgetRows(lab, state.report.values || {}, data.sum.mean, data.unit)).map((row) => (row.mean && Number.isFinite(row.value) ? Object.assign(row, { value: Number(row.value.toPrecision(5)) }) : row));
    if (state.err.lab !== lab || !state.err.rows) {
      if (state.err.lab !== lab) state.err.drop = false;
      state.err.lab = lab;
      state.err.rows = fresh.map((row) => Object.assign({}, row));
    } else {
      state.err.rows.forEach((row, i) => {
        const f = fresh[i];
        if (f && !row.edited && row.tool === f.tool && row.label === f.label) {
          row.value = f.value;
          row.u = f.u;
        }
      });
    }
    return state.err.rows;
  }

  // 오차 분석에 쓰는 것을 한데 모은다. 보고서도 이것을 쓴다.
  function errorAnalysis() {
    ensureDrawn('report');
    const data = reportData();
    const key = data.custom ? REPORT_CUSTOM : state.report.lab;
    const causes = E.causes(data.custom ? '' : state.report.lab);
    const values = data.trials.map((trial) => trial.value);
    const q = E.qTest(values);
    const dropIndex = state.err.drop && q && q.drop90 ? q.index : -1;
    const s = E.stats(values.filter((v, i) => i !== dropIndex));
    const rows = errRows(data);
    const b = E.budget(rows);
    const theory = data.hasTheory ? data.primary.value : NaN;
    const d = E.diagnose(s, theory, b.total, causes.abs, b.rep);
    const pickedSet = state.err.picked[key] || (state.err.picked[key] = new Set());
    const picked = causes.items.filter((_, i) => pickedSet.has(i));
    const n = data.trials.filter((trial) => !Number.isNaN(trial.value)).length;
    return { data, key, causes, q, dropIndex, s, rows, b, d, pickedSet, picked, theory, n };
  }

  function qSentence(a, doc) {
    const { q, data } = a;
    const shown = q ? `${data.trials[q.index] ? data.trials[q.index].text : numText(q.value)}${data.unit ? ` ${data.unit}` : ''}` : '';
    return E.qLine(q, a.n, shown, a.dropIndex >= 0, doc);
  }

  // 오차율을 가로줄 위에 점으로: 가운데가 이론값, 띠가 '날 수 있는 폭'(±U)
  function errStrip(a) {
    const { data, d } = a;
    const ref = a.causes.abs ? Math.abs(a.theory) : a.theory;
    const items = data.trials
      .map((trial, i) => ({ i, v: trial.value }))
      .filter((x) => Number.isFinite(x.v))
      .map((x) => ({ i: x.i, e: Number.isFinite(ref) && ref !== 0 ? (((a.causes.abs ? Math.abs(x.v) : x.v) - ref) / Math.abs(ref)) * 100 : NaN, drop: x.i === a.dropIndex }))
      .filter((x) => Number.isFinite(x.e));
    if (!items.length) return null;
    const U = Number.isFinite(d.expanded) ? d.expanded : 0;
    const R = Math.max(1, U, ...items.map((x) => Math.abs(x.e)), Math.abs(d.error) || 0) * 1.25;
    const W = 560;
    const H = 132;
    const L = 30;
    const Rt = W - 30;
    const y = 62;
    const X = (e) => L + ((e + R) / (2 * R)) * (Rt - L);
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('class', 'err-strip');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `이론값과의 차이: ${items.map((x) => `${x.i + 1}회 ${E.pct(x.e, true)}`).join(', ')}${Number.isFinite(d.error) ? `, 평균 ${E.pct(d.error, true)}` : ''}`);
    const add = (tag, attrs, text) => {
      const node = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
      if (text != null) node.textContent = text;
      svg.append(node);
      return node;
    };
    if (U > 0) add('rect', { class: 'es-band', x: X(-U), y: y - 22, width: X(U) - X(-U), height: 44, rx: 6 });
    add('line', { class: 'es-axis', x1: L, y1: y, x2: Rt, y2: y });
    add('line', { class: 'es-zero', x1: X(0), y1: y - 30, x2: X(0), y2: y + 30 });
    add('text', { class: 'es-label', x: X(0), y: y - 36, 'text-anchor': 'middle' }, '이론값');
    for (const t of [-R, -R / 2, R / 2, R]) {
      const nice = Number(t.toPrecision(2));
      add('line', { class: 'es-tick', x1: X(nice), y1: y - 4, x2: X(nice), y2: y + 4 });
      add('text', { class: 'es-tick-text', x: X(nice), y: y + 46, 'text-anchor': 'middle' }, `${nice > 0 ? '+' : nice < 0 ? '−' : ''}${Math.abs(nice)}%`);
    }
    // 겹치는 점은 위아래로 비켜 놓는다
    const placed = [];
    for (const x of items.sort((p, q) => p.e - q.e)) {
      const cx = X(x.e);
      let dy = 0;
      while (placed.some((p) => Math.abs(p.cx - cx) < 12 && p.dy === dy)) dy = dy <= 0 ? -dy + 12 : -dy;
      placed.push({ cx, dy });
      add('circle', { class: x.drop ? 'es-dot es-dot--drop' : 'es-dot', cx, cy: y + dy, r: 6 });
      add('text', { class: 'es-dot-text', x: cx, y: dy > 0 ? y + dy + 17 : y + dy - 10, 'text-anchor': 'middle' }, String(x.i + 1));
    }
    if (Number.isFinite(d.error)) {
      const mx = X(d.error);
      add('path', { class: 'es-mean', d: `M${mx} ${y - 9} L${mx + 9} ${y} L${mx} ${y + 9} L${mx - 9} ${y} Z` });
    }
    add('text', { class: 'es-legend', x: L, y: H - 6 }, `● 회차 (숫자는 회차)   ◆ 평균${U > 0 ? `   띠: 날 수 있는 폭 ±${E.pct(U)}` : ''}`);
    return svg;
  }

  function errBudgetUi(a) {
    const toolOptions = (current) => E.TOOLS.map((t) => el('option', { value: t.id, text: t.name, selected: t.id === current }));
    const box = $('err-budget');
    box.replaceChildren(
      ...a.rows.map((row, i) =>
        el(
          'div',
          { class: 'err-row', 'data-row': String(i) },
          el(
            'div',
            { class: 'err-row__top' },
            el('label', { class: 'visually-hidden', for: `err-${i}-label`, text: `${i + 1}번째 측정의 이름` }),
            el('input', { id: `err-${i}-label`, type: 'text', class: 'err-row__label', 'data-field': 'label', maxlength: '30', value: row.label }),
            el('button', { type: 'button', class: 'btn btn--small err-row__del', 'data-del': String(i), 'aria-label': `${row.label} 줄 빼기`, text: '빼기' })
          ),
          el(
            'div',
            { class: 'err-row__grid' },
            el('div', { class: 'field err-row__tool' }, el('label', { for: `err-${i}-tool`, text: '기구' }), el('select', { id: `err-${i}-tool`, 'data-field': 'tool' }, toolOptions(row.tool))),
            el('div', { class: 'field' }, el('label', { for: `err-${i}-value`, text: row.mean ? '값 (평균)' : '값' }), el('div', { class: 'suffix' }, el('input', { id: `err-${i}-value`, type: 'text', inputmode: 'decimal', 'data-field': 'value', value: numText(row.value) }), el('span', { text: row.unit || '' }))),
            el('div', { class: 'field' }, el('label', { for: `err-${i}-u`, text: '± 허용 오차' }), el('div', { class: 'suffix' }, el('input', { id: `err-${i}-u`, type: 'text', inputmode: 'decimal', 'data-field': 'u', value: numText(row.u) }), el('span', { text: row.unit || '' }))),
            el('div', { class: 'field' }, el('label', { for: `err-${i}-reads`, text: '읽은 횟수' }), el('select', { id: `err-${i}-reads`, 'data-field': 'reads' }, [1, 2, 3].map((k) => el('option', { value: String(k), text: String(k), selected: k === row.reads }))))
          ),
          el('p', { class: 'err-row__rel', 'data-rel': String(i) })
        )
      )
    );
    if (!a.rows.length) box.append(el('p', { class: 'note', text: '계산에 들어간 측정을 [줄 추가]로 넣어 주세요. 예: 피펫으로 덜어 낸 부피, 저울로 단 질량.' }));
  }

  function errCausesUi(a) {
    const focused = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.cause : null;
    const dirName = { 1: 'up', '-1': 'down', 0: 'both', x: 'none' };
    const dirLabel = { 1: '크게', '-1': '작게', 0: '흔들림', x: '영향 적음' };
    $('err-causes').replaceChildren(
      ...a.causes.items.map((item, i) => {
        const match = E.matchesSign(item.dir, a.d.error, a.d.expanded);
        return el(
          'li',
          { class: match ? 'err-cause err-cause--match' : 'err-cause' },
          el(
            'label',
            { class: 'err-cause__label' },
            el('input', { type: 'checkbox', 'data-cause': String(i), checked: a.pickedSet.has(i) }),
            el('span', { class: `err-dir err-dir--${dirName[item.dir]}`, text: dirLabel[item.dir] }),
            el('span', { class: 'err-cause__text' }, el('span', { text: item.text }), item.why ? el('small', { text: item.why }) : null, match ? el('em', { class: 'err-cause__match', text: '오차율과 같은 쪽이라 먼저 의심해 볼 만해요' }) : null)
          )
        );
      })
    );
    if (focused != null) {
      const again = $('err-causes').querySelector(`[data-cause="${focused}"]`);
      if (again) again.focus();
    }
    const what = a.causes.what;
    let hint = `${P.josa(what, '을', '를')} 크게·작게 만드는 원인이에요. 우리 조에 있었던 일을 고르면 분석지와 보고서의 고찰에 들어가요.`;
    if (a.d.kind === 'systematic' || a.d.kind === 'both') hint += a.d.error > 0 ? ' 평균이 이론값보다 커서 [크게] 쪽 원인이 먼저 의심돼요.' : ' 평균이 이론값보다 작아서 [작게] 쪽 원인이 먼저 의심돼요.';
    $('err-causes-hint').textContent = hint;
  }

  function errQUi(a) {
    $('err-q').replaceChildren(
      ...kids(
        el('p', { class: 'err-q__text', text: qSentence(a) }),
        a.q && a.q.drop90 ? el('button', { type: 'button', class: 'btn btn--small', id: 'err-drop', 'aria-pressed': a.dropIndex >= 0 ? 'true' : 'false', text: a.dropIndex >= 0 ? '뺀 값 다시 넣기' : `${a.q.index + 1}회 값 빼고 보기` }) : null,
        a.dropIndex >= 0 ? el('p', { class: 'field__hint', text: '결과 정리표에는 그대로 있어요. 오차 분석과 보고서의 분석에서만 빼요.' }) : null
      )
    );
  }

  function errPaper(a) {
    const { data, s, d, b, n } = a;
    const withUnit = (text) => (data.unit ? `${text} ${data.unit}` : text);
    const places = data.places;
    const ref = a.causes.abs ? Math.abs(a.theory) : a.theory;
    const trialRows = data.trials
      .filter((trial) => !Number.isNaN(trial.value))
      .map((trial) => [
        `${trial.n}회${trial.n - 1 === a.dropIndex ? ' (뺌)' : ''}`,
        withUnit(trial.text),
        Number.isFinite(ref) && ref !== 0 ? E.pct((((a.causes.abs ? Math.abs(trial.value) : trial.value) - ref) / Math.abs(ref)) * 100, true) : '',
      ]);
    const sumRows = [
      ['평균', s.n ? withUnit(C.formatFixed(s.mean, places)) : '—'],
      ['표준 편차 (상대)', s.n >= 2 ? `${withUnit(C.formatFixed(s.sd, places))} (${pctText(s.rsd)})` : '두 번 넘게 재야 나와요'],
      ['이론값', data.hasTheory ? withUnit(C.formatSig(data.primary.value, 4)) : '없음'],
      ['오차율', Number.isFinite(d.error) ? E.pct(d.error, true) : '—'],
      ['기구 불확도 (합친 것)', Number.isFinite(b.total) ? `±${pctText(b.total)}` : '—'],
      ['날 수 있는 폭 (약 95%)', Number.isFinite(d.expanded) ? `±${pctText(d.expanded)}` : '—'],
    ];
    const budgetRowsOut = a.rows.map((row, i) => {
      const r = b.rows[i];
      return [row.label, row.unit ? `${numText(row.value)} ${row.unit}` : numText(row.value), `±${numText(row.u)}${row.reads > 1 ? ` × √${row.reads}` : ''}`, r && r.ok ? `${C.formatSig(r.rel, 2)} %` : '—', r && r.ok ? `${Math.round(r.share * 100)} %` : ''];
    });
    $('err-paper').replaceChildren(
      ...kids(
        paperHead('오차 분석', data.title, [data.unitName, data.date].filter(Boolean).join(' · ')),
        !n ? el('p', { class: 'paper__warn', text: '결과 정리에서 회차별로 잰 값을 넣으면 여기에 분석이 나와요.' }) : null,
        n ? paperSection('1. 잰 값과 이론값', paperTable(['회차', '잰 값', '이론값과의 차이'], trialRows, 'paper__table--trials'), errStrip(a), paperTable(['항목', '값'], sumRows, 'paper__table--kv paper__table--sum')) : null,
        n ? paperSection('2. 튀는 값 (Q 검정)', el('p', { class: 'paper__memo', text: qSentence(a) })) : null,
        n
          ? paperSection(
              '3. 기구 불확도',
              a.rows.length ? paperTable(['측정', '값', '허용 오차', '상대 불확도', '몫'], budgetRowsOut, 'paper__table--budget') : el('p', { class: 'paper__memo', text: '넣은 기구가 없어요.' }),
              b.top ? el('p', { class: 'paper__memo', text: `가장 큰 몫은 "${b.top.label}"(${Math.round(b.top.share * 100)} %)이에요. 이 측정을 더 정밀하게 하면 전체 불확도가 가장 많이 줄어요.` }) : null
            )
          : null,
        n ? paperSection('4. 판단', el('ul', { class: 'paper__list' }, d.lines.map((line) => el('li', { text: line })))) : null,
        n
          ? paperSection(
              '5. 오차의 원인',
              a.picked.length ? el('ul', { class: 'paper__list' }, a.picked.map((item) => el('li', { text: E.causeLine(item, a.causes.what) }))) : el('p', { class: 'paper__hint no-print', text: '왼쪽 [오차의 원인]에서 우리 조에 있었던 일을 고르면 여기에 적혀요.' })
            )
          : null
      )
    );
  }

  function errText(a) {
    const { data, s, d, b } = a;
    const withUnit = (text) => (data.unit ? `${text} ${data.unit}` : text);
    const lines = [`오차 분석 — ${data.title}`, data.date];
    if (!a.n) return lines.concat('잰 값이 없어요.').join('\n');
    lines.push(`잰 값: ${data.trials.filter((t) => !Number.isNaN(t.value)).map((t) => t.text).join(', ')}${data.unit ? ` ${data.unit}` : ''}`);
    const parts = [`평균 ${withUnit(C.formatFixed(s.mean, data.places))}`];
    if (s.n >= 2) parts.push(`표준 편차 ${withUnit(C.formatFixed(s.sd, data.places))} (${pctText(s.rsd)})`);
    if (data.hasTheory) parts.push(`이론값 ${withUnit(C.formatSig(data.primary.value, 4))}`);
    if (Number.isFinite(d.error)) parts.push(`오차율 ${E.pct(d.error, true)}`);
    lines.push(parts.join(', '));
    lines.push(`튀는 값: ${qSentence(a)}`);
    if (Number.isFinite(b.total)) lines.push(`기구 불확도: ±${pctText(b.total)} (${a.rows.map((row, i) => (b.rows[i].ok ? `${row.label} ${C.formatSig(b.rows[i].rel, 2)} %` : row.label)).join(', ')})`);
    lines.push(...d.lines);
    if (a.picked.length) lines.push('오차의 원인:', ...a.picked.map((item) => `- ${E.causeLine(item, a.causes.what)}`));
    return lines.join('\n');
  }

  // 불확도 표의 입력칸은 그대로 두고 나머지를 다시 그린다 (입력하는 동안 초점을 잃지 않게)
  function refreshError() {
    const a = errorAnalysis();
    const n = a.n;
    const withUnit = (text) => (a.data.unit ? `${text} ${a.data.unit}` : text);
    $('err-src').textContent = n
      ? `${a.data.title} · ${n}회 · ${a.data.hasTheory ? `이론값 ${withUnit(C.formatSig(a.data.primary.value, 4))}` : '이론값 없음'}`
      : `${a.data.title}: 아직 잰 값이 없어요. 결과 정리에서 회차별로 잰 값을 넣어 주세요.`;
    $('err-body').hidden = !n;
    errQUi(a);
    for (const span of document.querySelectorAll('#err-budget [data-rel]')) {
      const r = a.b.rows[Number(span.dataset.rel)];
      span.textContent = r && r.ok ? `상대 불확도 ${C.formatSig(r.rel, 2)} % · 몫 ${Math.round(r.share * 100)} %` : '값과 허용 오차를 0보다 큰 숫자로 넣어 주세요.';
      span.classList.toggle('err-row__rel--bad', !(r && r.ok));
    }
    errCausesUi(a);
    errPaper(a);
    return a;
  }

  function renderError() {
    const a = errorAnalysis();
    errBudgetUi(a);
    refreshError();
  }

  function openError() {
    ensureDrawn('error');
    navigate('error');
  }

  function setupError() {
    $('err-edit').addEventListener('click', () => {
      ensureDrawn('report');
      navigate('report');
    });
    $('err-add').addEventListener('click', () => {
      state.err.rows.push({ tool: 'other', label: '측정', value: 1, u: 0.01, reads: 1, unit: '', edited: true });
      renderError();
      const inputs = document.querySelectorAll('#err-budget .err-row__label');
      if (inputs.length) inputs[inputs.length - 1].select();
    });
    $('err-preset').addEventListener('click', () => {
      state.err.rows = null;
      renderError();
      flash('err-note', '이 실험의 기본 기구로 되돌렸어요.', 3000);
    });
    const onBudget = (event) => {
      const field = event.target.dataset.field;
      const rowBox = event.target.closest('[data-row]');
      if (!field || !rowBox) return;
      const row = state.err.rows[Number(rowBox.dataset.row)];
      const raw = event.target.value;
      if (field === 'label') row.label = raw.trim() || '측정';
      else if (field === 'tool') {
        const tool = E.TOOL[raw];
        row.tool = raw;
        row.unit = tool.unit;
        row.reads = tool.reads;
        row.once = Boolean(tool.once);
        row.u = tool.rel && Number.isFinite(row.value) ? (Math.abs(row.value) * tool.rel) / 100 : tool.u;
        if (!row.mean && !row.edited) row.value = tool.value;
        row.edited = true;
        renderError();
        const again = $(`err-${rowBox.dataset.row}-tool`);
        if (again) again.focus();
        return;
      } else if (field === 'reads') {
        row.reads = Number(raw) || 1;
        row.edited = true;
      } else {
        row[field] = C.parseNumber(raw);
        row.edited = true;
      }
      refreshError();
    };
    $('err-budget').addEventListener('input', onBudget);
    $('err-budget').addEventListener('change', (event) => {
      if (event.target.tagName === 'SELECT') onBudget(event);
    });
    $('err-budget').addEventListener('click', (event) => {
      const del = event.target.closest('[data-del]');
      if (!del) return;
      state.err.rows.splice(Number(del.dataset.del), 1);
      renderError();
      $('err-add').focus();
    });
    $('err-causes').addEventListener('change', (event) => {
      const box = event.target.closest('[data-cause]');
      if (!box) return;
      const set = state.err.picked[state.err.lab] || (state.err.picked[state.err.lab] = new Set());
      const i = Number(box.dataset.cause);
      if (box.checked) set.add(i);
      else set.delete(i);
      refreshError();
    });
    $('err-q').addEventListener('click', (event) => {
      if (!event.target.closest('#err-drop')) return;
      state.err.drop = !state.err.drop;
      refreshError();
      if ($('err-drop')) $('err-drop').focus();
    });
    $('err-print').addEventListener('click', () => printPaper('err-note'));
    $('err-copy').addEventListener('click', async () => {
      const ok = await copyText(errText(errorAnalysis()));
      flash('err-note', ok ? '오차 분석을 글로 복사했어요. 보고서에 붙여 넣으세요.' : '복사하지 못했어요. 종이를 끌어서 직접 복사하세요.', 4000);
    });
    $('err-to-report').addEventListener('click', () => openReportDoc());
    renderError();
  }

  /* ---------- 실험 보고서: 결과 정리의 값과 오차 분석으로 보고서를 채운다 (SPEC 25장) ---------- */

  function reportDocLab() {
    return state.report.lab && state.report.lab !== REPORT_CUSTOM ? B.EXPERIMENTS.find((e) => e.id === state.report.lab) : null;
  }

  // 보고서의 항목별 처음 글 (계획서 초안 + 결과·분석·고찰·결론)
  function reportDocBase(a) {
    const { data, s, d, b } = a;
    const lab = reportDocLab();
    const base = Object.assign({}, lab ? P.draft(lab, { C, L, TH, W, B }, { groups: 1 }) : P.blank());
    const withUnit = (text) => (data.unit ? `${text} ${data.unit}` : text);
    const label = data.primary ? data.primary.label : '잰 값';
    // 결과: 넣은 양과 정리한 값 (표는 따로 그린다)
    const result = [];
    if (data.amounts.length) result.push(`넣은 양: ${data.amounts.map((x) => `${x.label} ${x.value}${x.unit ? ` ${x.unit}` : ''}`).join(', ')}`);
    if (data.hasTheory) result.push(`이론값: ${label} ${withUnit(C.formatSig(data.primary.value, 4))}`);
    if (s.n) result.push(`평균 ${withUnit(C.formatFixed(s.mean, data.places))}${s.n >= 2 ? `, 표준 편차 ${withUnit(C.formatFixed(s.sd, data.places))} (상대 ${pctText(s.rsd)})` : ''}${Number.isFinite(d.error) ? `, 오차율 ${E.pct(d.error, true)}` : ''}`);
    if (a.dropIndex >= 0) result.push(`(${a.dropIndex + 1}회 값은 Q 검정으로 빼고 평균을 구했다.)`);
    base.record = result.join('\n');
    // 분석: 정확도·정밀도, 튀는 값, 기구 불확도
    const analysis = [];
    if (a.n) {
      analysis.push(...d.doc);
      if (a.n >= 3) analysis.push(qSentence(a, true));
      if (Number.isFinite(b.total)) analysis.push(`기구 불확도는 합쳐서 ±${pctText(b.total)}${b.top ? `이고, 가장 큰 몫은 "${b.top.label}"(${Math.round(b.top.share * 100)} %)이다` : ''}.`);
    }
    base.analysis = analysis.join('\n');
    // 고찰: 고른 원인과 메모
    base.discussion = a.picked.map((item) => `- ${E.causeLine(item, a.causes.what)}`).concat(data.memo ? [data.memo] : []).join('\n');
    // 결론
    let conclusion = '';
    if (s.n && data.hasTheory && Number.isFinite(d.error)) {
      conclusion = `${P.josa(label, '은', '는')} 평균 ${withUnit(C.formatFixed(s.mean, data.places))}로, 이론값 ${withUnit(C.formatSig(data.primary.value, 4))}와 ${E.pct(d.error, true)} 차이가 났다.`;
      if (d.accuracy === 'ok') conclusion += ` 이 차이는 측정이 가질 수 있는 폭(±${pctText(d.expanded)}) 안이므로 실험 결과는 이론과 맞는다고 볼 수 있다.`;
      else if (d.accuracy === 'off') conclusion += ` 이 차이는 측정이 가질 수 있는 폭(±${pctText(d.expanded)})보다 커서, 결과를 ${d.error > 0 ? '크게' : '작게'} 만든 원인이 있었다고 본다.`;
    } else if (s.n) {
      conclusion = `${P.josa(label, '은', '는')} 평균 ${withUnit(C.formatFixed(s.mean, data.places))}였다.`;
    }
    base.conclusion = conclusion;
    return base;
  }

  // 지금 보고서의 항목: [{ key, id, name, text, given, table }]
  function reportDocSections(a) {
    const base = reportDocBase(a);
    const tpl = state.reportDoc.template;
    const nameOf = (id) => P.REPORT_NAME[id] || P.SECTION[id].name;
    const order = tpl ? tpl.sections.map((sec) => ({ id: sec.id, name: sec.name, given: sec.text })) : P.REPORT_ORDER.map((id) => ({ id, name: nameOf(id), given: '' }));
    if (tpl && state.reportDoc.addMissing) {
      const have = new Set(tpl.sections.map((sec) => sec.id));
      for (const id of P.REPORT_ORDER) if (!have.has(id)) order.push({ id, name: nameOf(id), given: '' });
    }
    return order.map((sec, i) => {
      const key = `${i}:${sec.id}`;
      const value = sec.id === 'custom' ? '' : base[sec.id];
      const auto = typeof value === 'string' ? value : '';
      const text = state.reportDoc.edits[key] != null ? state.reportDoc.edits[key] : sec.given || auto;
      return { key, id: sec.id, name: sec.name, text, given: Boolean(sec.given), table: sec.id === 'record' };
    });
  }

  function reportDocMeta() {
    const date = $('report-day').value ? C.formatDate($('report-day').value) : '';
    return [$('report-who').value.trim(), date].filter(Boolean).join(' · ');
  }

  const DOC_HINT = {
    discussion: '오차 분석에서 우리 조에 있었던 원인을 고르거나, 직접 적어 주세요.',
    refs: '교과서, 실험 안내서, 참고한 자료를 적어 주세요.',
    analysis: '결과 정리에서 잰 값을 넣으면 채워져요.',
    conclusion: '결과 정리에서 잰 값을 넣으면 채워져요.',
  };

  function renderReportDoc() {
    const a = errorAnalysis();
    const { data } = a;
    const sections = reportDocSections(a);
    const withUnit = (text) => (data.unit ? `${text} ${data.unit}` : text);
    const ref = a.causes.abs ? Math.abs(a.theory) : a.theory;
    const trialTable = () =>
      paperTable(
        ['회차', data.primary ? `${data.primary.label}${data.unit ? ` (${data.unit})` : ''}` : '잰 값', '이론값과의 차이'],
        data.trials
          .filter((trial) => !Number.isNaN(trial.value))
          .map((trial) => [`${trial.n}회${trial.n - 1 === a.dropIndex ? ' (뺌)' : ''}`, trial.text, Number.isFinite(ref) && ref !== 0 ? E.pct((((a.causes.abs ? Math.abs(trial.value) : trial.value) - ref) / Math.abs(ref)) * 100, true) : ''])
          .concat(a.s.n ? [['평균', C.formatFixed(a.s.mean, data.places), Number.isFinite(a.d.error) ? E.pct(a.d.error, true) : '']] : []),
        'paper__table--trials'
      );
    const edit = (key, text, id) => {
      const box = el('div', { class: 'paper__edit', contenteditable: 'true', spellcheck: 'false', 'data-key': key, role: 'textbox', 'aria-multiline': 'true', 'data-placeholder': DOC_HINT[id] || '' });
      box.textContent = text;
      return box;
    };
    const titleBox = el('h2', { class: 'paper__title paper__edit paper__edit--title', contenteditable: 'true', spellcheck: 'false', 'data-key': 'title', role: 'textbox', 'aria-label': '보고서 제목' });
    titleBox.textContent = state.reportDoc.edits.title != null ? state.reportDoc.edits.title : data.title;
    $('report-paper').replaceChildren(
      ...kids(
        el('p', { class: 'paper__hint no-print', text: '종이의 글을 눌러 바로 고칠 수 있어요. 결과 정리의 값이나 고른 원인이 바뀌면, 고치지 않은 칸은 따라 바뀌어요.' }),
        el('header', { class: 'paper__head' }, el('p', { class: 'paper__kind', text: '실험 보고서' }), titleBox, el('p', { class: 'paper__meta', text: reportDocMeta() || '학번·이름, 실험한 날' })),
        ...sections.map((sec, i) => {
          const head = el('h3', { class: 'paper__h' }, `${i + 1}. ${sec.name}`, sec.given ? el('span', { class: 'paper__badge no-print', text: '양식에 적혀 있던 글' }) : null);
          if (sec.table) return el('section', { class: 'paper__sec' }, head, a.n ? trialTable() : null, a.n ? errStrip(a) : null, edit(sec.key, sec.text, sec.id));
          return el('section', { class: 'paper__sec' }, head, edit(sec.key, sec.text, sec.id));
        }),
        FI && state.reportFile ? reportFileSection() : null
      )
    );
    const tpl = state.reportDoc.template;
    $('report-tpl').hidden = !tpl;
    if (tpl) {
      const have = new Set(tpl.sections.map((sec) => sec.id));
      const missing = P.REPORT_ORDER.filter((id) => !have.has(id)).map((id) => P.REPORT_NAME[id] || P.SECTION[id].name);
      const added = state.reportDoc.addMissing && missing.length;
      $('report-tpl-sum').textContent = `"${tpl.name}"의 항목 ${tpl.sections.length}개 차례로 만들었어요.${missing.length ? (added ? ` 양식에 없는 항목(${missing.join(', ')})은 뒤에 붙였어요.` : ` 양식에 없는 항목(${missing.join(', ')})은 넣지 않았어요.`) : ''}`;
      $('report-tpl-more').hidden = !missing.length;
      $('report-tpl-more').textContent = added ? '빠진 항목 빼기' : '빠진 항목도 넣기';
    }
  }

  function reportDocText() {
    const a = errorAnalysis();
    const sections = reportDocSections(a).map((sec) => {
      const live = document.querySelector(`#report-paper [data-key="${sec.key}"]`);
      return { name: sec.name, text: live ? live.innerText.replace(/\n$/, '') : sec.text };
    });
    const title = state.reportDoc.edits.title != null ? state.reportDoc.edits.title : a.data.title;
    const values = a.data.trials.filter((t) => !Number.isNaN(t.value));
    const record = sections.find((_, i) => reportDocSections(a)[i].table);
    if (record && values.length) record.text = [`잰 값: ${values.map((t) => `${t.n}회 ${t.text}`).join(', ')}${a.data.unit ? ` ${a.data.unit}` : ''}`, record.text].filter(Boolean).join('\n');
    return P.toText({ kind: '실험 보고서', title, meta: reportDocMeta(), sections });
  }

  function setReportMode(mode) {
    state.reportDoc.mode = mode === 'doc' ? 'doc' : 'sheet';
    const doc = state.reportDoc.mode === 'doc';
    for (const button of document.querySelectorAll('[data-report-mode]')) button.setAttribute('aria-pressed', button.dataset.reportMode === state.reportDoc.mode ? 'true' : 'false');
    $('report-doc-box').hidden = !doc;
    $('report-print').textContent = doc ? '보고서 인쇄' : '결과 정리표 인쇄';
    $('report-paper').setAttribute('aria-label', doc ? '실험 보고서 미리보기' : '결과 정리표 미리보기');
    renderReport();
  }

  function openReportDoc() {
    ensureDrawn('report');
    setReportMode('doc');
    navigate('report');
  }

  function loadReportTemplate(doc) {
    if (!doc.ok) {
      flash('report-tpl-note', doc.message, 8000);
      return;
    }
    const tpl = P.readTemplate(doc);
    if (tpl.sections.length < 2) {
      flash('report-tpl-note', '양식에서 항목 이름(목적, 결과, 고찰 같은)을 찾지 못했어요. 항목 이름을 한 줄씩 적은 양식을 넣어 주세요.', 8000);
      return;
    }
    state.reportDoc.template = { name: doc.name, sections: tpl.sections };
    state.reportDoc.edits = {};
    state.reportDoc.addMissing = false;
    const guess = P.guessLab(FI.allText(doc), reportLabs());
    flash('report-tpl-note', guess && guess.id !== state.report.lab ? `파일을 보니 "${B.EXPERIMENTS.find((e) => e.id === guess.id).title}" 실험 같아요. 위의 [실험]에서 바꿀 수 있어요.` : '', 8000);
    renderReport();
  }

  function setupReportDoc() {
    $('report-day').value = todayISO();
    $('report-tpl-drop').replaceChildren(fileDrop('report-tpl-input', '학교 보고서 양식 넣기', '한글(.hwpx), 워드(.docx), 텍스트의 항목 이름과 차례를 따라 채워요. 이미 적힌 글은 그대로 둬요.', loadReportTemplate));
    for (const button of document.querySelectorAll('[data-report-mode]')) button.addEventListener('click', () => setReportMode(button.dataset.reportMode));
    for (const id of ['report-who', 'report-day']) $(id).addEventListener('input', () => {
      const meta = $('report-paper').querySelector('.paper__meta');
      if (state.reportDoc.mode === 'doc' && meta) meta.textContent = reportDocMeta() || '학번·이름, 실험한 날';
    });
    $('report-paper').addEventListener('input', (event) => {
      if (state.reportDoc.mode !== 'doc') return;
      const box = event.target.closest('[data-key]');
      if (box) state.reportDoc.edits[box.dataset.key] = box.innerText.replace(/\n$/, '');
    });
    $('report-tpl-more').addEventListener('click', () => {
      state.reportDoc.addMissing = !state.reportDoc.addMissing;
      state.reportDoc.edits = {};
      renderReport();
    });
    $('report-tpl-clear').addEventListener('click', () => {
      state.reportDoc.template = null;
      state.reportDoc.edits = {};
      renderReport();
      flash('report-tpl-note', '양식을 뺐어요. 기본 차례로 돌아왔어요.', 4000);
    });
    $('report-doc-reset').addEventListener('click', () => {
      state.reportDoc.edits = {};
      renderReport();
      flash('report-tpl-note', '고친 글을 지우고 처음 글로 되돌렸어요.', 4000);
    });
    $('report-to-error').addEventListener('click', () => openError());
  }

  /* ---------- 파일 넣는 칸: 결과 정리와 계획서가 함께 쓴다 (SPEC 24장) ---------- */

  const FILE_ACCEPT = '.csv,.tsv,.txt,.md,.xlsx,.xlsm,.hwpx,.docx,.hwp,.xls,.doc,.pdf';

  // 끌어다 놓거나 눌러서 고르는 칸. onFile(doc)는 FileIn이 읽은 결과를 받는다.
  function fileDrop(id, title, hint, onFile) {
    const input = el('input', { type: 'file', id, class: 'visually-hidden drop__input', accept: FILE_ACCEPT });
    const zone = el(
      'label',
      { class: 'drop', for: id },
      el('span', { class: 'drop__icon', 'aria-hidden': 'true' }, icon(ICONS.file)),
      el('span', { class: 'drop__title', text: title }),
      el('span', { class: 'drop__hint', text: hint })
    );
    const take = async (file) => {
      if (!file) return;
      zone.classList.add('is-busy');
      const doc = await FI.readFile(file);
      zone.classList.remove('is-busy');
      input.value = '';
      onFile(doc);
    };
    input.addEventListener('change', () => take(input.files && input.files[0]));
    zone.addEventListener('dragover', (event) => {
      event.preventDefault();
      zone.classList.add('is-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
    zone.addEventListener('drop', (event) => {
      event.preventDefault();
      zone.classList.remove('is-over');
      take(event.dataTransfer && event.dataTransfer.files[0]);
    });
    return el('div', { class: 'drop-wrap' }, input, zone);
  }

  /* ---------- 결과 정리에 파일 넣기 ---------- */

  const KIND_TEXT = { trials: '반복 측정', series: '연속 자료', none: '숫자 없음' };

  function reportFileTable() {
    const f = state.reportFile;
    return f ? f.analysis.tables[f.table] : null;
  }

  // 파일의 값을 결과표의 회차 칸에 넣는다 (반복 측정일 때)
  function applyReportFile() {
    const f = state.reportFile;
    const t = reportFileTable();
    if (!f || !t || t.kind !== 'trials') return;
    const q = t.quantities[f.q] || t.quantities[0];
    const box = $('report-trials');
    const texts = q.texts.slice(0, TRIALS.max);
    while (box.children.length < texts.length) addTrial('');
    Array.from(box.querySelectorAll('input')).forEach((input, i) => {
      input.value = texts[i] || '';
    });
    if (state.report.lab === REPORT_CUSTOM) {
      if (!$('report-what').value.trim()) $('report-what').value = q.name.slice(0, 30);
      if (!$('report-unit').value.trim() && q.unit) $('report-unit').value = q.unit.slice(0, 10);
    }
  }

  function showReportFile() {
    const f = state.reportFile;
    $('report-file').hidden = !f;
    if (!f) return;
    const usable = f.analysis.tables.filter((t) => t.kind !== 'none');
    $('report-file-table-field').hidden = usable.length < 2;
    $('report-file-table').replaceChildren(...usable.map((t) => el('option', { value: String(t.table), text: `${t.name || `표 ${t.table + 1}`} — ${KIND_TEXT[t.kind]}` })));
    $('report-file-table').value = String(f.table);
    const t = reportFileTable();
    const qs = t.kind === 'series' ? t.ys.map((y) => y.name) : t.quantities.map((q) => q.name);
    $('report-file-q-label').textContent = t.kind === 'series' ? '그래프의 세로축' : '회차 칸에 넣을 값';
    $('report-file-q-field').hidden = qs.length < 2;
    $('report-file-q').replaceChildren(...qs.map((name, i) => el('option', { value: String(i), text: name })));
    $('report-file-q').value = String(f.q);
    const tablesText = f.analysis.tables.length > 1 ? `표 ${f.analysis.tables.length}개 가운데 "${t.name || `표 ${t.table + 1}`}"` : '표';
    if (t.kind === 'trials') {
      const q = t.quantities[f.q] || t.quantities[0];
      const cut = q.texts.length > TRIALS.max ? ` (회차 칸에는 ${TRIALS.max}개까지 넣었어요)` : '';
      const theoryUnit = state.report.lab === REPORT_CUSTOM ? $('report-unit').value.trim() : state.report.result && state.report.result.primary ? state.report.result.primary.unit : '';
      const differ = q.unit && theoryUnit && q.unit.toLowerCase() !== theoryUnit.toLowerCase() ? ` 이 값의 단위(${q.unit})가 이론값의 단위(${theoryUnit})와 달라요. 맞는 값을 골라 주세요.` : '';
      $('report-file-sum').textContent = `"${f.name}"의 ${tablesText}에서 ${q.name} ${q.values.length}개를 읽어 회차 칸에 넣었어요${cut}.${t.quantities.length > 1 ? ` 잰 것 ${t.quantities.length}가지의 정리는 종이 아래에 있어요.` : ''}${differ}`;
    } else {
      const y = t.ys[f.q] || t.ys[0];
      $('report-file-sum').textContent = `"${f.name}"의 ${tablesText}에서 ${t.x.name}–${y.name} 자료 ${y.points.length}쌍을 읽어 그래프로 그렸어요.`;
    }
  }

  function loadReportFile(doc) {
    if (!doc.ok) {
      flash('report-file-note', doc.message, 8000);
      return;
    }
    const analysis = FI.analyze(doc);
    if (!analysis.best) {
      flash('report-file-note', '숫자로 된 표를 찾지 못했어요. 첫 줄에 이름(예: 부피 (mL)), 그 아래에 잰 값을 적은 표를 넣어 주세요.', 8000);
      return;
    }
    // 고른 실험의 이론값과 단위가 같은 값을 먼저 고른다 (예: 적정 실험이면 mL)
    const unit = state.report.lab === REPORT_CUSTOM ? $('report-unit').value.trim() : state.report.result && state.report.result.primary ? state.report.result.primary.unit : '';
    const best = analysis.best;
    const match = best.kind === 'trials' && unit ? best.quantities.findIndex((q) => q.unit && q.unit.toLowerCase() === unit.toLowerCase()) : -1;
    state.reportFile = { name: doc.name, analysis, table: best.table, q: match > 0 ? match : 0 };
    flash('report-file-note', '');
    applyReportFile();
    showReportFile();
    renderReport();
  }

  // 종이에 그리는 x–y 그래프 (흰 종이에 맞춘 색)
  function paperChart(t, yIndex) {
    const y = t.ys[yIndex] || t.ys[0];
    const pts = y.points;
    const W0 = 560;
    const H0 = 260;
    const pad = { l: 46, r: 14, t: 14, b: 40 };
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const nice = (lo, hi) => (hi - lo < 1e-12 ? [lo - 1, hi + 1] : [lo, hi]);
    const [x0, x1] = nice(Math.min(...xs), Math.max(...xs));
    let [y0, y1] = nice(Math.min(...ys), Math.max(...ys));
    const isPh = /^pH$/i.test(y.name.trim());
    if (isPh) [y0, y1] = [Math.min(0, Math.floor(y0)), Math.max(14, Math.ceil(y1))];
    const X = (v) => pad.l + ((v - x0) / (x1 - x0)) * (W0 - pad.l - pad.r);
    const Y = (v) => H0 - pad.b - ((v - y0) / (y1 - y0)) * (H0 - pad.t - pad.b);
    const ticks = (lo, hi, n) => Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);
    const fmt = (v) => C.formatSig(v, 3);
    const steep = FI.steepest(pts);
    const kids = [
      ...ticks(y0, y1, isPh ? 7 : 4).map((v) => svg('g', null, svg('line', { x1: pad.l, x2: W0 - pad.r, y1: Y(v), y2: Y(v), class: 'pc-grid' }), svg('text', { x: pad.l - 6, y: Y(v) + 4, class: 'pc-tick', 'text-anchor': 'end' }, isPh ? String(Math.round(v)) : fmt(v)))),
      ...ticks(x0, x1, 5).map((v) => svg('text', { x: X(v), y: H0 - pad.b + 16, class: 'pc-tick', 'text-anchor': 'middle' }, fmt(v))),
      svg('line', { x1: pad.l, x2: W0 - pad.r, y1: H0 - pad.b, y2: H0 - pad.b, class: 'pc-axis' }),
      svg('line', { x1: pad.l, x2: pad.l, y1: pad.t, y2: H0 - pad.b, class: 'pc-axis' }),
      svg('polyline', { points: pts.map((p) => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' '), class: 'pc-line' }),
      ...pts.map((p) => svg('circle', { cx: X(p[0]), cy: Y(p[1]), r: 2.6, class: 'pc-dot' })),
      svg('text', { x: (pad.l + W0 - pad.r) / 2, y: H0 - 6, class: 'pc-label', 'text-anchor': 'middle' }, `${t.x.name}${t.x.unit ? ` (${t.x.unit})` : ''}`),
      svg('text', { x: 12, y: (pad.t + H0 - pad.b) / 2, class: 'pc-label', 'text-anchor': 'middle', transform: `rotate(-90 12 ${(pad.t + H0 - pad.b) / 2})` }, `${y.name}${y.unit ? ` (${y.unit})` : ''}`),
    ];
    if (steep) kids.push(svg('line', { x1: X(steep.x), x2: X(steep.x), y1: pad.t, y2: H0 - pad.b, class: 'pc-steep' }));
    return svg('svg', { viewBox: `0 0 ${W0} ${H0}`, class: 'paper-chart', role: 'img', 'aria-label': `${t.x.name}에 따른 ${y.name} 그래프` }, ...kids);
  }

  // 종이 아래의 "불러온 자료" 구역
  function reportFileSection() {
    const f = state.reportFile;
    const t = reportFileTable();
    if (!f || !t) return null;
    const stats = (q) => {
      const s = TH.summarize(q.values, NaN);
      const u = (v) => `${C.formatSig(v, 4)}${q.unit ? ` ${q.unit}` : ''}`;
      return [q.unit ? `${q.name} (${q.unit})` : q.name, `${s.n}`, u(s.mean), s.n >= 2 ? u(s.sd) : '', u(Math.min(...q.values)), u(Math.max(...q.values))];
    };
    const preview = t.rows.slice(0, 8);
    const width = Math.max(...preview.map((r) => r.length));
    const pad = (r) => Array.from({ length: width }, (_, i) => (r[i] == null ? '' : r[i]));
    const parts = [el('p', { class: 'paper__meta-line', text: `파일: ${f.name}${f.analysis.tables.length > 1 ? ` · ${t.name || `표 ${t.table + 1}`}` : ''} · ${KIND_TEXT[t.kind]}` })];
    if (t.kind === 'series') {
      const y = t.ys[f.q] || t.ys[0];
      const steep = FI.steepest(y.points);
      parts.push(paperChart(t, f.q));
      if (steep) {
        const titration = /^pH$/i.test(y.name.trim()) && /부피|mL|volume/i.test(`${t.x.name} ${t.x.unit}`);
        parts.push(el('p', { class: 'paper__note', text: `${P ? P.josa(y.name, '이', '가') : y.name} 가장 가파르게 변한 곳: ${t.x.name} ≈ ${C.formatSig(steep.x, 4)}${t.x.unit ? ` ${t.x.unit}` : ''}${titration ? ' (당량점 근처)' : ''}` }));
      }
    }
    if (t.kind === 'series') {
      const range = (q) => [q.unit ? `${q.name} (${q.unit})` : q.name, `${q.values.length}`, C.formatSig(Math.min(...q.values), 4), C.formatSig(Math.max(...q.values), 4)];
      parts.push(paperTable(['잰 것', '개수', '최소', '최대'], t.quantities.map(range), 'paper__table--file'));
    } else {
      parts.push(paperTable(['잰 것', '개수', '평균', '표준 편차', '최소', '최대'], t.quantities.map(stats), 'paper__table--file'));
    }
    parts.push(el('p', { class: 'paper__small', text: `원래 표${t.rows.length > preview.length ? ` (앞 ${preview.length}줄, 모두 ${t.rows.length}줄)` : ''}` }));
    parts.push(paperTable(pad(preview[0]).map(String), preview.slice(1).map(pad), 'paper__table--raw'));
    return paperSection('불러온 자료', ...parts);
  }

  function reportFileText() {
    const t = reportFileTable();
    if (!t) return [];
    const lines = [`불러온 파일: ${state.reportFile.name}`];
    for (const q of t.quantities) {
      const s = TH.summarize(q.values, NaN);
      lines.push(`${q.name}: ${s.n}개, 평균 ${C.formatSig(s.mean, 4)}${q.unit ? ` ${q.unit}` : ''}${s.n >= 2 ? `, 표준 편차 ${C.formatSig(s.sd, 3)}` : ''}`);
    }
    if (t.kind === 'series') {
      const y = t.ys[state.reportFile.q] || t.ys[0];
      const steep = FI.steepest(y.points);
      if (steep) lines.push(`${P ? P.josa(y.name, '이', '가') : y.name} 가장 가파르게 변한 곳: ${t.x.name} ≈ ${C.formatSig(steep.x, 4)}${t.x.unit ? ` ${t.x.unit}` : ''}`);
    }
    return lines;
  }

  function setupReportFile() {
    if (!FI) {
      $('report-file-box').hidden = true;
      return;
    }
    $('report-drop').replaceChildren(fileDrop('report-file-input', '잰 값이 든 파일 넣기', '엑셀(.xlsx), CSV, 한글(.hwpx), 워드(.docx)의 표를 읽어요. 파일은 이 기기 밖으로 나가지 않아요.', loadReportFile));
    $('report-file-table').addEventListener('change', () => {
      state.reportFile.table = Number($('report-file-table').value);
      state.reportFile.q = 0;
      applyReportFile();
      showReportFile();
      renderReport();
    });
    $('report-file-q').addEventListener('change', () => {
      state.reportFile.q = Number($('report-file-q').value);
      applyReportFile();
      showReportFile();
      renderReport();
    });
    $('report-file-clear').addEventListener('click', () => {
      state.reportFile = null;
      showReportFile();
      renderReport();
      flash('report-file-note', '파일을 뺐어요. 회차 칸에 넣은 값은 그대로 두었어요.', 4000);
    });
  }

  // 초시계: 반응이 끝날 때까지 걸린 시간을 재어 빈 회차 칸에 넣는다 (반응 속도 실험)
  function setupStopwatch() {
    const button = $('report-watch-btn');
    let start = 0;
    let timer = null;
    const show = (sec) => {
      $('report-watch-time').textContent = `${sec.toFixed(1)} s`;
    };
    button.addEventListener('click', () => {
      if (!timer) {
        start = performance.now();
        show(0);
        timer = setInterval(() => show((performance.now() - start) / 1000), 100);
        button.textContent = '멈추고 기록';
        button.classList.add('btn--primary');
        return;
      }
      clearInterval(timer);
      timer = null;
      const sec = (performance.now() - start) / 1000;
      show(sec);
      button.textContent = '초시계 시작';
      button.classList.remove('btn--primary');
      let input = Array.from(document.querySelectorAll('#report-trials input')).find((x) => x.value.trim() === '');
      if (!input) input = addTrial('');
      if (!input) {
        flash('report-note', `회차 칸이 ${TRIALS.max}개 모두 찼어요. 잰 시간은 ${sec.toFixed(1)} s예요.`, 6000);
        return;
      }
      input.value = sec.toFixed(1);
      if (state.report.lab === REPORT_CUSTOM && !$('report-unit').value.trim()) $('report-unit').value = 's';
      renderReport();
      const n = Array.from(document.querySelectorAll('#report-trials input')).indexOf(input) + 1;
      flash('report-note', `${n}회 칸에 ${sec.toFixed(1)} s를 넣었어요.`, 4000);
    });
  }

  /* ---------- 실험 계획서 (SPEC 24장) ---------- */

  const PLAN_KEY = 'recipe-maker-plans';
  const PLAN_MAX = 8;
  const PLAN_BLANK = '__blank__';

  function planLab() {
    return state.plan.lab && state.plan.lab !== PLAN_BLANK ? B.EXPERIMENTS.find((e) => e.id === state.plan.lab) : null;
  }

  // 지금 계획서의 항목: [{ key, id, name, text, table, given }]
  function planSections() {
    const lab = planLab();
    const base = lab ? P.draft(lab, { C, L, TH, W, B }, { groups: state.plan.groups }) : P.blank();
    const tpl = state.plan.template;
    const order = tpl ? tpl.sections.map((s) => ({ id: s.id, name: s.name, given: s.text })) : P.DEFAULT_ORDER.map((id) => ({ id, name: P.SECTION[id].name, given: '' }));
    // 양식에 없는 항목을 뒤에 붙여 달라고 했으면 붙인다
    if (tpl && state.plan.addMissing) {
      const have = new Set(tpl.sections.map((s) => s.id));
      for (const id of P.DEFAULT_ORDER) if (!have.has(id)) order.push({ id, name: P.SECTION[id].name, given: '' });
    }
    return order.map((s, i) => {
      const key = `${i}:${s.id}`;
      const value = s.id === 'custom' ? '' : base[s.id];
      const table = value && typeof value === 'object' && value.table && !s.given ? value : null;
      const auto = typeof value === 'string' ? value : '';
      const text = state.plan.edits[key] != null ? state.plan.edits[key] : s.given || auto;
      return { key, id: s.id, name: s.name, text, table, given: Boolean(s.given) };
    });
  }

  function planMeta() {
    const date = $('plan-date').value ? C.formatDate($('plan-date').value) : '';
    return [$('plan-who').value.trim(), date].filter(Boolean).join(' · ');
  }

  function renderPlan() {
    const lab = planLab();
    const sections = planSections();
    const title = lab ? lab.title : '';
    const edit = (key, text, cls) => {
      const box = el('div', { class: cls || 'paper__edit', contenteditable: 'true', spellcheck: 'false', 'data-key': key, role: 'textbox', 'aria-multiline': 'true' });
      box.textContent = text;
      return box;
    };
    const titleBox = el('h2', { class: 'paper__title paper__edit paper__edit--title', contenteditable: 'true', spellcheck: 'false', 'data-key': 'title', role: 'textbox', 'aria-label': '실험 제목' });
    titleBox.textContent = state.plan.edits.title != null ? state.plan.edits.title : title;
    const tpl = state.plan.template;
    $('plan-paper').replaceChildren(
      el('p', { class: 'paper__hint no-print', text: '종이의 글을 눌러 바로 고칠 수 있어요. 고친 글은 [이 브라우저에 보관]을 눌러야 남아요.' }),
      el('header', { class: 'paper__head' }, el('p', { class: 'paper__kind', text: '실험 계획서' }), titleBox, el('p', { class: 'paper__meta', text: planMeta() || '조·이름, 날짜' })),
      ...sections.map((s, i) => {
        const head = el('h3', { class: 'paper__h' }, `${i + 1}. ${s.name}`, s.given ? el('span', { class: 'paper__badge no-print', text: '양식에 적혀 있던 글' }) : null);
        if (s.table) {
          const cell = (text, r, c) => {
            const k = `${s.key}:${r}:${c}`;
            const td = el(r === 0 ? 'th' : 'td', { contenteditable: 'true', 'data-key': k, spellcheck: 'false' });
            td.textContent = state.plan.edits[k] != null ? state.plan.edits[k] : text;
            return td;
          };
          return el(
            'section',
            { class: 'paper__sec' },
            head,
            el('table', { class: 'paper__table paper__table--record' }, el('thead', null, el('tr', null, s.table.head.map((h, c) => cell(h, 0, c)))), el('tbody', null, s.table.rows.map((row, r) => el('tr', null, row.map((v, c) => cell(v, r + 1, c))))))
          );
        }
        return el('section', { class: 'paper__sec' }, head, edit(s.key, s.text));
      })
    );
    if (tpl) {
      const have = new Set(tpl.sections.map((s) => s.id));
      const missing = P.DEFAULT_ORDER.filter((id) => !have.has(id)).map((id) => P.SECTION[id].name);
      const added = state.plan.addMissing && missing.length;
      $('plan-file-sum').textContent = `"${tpl.name}"의 항목 ${tpl.sections.length}개 차례로 만들었어요.${missing.length ? (added ? ` 양식에 없는 항목(${missing.join(', ')})은 뒤에 붙였어요.` : ` 양식에 없는 항목(${missing.join(', ')})은 넣지 않았어요.`) : ''}`;
      $('plan-file-more').hidden = !missing.length;
      $('plan-file-more').textContent = added ? '빠진 항목 빼기' : '빠진 항목도 넣기';
    }
    $('plan-file').hidden = !tpl;
    const g = state.plan.guess;
    $('plan-guess').hidden = !(g && g !== state.plan.lab);
    if (g && g !== state.plan.lab) {
      const guessLab = B.EXPERIMENTS.find((e) => e.id === g);
      $('plan-guess-text').textContent = `파일을 보니 "${guessLab.title}" 실험 같아요.`;
    }
  }

  // 종이에서 고친 글을 기억한다
  function onPlanEdit(event) {
    const box = event.target.closest('[data-key]');
    if (!box) return;
    state.plan.edits[box.dataset.key] = box.innerText.replace(/\n$/, '');
  }

  function planAsText() {
    const lab = planLab();
    const sections = planSections().map((s) => {
      if (!s.table) return { name: s.name, text: s.text };
      const val = (r, c, text) => (state.plan.edits[`${s.key}:${r}:${c}`] != null ? state.plan.edits[`${s.key}:${r}:${c}`] : text);
      return { name: s.name, text: '', table: { head: s.table.head.map((h, c) => val(0, c, h)), rows: s.table.rows.map((row, r) => row.map((v, c) => val(r + 1, c, v))) } };
    });
    const title = state.plan.edits.title != null ? state.plan.edits.title : lab ? lab.title : '';
    return P.toText({ title, meta: planMeta(), sections });
  }

  function pickPlan(id, keepEdits) {
    state.plan.lab = id;
    if (!keepEdits) state.plan.edits = {};
    $('plan-pick').value = id;
    renderPlan();
  }

  function loadPlanTemplate(doc) {
    if (!doc.ok) {
      flash('plan-file-note', doc.message, 8000);
      return;
    }
    const tpl = P.readTemplate(doc);
    if (tpl.sections.length < 2) {
      flash('plan-file-note', '양식에서 항목 이름(목적, 준비물, 과정 같은)을 찾지 못했어요. 항목 이름을 한 줄씩 적은 양식을 넣어 주세요.', 8000);
      return;
    }
    state.plan.template = { name: doc.name, sections: tpl.sections };
    state.plan.edits = {};
    state.plan.addMissing = false;
    const guess = P.guessLab(FI.allText(doc), B.EXPERIMENTS);
    state.plan.guess = guess ? guess.id : null;
    flash('plan-file-note', '');
    renderPlan();
  }

  function readPlans() {
    try {
      const list = JSON.parse(window.localStorage.getItem(PLAN_KEY) || '[]');
      return Array.isArray(list) ? list.filter((p) => p && typeof p.name === 'string' && p.edits && typeof p.edits === 'object') : [];
    } catch (error) {
      return [];
    }
  }

  function writePlans(list) {
    try {
      window.localStorage.setItem(PLAN_KEY, JSON.stringify(list.slice(0, PLAN_MAX)));
      return true;
    } catch (error) {
      return false;
    }
  }

  function renderPlanSaved() {
    const saved = readPlans();
    $('plan-saved').hidden = saved.length === 0;
    $('plan-saved-list').replaceChildren(
      ...saved.map((item, i) =>
        el(
          'li',
          { class: 'saved__item' },
          el('span', { class: 'saved__name', text: item.name }),
          el('span', { class: 'saved__meta', text: item.date }),
          el('button', { type: 'button', class: 'btn btn--small', 'data-plan-load': String(i), text: '불러오기' }),
          el('button', { type: 'button', class: 'btn btn--small', 'data-plan-drop': String(i), 'aria-label': `${item.name} 지우기`, text: '지우기' })
        )
      )
    );
  }

  function savePlan() {
    const lab = planLab();
    // 아직 칸을 떠나지 않은 글도 담는다
    for (const box of document.querySelectorAll('#plan-paper [data-key]')) state.plan.edits[box.dataset.key] = box.innerText.replace(/\n$/, '');
    const title = (state.plan.edits.title || (lab ? lab.title : '') || '빈 계획서').slice(0, 40);
    const entry = {
      name: title,
      date: C.formatDate(todayISO()),
      lab: state.plan.lab,
      groups: state.plan.groups,
      who: $('plan-who').value.slice(0, 40),
      day: $('plan-date').value,
      template: state.plan.template,
      addMissing: state.plan.addMissing,
      edits: state.plan.edits,
    };
    const list = [entry].concat(readPlans().filter((p) => p.name !== entry.name));
    const ok = writePlans(list);
    renderPlanSaved();
    flash('plan-note', ok ? `"${title}" 계획서를 이 브라우저에 보관했어요. 다른 기기에서는 보이지 않아요.` : '이 브라우저에는 보관할 수 없어요. [글로 복사]로 옮겨 두세요.', 6000);
  }

  function openSavedPlan(entry) {
    state.plan.template = entry.template && Array.isArray(entry.template.sections) ? entry.template : null;
    state.plan.groups = entry.groups > 1 ? Math.min(12, Math.round(entry.groups)) : 1;
    state.plan.guess = null;
    state.plan.addMissing = Boolean(entry.addMissing);
    $('plan-groups').value = String(state.plan.groups);
    $('plan-who').value = entry.who || '';
    $('plan-date').value = entry.day || todayISO();
    state.plan.edits = Object.assign({}, entry.edits);
    pickPlan(B.EXPERIMENTS.some((e) => e.id === entry.lab) ? entry.lab : PLAN_BLANK, true);
  }

  function openPlan(id) {
    ensureDrawn('plan');
    if (id && B.EXPERIMENTS.some((e) => e.id === id)) pickPlan(id);
    navigate('plan');
  }

  function setupPlan() {
    $('plan-pick').replaceChildren(
      ...B.UNITS.map((unit) => el('optgroup', { label: unit }, B.EXPERIMENTS.filter((e) => e.unit === unit).map((e) => el('option', { value: e.id, text: e.title })))),
      el('optgroup', { label: '그 밖에' }, el('option', { value: PLAN_BLANK, text: '빈 계획서 (항목만)' }))
    );
    $('plan-date').value = todayISO();
    $('plan-drop').replaceChildren(fileDrop('plan-file-input', '학교 계획서 양식 넣기', '한글(.hwpx), 워드(.docx), 텍스트의 항목 이름과 차례를 따라 채워요. 이미 적힌 글은 그대로 둬요.', loadPlanTemplate));
    $('plan-pick').addEventListener('change', () => pickPlan($('plan-pick').value));
    for (const id of ['plan-who', 'plan-date']) $(id).addEventListener('input', () => {
      $('plan-paper').querySelector('.paper__meta').textContent = planMeta() || '조·이름, 날짜';
    });
    $('plan-groups').addEventListener('change', () => {
      const n = Math.round(C.parseNumber($('plan-groups').value));
      state.plan.groups = n >= 1 && n <= 12 ? n : 1;
      $('plan-groups').value = String(state.plan.groups);
      renderPlan();
    });
    $('plan-paper').addEventListener('input', onPlanEdit);
    $('plan-guess-btn').addEventListener('click', () => {
      const id = state.plan.guess;
      state.plan.guess = null;
      pickPlan(id);
    });
    $('plan-file-more').addEventListener('click', () => {
      state.plan.addMissing = !state.plan.addMissing;
      renderPlan();
    });
    $('plan-file-clear').addEventListener('click', () => {
      state.plan.template = null;
      state.plan.guess = null;
      state.plan.edits = {};
      renderPlan();
      flash('plan-file-note', '양식을 뺐어요. 기본 차례로 돌아왔어요.', 4000);
    });
    $('plan-reset').addEventListener('click', () => {
      state.plan.edits = {};
      renderPlan();
      flash('plan-note', '고친 글을 지우고 처음 초안으로 되돌렸어요.', 4000);
    });
    $('plan-print').addEventListener('click', () => printPaper('plan-note'));
    $('plan-copy').addEventListener('click', async () => {
      const ok = await copyText(planAsText());
      flash('plan-note', ok ? '계획서를 글로 복사했어요. 한글이나 워드에 붙여 넣으세요.' : '복사하지 못했어요. 종이를 끌어서 직접 복사하세요.', 5000);
    });
    $('plan-save').addEventListener('click', savePlan);
    $('plan-saved-list').addEventListener('click', (event) => {
      const load = event.target.closest('[data-plan-load]');
      const drop = event.target.closest('[data-plan-drop]');
      const list = readPlans();
      if (load) {
        const entry = list[Number(load.dataset.planLoad)];
        if (entry) {
          openSavedPlan(entry);
          flash('plan-note', `"${entry.name}" 계획서를 불러왔어요.`, 4000);
        }
      } else if (drop) {
        list.splice(Number(drop.dataset.planDrop), 1);
        writePlans(list);
        renderPlanSaved();
      }
    });
    renderPlanSaved();
    pickPlan(state.plan.lab || 'vinegar', true);
  }

  /* ---------- 폐액 버리기 (SPEC 24장) ---------- */

  function wastePick(ids, ph) {
    state.waste.parts = W.PARTS.concat(W.TABLE).filter((p) => ids.includes(p.id)).map((p) => p.id);
    state.waste.ph = ph || '';
    renderWaste();
  }

  function binTag(id, big) {
    const bin = W.BIN[id];
    return el('span', { class: `bin-tag bin-tag--${id}${big ? ' bin-tag--big' : ''}` }, el('span', { class: 'bin-tag__dot', 'aria-hidden': 'true' }), bin.name);
  }

  function renderWaste() {
    const { parts, ph } = state.waste;
    // 시약표에서 알아들은 시약은 고를 칸이 따로 없어서, 고른 동안만 맨 위에 칩으로 보여 준다(누르면 뺀다).
    const found = parts.filter((id) => W.PART[id] && W.PART[id].table);
    $('waste-found').hidden = found.length === 0;
    $('waste-found-chips').replaceChildren(...found.map((id) => el('button', { type: 'button', class: 'filter-chip', 'data-part': id, 'aria-pressed': 'true', text: W.PART[id].name })));
    for (const chip of document.querySelectorAll('#waste-chips [data-part]')) chip.setAttribute('aria-pressed', parts.includes(chip.dataset.part) ? 'true' : 'false');
    const r = W.decide(parts, ph);
    const box = $('waste-result');
    if (!r.ok) {
      box.replaceChildren(el('h2', { class: 'card__title', text: '어느 통일까?' }), el('p', { class: 'empty', id: 'waste-empty', text: '무엇이 섞였는지 왼쪽에서 고르거나 위에 적어 보세요. 예: 산이 조금 들어간 얼음물' }));
      return;
    }
    const names = parts.map((id) => W.PART[id].name).join(', ');
    const phChips = r.needPh || ph
      ? el(
          'div',
          { class: 'waste-ph' },
          el('span', { class: 'waste-ph__label', text: 'pH 시험지로 재 보니' }),
          ...[['acid', '산성'], ['neutral', '거의 중성'], ['base', '염기성']].map(([value, text]) => el('button', { type: 'button', class: 'filter-chip', 'data-ph': value, 'aria-pressed': ph === value ? 'true' : 'false', text }))
        )
      : null;
    const solids = r.bins.filter((b) => b === 'solid' || b === 'glass');
    box.replaceChildren(
      ...[
        el('h2', { class: 'card__title', text: '여기에 버려요' }),
        r.bin ? el('p', { class: 'waste-answer', id: 'waste-answer' }, binTag(r.bin, true)) : r.needPh ? el('p', { class: 'waste-answer waste-answer--ask', id: 'waste-answer', text: 'pH를 재 봐야 알아요' }) : null,
        solids.length ? el('p', { class: 'waste-solids' }, el('span', { text: r.bin || r.needPh ? '고체는 따로:' : '이것은' }), ...solids.map((b) => binTag(b))) : null,
        el('ul', { class: 'waste-why', id: 'waste-why' }, r.reasons.map((text) => el('li', { text }))),
        phChips,
        r.warnings.length ? el('div', { class: 'waste-warn', id: 'waste-warn' }, r.warnings.map((w) => el('p', { class: `waste-alert waste-alert--${w.level === 'danger' ? 'danger' : 'warn'}`, text: w.text }))) : null,
        r.extra.length ? el('ul', { class: 'waste-extra' }, r.extra.map((text) => el('li', { text }))) : null,
        r.steps.length ? el('details', { class: 'waste-steps' }, el('summary', { text: '통에 붓는 법' }), el('ol', null, r.steps.map((text) => el('li', { text })))) : null,
        el('p', { class: 'waste-picked' }, el('span', { text: `고른 것: ${names}` }), el('button', { type: 'button', class: 'link-btn', id: 'waste-clear', text: '모두 지우기' })),
      ].filter(Boolean)
    );
  }

  function openWaste(labId) {
    ensureDrawn('waste');
    if (labId) {
      const lab = B.EXPERIMENTS.find((e) => e.id === labId);
      if (lab) {
        $('waste-lab').value = lab.id;
        wastePick(W.forLab(lab, C).parts);
      }
    }
    navigate('waste');
  }

  function setupWaste() {
    // 시약표의 이름을 칠 때 고를 수 있게 (브라우저가 아래에 보여 준다)
    if (W.TABLE.length) {
      const names = [...new Set(C.searchReagents('').map((r) => r.korean.replace(/\s+/g, ' ').trim()))].sort((a, b) => a.localeCompare(b, 'ko'));
      $('waste-names').replaceChildren(...names.map((name) => el('option', { value: name })));
    }
    $('waste-chips').replaceChildren(
      el('div', { class: 'waste-group', id: 'waste-found', hidden: true }, el('p', { class: 'waste-group__name', text: '시약표에서 찾은 시약' }), el('div', { class: 'filter-chips', id: 'waste-found-chips' })),
      ...W.GROUPS.map(([group, name]) =>
        el(
          'div',
          { class: 'waste-group' },
          el('p', { class: 'waste-group__name', text: name }),
          el('div', { class: 'filter-chips' }, W.PARTS.filter((p) => p.group === group).map((p) => el('button', { type: 'button', class: 'filter-chip', 'data-part': p.id, 'aria-pressed': 'false', text: p.name })))
        )
      )
    );
    // 헷갈리기 쉬운 경우: 누르면 그 성분이 골라진다. 중화가 끝난 용액처럼 pH를 재야 하는 경우는 "pH를 재서"로 보여 준다.
    $('waste-cases').replaceChildren(
      ...W.CASES.map((c, i) => {
        const r = W.decide(c.parts);
        const tags = r.bins.length ? r.bins.map((b) => binTag(b)) : [el('span', { class: 'bin-tag bin-tag--ask', text: 'pH를 재서' })];
        return el('button', { type: 'button', class: 'waste-case', 'data-case': String(i) }, el('span', { class: 'waste-case__q', text: c.q }), el('span', { class: 'waste-case__bins' }, tags));
      })
    );
    $('waste-bins').replaceChildren(
      ...W.BINS.map((bin) => el('div', { class: `bin-card bin-card--${bin.id}` }, binTag(bin.id, true), el('p', { class: 'bin-card__what', text: bin.what }), el('p', { class: 'bin-card__ex', text: bin.examples })))
    );
    if (available('labs')) {
      $('waste-lab').replaceChildren(el('option', { value: '', text: '실험을 고르면 쓰인 시약이 골라져요' }), ...B.UNITS.map((unit) => el('optgroup', { label: unit }, B.EXPERIMENTS.filter((e) => e.unit === unit).map((e) => el('option', { value: e.id, text: e.title })))));
      $('waste-lab').addEventListener('change', () => {
        const lab = B.EXPERIMENTS.find((e) => e.id === $('waste-lab').value);
        if (!lab) return;
        const w = W.forLab(lab, C);
        wastePick(w.parts);
        flash('waste-note', w.notes.length ? w.notes.join(' ') : '', 10000);
      });
    } else {
      $('waste-lab-field').hidden = true;
    }
    $('waste-chips').addEventListener('click', (event) => {
      const chip = event.target.closest('[data-part]');
      if (!chip) return;
      const id = chip.dataset.part;
      const parts = state.waste.parts.includes(id) ? state.waste.parts.filter((x) => x !== id) : state.waste.parts.concat(id);
      wastePick(parts, '');
    });
    $('waste-cases').addEventListener('click', (event) => {
      const button = event.target.closest('[data-case]');
      if (!button) return;
      const c = W.CASES[Number(button.dataset.case)];
      $('waste-q').value = c.q;
      $('waste-lab').value = '';
      wastePick(c.parts);
      if (window.matchMedia('(max-width: 900px)').matches) $('waste-result').scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    $('waste-result').addEventListener('click', (event) => {
      const ph = event.target.closest('[data-ph]');
      if (ph) wastePick(state.waste.parts, state.waste.ph === ph.dataset.ph ? '' : ph.dataset.ph);
      if (event.target.closest('#waste-clear')) {
        $('waste-q').value = '';
        $('waste-lab').value = '';
        wastePick([]);
      }
    });
    $('waste-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const ids = W.partsOfText($('waste-q').value);
      if (!ids.length) {
        flash('waste-note', '알아들은 시약이 없어요. 아래에서 직접 골라 주세요.', 5000);
        return;
      }
      $('waste-lab').value = '';
      flash('waste-note', `알아들은 것: ${ids.map((id) => W.PART[id].name).join(', ')}`, 5000);
      wastePick(ids);
      if (window.matchMedia('(max-width: 900px)').matches) $('waste-result').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    renderWaste();
  }

  /* ---------- 여러 실험 준비: 실험을 여러 개 고르면 기구와 시약을 한 장에 모은다 (SPEC 22장) ---------- */

  function renderPrep() {
    const ids = state.prep.labs;
    const groups = state.prep.groups;
    const labs = B.EXPERIMENTS.filter((e) => ids.includes(e.id));
    const title = (id) => B.EXPERIMENTS.find((e) => e.id === id).title;
    for (const button of document.querySelectorAll('[data-prep]')) button.setAttribute('aria-pressed', ids.includes(button.dataset.prep) ? 'true' : 'false');
    $('prep-count').textContent = `${labs.length}개 골랐어요`;
    $('prep-print').disabled = labs.length === 0;
    $('prep-add').disabled = labs.length === 0;
    $('prep-clear').hidden = labs.length === 0;
    const paper = $('prep-paper');
    if (!labs.length) {
      paper.replaceChildren(paperHead('실험 준비표', '실험을 골라 주세요', C.formatDate(todayISO())), el('p', { class: 'paper__empty', text: '왼쪽에서 실험을 하나 넘게 고르면, 필요한 기구와 시약이 여기에 한 장으로 모여요.' }));
      return;
    }
    const gear = B.gearFor(ids);
    const merged = L.mergeReagents(labs, groups);
    state.prep.solutions = merged.solutions;
    const many = labs.length > 1;
    const gearRows = [];
    for (const [cat, catName] of B.GEAR_CATS) {
      for (const entry of gear.gear.filter((g) => g.gear.cat === cat)) {
        gearRows.push([tickBox(), entry.gear.name, catName, el('span', { class: 'paper__uses' }, entry.uses.map((use) => el('span', { class: 'paper__use' }, many ? el('em', { text: `${title(use.lab)}: ` }) : null, use.lines.join(', '))))]);
      }
    }
    const solutionRows = merged.solutions.map((s) => [
      tickBox(),
      el('span', null, s.prep.name, s.prep.formula ? el('small', { class: 'paper__sub' }, ' ', formula(s.prep.formula)) : null),
      s.prep.target,
      s.prep.ok ? s.prep.amount : '계산할 수 없어요',
      many ? s.labs.map(title).join(', ') : '',
    ]);
    const otherRows = merged.others
      .map((o) => [tickBox(), o.name, o.uses.map((use) => (many ? `${title(use.lab)}: ${use.amount || '조금'}` : use.amount || '조금')).join(' / ')])
      .concat(gear.loose.map((item) => [tickBox(), item.line, many ? title(item.lab) : '']));
    paper.replaceChildren(
      ...[
      paperHead('실험 준비표', `실험 ${labs.length}개 · ${groups}조`, C.formatDate(todayISO())),
      paperSection('할 실험', el('ol', { class: 'paper__list' }, labs.map((e) => el('li', null, e.title, el('small', { class: 'paper__sub', text: ` ${e.unit}` }))))),
      paperSection(
        `기구 ${gearRows.length}가지`,
        paperTable(['', '기구', '종류', many ? '쓰는 실험과 한 조에 필요한 것' : '한 조에 필요한 것'], gearRows, 'paper__table--check paper__table--gear'),
        groups > 1 ? el('p', { class: 'paper__note', text: `개수는 한 조에 필요한 수예요. ${groups}조면 그만큼 곱해서 준비하세요.` }) : null
      ),
      gear.always.length ? paperSection('기본으로 챙길 것', el('ul', { class: 'paper__ticks' }, gear.always.map((g) => el('li', null, tickBox(), g.name)))) : null,
      solutionRows.length
        ? paperSection(
            `만들 용액 ${solutionRows.length}가지`,
            paperTable(['', '시약', '만들 용액', '달 양·취할 양', many ? '쓰는 실험' : ''], solutionRows, 'paper__table--check'),
            el('p', { class: 'paper__note', text: `부피는 실험에 드는 양에 조 수(${groups})를 곱해 더한 값이에요. 같은 용액은 한 줄로 모았어요. 여유분은 넣지 않았어요.` })
          )
        : null,
      otherRows.length ? paperSection('그 밖의 시약과 재료', paperTable(['', '이름', many ? '쓰는 실험과 양' : '양'], otherRows, 'paper__table--check')) : null,
      W ? paperSection('폐액', paperTable(['실험', '모두 섞였을 때', '주의'], labs.map((e) => wasteRow(e)), 'paper__table--waste')) : null,
      ].filter(Boolean)
    );
  }

  // 준비표의 폐액 줄: [실험, 모두 섞였을 때의 통, 덧붙이는 말]
  function wasteRow(lab) {
    const w = W.forLab(lab, C);
    const bin = w.solidOnly ? '액체 폐액 없음 (고체만)' : w.mixed && w.mixed.bin ? W.BIN[w.mixed.bin].name : w.mixed && w.mixed.needPh ? 'pH를 재서 산·알칼리·무기계' : '';
    const metals = w.mixed && w.mixed.metals.length ? `기록지에 ${w.mixed.metals.join(', ')}` : '';
    return [lab.title, bin, [metals].concat(w.notes.slice(0, 1)).filter(Boolean).join(' · ')];
  }

  // 준비표의 용액을 한 번에 조제 목록에 넣는다.
  function addPrepSolutions() {
    let added = 0;
    let skipped = 0;
    for (const solution of state.prep.solutions || []) {
      const result = solution.prep.result;
      if (!result || !result.ok) continue;
      if (state.list.length >= C.LIMITS.listRows) {
        skipped += 1;
        continue;
      }
      state.list.push(result.item);
      added += 1;
    }
    renderList();
    renderRecipe();
    flash(
      'prep-note',
      !added && !skipped
        ? '조제 목록에 넣을 용액이 없어요.'
        : skipped
          ? `용액 ${added}개를 넣었어요. 조제 목록이 가득 차서 ${skipped}개는 넣지 못했어요.`
          : `용액 ${added}개를 조제 목록에 넣었어요 (${state.list.length} / ${C.LIMITS.listRows}). 레시피·라벨에서 라벨을 만들 수 있어요.`,
      6000
    );
  }

  function setupPrep() {
    $('prep-pick').replaceChildren(
      ...B.UNITS.map((unit) =>
        el(
          'div',
          { class: 'prep-unit' },
          el('h3', { class: 'prep-unit__name', text: unit }),
          el('div', { class: 'filter-chips' }, B.EXPERIMENTS.filter((e) => e.unit === unit).map((e) => el('button', { type: 'button', class: 'filter-chip', 'data-prep': e.id, 'aria-pressed': 'false', text: e.title })))
        )
      )
    );
    $('prep-pick').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-prep]');
      if (!button) return;
      const id = button.dataset.prep;
      state.prep.labs = state.prep.labs.includes(id) ? state.prep.labs.filter((x) => x !== id) : state.prep.labs.concat(id);
      flash('prep-note', '');
      renderPrep();
    });
    const readGroups = () => {
      const n = Math.round(C.parseNumber($('prep-groups').value));
      state.prep.groups = n >= 1 && n <= 12 ? n : 1;
      renderPrep();
    };
    $('prep-groups').addEventListener('input', readGroups);
    $('prep-groups').addEventListener('change', () => {
      readGroups();
      $('prep-groups').value = String(state.prep.groups);
    });
    $('prep-clear').addEventListener('click', () => {
      state.prep.labs = [];
      flash('prep-note', '');
      renderPrep();
    });
    $('prep-print').addEventListener('click', () => printPaper('prep-note'));
    $('prep-add').addEventListener('click', addPrepSolutions);
    renderPrep();
  }

  function openPrep(id) {
    if (id && !state.prep.labs.includes(id)) state.prep.labs = state.prep.labs.concat(id);
    // 준비표 화면을 아직 연 적이 없으면 처음 그릴 때(setupPrep) 지금 고른 실험까지 함께 그려진다.
    if (drawn.prep) renderPrep();
    else ensureDrawn('prep');
    navigate('prep');
  }

  /* ---------- 조제 목록을 링크로 나누고 브라우저에 보관한다 (SPEC 22장) ---------- */

  // 보관한 목록을 브라우저에 두는 이름. 조제 목록과 희석 계열에 넣은 값만 들어간다.
  const SAVED_KEY = 'recipe-maker-lists';
  const SAVED_MAX = 8;
  const SHARE_HASH = 'list=';

  function hasListToKeep() {
    const d = readDilution();
    return state.list.length > 0 || d.stock.trim() !== '' || d.rows.some((row) => row.conc.trim() !== '' || row.volume.trim() !== '');
  }

  // 싼 글자를 풀어 조제 목록과 희석 계열을 채운다.
  function loadShared(code) {
    const data = SH.decode(code);
    if (!data.ok) return data;
    const items = [];
    let failed = data.dropped;
    for (const entry of data.items) {
      const result = entry.kind === 'liquid' ? C.computeLiquid(entry.input) : C.computeSolid(entry.input);
      if (result.ok && items.length < C.LIMITS.listRows) items.push(result.item);
      else failed += 1;
    }
    state.list = items;
    const d = data.dilution || { name: '', stock: '', unit: '', rows: [] };
    $('dil-name').value = d.name;
    $('dil-stock').value = d.stock;
    if (C.DILUTION_UNITS.includes(d.unit)) $('dil-unit').value = d.unit;
    $('dil-rows').replaceChildren();
    if (d.rows.length) d.rows.slice(0, C.LIMITS.dilutionRows).forEach((row) => addDilRow(row.conc, row.volume));
    else addDilRow('', '');
    flash('list-note', '');
    flash('liq-note', '');
    renderAll();
    return { ok: true, count: items.length, failed, dilution: Boolean(data.dilution) };
  }

  function loadedMessage(done, from) {
    if (!done.ok) return done.message;
    const parts = [`${from} 용액 ${done.count}개${done.dilution ? '와 희석 계열' : ''}을 불러왔어요.`];
    if (done.failed) parts.push(`${done.failed}개는 이 앱에 없는 시약이거나 값이 맞지 않아 뺐어요.`);
    return parts.join(' ');
  }

  function readSaved() {
    try {
      const list = JSON.parse(window.localStorage.getItem(SAVED_KEY) || '[]');
      return Array.isArray(list) ? list.filter((item) => item && typeof item.name === 'string' && typeof item.code === 'string').slice(0, SAVED_MAX) : [];
    } catch (error) {
      return [];
    }
  }

  function writeSaved(list) {
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(list.slice(0, SAVED_MAX)));
      return true;
    } catch (error) {
      return false;
    }
  }

  function renderSaved() {
    const saved = readSaved();
    $('saved-list').hidden = saved.length === 0;
    $('saved-list').replaceChildren(
      ...saved.map((item, i) =>
        el(
          'li',
          { class: 'saved__item' },
          el('span', { class: 'saved__name', text: item.name }),
          el('span', { class: 'saved__meta', text: `${item.count}개 · ${item.date}` }),
          el('button', { type: 'button', class: 'btn btn--small', 'data-load': String(i), text: '불러오기' }),
          el('button', { type: 'button', class: 'btn btn--small', 'data-drop': String(i), 'aria-label': `${item.name} 지우기`, text: '지우기' })
        )
      )
    );
  }

  function setupShare() {
    $('share-link').addEventListener('click', async () => {
      if (!hasListToKeep()) {
        $('share-url').hidden = true;
        flash('share-note', '아직 담은 것이 없어요. 용액 조제에서 목록에 추가한 다음 눌러 주세요.', 5000);
        return;
      }
      const url = `${window.location.href.split('#')[0]}#${SHARE_HASH}${SH.encode(state.list, readDilution())}`;
      $('share-url').value = url;
      $('share-url').hidden = false;
      const ok = await copyText(url);
      flash('share-note', ok ? '링크를 복사했어요. 이 링크를 열면 같은 목록이 나와요.' : '아래 링크를 눌러서 직접 복사하세요.', 6000);
    });
    $('share-url').addEventListener('focus', () => $('share-url').select());
    $('share-form').addEventListener('submit', (event) => {
      event.preventDefault();
      if (!hasListToKeep()) {
        flash('share-note', '아직 담은 것이 없어요. 용액 조제에서 목록에 추가한 다음 눌러 주세요.', 5000);
        return;
      }
      const saved = readSaved();
      const name = $('share-name').value.trim() || (state.list[0] ? `${state.list[0].koreanName} 등` : '희석 계열');
      const entry = { name: name.slice(0, 20), date: C.formatDate(todayISO()), count: state.list.length, code: SH.encode(state.list, readDilution()) };
      const next = [entry].concat(saved.filter((item) => item.name !== entry.name));
      const ok = writeSaved(next);
      $('share-name').value = '';
      renderSaved();
      flash('share-note', ok ? `'${entry.name}'(으)로 이 브라우저에 보관했어요.${next.length > SAVED_MAX ? ` 가장 오래된 것은 지웠어요(${SAVED_MAX}개까지).` : ''}` : '이 브라우저에서는 보관할 수 없어요. 링크를 복사해 두세요.', 6000);
    });
    $('saved-list').addEventListener('click', (event) => {
      const load = event.target.closest('button[data-load]');
      const drop = event.target.closest('button[data-drop]');
      const saved = readSaved();
      if (load) {
        const item = saved[Number(load.dataset.load)];
        if (item) flash('share-note', loadedMessage(loadShared(item.code), `'${item.name}'의`), 6000);
      } else if (drop) {
        const item = saved[Number(drop.dataset.drop)];
        saved.splice(Number(drop.dataset.drop), 1);
        writeSaved(saved);
        renderSaved();
        if (item) flash('share-note', `'${item.name}'을(를) 지웠어요.`, 4000);
      }
    });
    renderSaved();
  }

  // 주소가 #list=… 이면 그 목록을 불러오고 레시피·라벨 화면을 연다. 불러왔으면 true.
  function openSharedHash() {
    const hash = window.location.hash.slice(1);
    if (!SH || !hash.startsWith(SHARE_HASH)) return false;
    const done = loadShared(hash.slice(SHARE_HASH.length));
    renderPage('recipe');
    syncHash();
    flash('share-note', loadedMessage(done, '링크의'), 8000);
    return true;
  }

  /* ---------- 계산 도구: 왼쪽에서 고르고 오른쪽에서 계산한다 ---------- */

  // 화면에 미리 있는 계산 넷. 나머지는 labcalc.js의 계산 모음이다.
  const BASIC_TOOLS = [
    { id: 'convert', form: 'cv-form', title: '농도 환산', short: '농도 환산', desc: '한 가지 단위로 넣은 농도를 M, mM, g/L, mg/L, % (w/v)로 바꿔 보여 줘요.', formula: 'g/L = M × 몰질량,  % (w/v) = g/L ÷ 10', labs: ['standard', 'beer'] },
    { id: 'titration', form: 'ti-form', title: '중화 적정', short: '중화 적정', desc: '농도를 아는 용액으로 모르는 용액의 농도를 구해요.', formula: 'n₁M₁V₁ = n₂M₂V₂', labs: ['vinegar', 'ksp'] },
    { id: 'colligative', form: 'co-form', title: '총괄성 (어는점 내림·끓는점 오름)', short: '어는점 내림·끓는점 오름', desc: '용질이 녹으면 어는점은 내려가고 끓는점은 올라가요. 그 크기를 구해요.', formula: 'ΔT = i × K × m', labs: ['freezing'] },
    { id: 'ph-strong', form: 'ph-form', title: '강산·강염기의 pH', short: '강산·강염기의 pH', desc: '물에서 모두 이온화하는 산과 염기의 pH를 구해요.', formula: 'pH = −log[H⁺],  pH + pOH = 14', labs: ['indicator-range', 'buffer'] },
  ];
  const BASIC_GROUP = '기본 계산';
  // 계산 묶음의 색 (색상환의 각도)
  const GROUP_HUE = { [BASIC_GROUP]: 214, '물질의 양': 250, '기체와 열': 22, '반응 속도와 평형': 150, '산과 염기': 330, '산화·환원과 전기화학': 280, '실험 정리': 195 };

  function toolList() {
    const list = BASIC_TOOLS.map((t) => ({ id: t.id, group: BASIC_GROUP, title: t.title, short: t.short, basic: t }));
    if (L) for (const calc of L.CALCS) list.push({ id: calc.id, group: calc.group, title: calc.title, short: calc.title, calc });
    return list;
  }

  function pickTool(id) {
    const tools = toolList();
    const tool = tools.find((t) => t.id === id) || tools[0];
    state.tool = tool.id;
    for (const t of BASIC_TOOLS) $(t.form).hidden = t.id !== tool.id;
    $('more-card').hidden = !tool.calc;
    if (tool.calc) $('more-calc-box').replaceChildren(calcForm(tool.calc, 'more', true));
    const labs = (tool.basic ? tool.basic.labs : B ? B.EXPERIMENTS.filter((e) => e.calcs.includes(tool.id)).map((e) => e.id) : [])
      .map((labId) => (B ? B.EXPERIMENTS.find((e) => e.id === labId) : null))
      .filter(Boolean);
    const head = $('tool-head');
    head.style.setProperty('--g', String(GROUP_HUE[tool.group] ?? 214));
    head.replaceChildren(
      ...kids(
      el('span', { class: 'tool-tag', text: tool.group }),
      el('h2', { class: 'tool-head__title', id: 'tool-title', text: tool.title }),
      tool.basic ? el('p', { class: 'tool-head__desc', text: tool.basic.desc }) : null,
      el('p', { class: 'tool-formula' }, el('span', { class: 'tool-formula__label', text: tool.basic ? '식' : '계산 방법' }), el('span', { class: 'tool-formula__text', text: tool.basic ? tool.basic.formula : tool.calc.hint })),
      labs.length
        ? el(
            'div',
            { class: 'tool-labs' },
            el('span', { class: 'tool-labs__label', text: '이 계산을 쓰는 실험' }),
            ...labs.map((lab) => el('button', { type: 'button', class: 'gear-lab', 'data-lab': lab.id, text: lab.title }))
          )
        : null
      )
    );
    for (const button of document.querySelectorAll('[data-tool]')) {
      if (button.dataset.tool === tool.id) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
    $('tool-pick').value = tool.id;
  }

  function setupTools() {
    const tools = toolList();
    const groups = [];
    for (const t of tools) if (!groups.includes(t.group)) groups.push(t.group);
    $('tool-count').textContent = `${tools.length}가지`;
    $('tool-nav').replaceChildren(
      ...groups.map((group) => {
        const box = el(
          'div',
          { class: 'tool-group' },
          el('h3', { class: 'tool-group__name' }, el('span', { class: 'tool-dot', 'aria-hidden': 'true' }), group),
          el('ul', { class: 'lnb' }, tools.filter((t) => t.group === group).map((t) => el('li', null, el('button', { type: 'button', class: 'lnb__item', 'data-tool': t.id, text: t.short }))))
        );
        box.style.setProperty('--g', String(GROUP_HUE[group] ?? 214));
        return box;
      })
    );
    $('tool-pick').replaceChildren(...groups.map((group) => el('optgroup', { label: group }, tools.filter((t) => t.group === group).map((t) => el('option', { value: t.id, text: t.short })))));
    $('tool-nav').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-tool]');
      if (!button) return;
      pickTool(button.dataset.tool);
      if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches) $('tool-head').scrollIntoView();
    });
    $('tool-pick').addEventListener('change', () => pickTool($('tool-pick').value));
    $('tool-hits').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-tool]');
      if (!button) return;
      pickTool(button.dataset.tool);
      $('tool-head').scrollIntoView();
    });
    $('tool-query').addEventListener('input', filterTools);
    $('tool-query').addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.isComposing) return;
      event.preventDefault();
      const hits = toolMatches($('tool-query').value.trim());
      if (!hits || !hits.length) return;
      pickTool(hits[0]);
      if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches) $('tool-head').scrollIntoView();
    });
    pickTool(state.tool);
  }

  // 계산 찾기 칸: 검색(search.js)으로 이름·묶음·설명을 견주고(오타도 고쳐 준다), 식과 설명 글은 그대로도 찾는다.
  function toolMatches(raw) {
    if (!raw) return null;
    const tools = toolList();
    const hits = S ? S.search(raw, searchIndex()).results.filter((r) => r.doc.type === 'calc').map((r) => r.doc.id) : [];
    const words = raw.split(/\s+/).filter(Boolean).map(flat);
    for (const t of tools) {
      if (hits.includes(t.id)) continue;
      const text = flat(`${t.title} ${t.short} ${t.group} ${t.basic ? `${t.basic.desc} ${t.basic.formula}` : t.calc.hint}`);
      if (words.every((w) => text.includes(w))) hits.push(t.id);
    }
    return hits;
  }

  function filterTools() {
    const raw = $('tool-query').value.trim();
    const hits = toolMatches(raw);
    const tools = toolList();
    for (const button of $('tool-nav').querySelectorAll('[data-tool]')) button.closest('li').hidden = Boolean(hits) && !hits.includes(button.dataset.tool);
    for (const group of $('tool-nav').querySelectorAll('.tool-group')) group.hidden = !group.querySelector('li:not([hidden])');
    $('tool-count').textContent = hits ? `${hits.length} / ${tools.length}가지` : `${tools.length}가지`;
    $('tool-none').hidden = !hits || hits.length > 0;
    $('tool-none').textContent = hits && !hits.length ? `'${raw}'에 맞는 계산이 없어요. 짧게 줄이거나 다른 말로 찾아보세요.` : '';
    // 좁은 화면에서는 왼쪽 목록이 숨으므로 찾은 계산을 버튼으로 보여 준다.
    $('tool-hits').hidden = !hits || !hits.length;
    $('tool-hits').replaceChildren(
      ...(hits || []).slice(0, 8).map((id) => {
        const t = tools.find((x) => x.id === id);
        return el('button', { type: 'button', class: 'gear-lab tool-hit', 'data-tool': t.id, 'aria-current': t.id === state.tool ? 'true' : null, text: t.short });
      })
    );
  }

  /* ---------- R&E 주제 추천 ---------- */

  function readTopicForm() {
    const checked = (id) => Array.from($(id).querySelectorAll('input:checked'), (input) => input.value);
    const tools = checked('tp-tools');
    const basicOnly = tools.includes('__basic__');
    return {
      careers: checked('tp-careers'),
      keyword: $('tp-keyword').value,
      tools: basicOnly ? [] : tools.length ? tools : null,
      level: $('tp-level').value,
      limit: 6,
    };
  }

  // 진로를 고르지 않고 글만 적었을 때, 글에서 읽은 분야를 알려 준다.
  function renderRead(input) {
    const text = String(input.keyword || '').trim();
    const show = input.careers.length === 0 && text !== '';
    $('tp-read').hidden = !show;
    if (!show) return;
    const read = T.inferCareers(text).slice(0, 3);
    $('tp-read').textContent = read.length
      ? `글에서 읽은 분야: ${read.map((r) => `${r.career} ${Math.round(r.share * 100)}%`).join(', ')}`
      : '적어 준 글만으로는 분야를 못 읽었어요. 진로를 골라 주세요.';
  }

  function topicCard(topic, top, extra, attrs) {
    return el(
      'li',
      null,
      el(
        'button',
        Object.assign({ type: 'button', class: topic.generated ? 'lab-item lab-item--new' : 'lab-item' }, attrs),
        el('span', { class: 'lab-item__unit', text: top }),
        el('strong', { class: 'lab-item__title', text: topic.title }),
        el('span', { class: 'lab-item__concept', text: topic.question }),
        extra ? el('span', { class: 'topic-why', text: extra }) : null
      )
    );
  }

  function renderGenerated(reset) {
    const input = readTopicForm();
    renderRead(input);
    if (reset) state.round = 0;
    const ask = (round) => T.generate({ careers: input.careers, keyword: input.keyword, tools: input.tools, count: 6, round });
    let list = ask(state.round);
    if (!list.length && state.round > 0) {
      state.round = 0; // 끝까지 봤으면 처음으로 돌아간다
      list = ask(0);
    }
    state.generated = list;
    $('tp-gen').replaceChildren(
      ...list.map((topic, i) => topicCard(topic, `새로움 ${Math.round(topic.novelty * 100)}%`, `가장 가까운 기존 주제: ${topic.nearestTitle}`, { 'data-gen': String(i) }))
    );
    $('tp-gen-empty').hidden = list.length > 0;
    $('btn-regenerate').hidden = list.length === 0;
    $('tp-gen-card').hidden = false;
  }

  function renderTopics() {
    const input = readTopicForm();
    renderRead(input);
    const results = T.recommend(input);
    $('tp-results').replaceChildren(
      ...results.map((r, i) => topicCard(r.topic, `${i + 1}순위 · ${T.LEVELS[r.topic.level][1]}`, r.why.join(' · '), { 'data-topic': r.topic.id }))
    );
    $('tp-count').textContent = `${results.length}개 / 전체 ${T.TOPICS.length}개`;
    $('tp-results-card').hidden = false;
  }

  // 주제의 id나, 새로 만든 주제 그 자체를 받는다.
  function showTopic(idOrTopic) {
    const topic = typeof idOrTopic === 'string' ? T.TOPICS.find((t) => t.id === idOrTopic) : idOrTopic;
    if (!topic) return;
    const nearest = topic.generated ? T.TOPICS.find((t) => t.title === topic.nearestTitle) : null;
    const heading = (text) => el('h3', { class: 'lab-h', text });
    const labs = topic.labs.map((labId) => (B ? B.EXPERIMENTS.find((e) => e.id === labId) : null)).filter(Boolean);
    const calcs = topic.calcs.map((calcId) => (L ? L.find(calcId) : null)).filter(Boolean);
    // 없는 부분(null)은 빼고 넣는다. 그대로 넣으면 화면에 "null"이라는 글자가 찍힌다.
    $('tp-detail').replaceChildren(
      ...[
      el('button', { type: 'button', class: 'link-btn', id: 'tp-back', text: TOPIC_MENU ? '← 주제 추천' : '← 홈', onclick: closeTopic }),
      el('p', { class: 'lab-item__unit', text: `${topic.careers.join(' · ')} · ${T.LEVELS[topic.level][1]}` }),
      el('h2', { class: 'lab-detail__title', id: 'tp-title', text: topic.title }),
      topic.generated
        ? el(
            'div',
            { class: 'gen-note', id: 'tp-gen-note' },
            el('p', { text: `재료와 변인을 조합해서 만든 주제예요. 원래 있던 주제 30개와 견준 새로움은 ${Math.round(topic.novelty * 100)}%예요. 실험 방안은 틀에 맞춰 채운 초안이라, 해 볼 만한지와 안전한지는 선생님과 꼭 확인하세요.` }),
            nearest ? el('button', { type: 'button', class: 'btn btn--small', text: `가장 가까운 기존 주제: ${nearest.title}`, onclick: () => showTopic(nearest.id) }) : null
          )
        : null,
      heading('연구 질문'),
      el('p', { text: topic.question }),
      heading('변인'),
      el(
        'dl',
        { class: 'kv kv--text' },
        [['바꾸는 것', topic.change], ['재는 것', topic.measure], ['같게 두는 것', topic.fixed]].map(([k, v]) => el('div', { class: 'kv__row' }, el('dt', { text: k }), el('dd', { text: v })))
      ),
      heading('실험 방안'),
      el('ol', { class: 'recipe__steps' }, topic.plan.map((step) => el('li', { text: step }))),
      heading('준비물'),
      el('ul', { class: 'chips' }, topic.needs.concat(topic.tools).map((n) => el('li', { text: n }))),
      labs.length ? heading('먼저 해 볼 기본 실험') : null,
      labs.length
        ? el('div', { class: 'row-actions', id: 'tp-labs' }, labs.map((lab) => el('button', { type: 'button', class: 'btn btn--small', text: lab.title, onclick: () => { navigate('labs'); showLab(lab.id); } })))
        : null,
      calcs.length ? heading('쓸 수 있는 계산 (계산 도구에 있음)') : null,
      calcs.length ? el('ul', { class: 'chips' }, calcs.map((calc) => el('li', { text: calc.title }))) : null,
      heading('주의'),
      el('ul', { class: 'safety-list' }, el('li', { text: topic.caution })),
      heading('더 나아가기'),
      el('p', { text: topic.extend })
      ].filter(Boolean)
    );
    $('tp-index').hidden = true;
    $('tp-detail').hidden = false;
    window.scrollTo(0, 0);
    $('tp-back').focus();
  }

  function closeTopic() {
    $('tp-detail').hidden = true;
    $('tp-index').hidden = false;
    if (!TOPIC_MENU) {
      state.topicOpen = false;
      navigate('home');
    }
  }

  // 홈의 "오늘의 R&E 주제"에서 주제 하나를 연다.
  function openTopic(id) {
    state.topicOpen = true;
    navigate('topics');
    showTopic(id);
  }

  /* ---------- 레시피·라벨 ---------- */

  const KIND_NAME = { solid: '고체 조제', liquid: '액체 시약', dilution: '희석 계열' };

  function cardNode(card) {
    return el(
      'article',
      { class: `recipe recipe--${card.kind}` },
      el('p', { class: 'recipe__kind', text: KIND_NAME[card.kind] }),
      el('h3', { class: 'recipe__title', text: card.title }),
      el('ol', { class: 'recipe__steps' }, card.steps.map((step) => el('li', { text: step }))),
      card.summary ? el('p', { class: 'recipe__summary', text: card.summary }) : null
    );
  }

  function labelNode(label) {
    return el(
      'div',
      { class: label.caution ? 'label label--caution' : 'label' },
      el('div', { class: 'label__name', text: label.name }),
      el(
        'div',
        { class: 'label__line' },
        el('span', { class: 'label__conc', text: label.conc }),
        label.caution ? el('span', { class: 'label__caution', text: C.TEXT.caution }) : null
      ),
      el(
        'div',
        { class: 'label__meta' },
        el('span', { class: 'label__field' }, el('span', { class: 'label__key', text: '조제일' }), ' ', el('span', { class: label.date ? 'label__date' : 'label__date is-blank', text: label.date })),
        el('span', { class: 'label__field label__field--grow' }, el('span', { class: 'label__key', text: '조제자' }), ' ', el('span', { class: label.maker ? 'label__maker' : 'label__maker is-blank', text: label.maker }))
      )
    );
  }

  function renderPreview() {
    const labels = state.labels;
    const open = state.previewOpen && labels.length > 0;
    $('label-preview').hidden = !open;
    document.body.classList.toggle('has-preview', open);
    $('completion').hidden = !state.previewOpened;
    $('completion-code').textContent = COMPLETION_CODE;

    const box = $('sheets');
    box.replaceChildren();
    if (!open) return;
    const sheets = C.paginate(labels);
    $('preview-count').textContent = `라벨 ${labels.length}개 · A4 ${sheets.length}장`;
    sheets.forEach((sheet, i) => {
      box.append(
        el(
          'figure',
          { class: 'sheet-wrap' },
          el('div', { class: 'sheet' }, el('div', { class: 'sheet__grid' }, sheet.map(labelNode))),
          el('figcaption', { class: 'sheet-cap no-print', text: `${i + 1} / ${sheets.length}장` })
        )
      );
    });
  }

  // 레시피 카드와 라벨의 내용(자료)을 다시 만든다. 화면에 그리는 일은 레시피·라벨 화면이 보일 때만 한다.
  // 다른 화면에서 값을 고치는 동안에는 탭 바의 라벨 수만 바로 고치고, 카드와 미리보기는 그 화면을 열 때 그린다.
  function renderRecipe() {
    const input = readDilution();
    const result = C.computeDilution(input);
    state.cards = C.buildCards(state.list, input.name, result);
    state.labels = C.buildLabels(
      state.list,
      input.name,
      result,
      C.formatDate($('label-date').value),
      $('label-maker').value
    );
    if (state.labels.length === 0) state.previewOpen = false;
    if (state.labels.length > 0) flash('label-note', '');
    // 아래 탭 바의 레시피·라벨 자리에 지금 만들 수 있는 라벨 수를 보여 준다.
    const count = $('tabbar-count');
    if (count) {
      setText(count, String(state.labels.length));
      count.hidden = state.labels.length === 0;
    }
    // 인쇄 규칙(라벨 시트만 인쇄)이 보는 표시는 미루지 않는다.
    document.body.classList.toggle('has-preview', state.previewOpen && state.labels.length > 0);
    if (currentPage === 'recipe') drawRecipe();
    else recipeStale = true;
  }

  function drawRecipe() {
    recipeStale = false;
    $('cards').replaceChildren(...state.cards.map(cardNode));
    $('recipe-empty').hidden = state.cards.length > 0;
    renderPreview();
  }

  function openLabels() {
    if (state.labels.length === 0) {
      flash('label-note', C.TEXT.emptyRecipe, 4000);
      return;
    }
    state.previewOpen = true;
    state.previewOpened = true;
    renderPreview();
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    $('label-preview').scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
  }

  function closeLabels() {
    state.previewOpen = false;
    renderPreview();
    $('btn-labels').focus();
  }

  function printLabels() {
    try {
      window.print();
    } catch (error) {
      // 인쇄 창을 열 수 없는 환경이면 아래 안내만 보여 준다.
    }
    if (window.self !== window.top) {
      flash('print-note', '인쇄 창이 열리지 않으면 이 페이지를 공개 주소로 따로 열어서 인쇄하세요.', 8000);
    }
  }

  /* ---------- 샘플 ---------- */

  // [샘플: 총괄성 실험]: 고체 넷만 조제 목록에 넣는다. 희석 탭은 건드리지 않는다 (SPEC 27장).
  function loadSample() {
    state.list = C.SAMPLE.solids.map((solid) => C.computeSolid(solid).item);
    flash('list-note', '');
    flash('liq-note', '');
    showTab('solid');
    renderAll();
    flash('sample-note', '샘플을 불러왔습니다. 조제 목록을 확인하세요.', 5000);
  }

  // [샘플: 흡광도 실험]: 조제 목록은 그대로 두고 희석 탭만 채운다 (SPEC 27장).
  function loadAbsorbanceSample() {
    const dilution = C.SAMPLE_ABSORBANCE.dilution;
    $('dil-name').value = dilution.name;
    $('dil-stock').value = dilution.stock;
    $('dil-unit').value = dilution.unit;
    $('dil-rows').replaceChildren();
    dilution.rows.forEach((row) => addDilRow(row.conc, row.volume));
    showTab('dilution');
    renderAll();
    flash('sample-note', '흡광도 샘플을 불러왔습니다. 희석 탭을 확인하세요.', 5000);
  }

  function renderAll() {
    renderSolid();
    renderLiquid();
    renderList();
    renderDilution();
    renderSerial();
    renderConvert();
    renderTitration();
    renderColligative();
    renderPH();
    if (drawn.reagents) renderReagents(); // 시약표는 그 화면을 처음 열 때 그린다
    renderRecipe();
  }

  /* ---------- 1분 체험: 계획서의 데모 순서를 차례로 보여 준다 (SPEC 26장) ---------- */

  const TOUR = [
    {
      page: 'solid',
      title: '샘플로 칭량 질량 계산',
      text: '총괄성 실험에 쓸 용액 넷을 샘플로 불러왔어요. 조제 목록에 시약마다 달아야 할 질량이 g 단위 소수 셋째 자리로 나와요.',
      run: () => {
        loadSample();
        flash('sample-note', '');
      },
      spot: '#prep-table',
    },
    {
      page: 'solid',
      title: '수화물 보정',
      text: 'MgCl2·6H2O처럼 물이 붙은 시약은 그 물의 무게까지 넣어 계산해요. "수화물 보정됨" 표시를 보세요. 물을 빼고 계산하면 실제 농도는 목표의 46.8%밖에 안 돼요.',
      spot: '#prep-list .badge--hydrate',
    },
    {
      page: 'dilution',
      title: '원액 하나로 여러 농도',
      text: '100 mg/L 원액 하나로 4가지 농도(0.5·1·2·4 mg/L)를 만들 때 덜어 낼 원액과 넣을 증류수예요. 1 mL보다 적게 덜어야 하는 줄에는 노란 표시가 붙어요.',
      run: () => {
        loadAbsorbanceSample();
        flash('sample-note', '');
      },
      spot: '#dil-table',
    },
    {
      page: 'dilution',
      title: '권장 원액 조제량',
      text: '원액을 모두 얼마나 쓰는지와, 몇 mL 부피 플라스크로 만들면 되는지 알려 줘요. 원액을 넘치게 만들지 않아 폐액도 줄어요.',
      spot: '#dil-summary',
    },
    {
      page: 'recipe',
      title: '레시피 카드',
      text: '칭량 → 녹이기 → 표선 맞추기 → 희석 차례로 정리한 카드예요. 이대로 따라 하면 돼요.',
      spot: '#cards',
    },
    {
      page: 'recipe',
      title: '한글 라벨',
      text: '한글 이름, 농도, 조제일, 조제자가 들어간 라벨을 A4 한 장에 12개까지 뽑아요. 공용 실험실에서 누가 만든 무슨 용액인지 바로 알 수 있어요.',
      run: () => openLabels(),
      spot: '#sheets',
    },
    {
      page: 'recipe',
      title: '체험 끝',
      text: '여기까지가 1분 체험이에요. 아래의 체험 완료 코드를 보여 주세요. 다른 기능은 홈의 네모에서 열 수 있어요.',
      spot: '#completion',
    },
  ];

  function tourSpot(selector) {
    for (const node of document.querySelectorAll('.tour-spot')) node.classList.remove('tour-spot');
    if (!selector) return;
    const node = document.querySelector(selector);
    if (!node) return;
    node.classList.add('tour-spot');
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = calm ? 'auto' : 'smooth';
    // 안내 카드는 화면 아래쪽에 떠 있다(휴대폰에서는 가로로 다 덮는다). 비출 것을 화면 한가운데에 맞추면 작은 표시(수화물 배지,
    // 권장 원액 조제량, 체험 완료 코드)가 카드 뒤에 숨었다(휴대폰은 화면 높이 710px쯤부터, 노트북도 650px쯤이면).
    // 카드와 가로로 겹치는 것은 머리 줄 아래부터 카드 위까지의 빈 자리에 맞춘다: 다 들어가면 그 가운데에, 더 크면 윗부분부터 보이게.
    const card = $('tour').getBoundingClientRect();
    const box = node.getBoundingClientRect();
    const rootStyle = window.getComputedStyle(document.documentElement);
    const pad = parseFloat(rootStyle.scrollPaddingTop); // 머리 줄이 가리는 높이 (style.css의 scroll-padding-top)
    const inset = parseFloat(rootStyle.paddingTop); // 노치 자리 (style.css가 html에 준 safe-area 여백. 보통은 0)
    const top = (Number.isFinite(pad) ? pad : 0) + (Number.isFinite(inset) ? inset : 0) + 8; // + 테두리 표시가 보일 틈
    const room = card.top - 8 - top;
    const overlap = Math.min(card.right, box.right) - Math.max(card.left, box.left);
    // 빈 자리보다 조금(32px까지) 큰 것도 가운데에 둔다. 위아래로 16px씩 넘는 만큼은 틈 안이라 글이 가려지지 않는다.
    const fits = box.height <= room + 32;
    // 빈 자리가 140px보다 좁은데 그보다 큰 것은 전처럼 화면 가운데에 둔다(윗부분만 조금 보이는 것보다 낫다).
    if (overlap > 0 && room > 0 && (fits || room >= 140)) {
      const offset = fits ? (room - box.height) / 2 : 0;
      // 지금 위치에서 옮길 곳을 계산해 그 자리로 간다(앞 단계의 부드러운 이동이 끝나기 전에 불려도 같은 곳에 닿는다).
      window.scrollTo({ top: window.scrollY + box.top - top - offset, behavior });
      return;
    }
    node.scrollIntoView({ behavior, block: 'center' });
  }

  function showTourStep(index) {
    const step = TOUR[index];
    state.tour = index;
    ensureDrawn(step.page);
    if (currentPage !== step.page) navigate(step.page);
    if (step.run && !state.tourDone[index]) {
      step.run();
      state.tourDone[index] = true;
    }
    if (step.page === 'recipe' && recipeStale) drawRecipe();
    $('tour').hidden = false;
    document.body.classList.add('has-tour');
    $('tour-step').textContent = `1분 체험 · ${index + 1} / ${TOUR.length}`;
    $('tour-title').textContent = step.title;
    $('tour-text').textContent = step.text;
    $('tour-fill').style.width = `${((index + 1) / TOUR.length) * 100}%`;
    $('tour-prev').disabled = index === 0;
    $('tour-next').textContent = index === TOUR.length - 1 ? '끝내기' : '다음';
    // 화면이 바뀐 뒤에 비춘다
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => tourSpot(step.spot)));
  }

  function startTour() {
    state.tourDone = {};
    showTourStep(0);
    $('tour-next').focus();
  }

  function endTour() {
    state.tour = -1;
    $('tour').hidden = true;
    document.body.classList.remove('has-tour');
    tourSpot(null);
  }

  function setupTour() {
    // 홈의 큰 그림 아래쪽과 할 일 버튼 아래, 두 곳에서 시작할 수 있다
    for (const button of document.querySelectorAll('[data-tour-start]')) button.addEventListener('click', startTour);
    $('tour-next').addEventListener('click', () => {
      if (state.tour >= TOUR.length - 1) {
        endTour();
        navigate('home');
        return;
      }
      showTourStep(state.tour + 1);
    });
    $('tour-prev').addEventListener('click', () => {
      if (state.tour > 0) showTourStep(state.tour - 1);
    });
    $('tour-close').addEventListener('click', endTour);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && state.tour >= 0) endTour();
    });
  }

  /* ---------- 시작 ---------- */

  function initSelects() {
    for (const reagent of C.REAGENTS) $('reagent-builtin').append(el('option', { value: reagent.id, text: reagent.id }));
    // 학교 시약표에서 고른 자주 쓰는 시약을 묶음별로 넣는다 (시약표가 없으면 아무것도 넣지 않는다).
    for (const group of C.commonReagents()) {
      const node = el('optgroup', { label: `자주 쓰는 시약 · ${group.name}`, class: 'reagent-common' });
      for (const reagent of group.reagents) node.append(el('option', { value: reagent.id, text: `${reagent.korean} (${reagent.formula})` }));
      $('reagent').insertBefore(node, $('reagent-school'));
    }
    $('reagent').append(el('option', { value: C.CUSTOM_ID, text: '직접 입력' }));
    fillSelect('unit', C.UNITS);
    fillSelect('dil-unit', C.DILUTION_UNITS);
    fillSelect('ser-unit', C.DILUTION_UNITS);
    fillSelect('liq-unit', C.LIQUID_UNITS);
    fillSelect('cv-unit', C.CONVERT_UNITS);

    for (const preset of C.LIQUID_PRESETS) {
      state.liquidOptions[preset.id] = {
        name: preset.korean,
        label: preset.label,
        formula: preset.formula,
        molarMass: String(preset.molarMass),
        percent: preset.percent,
        density: preset.density,
        caution: true,
        info:
          `대표값(함량 ${preset.percent}%, 밀도 ${preset.density} g/mL)을 넣어 뒀어요. 병 라벨과 다르면 고쳐 쓰세요.` +
          (preset.id === 'NH3' ? ' 함량은 NH₃ 기준입니다.' : ''),
      };
      $('liq-presets').append(el('option', { value: preset.id, text: `${preset.korean} (${preset.formula})` }));
    }
    state.liquidOptions[C.CUSTOM_ID] = {
      name: '',
      label: '',
      formula: '',
      molarMass: '',
      percent: '',
      density: '',
      caution: false,
      info: '시약 이름과 몰질량, 병 라벨의 함량·밀도를 넣어 주세요.',
    };
    $('liq-reagent').append(el('option', { value: C.CUSTOM_ID, text: '직접 입력' }));

    $('cv-reagent').append(el('option', { value: '', text: '직접 입력' }));
    for (const reagent of C.REAGENTS) $('cv-reagent').append(el('option', { value: reagent.id, text: reagent.id }));

    for (const solvent of C.SOLVENTS) $('co-solvent').append(el('option', { value: solvent.id, text: solvent.korean }));
    $('co-solvent').append(el('option', { value: '', text: '직접 입력' }));
  }

  function init() {
    initSelects();
    $('purity').value = C.DEFAULT_PURITY;
    $('label-date').value = todayISO();
    $('recipe-empty').textContent = C.TEXT.emptyRecipe;
    $('btn-find').textContent = `시약표에서 찾기 (${C.SCHOOL_COUNT}종)`;
    $('btn-find').hidden = C.SCHOOL_COUNT === 0;
    addDilRow('', '');
    applyLiquidOption();
    applySolvent();

    // 아이폰 사파리는 터치 리스너가 걸려 있어야 :active(누르는 동안의 표시)를 적용한다. 아무 일도 하지 않는 리스너를 하나 걸어 둔다.
    document.addEventListener('touchstart', () => {}, { passive: true });

    // 화면 이동
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-go]');
      if (target) {
        navigate(target.dataset.go);
        return;
      }
      const link = event.target.closest('a[href^="#"]');
      const name = link ? link.getAttribute('href').slice(1) : '';
      if (PAGES[name]) {
        event.preventDefault();
        openPage(name);
      }
    });
    for (const link of document.querySelectorAll('a[href^="#"]')) {
      const name = link.getAttribute('href').slice(1);
      if (PAGES[name] && !available(name)) link.hidden = true;
      if (name === 'topics' && link.dataset.nav) link.hidden = !TOPIC_MENU || !available('topics');
    }
    $('btn-menu').addEventListener('click', () => setMenu(!$('site-menu').classList.contains('is-open')));
    $('btn-search').addEventListener('click', () => {
      if (!$('site-search-form').classList.contains('is-open')) setSearch(true);
      else if ($('site-search').value.trim()) $('site-search-form').requestSubmit();
      else setSearch(false);
    });
    $('site-search').addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      setSearch(false);
      $('btn-search').focus();
    });
    if (available('search')) {
      $('search-suggest').replaceChildren(el('span', { class: 'search-suggest__label', text: '이런 말로 찾아보세요' }), ...SEARCH_SUGGEST.map((word) => el('button', { type: 'button', class: 'filter-chip', 'data-word': word, text: word })));
      $('search-suggest').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-word]');
        if (!button) return;
        $('search-input').value = button.dataset.word;
        renderSearch();
        $('search-input').focus();
      });
      $('search-input').addEventListener('input', renderSearch);
      $('search-form').addEventListener('submit', (event) => {
        event.preventDefault();
        renderSearch();
      });
      $('lab-everywhere').addEventListener('click', () => searchSite($('lab-query').value));
      // 검색 화면의 첫 모습은 그 화면을 처음 열 때 그린다 (FIRST_DRAW).
    }
    $('site-search-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const query = $('site-search').value.trim();
      if (!query) return;
      $('site-search').value = '';
      searchSite(query);
    });
    setupTheme();
    $('btn-back').addEventListener('click', goBack);
    window.addEventListener('hashchange', () => {
      if (openSharedHash()) return;
      const name = window.location.hash.slice(1) || 'home';
      if (name !== currentPage) renderPage(name);
      syncHash();
    });

    // 고체 조제
    $('solid-form').addEventListener('input', renderSolid);
    $('solid-form').addEventListener('change', renderSolid);
    $('solid-form').addEventListener('submit', (event) => {
      event.preventDefault();
      addItem(state.solid, 'list-note');
    });
    // [목록에 추가]가 폼 밖(결과 카드)에 있어서 입력 칸에서 엔터를 눌러도 위의 submit이 일어나지 않았다.
    // 입력 칸의 엔터를 직접 받아 같은 일을 한다. 한글을 조합하는 중의 엔터(글자 확정)는 넘긴다.
    $('solid-form').addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.isComposing || event.target.tagName !== 'INPUT') return;
      event.preventDefault();
      addItem(state.solid, 'list-note');
    });
    $('btn-add').addEventListener('click', () => addItem(state.solid, 'list-note'));
    // 조제 목록의 [삭제]: 표에 리스너 하나만 걸어 둔다.
    $('prep-list').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-remove]');
      if (button) removeItem(Number(button.dataset.remove));
    });
    $('btn-find').addEventListener('click', () => {
      showTab('reagents');
      $('rg-query').focus();
    });

    // 액체 시약
    for (const reagent of C.commonLiquids()) registerLiquid(reagent);
    $('liq-reagent').addEventListener('change', applyLiquidOption);
    onForm('liq-form', renderLiquid);
    $('btn-liq-add').addEventListener('click', () => addItem(state.liquid, 'liq-note'));

    // 희석
    const onDilution = () => {
      renderDilution();
      renderRecipe();
    };
    onForm('dil-form', onDilution);
    $('dil-rows').addEventListener('click', (event) => {
      const button = event.target.closest('.dil-del');
      if (!button) return;
      removeDilRow(button.closest('.dil-row'));
      onDilution();
    });
    $('btn-add-row').addEventListener('click', () => {
      const row = addDilRow('', '');
      onDilution();
      if (row) row.querySelector('.dil-conc').focus();
    });
    onForm('ser-form', renderSerial);

    // 계산 도구
    $('cv-reagent').addEventListener('change', () => {
      const reagent = C.findReagent($('cv-reagent').value);
      $('cv-mm').value = reagent ? String(reagent.molarMass) : '';
      if (!reagent) $('cv-mm').focus(); // 직접 입력: 몰질량 칸으로
    });
    $('cv-mm').addEventListener('input', () => {
      $('cv-reagent').value = '';
    });
    onForm('cv-form', renderConvert);
    onForm('ti-form', renderTitration);
    $('co-solvent').addEventListener('change', applySolvent);
    for (const id of ['co-kf', 'co-kb', 'co-fp', 'co-bp']) {
      $(id).addEventListener('input', () => {
        $('co-solvent').value = '';
      });
    }
    onForm('co-form', renderColligative);
    onForm('ph-form', renderPH);

    // 시약표
    const onSearch = () => {
      state.shown = PAGE;
      renderReagents();
    };
    $('rg-query').addEventListener('input', onSearch);
    $('rg-filter').addEventListener('change', onSearch);
    $('rg-more').addEventListener('click', () => {
      state.shown += PAGE;
      renderReagents();
    });
    $('rg-list').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-use]');
      if (!button) return;
      if (button.dataset.use === 'liquid') useInLiquid(button.dataset.id);
      else useInSolid(button.dataset.id);
    });

    // 레시피·라벨
    $('label-date').addEventListener('input', renderRecipe);
    $('label-date').addEventListener('change', renderRecipe);
    $('label-maker').addEventListener('input', renderRecipe);
    $('btn-labels').addEventListener('click', openLabels);
    $('btn-close').addEventListener('click', closeLabels);
    $('btn-print').addEventListener('click', printLabels);
    // 다른 화면에서 값을 고친 채 바로 인쇄해도 라벨이 최신이게, 인쇄 직전에 미뤄 둔 그리기를 마친다.
    window.addEventListener('beforeprint', () => {
      if (recipeStale) drawRecipe();
    });
    $('btn-sample').addEventListener('click', loadSample);
    $('btn-sample-abs').addEventListener('click', loadAbsorbanceSample);
    $('btn-sample-abs-dil').addEventListener('click', loadAbsorbanceSample); // 좁은 화면에서는 머리의 버튼 대신 희석 탭의 이 버튼을 쓴다
    setupTour();

    // 실험과 실험 계산 모음 (labcalc.js나 experiments.js를 빼면 숨는다)
    const labsReady = Boolean(L && B);
    // 계산 도구, 이론값 계산, 적정 곡선, 결과 정리, 준비표, 실험 목록, 색이 변하는 실험, 준비물은 그 화면을 처음 열 때 그린다 (FIRST_DRAW).
    // 조제 목록 보관·공유는 레시피·라벨 화면의 버튼이라 바로 준비한다.
    if (SH) setupShare();
    else $('share-card').hidden = true;
    // 실험을 여는 버튼은 어디에 있든 data-lab으로 연다 (색이 변하는 실험, 준비물, 계산 도구의 관련 실험)
    for (const [box, from] of [['colors-list', 'colors'], ['gear-list', 'gear'], ['tool-head', 'labs'], ['theory-head', 'theory']]) {
      $(box).addEventListener('click', (event) => {
        const button = event.target.closest('button[data-lab]');
        if (button) openLab(button.dataset.lab, from);
      });
    }
    if (labsReady) {
      $('lab-unit').append(el('option', { value: '', text: '전체 단원' }));
      for (const unit of B.UNITS) $('lab-unit').append(el('option', { value: unit, text: unit }));
      $('lab-unit').addEventListener('change', renderLabList);
      $('lab-query').addEventListener('input', renderLabList);
      $('lab-cats').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-cat]');
        if (!button) return;
        $('lab-unit').value = button.dataset.cat;
        renderLabList();
      });
      $('lab-list').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-lab]');
        if (button) showLab(button.dataset.lab);
      });
      $('colors-units').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-color-unit]');
        if (!button) return;
        state.colorUnit = button.dataset.colorUnit;
        renderColors();
      });
      $('gear-cats').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-gear-cat]');
        if (!button) return;
        state.gearCat = button.dataset.gearCat;
        renderGear();
      });
      $('gear-list').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-more], button[data-how]');
        if (!button) return;
        const [key, box] = button.dataset.more ? ['more', state.gearOpen] : ['how', state.gearHowOpen];
        const id = button.dataset[key];
        box[id] = !box[id];
        renderGear();
        const again = $('gear-list').querySelector(`button[data-${key}="${id}"]`);
        if (again) again.focus();
      });
      $('gear-query').addEventListener('input', renderGear);
      $('gear-how-only').addEventListener('click', () => {
        state.gearHowOnly = !state.gearHowOnly;
        renderGear();
      });
    }

    if (T) {
      const box = (id, value, text) => el('label', { class: 'check' }, el('input', { type: 'checkbox', value, id: null }), el('span', { text }));
      $('tp-careers').append(...T.CAREERS.map((c) => box('tp-careers', c, c)));
      $('tp-tools').append(...T.TOOLS.map((t) => box('tp-tools', t, t)), box('tp-tools', '__basic__', '기본 유리 기구만'));
      for (const [value, label] of T.LEVELS) $('tp-level').append(el('option', { value: String(value), text: label }));
      $('tp-form').addEventListener('submit', (event) => {
        event.preventDefault();
        renderTopics();
      });
      // 추천 주제(아무것도 고르지 않은 상태의 추천)는 그 화면을 처음 열 때 그린다 (FIRST_DRAW).
      $('tp-results').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-topic]');
        if (button) showTopic(button.dataset.topic);
      });
      $('btn-generate').addEventListener('click', () => {
        renderGenerated(true);
        $('tp-gen-card').scrollIntoView({ block: 'nearest' });
      });
      $('btn-regenerate').addEventListener('click', () => {
        state.round += 1;
        renderGenerated(false);
      });
      $('tp-gen').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-gen]');
        if (button) showTopic(state.generated[Number(button.dataset.gen)]);
      });
      // "어떻게 고르고 만드나요?"에 들어가는 숫자. 주제를 하나씩 빼고 시험하는 계산이 시작 시간의 대부분을 차지해서
      // (느린 기기에서 0.2초쯤) 설명을 펼칠 때 한 번만 한다. 추천 화면을 메뉴에 둘 때는 화면이 뜬 뒤 한가할 때 미리 해 둔다.
      let howReady = false;
      const fillHow = () => {
        if (howReady) return;
        howReady = true;
        const score = T.evaluateInference();
        $('tp-eval').textContent = `주제를 하나씩 빼고 시험해 보니 ${score.total}개 중 ${score.top1}개를 맞혔어요. 제일 흔한 분야로만 찍으면 ${score.baseline}개예요.`;
        $('tp-combos').textContent = `지금 만들 수 있는 조합은 ${T.countCombinations()}가지예요.`;
      };
      const how = $('tp-form').querySelector('details.how');
      if (!how) fillHow();
      else {
        how.addEventListener('toggle', () => {
          if (how.open) fillHow();
        });
        if (how.open) fillHow();
        else if (TOPIC_MENU && window.requestIdleCallback) window.requestIdleCallback(() => fillHow());
        else if (TOPIC_MENU) window.setTimeout(fillHow, 1500);
      }
    }

    renderAll();
    setupHome();
    if (!openSharedHash()) {
      renderPage(window.location.hash.slice(1) || 'home');
      if (window.location.hash) syncHash();
    }
  }

  init();
})();
