// 실험 계획서: 실험을 고르면 계획서 초안을 채우고, 학교 양식 파일을 넣으면 그 항목 차례에 맞춘다 (SPEC 24장).
// 화면은 app.js가 그린다. 여기에는 계획서의 항목, 실험마다의 목적과 변인, 초안을 만드는 규칙, 양식의 항목을 읽는 규칙이 있다.
(function () {
  'use strict';

  // 계획서의 항목. keys는 양식 파일의 항목 이름을 알아볼 때 쓰는 말이다(띄어쓰기는 빼고 견준다).
  const SECTIONS = [
    { id: 'title', name: '실험 제목', keys: ['실험제목', '제목', '주제', '실험명', '탐구주제'] },
    { id: 'purpose', name: '실험 목적', keys: ['실험목적', '목적', '목표', '학습목표', '탐구목적'] },
    { id: 'question', name: '탐구 질문', keys: ['탐구질문', '탐구문제', '문제인식', '질문', '동기'] },
    { id: 'theory', name: '이론적 배경', keys: ['이론적배경', '이론', '배경', '원리', '관련개념', '개념', '선행지식'] },
    { id: 'hypothesis', name: '가설', keys: ['가설', '예상가설'] },
    { id: 'variables', name: '변인', keys: ['변인통제', '변인', '조작변인', '통제변인', '종속변인', '독립변인'] },
    { id: 'materials', name: '준비물', keys: ['준비물', '실험기구', '기구', '재료', '도구', '실험장치', '장치', '준비'] },
    { id: 'reagents', name: '시약과 조제', keys: ['시약및조제', '시약조제', '시약', '약품', '용액조제', '조제'] },
    { id: 'steps', name: '실험 과정', keys: ['실험과정', '실험방법', '과정', '방법', '절차', '순서'] },
    { id: 'expected', name: '예상 결과', keys: ['예상결과', '결과예측', '예측', '기대효과', '기대결과'] },
    { id: 'record', name: '결과 기록표', keys: ['결과기록', '기록표', '관찰기록', '측정결과', '실험결과', '데이터', '결과'] },
    { id: 'safety', name: '안전 수칙', keys: ['안전수칙', '안전', '주의사항', '유의사항', '주의', '유의점'] },
    { id: 'waste', name: '폐액 처리', keys: ['폐액처리', '폐액', '폐수', '폐기물', '뒷정리', '정리정돈'] },
    { id: 'roles', name: '역할 분담', keys: ['역할분담', '역할', '분담', '조원'] },
    { id: 'schedule', name: '일정', keys: ['일정', '추진일정', '시간계획', '계획표'] },
    { id: 'refs', name: '참고 자료', keys: ['참고문헌', '참고자료', '참고', '출처', '문헌'] },
    // 실험 보고서에만 쓰는 항목 (SPEC 25장). 계획서 양식에 있으면 빈칸으로 둔다.
    { id: 'analysis', name: '분석', keys: ['오차분석', '결과분석', '자료분석', '자료해석', '분석', '해석'] },
    { id: 'discussion', name: '고찰', keys: ['결과및고찰', '고찰', '토의', '토론', '논의'] },
    { id: 'conclusion', name: '결론', keys: ['결론및제언', '결론', '제언', '느낀점', '배운점', '소감'] },
  ];
  const SECTION = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
  // 양식 파일이 없을 때의 차례
  const DEFAULT_ORDER = ['purpose', 'theory', 'hypothesis', 'variables', 'materials', 'reagents', 'steps', 'expected', 'record', 'safety', 'waste'];
  // 실험 보고서의 차례와, 보고서에서 다르게 부르는 이름
  const REPORT_ORDER = ['purpose', 'theory', 'materials', 'reagents', 'steps', 'record', 'analysis', 'discussion', 'conclusion', 'refs'];
  const REPORT_NAME = { record: '실험 결과', reagents: '시약', refs: '참고 자료' };

  // 실험마다의 목적과 변인. change: 조작 변인(없으면 null) · measure: 종속 변인(재는 것) · keep: 통제 변인
  const LAB_PLAN = {
    hydrate: { purpose: '황산 구리(II) 수화물을 가열해 잃은 물의 질량으로 결정수의 수를 구한다.', change: null, measure: '가열 전후의 질량 (잃은 물의 질량)', keep: ['가열하는 시간과 불의 세기', '식힐 때 공기 중의 수분을 막는 방법'] },
    mgo: { purpose: '마그네슘을 태워 생긴 산화 마그네슘의 질량으로 실험식을 구한다.', change: null, measure: '태우기 전후의 질량', keep: ['도가니 뚜껑을 여는 정도', '가열하는 시간'] },
    limiting: { purpose: '같은 양의 염산에 탄산 칼슘의 양을 바꿔 넣으며 한계 반응물을 찾는다.', change: '탄산 칼슘의 질량', measure: '빠져나간 이산화 탄소의 질량', keep: ['염산의 농도와 부피', '온도'] },
    precipitate: { purpose: '앙금 생성 반응으로 용액 속에 있는 이온을 확인한다.', change: '섞는 두 용액의 조합', measure: '앙금이 생기는지와 앙금의 색', keep: ['용액의 농도', '넣는 방울 수'] },
    standard: { purpose: '고체 시약으로 정확한 농도의 표준 용액을 만들고 원하는 농도로 묽힌다.', change: null, measure: '단 질량과 만든 용액의 농도', keep: ['부피 플라스크의 표선 맞추기', '온도'] },
    beer: { purpose: '농도를 아는 용액의 흡광도로 검량선을 그리고 모르는 용액의 농도를 구한다.', change: '메틸렌 블루 용액의 농도', measure: '흡광도', keep: ['파장', '같은 큐벳', '온도'] },
    'gas-constant': { purpose: '마그네슘과 염산이 반응해 나온 수소의 부피로 기체 상수 R을 구한다.', change: null, measure: '수소 기체의 부피, 온도, 압력', keep: ['마그네슘의 질량', '염산의 농도'] },
    graham: { purpose: '암모니아와 염화 수소가 퍼져 만나는 자리로 두 기체의 확산 속도를 비교한다.', change: null, measure: '양 끝에서 흰 고리까지의 거리', keep: ['솜에 적신 양', '유리관의 굵기와 길이', '온도'] },
    'neutralization-heat': { purpose: '염산과 수산화 나트륨 수용액이 중화될 때 나온 열로 중화열을 구한다.', change: null, measure: '섞기 전후의 온도 차', keep: ['두 용액의 처음 온도', '용액의 부피와 농도', '열량계'] },
    hess: { purpose: '세 반응의 반응열을 재어 헤스 법칙이 성립하는지 확인한다.', change: '반응의 경로', measure: '각 반응의 온도 변화 (반응열)', keep: ['수산화 나트륨의 질량', '물과 염산의 부피', '처음 온도'] },
    'dissolution-heat': { purpose: '질산 암모늄과 염화 칼슘이 물에 녹을 때의 온도 변화로 용해 엔탈피를 구한다.', change: '녹이는 물질의 종류', measure: '온도 변화', keep: ['물질의 질량', '물의 부피', '처음 온도'] },
    freezing: { purpose: '용액의 어는점 내림을 재어 용질의 분자량을 구하고 입자 수의 영향을 비교한다.', change: '용질의 종류와 농도', measure: '어는점', keep: ['용매의 양', '한제(얼음과 소금)의 비', '젓는 속도'] },
    conductivity: { purpose: '여러 용액의 전기 전도성을 비교해 전해질과 비전해질을 구별한다.', change: '용액의 종류', measure: '전도도 (또는 LED의 밝기)', keep: ['용액의 농도', '전극을 담그는 깊이', '전압'] },
    'rate-conc': { purpose: '티오황산 나트륨의 농도를 바꾸며 반응 속도를 비교하고 반응 차수를 구한다.', change: '티오황산 나트륨의 농도', measure: '× 표시가 보이지 않게 될 때까지 걸린 시간', keep: ['염산의 농도와 부피', '온도', '용액의 전체 부피'] },
    'rate-temp': { purpose: '온도를 바꾸며 반응 시간을 재어 활성화 에너지를 구한다.', change: '온도', measure: '반응 시간', keep: ['두 용액의 농도와 부피'] },
    'iodine-clock': { purpose: '아이오딘 시계 반응으로 반응물의 농도와 반응 속도의 관계를 알아본다.', change: '아이오딘화 칼륨의 농도', measure: '파란색이 나타날 때까지 걸린 시간', keep: ['티오황산 나트륨의 양', '온도', '녹말의 양'] },
    'le-chatelier': { purpose: '농도와 온도를 바꿀 때 평형이 이동하는 방향을 색 변화로 확인한다.', change: '넣는 물질과 온도', measure: '용액의 색 (붉은색이 짙어지는지)', keep: ['처음 용액의 양', '비교용 시험관'] },
    ksp: { purpose: '수산화 칼슘 포화 용액을 염산으로 적정해 용해도곱 상수를 구한다.', change: null, measure: '중화점까지 넣은 염산의 부피', keep: ['포화 용액의 온도', '덜어 낸 용액의 양'] },
    'cobalt-eq': { purpose: '염화 코발트 용액의 색 변화로 평형의 이동을 확인한다.', change: '넣는 진한 염산·물의 양과 온도', measure: '용액의 색 (분홍 ⇌ 파랑)', keep: ['처음 용액의 양'] },
    'copper-ammine': { purpose: '구리(II) 이온에 암모니아를 넣어 착이온이 생기는 색 변화를 관찰한다.', change: '넣는 암모니아수의 양', measure: '용액의 색과 앙금', keep: ['황산 구리 수용액의 양과 농도'] },
    vinegar: { purpose: '중화 적정으로 식초 속 아세트산의 몰 농도와 함량(%)을 구한다.', change: null, measure: '중화점까지 넣은 수산화 나트륨 수용액의 부피', keep: ['식초 시료의 양', '지시약의 양', '종말점 판단 (분홍색이 30초 유지)'] },
    'weak-acid': { purpose: '아세트산 수용액의 pH로 이온화 상수 Ka와 이온화도를 구한다.', change: '아세트산의 농도', measure: 'pH', keep: ['온도', 'pH 미터 보정'] },
    buffer: { purpose: '아세트산과 아세트산 나트륨으로 완충 용액을 만들고 완충 작용을 확인한다.', change: '용액의 종류 (완충 용액, 증류수)', measure: '산·염기를 넣었을 때의 pH 변화', keep: ['넣는 산·염기의 양과 농도', '용액의 부피'] },
    'indicator-range': { purpose: '여러 pH의 용액에 지시약을 넣어 지시약의 변색 범위를 찾는다.', change: '용액의 pH', measure: '지시약의 색', keep: ['지시약의 양', '용액의 부피'] },
    'red-cabbage': { purpose: '적양배추 즙으로 지시약을 만들고 생활 속 용액의 산성·염기성을 알아본다.', change: '용액의 종류', measure: '적양배추 지시약의 색', keep: ['지시약의 양', '용액의 양'] },
    permanganate: { purpose: '과망가니즈산 칼륨 적정으로 과산화 수소수의 농도를 구한다.', change: null, measure: '종말점까지 넣은 과망가니즈산 칼륨 용액의 부피', keep: ['시료의 양', '황산의 양', '종말점 판단 (연분홍이 30초 유지)'] },
    daniell: { purpose: '다니엘 전지를 만들어 전지 전위를 재고 네른스트 식의 값과 비교한다.', change: '황산 구리(II) 수용액의 농도', measure: '전지 전위 (V)', keep: ['전해질의 부피', '염다리', '온도'] },
    electrolysis: { purpose: '황산 구리(II) 수용액을 전기 분해해 전극의 질량 변화로 패러데이 법칙을 확인한다.', change: null, measure: '(−)극 구리판의 늘어난 질량', keep: ['전류 (0.50 A)', '전류를 흘린 시간', '용액의 농도'] },
    'blue-bottle': { purpose: '푸른 병 반응으로 산화·환원에 따른 색 변화를 관찰한다.', change: '흔드는 횟수', measure: '파란색이 사라질 때까지 걸린 시간', keep: ['포도당과 수산화 나트륨의 양', '온도'] },
    'traffic-light': { purpose: '신호등 반응으로 인디고 카민의 산화·환원 색 변화를 관찰한다.', change: '용액의 온도', measure: '색이 바뀔 때까지 걸린 시간', keep: ['포도당과 수산화 나트륨의 양', '흔드는 세기'] },
    'metal-activity': { purpose: '금속을 여러 금속 이온 용액에 넣어 금속의 반응성 순서를 정한다.', change: '금속과 용액의 조합', measure: '금속 표면과 용액의 색 변화', keep: ['용액의 농도와 양', '지켜보는 시간'] },
    'ki-electrolysis': { purpose: '아이오딘화 칼륨 수용액을 전기 분해해 두 전극에서 생기는 물질을 확인한다.', change: null, measure: '전극 주변의 색 변화', keep: ['전압', '용액의 농도'] },
    'vitamin-c': { purpose: '아이오딘 적정으로 비타민 C 정제 속 비타민 C의 양을 구한다.', change: null, measure: '종말점까지 넣은 아이오딘 용액의 부피', keep: ['시료의 양', '녹말의 양'] },
  };

  // 받침이 있으면 true (조사 고르기)
  function hasBatchim(word) {
    const ch = String(word || '').trim().slice(-1);
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
    return /[013678LMNRlmnr]$/.test(ch); // 로마자·숫자는 읽는 소리로 대강
  }
  const josa = (word, withB, without) => `${word}${hasBatchim(String(word).replace(/\s*\(.*\)$/, '')) ? withB : without}`;

  const bullet = (items) => items.filter(Boolean).map((item) => `- ${item}`).join('\n');
  const numbered = (items) => items.filter(Boolean).map((item, i) => `${i + 1}. ${item}`).join('\n');

  // 실험 하나의 계획서 초안. deps: { C, L, TH, W, B } (calc, labcalc, theory, waste, experiments). opts: { groups }
  function draft(lab, deps, opts) {
    const o = opts || {};
    const groups = o.groups > 1 ? Math.round(o.groups) : 1;
    const info = LAB_PLAN[lab.id] || {};
    const out = {};
    out.title = lab.title;
    out.purpose = info.purpose || '';
    out.question = info.change ? `${josa(info.change, '을', '를')} 바꾸면 ${josa(info.measure, '은', '는')} 어떻게 달라질까?` : '실험으로 구한 값은 이론값(또는 문헌값)과 얼마나 같을까?';
    const model = deps.TH && deps.TH.find ? deps.TH.find(lab.id) : null;
    out.theory = [lab.concept, model && model.equation && !lab.concept.includes(model.equation) ? `관계식: ${model.equation}` : ''].filter(Boolean).join('\n');
    out.hypothesis = info.change
      ? `${josa(info.change, '이', '가')} 커질수록 ${josa(info.measure, '은', '는')} (커질 / 작아질) 것이다. 까닭: `
      : '실험값은 이론값에 가깝게 나올 것이다. 차이가 난다면 (          ) 때문일 것이다.';
    out.variables = [
      `조작 변인: ${info.change || '없음 (같은 조건으로 되풀이해 잰다)'}`,
      `종속 변인: ${info.measure || ''}`,
      `통제 변인: ${(info.keep || []).join(', ')}`,
    ].join('\n');
    const always = deps.B && deps.B.EQUIPMENT ? deps.B.EQUIPMENT.filter((g) => g.always).map((g) => g.name) : [];
    out.materials = bullet(lab.materials.concat(always.length ? [`기본: ${always.join(', ')}`] : []));
    if (deps.L && deps.L.prepareReagent) {
      out.reagents = bullet(
        lab.reagents.map((spec) => {
          const r = deps.L.prepareReagent(spec, groups);
          if (spec.text) return r.amount ? `${r.name}: ${r.amount}` : r.name;
          const name = r.formula ? `${r.name} (${r.formula})` : r.name;
          return `${name} ${r.target}${r.amount ? ` — ${r.amount}` : ''}`;
        })
      ) + (groups > 1 ? `\n(${groups}조 분량)` : '');
    } else {
      out.reagents = bullet(lab.reagents.map((spec) => spec.text || spec.name || spec.id || spec.preset));
    }
    out.steps = numbered(lab.steps);
    const expected = [];
    if (model && deps.TH.run && deps.TH.defaults) {
      const r = deps.TH.run(lab.id, deps.TH.defaults(lab.id));
      if (r.ok && r.primary && Number.isFinite(r.primary.value)) {
        const v = deps.C && deps.C.formatSig ? deps.C.formatSig(r.primary.value, 4) : String(r.primary.value);
        expected.push(`이론대로라면 ${r.primary.label}: ${v}${r.primary.unit ? ` ${r.primary.unit}` : ''} (이론값 계산의 처음 값으로 계산)`);
      }
    }
    if (lab.colors && lab.colors.steps) expected.push(`색 변화${lab.colors.note ? `(${lab.colors.note.replace(/[()]/g, '')})` : ''}: ${lab.colors.steps.map(([name]) => name).join(` ${lab.colors.sep || '→'} `)}`);
    if (lab.wrap) expected.push(lab.wrap);
    out.expected = expected.join('\n');
    out.record = recordTable(lab, deps);
    out.safety = bullet(lab.caution.concat(['보안경과 실험복을 입고, 시약은 손으로 만지지 않는다.']));
    out.waste = deps.W && deps.W.labLines ? bullet(deps.W.labLines(lab, deps.C)) : '';
    out.roles = '';
    out.schedule = '';
    out.refs = '';
    return out;
  }

  // 결과 기록표: 대표값이 있는 실험은 그 값의 칸, 아니면 측정값·관찰 칸
  function recordTable(lab, deps) {
    let head = ['회차', '측정값', '관찰한 것'];
    if (deps.TH && deps.TH.find && deps.TH.find(lab.id)) {
      const r = deps.TH.run(lab.id, deps.TH.defaults(lab.id));
      if (r.ok && r.primary) head = ['회차', `${r.primary.label}${r.primary.unit ? ` (${r.primary.unit})` : ''}`, '관찰한 것'];
    }
    const info = LAB_PLAN[lab.id] || {};
    if (info.measure && head[1] === '측정값') head[1] = info.measure.replace(/\s*\(.*\)$/, '');
    return { table: true, head, rows: [['1회', '', ''], ['2회', '', ''], ['3회', '', ''], ['평균', '', '']] };
  }

  // 실험 없이 빈 계획서 (항목 이름만)
  function blank() {
    const out = {};
    for (const s of SECTIONS) out[s.id] = '';
    out.title = '';
    out.record = { table: true, head: ['회차', '측정값', '관찰한 것'], rows: [['1회', '', ''], ['2회', '', ''], ['3회', '', '']] };
    return out;
  }

  /* ---------- 양식 파일 읽기: 항목 이름과 차례, 이미 적힌 내용 ---------- */

  const NUMBERING = /^\s*(?:\(?\d{1,2}[.)]\s*|\d{1,2}\s+(?=\D)|[①-⑳]\s*|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+[.)]?\s*|[IVX]{1,4}[.)]\s*|[가-하][.)]\s*|\([가-하]\)\s*|[■□●○◆◇▶▷►◎※★☆·\u2219•\-–—]+\s*)/;
  const squash = (text) => String(text || '').replace(/[\s:：·.\-()（）[\]<>「」『』]/g, '');

  // 줄 하나가 항목 이름이면 그 항목 id(모르는 항목이면 'custom'), 아니면 null.
  // cell: 표의 칸(양식 표의 왼쪽 칸)이면 true. 번호나 쌍점이 없는 줄은 이름에 가까워야 한다("실험 계획서 & 결과"는 항목이 아니다).
  function matchHeading(line, cell) {
    const raw = String(line || '').trim();
    if (!raw || raw.length > 40) return null;
    const numbered = NUMBERING.test(raw);
    let text = raw.replace(NUMBERING, '').trim();
    let rest = '';
    const colon = text.match(/^([^:：]{1,20})[:：]\s*(.*)$/);
    if (colon) {
      text = colon[1].trim();
      rest = colon[2].trim();
    }
    if (!text || text.length > 20) return null;
    if (/[다요]\.?$/.test(text) && text.length > 6) return null; // 문장
    const key = squash(text);
    const slack = numbered || colon || cell ? 8 : 3;
    let best = null;
    for (const s of SECTIONS) {
      for (const k of s.keys) {
        // "탐구 동기 및 목적"처럼 앞뒤에 말이 붙어도 알아본다. 둘 이상 맞으면 긴 말이 이긴다(예상 결과 > 결과).
        if (key === k || (key.includes(k) && key.length <= k.length + slack)) {
          if (!best || k.length > best.len) best = { id: s.id, len: k.length };
        }
      }
    }
    if (best) return { id: best.id, name: text, rest };
    if ((numbered || colon) && text.length <= 14 && !/\d{2,}/.test(text)) return { id: 'custom', name: text, rest };
    return null;
  }

  // 빈칸을 나타내는 글(밑줄, "내용을 적으시오" 등)인가
  function isPlaceholder(text) {
    const t = String(text || '').replace(/\s+/g, '');
    if (!t) return true;
    if (/^[_\-.·…\u318d()[\]]+$/.test(t)) return true;
    return t.length < 30 && /(적으시오|작성하시오|쓰시오|기록하시오|적어주세요|작성해주세요|써주세요|입력|내용|예시|작성란|작성)$/.test(t.replace(/[.()]/g, ''));
  }

  // doc: FileIn.read의 결과 { blocks: [{ type: 'p', text } | { type: 'table', rows }] }
  // 돌려주는 값: { sections: [{ id, name, text }], title } — 항목은 양식의 차례대로, text는 양식에 이미 적혀 있던 내용
  function readTemplate(doc) {
    const sections = [];
    let title = '';
    let current = null;
    const add = (heading) => {
      if (heading.id !== 'custom' && sections.some((s) => s.id === heading.id)) {
        current = sections.find((s) => s.id === heading.id);
        if (heading.rest) current.lines.push(heading.rest);
        return;
      }
      current = { id: heading.id, name: heading.name, lines: heading.rest ? [heading.rest] : [] };
      sections.push(current);
    };
    for (const block of (doc && doc.blocks) || []) {
      if (block.type === 'table') {
        // 왼쪽 칸이 항목 이름이고 오른쪽 칸이 적는 자리인 양식 표
        for (const row of block.rows) {
          const cells = row.map((c) => String(c || '').trim());
          const first = cells.findIndex((c) => c);
          if (first < 0) continue;
          const heading = matchHeading(cells[first], true);
          if (heading) {
            add(heading);
            const after = cells.slice(first + 1).filter((c) => c && !matchHeading(c, true));
            current.lines.push(...after);
            // 한 줄에 항목이 둘 (예: 날짜 | ... | 조 | ...)
            for (const c of cells.slice(first + 1)) {
              const h = c && matchHeading(c, true);
              if (h && h.id !== 'custom') add(h);
            }
          } else if (current) {
            current.lines.push(cells.filter(Boolean).join(' | '));
          }
        }
        continue;
      }
      const lines = String(block.text || '').split('\n');
      for (const line of lines) {
        const heading = matchHeading(line);
        if (heading) add(heading);
        else if (current) current.lines.push(line.trim());
        else if (!title && line.trim().length >= 2 && line.trim().length <= 40) title = line.trim();
      }
    }
    const out = sections
      .filter((s) => s.id !== 'title' || true)
      .map((s) => {
        const text = s.lines.filter((l) => l && !isPlaceholder(l)).join('\n').trim();
        return { id: s.id, name: s.name, text };
      });
    return { sections: out, title };
  }

  // 글을 보고 어떤 실험인지 짐작한다. 실험 이름과 시약 이름의 낱말이 많이 겹치는 것. 확실하지 않으면 null.
  const STOP = new Set(['실험', '구하기', '측정', '반응', '용액', '수용액', '이온', '확인', '관찰', '만들기', '이용', '이용한', '농도', '변화', '색의', '색', '그리고', '함량', '정량', '상수', '법칙']);
  function wordsOf(text) {
    return String(text || '')
      .replace(/[()[\],.:·\-–—→⇌=+/%]/g, ' ')
      .split(/\s+/)
      .map((w) => w.replace(/(의|과|와|으로|로|을|를|이|가|은|는|에서|에)$/, ''))
      .filter((w) => w.length >= 2 && !STOP.has(w) && !/^[\d.]+$/.test(w) && !/^(mol|g|mg|mL|L|M|약|조금)$/i.test(w));
  }
  // 실험 이름의 낱말은 3점(두 글자는 2점), 시약 이름의 낱말은 1점. 이름의 낱말이 둘 넘게 맞고, 다음 실험보다 3점 넘게 앞서야 한다.
  function guessLab(text, labs) {
    const body = String(text || '');
    if (body.replace(/\s/g, '').length < 20) return null;
    const scored = labs.map((lab) => {
      const title = new Set(wordsOf(lab.title));
      const more = new Set(wordsOf(lab.reagents.map((r) => r.name || r.text || '').join(' ')).filter((w) => !title.has(w)));
      let score = 0;
      let titleHits = 0;
      for (const w of title) if (body.includes(w)) { score += w.length >= 3 ? 3 : 2; titleHits += 1; }
      for (const w of more) if (body.includes(w)) score += 1;
      if (body.includes(lab.title)) score += 10;
      return { id: lab.id, score, titleHits };
    }).sort((a, b) => b.score - a.score);
    const [top, next] = scored;
    if (!top || top.titleHits < 2 || top.score < 6 || (next && top.score - next.score < 3)) return null;
    return { id: top.id, score: top.score };
  }

  // 계획서를 글로 (한글·워드에 붙여 넣을 때). plan: { title, meta, sections: [{ name, text }] }
  function toText(plan) {
    const lines = [`${plan.kind || '실험 계획서'}${plan.title ? ` — ${plan.title}` : ''}`];
    if (plan.meta) lines.push(plan.meta);
    plan.sections.forEach((s, i) => {
      lines.push('', `${i + 1}. ${s.name}`);
      if (s.table) {
        lines.push(s.table.head.join('\t'));
        for (const row of s.table.rows) lines.push(row.join('\t'));
      }
      if (s.text) lines.push(s.text);
    });
    return lines.join('\n');
  }

  const api = { SECTIONS, SECTION, DEFAULT_ORDER, REPORT_ORDER, REPORT_NAME, LAB_PLAN, draft, blank, matchHeading, isPlaceholder, readTemplate, guessLab, toText, josa };
  if (typeof window !== 'undefined') window.LabPlan = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
