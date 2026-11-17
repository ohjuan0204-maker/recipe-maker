/*
 * 용액 레시피 메이커 — 검색 (SPEC.md 21장)
 *
 * 짧은 낱말만 쳐도 찾아 주는 것이 목표다. 한 낱말을 다섯 가지 방법으로 견준다.
 *   1. 그대로 들어 있는가                      "적정" → 식초 속 아세트산의 함량 (중화 적정)
 *   2. 같은 뜻이거나 가까운 말인가 (SYNONYMS)   "산염기" → 산과 염기, "메스플라스크" → 부피 플라스크
 *   3. 글자가 차례대로 들어 있는가              "산염기" → 산과 염기 (사이에 한 글자까지)
 *   4. 한두 글자 틀린 말인가 (자모 단위)        "뷰랫" → 뷰렛
 *   5. 초성인가                                 "ㅈㅈ" → 적정
 * 3과 4는 1·2·5로 하나도 찾지 못한 낱말에만 쓴다. 아는 말을 엉뚱한 말로 바꿔 읽지 않으려는 것이다.
 * 낱말을 여러 개 치면 모두 맞는 것을 찾고, 없으면 하나라도 맞는 것을 보여 준다.
 * 브라우저에서는 window.SiteSearch, Node에서는 require('./search.js').
 */
(function (root) {
  'use strict';

  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const SMALL = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };

  // 견주기 좋게 다듬는다: 소문자로, 아래·위 첨자는 보통 숫자로, 한글·영문·숫자만 남긴다.
  function norm(text) {
    return String(text == null ? '' : text)
      .toLowerCase()
      .replace(/[₀-₉⁰¹²³⁴-⁹]/g, (ch) => SMALL[ch] || '')
      .replace(/[^0-9a-z가-힣ㄱ-ㅎ]+/g, '');
  }

  // 낱말마다 다듬어 한 칸씩 띄운다: "2H₂O + 2e⁻" → "2h2o 2e"
  function words(text) {
    return String(text == null ? '' : text)
      .toLowerCase()
      .replace(/[₀-₉⁰¹²³⁴-⁹]/g, (ch) => SMALL[ch] || '')
      .split(/[^0-9a-z가-힣ㄱ-ㅎ]+/)
      .filter(Boolean)
      .join(' ');
  }

  // 한글이 없는 짧은 말(HCl, pH, H2O2)은 띄어 쓴 낱말을 넘어서 이어 붙여 찾지 않는다.
  const isShortLatin = (n) => n.length < 6 && /^[0-9a-z]+$/.test(n);
  const has = (field, n) => (isShortLatin(n) ? field.w.includes(n) : field.n.includes(n));

  const isSyllable = (ch) => ch >= '가' && ch <= '힣';
  const isHangul = (text) => /^[가-힣]+$/.test(text);
  const isChosung = (text) => /^[ㄱ-ㅎ]{2,}$/.test(text);

  // 초성만 남긴다: "적정" → "ㅈㅈ"
  function chosung(text) {
    let out = '';
    for (const ch of text) out += isSyllable(ch) ? CHO[Math.floor((ch.charCodeAt(0) - 0xac00) / 588)] : ch;
    return out;
  }

  // 자모로 푼다 (틀린 글자를 견줄 때 쓴다): "뷰렛" → ㅂㅠㄹㅔㅅ
  function jamo(text) {
    let out = '';
    for (const ch of text) {
      if (!isSyllable(ch)) {
        out += ch;
        continue;
      }
      const code = ch.charCodeAt(0) - 0xac00;
      out += String.fromCharCode(0x1100 + Math.floor(code / 588), 0x1161 + Math.floor((code % 588) / 28));
      if (code % 28) out += String.fromCharCode(0x11a7 + (code % 28));
    }
    return out;
  }

  // 두 글의 편집 거리. limit보다 크면 더 세지 않는다.
  function distance(a, b, limit) {
    if (Math.abs(a.length - b.length) > limit) return limit + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i += 1) {
      const row = [i];
      let best = i;
      for (let j = 1; j <= b.length; j += 1) {
        row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (row[j] < best) best = row[j];
      }
      if (best > limit) return limit + 1;
      prev = row;
    }
    return prev[b.length];
  }

  // q의 글자가 t에 차례대로, 사이에 한 글자까지만 끼어 나오는가: "산염기" ⊂ "산과염기"
  function loose(q, t) {
    if (q.length < 3) return false;
    for (let start = t.indexOf(q[0]); start !== -1; start = t.indexOf(q[0], start + 1)) {
      let at = start;
      let ok = true;
      for (let k = 1; k < q.length; k += 1) {
        const next = t.indexOf(q[k], at + 1);
        if (next === -1 || next - at > 2) {
          ok = false;
          break;
        }
        at = next;
      }
      if (ok) return true;
    }
    return false;
  }

  // 같은 뜻의 말과 가까운 말. keys 가운데 하나를 치면 same(같은 뜻)과 near(가까운 말)로도 찾는다.
  const SYNONYMS = [
    { keys: ['산염기', '산과염기', '산성', '염기성', '알칼리', 'acid', 'base'], same: ['산과 염기'], near: ['중화', 'pH', '지시약', '완충'] },
    { keys: ['중화', '중화반응', 'neutralization'], same: ['중화'], near: ['적정', '산과 염기'] },
    { keys: ['적정', '적정실험', 'titration'], same: ['적정'], near: ['뷰렛'] },
    { keys: ['ph', '피에이치', '페하', '수소이온농도'], same: ['pH'], near: ['지시약', '산과 염기'] },
    { keys: ['완충', '완충용액', '버퍼', 'buffer'], same: ['완충'], near: [] },
    { keys: ['지시약', 'indicator', '리트머스', '페놀프탈레인', 'btb', '메틸오렌지'], same: ['지시약'], near: ['변색'] },
    { keys: ['색', '색변화', '색깔', '컬러', 'color', 'colour', '변색'], same: ['색 변화'], near: ['지시약'] },
    { keys: ['산화환원', '산화', '환원', 'redox'], same: ['산화·환원'], near: ['전지', '전기 분해'] },
    { keys: ['전지', '배터리', 'battery', '건전지', '갈바니', '볼타'], same: ['전지'], near: ['전위'] },
    { keys: ['전기분해', '전해', 'electrolysis', '도금'], same: ['전기 분해'], near: ['패러데이'] },
    { keys: ['반응속도', '속도', 'kinetics', 'rate', '빠르기'], same: ['반응 속도'], near: ['반응 차수', '활성화 에너지'] },
    { keys: ['평형', '화학평형', 'equilibrium'], same: ['화학 평형'], near: ['르샤틀리에', '용해도곱'] },
    { keys: ['르샤틀리에', '르샤트리에', '르샤틀리에원리', '르샤를리에', 'lechatelier'], same: ['르샤틀리에'], near: ['화학 평형'] },
    { keys: ['열', '열화학', '엔탈피', 'enthalpy', '발열', '흡열', '반응열', '열량'], same: ['열화학'], near: ['열량계', '중화열', '헤스', '엔탈피'] },
    { keys: ['기체', '가스', 'gas', '이상기체'], same: ['기체'], near: ['확산'] },
    { keys: ['몰', 'mol', 'mole', '몰수', '아보가드로'], same: ['몰'], near: ['물질의 양'] },
    { keys: ['농도', '몰농도', 'concentration', 'molarity', '퍼센트'], same: ['농도'], near: ['고체 조제', '희석'] },
    { keys: ['희석', '묽히기', '묽힘', '묽게', 'dilution'], same: ['희석'], near: ['묽히'] },
    { keys: ['총괄성', '어는점', '끓는점', '어는점내림', '끓는점오름', '빙점', 'colligative'], same: ['총괄성'], near: ['어는점', '끓는점'] },
    { keys: ['앙금', '침전', '침전물', 'precipitate'], same: ['앙금'], near: [] },
    { keys: ['분광', '흡광도', '검량선', '비어', 'beer', '분광광도계'], same: ['분광'], near: ['검량선', '흡광도'] },
    { keys: ['수화물', '결정수', 'hydrate'], same: ['수화물'], near: [] },
    { keys: ['한계반응물', '수득률', '양적관계', 'yield', 'limiting'], same: ['한계 반응물'], near: ['수득률', '양적 관계'] },
    { keys: ['비타민', '비타민c', '비타민씨', 'vitaminc', '아스코르브산'], same: ['비타민 C'], near: [] },
    { keys: ['전도도', '전해질', '전기전도', 'conductivity'], same: ['전해질'], near: ['전도도'] },
    { keys: ['오차', '오차율', 'error', '평균', '표준편차', '통계'], same: ['오차율'], near: ['평균'] },
    { keys: ['이론값', '이론', '예상', '예측', '예상값'], same: ['이론값'], near: [] },
    { keys: ['라벨', 'label', '스티커', '인쇄', '프린트', '출력'], same: ['라벨'], near: [] },
    { keys: ['시약', '시약표', 'reagent', '분자량', '몰질량', '화학식'], same: ['시약표'], near: ['몰질량'] },
    { keys: ['준비물', '기구', '도구', '장비', '실험기구', 'equipment'], same: ['준비물'], near: [] },
    { keys: ['메스플라스크', '매스플라스크', '용량플라스크'], same: ['부피 플라스크'], near: [] },
    { keys: ['메스실린더', '매스실린더'], same: ['눈금 실린더'], near: [] },
    { keys: ['스포이드', '드로퍼'], same: ['스포이트'], near: [] },
    { keys: ['비이커'], same: ['비커'], near: [] },
    { keys: ['저울', '전자저울'], same: ['전자저울'], near: [] },
    { keys: ['알코올램프', '버너', '가열'], same: ['가열'], near: [] },
    { keys: ['소금', '소금물', '식염', 'nacl'], same: ['염화 나트륨'], near: [] },
    { keys: ['양잿물', '가성소다', 'naoh'], same: ['수산화 나트륨'], near: [] },
    { keys: ['식초', '초산'], same: ['식초'], near: ['아세트산'] },
    { keys: ['과산화수소', '옥시풀', '과수', 'h2o2'], same: ['과산화 수소'], near: [] },
    // 화학식이나 옛 이름으로 쳐도 시약 이름으로 찾는다.
    { keys: ['hcl', '염화수소'], same: ['염산'], near: [] },
    { keys: ['ch3cooh', '빙초산'], same: ['아세트산'], near: [] },
    { keys: ['kmno4', '과망간산칼륨', '과망간산'], same: ['과망가니즈산 칼륨'], near: [] },
    { keys: ['agno3'], same: ['질산 은'], near: [] },
    { keys: ['cuso4'], same: ['황산 구리'], near: [] },
    { keys: ['nh3'], same: ['암모니아'], near: [] },
    { keys: ['ki', '요오드화칼륨'], same: ['아이오딘화 칼륨'], near: [] },
    { keys: ['i2', '요오드'], same: ['아이오딘'], near: [] },
    { keys: ['caco3', '석회석', '대리석'], same: ['탄산 칼슘'], near: [] },
    { keys: ['caoh2', '석회수'], same: ['수산화 칼슘'], near: [] },
    { keys: ['na2s2o3', '싸이오황산나트륨', '하이포'], same: ['티오황산 나트륨'], near: [] },
  ].map((group) => ({ keys: group.keys.map(norm), same: group.same.map((text) => ({ text, n: norm(text) })), near: group.near.map((text) => ({ text, n: norm(text) })) }));

  // 방법마다의 점수 비율
  const FACTOR = { exact: 1, same: 0.9, chosung: 0.6, loose: 0.5, typo: 0.4, near: 0.4 };

  // 문서 하나. fields는 [글, 무게, 이름]. 무게 3 이상인 글은 "센 글"로 보고 초성·차례·틀린 글자로도 견준다.
  function makeDoc(type, id, title, sub, fields) {
    return {
      type,
      id,
      title,
      sub,
      fields: fields
        .filter((field) => field[0])
        .map(([text, weight, label]) => {
          const strong = weight >= 3;
          const n = norm(text);
          return {
            text,
            label,
            weight,
            strong,
            n,
            // 낱말마다 다듬어 띄어 둔 글. 짧은 영문·숫자(화학식)는 낱말 안에서만 찾는다.
            w: words(text),
            // 낱말마다의 초성. 초성은 낱말의 첫머리부터만 견준다.
            cho: strong
              ? String(text)
                  .split(/[^0-9A-Za-z가-힣]+/)
                  .filter(Boolean)
                  .map((word) => ({ text: word, c: chosung(norm(word)) }))
              : [],
            // 다듬은 낱말들 (틀린 글자를 견줄 때 쓴다)
            parts: strong ? words(text).split(' ').filter(Boolean) : [],
          };
        }),
    };
  }

  // 초성 token이 낱말들의 첫머리부터 이어서 맞는가. 맞으면 그 낱말들을 돌려준다: "ㅈㅎㅈㅈ" → "중화 적정"
  function chosungWords(token, words) {
    for (let i = 0; i < words.length; i += 1) {
      let joined = '';
      for (let k = i; k < words.length && joined.length < token.length; k += 1) {
        joined += words[k].c;
        if (joined.startsWith(token)) return words.slice(i, k + 1).map((word) => word.text).join(' ');
        if (!token.startsWith(joined)) break;
      }
    }
    return '';
  }

  // 낱말 하나가 문서와 얼마나 맞는가: { score, how, via } 또는 null. fuzzy면 차례·틀린 글자로도 견준다.
  function matchToken(token, doc, fuzzy) {
    let best = null;
    const take = (score, how, via) => {
      if (!best || score > best.score) best = { score, how, via };
    };
    const groups = SYNONYMS.filter((group) => group.keys.includes(token));
    const hangul = isHangul(token);
    const tokenJamo = hangul && token.length >= 2 ? jamo(token) : '';
    const typoLimit = tokenJamo.length >= 8 ? 2 : tokenJamo.length >= 5 ? 1 : 0;
    for (const field of doc.fields) {
      if (has(field, token)) take(field.weight * (field.n === token ? 1.3 : field.n.startsWith(token) ? 1.1 : 1), 'exact', field.label);
      for (const group of groups) {
        for (const term of group.same) if (term.n !== token && has(field, term.n)) take(field.weight * FACTOR.same, 'same', term.text);
        for (const term of group.near) if (has(field, term.n)) take(field.weight * FACTOR.near, 'near', term.text);
      }
      if (!field.strong) continue;
      if (isChosung(token)) {
        const words = chosungWords(token, field.cho);
        if (words) take(field.weight * FACTOR.chosung, 'chosung', words);
      }
      if (!fuzzy) continue;
      if (hangul && loose(token, field.n)) take(field.weight * FACTOR.loose, 'loose', field.text);
      if (typoLimit) {
        // 낱말의 첫머리부터 친 글자 수만큼 견준다. 조사가 붙었거나("뷰렛과") 띄어 쓴 말("삼각 플라스크")도 찾는다.
        for (let i = 0; i < field.parts.length; i += 1) {
          const first = field.parts[i];
          if (first[0] !== token[0] && jamo(first[0])[0] !== tokenJamo[0]) continue;
          let joined = first;
          for (let k = i + 1; joined.length < token.length && k < field.parts.length; k += 1) joined += field.parts[k];
          const heads = [joined.slice(0, token.length)];
          if (first.length >= 2 && first.length < token.length) heads.push(first);
          for (const head of heads) {
            if (isHangul(head) && distance(tokenJamo, jamo(head), typoLimit) <= typoLimit) take(field.weight * FACTOR.typo, 'typo', head);
          }
        }
      }
    }
    return best;
  }

  function tokenize(query) {
    return String(query == null ? '' : query)
      .split(/[\s,·/]+/)
      .map((raw) => ({ raw, n: norm(raw) }))
      .filter((token) => token.n);
  }

  // docs에서 query를 찾는다. { tokens, results: [{ doc, score, why, how }], hints, partial }
  function search(query, docs) {
    const tokens = tokenize(query);
    const empty = { tokens: [], results: [], hints: [], partial: false };
    if (!tokens.length) return empty;
    const joined = tokens.length > 1 ? norm(query) : '';
    // 그대로·같은 뜻·초성으로 하나도 못 찾은 낱말만 차례·틀린 글자로 다시 견준다.
    const fuzzyOf = (n) => !docs.some((doc) => matchToken(n, doc, false));
    for (const token of tokens) token.fuzzy = fuzzyOf(token.n);
    const joinedFuzzy = joined ? fuzzyOf(joined) : false;
    const scored = [];
    docs.forEach((doc, order) => {
      const matches = tokens.map((token) => matchToken(token.n, doc, token.fuzzy));
      const whole = joined ? matchToken(joined, doc, joinedFuzzy) : null;
      const hit = matches.filter(Boolean);
      const all = hit.length === tokens.length;
      const sum = hit.reduce((total, match) => total + match.score, 0);
      const score = Math.max(all ? sum : 0, whole ? whole.score : 0);
      scored.push({ doc, order, matches, whole, all: all || Boolean(whole), score, any: sum });
    });
    let found = scored.filter((item) => item.score > 0);
    let partial = false;
    if (!found.length && tokens.length > 1) {
      found = scored.filter((item) => item.any > 0).map((item) => Object.assign(item, { score: item.any * 0.5 }));
      partial = found.length > 0;
    }
    found.sort((a, b) => b.score - a.score || a.order - b.order);
    const results = found.map((item) => {
      const used = item.matches.filter(Boolean).concat(item.whole ? [item.whole] : []);
      const top = used.reduce((a, b) => (b.score > a.score ? b : a));
      return { doc: item.doc, score: item.score, how: top.how, via: top.via, why: top.how === 'exact' ? top.via : '' };
    });
    // 친 말을 어떻게 알아들었는지: 그대로 찾지 않은 낱말마다 무엇으로 찾았는지 모은다.
    const hints = [];
    tokens.forEach((token) => {
      const seen = [];
      for (const item of found.slice(0, 12)) {
        const match = matchToken(token.n, item.doc, token.fuzzy);
        if (match && ['same', 'typo', 'loose', 'chosung'].includes(match.how) && !seen.includes(match.via)) seen.push(match.via);
      }
      if (seen.length) hints.push({ token: token.raw, as: seen.slice(0, 4) });
    });
    return { tokens: tokens.map((token) => token.raw), results, hints, partial };
  }

  // 앱의 자료로 문서 목록을 만든다. data = { B, L, tools, pages }
  //   tools [{ id, title, group, hint }]  pages [{ id, title, keywords, desc }]
  function buildIndex(data) {
    const { B, L, tools, pages } = data;
    const docs = [];
    if (B) {
      for (const lab of B.EXPERIMENTS) {
        const reagents = lab.reagents.map((spec) => {
          const prep = L ? L.prepareReagent(spec) : { name: spec.name || spec.text || spec.id || '', formula: spec.formula || '' };
          return `${prep.name} ${prep.formula || ''}`;
        });
        const calcs = L ? lab.calcs.map((id) => (L.find(id) ? L.find(id).title : '')) : [];
        docs.push(
          makeDoc('lab', lab.id, lab.title, lab.unit, [
            [lab.title, 10, '제목'],
            [lab.unit, 6, '단원'],
            [lab.colors ? `색 변화 색깔 ${lab.colors.steps.map((step) => step[0]).join(' ')}` : '', 5, '색'],
            [calcs.join(' '), 3, '계산'],
            [reagents.join(' '), 3, '시약'],
            [lab.materials.join(' '), 3, '준비물'],
            [`${lab.concept} ${lab.steps.join(' ')} ${lab.wrap}`, 1, '내용'],
          ])
        );
      }
      for (const gear of B.EQUIPMENT || []) {
        const cat = (B.GEAR_CATS.find(([value]) => value === gear.cat) || ['', ''])[1];
        docs.push(makeDoc('gear', gear.id, gear.name, cat, [[gear.name, 10, '이름'], [cat, 4, '종류'], [gear.desc, 1, '설명']]));
      }
    }
    for (const tool of tools || []) docs.push(makeDoc('calc', tool.id, tool.title, tool.group, [[tool.title, 10, '이름'], [tool.group, 6, '묶음'], [tool.hint || '', 1, '설명']]));
    for (const page of pages || []) docs.push(makeDoc('page', page.id, page.title, '화면', [[page.title, 10, '이름'], [page.keywords || '', 6, '키워드'], [page.desc || '', 1, '설명']]));
    return docs;
  }

  // 시약표에서 찾는다. list의 항목은 { korean, english, formula }. 꼭 맞는 것부터 차례로 돌려준다.
  //   - 같은 뜻의 말로도 찾는다: "소금" → 염화 나트륨, "HCl" → 염산
  //   - 영문 한두 글자(pH, Na)는 화학식의 첫머리와만 견준다. 영문 이름 속 아무 데나 맞는 것은 뺀다.
  function reagents(query, list) {
    const whole = norm(query);
    if (!whole) return [];
    const terms = [{ n: whole, factor: 1 }];
    for (const token of tokenize(query)) {
      for (const group of SYNONYMS) {
        if (!group.keys.includes(token.n)) continue;
        for (const term of group.same) if (!terms.some((t) => t.n === term.n)) terms.push({ n: term.n, factor: 0.8 });
      }
    }
    const scored = [];
    list.forEach((item, order) => {
      const ko = norm(item.korean);
      const f = norm(item.formula);
      const en = norm(item.english);
      const enWords = words(item.english).split(' ');
      let best = 0;
      for (const { n, factor } of terms) {
        const long = n.length >= 3;
        let score = 0;
        if (ko === n || f === n) score = 100;
        else if (ko.startsWith(n)) score = 80;
        else if (f.startsWith(n) && n.length >= 2) score = 70;
        else if (ko.includes(n)) score = 60;
        else if (long && f.includes(n)) score = 40;
        else if (long && enWords.some((word) => word.startsWith(n))) score = 30;
        else if (long && en.includes(n)) score = 20;
        if (score * factor > best) best = score * factor;
      }
      if (best) scored.push({ item, order, score: best });
    });
    scored.sort((a, b) => b.score - a.score || a.order - b.order);
    return scored.map((entry) => entry.item);
  }

  const api = { norm, chosung, jamo, distance, loose, tokenize, makeDoc, matchToken, search, buildIndex, reagents, SYNONYMS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SiteSearch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
