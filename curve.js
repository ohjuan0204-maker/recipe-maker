/*
 * 용액 레시피 메이커 — 적정 곡선 (SPEC.md 22장)
 *
 * 삼각 플라스크에 든 용액(시료)에 뷰렛의 용액을 조금씩 넣을 때의 pH를 계산한다.
 * 어림식(약산의 근사식, 완충 용액의 식)을 구간마다 갈아 끼우지 않고,
 * 전하 균형식 하나를 수치로 풀어서 처음부터 당량점 뒤까지 같은 방법으로 구한다.
 *
 *   [H⁺] + (센 염기에서 온 양이온) + [BH⁺] = [OH⁻] + (센 산에서 온 음이온) + [A⁻]
 *
 * 화면(app.js)과 검증(tests/curve.test.js)이 함께 쓴다.
 */
(function (root) {
  'use strict';

  const KW = 1.0e-14; // 25 °C에서 물의 이온곱
  // 한 방울(0.05 mL)은 25 mL의 0.2 %다. 그보다 작게 어긋나면 눈으로 가릴 수 없다고 본다.
  const GOOD = 0.2;
  const FAIR = 1.0;

  // 적정의 종류. analyte는 삼각 플라스크에 든 것, weak는 그것이 약한가.
  const KINDS = [
    {
      id: 'sa-sb',
      name: '강산에 강염기를 넣기',
      example: '염산 ← 수산화 나트륨 수용액',
      analyte: 'acid',
      weak: false,
      flask: '염산',
      burette: '수산화 나트륨 수용액',
      equation: 'HCl + NaOH → NaCl + H2O',
      indicator: 'phenolphthalein',
    },
    {
      id: 'wa-sb',
      name: '약산에 강염기를 넣기',
      example: '아세트산 ← 수산화 나트륨 수용액',
      analyte: 'acid',
      weak: true,
      flask: '아세트산',
      burette: '수산화 나트륨 수용액',
      equation: 'CH3COOH + NaOH → CH3COONa + H2O',
      constant: 'Ka',
      k: 1.8e-5,
      indicator: 'phenolphthalein',
    },
    {
      id: 'sb-sa',
      name: '강염기에 강산을 넣기',
      example: '수산화 나트륨 수용액 ← 염산',
      analyte: 'base',
      weak: false,
      flask: '수산화 나트륨 수용액',
      burette: '염산',
      equation: 'NaOH + HCl → NaCl + H2O',
      indicator: 'btb',
    },
    {
      id: 'wb-sa',
      name: '약염기에 강산을 넣기',
      example: '암모니아수 ← 염산',
      analyte: 'base',
      weak: true,
      flask: '암모니아수',
      burette: '염산',
      equation: 'NH3 + HCl → NH4Cl',
      constant: 'Kb',
      k: 1.8e-5,
      indicator: 'methyl-red',
    },
  ];

  const findKind = (id) => KINDS.find((kind) => kind.id === id) || null;

  const isPos = (...xs) => xs.every((x) => typeof x === 'number' && Number.isFinite(x) && x > 0);

  // 넣은 값이 계산할 수 있는 값인가. p = { kind, c0, v0, ct, k }
  //   c0, v0: 삼각 플라스크 속 용액의 농도(M)와 부피(mL), ct: 뷰렛 속 용액의 농도(M), k: 약산의 Ka나 약염기의 Kb
  function check(p) {
    const kind = findKind(p && p.kind);
    if (!kind) return '적정의 종류를 고르세요.';
    if (!isPos(p.c0, p.v0, p.ct)) return '농도와 부피는 0보다 큰 숫자로 입력하세요.';
    if (kind.weak && !isPos(p.k)) return `${kind.constant}는 0보다 큰 숫자로 입력하세요.`;
    if (kind.weak && p.k >= 1) return `${kind.constant}가 1보다 작은 약한 ${kind.analyte === 'acid' ? '산' : '염기'}만 계산해요.`;
    return '';
  }

  // 뷰렛의 용액을 v mL 넣었을 때의 pH
  function ph(p, v) {
    const kind = findKind(p.kind);
    const total = p.v0 + v;
    const sample = (p.c0 * p.v0) / total; // 시료에서 온 것의 전체 농도
    const added = (p.ct * v) / total; // 뷰렛에서 온 것의 전체 농도
    // 전하 균형식을 0으로 만드는 [H⁺]를 찾는다. 식의 값은 [H⁺]가 커질수록 커진다.
    const balance = (h) => {
      let sum = h - KW / h;
      if (kind.analyte === 'acid') {
        sum += added; // Na⁺
        sum -= kind.weak ? (sample * p.k) / (p.k + h) : sample; // A⁻ 또는 Cl⁻
      } else {
        sum -= added; // Cl⁻
        sum += kind.weak ? (sample * h) / (KW / p.k + h) : sample; // BH⁺ 또는 Na⁺
      }
      return sum;
    };
    let lo = 1e-16;
    let hi = 10;
    for (let i = 0; i < 200; i += 1) {
      const mid = Math.sqrt(lo * hi);
      if (balance(mid) > 0) hi = mid;
      else lo = mid;
    }
    return -Math.log10(Math.sqrt(lo * hi));
  }

  // 당량점까지 넣는 부피 (mL)
  const equivalence = (p) => (p.c0 * p.v0) / p.ct;

  // pH가 target이 되는 부피. 0 ~ limit 안에 없으면 null.
  function volumeAt(p, target, limit) {
    const kind = findKind(p.kind);
    const up = kind.analyte === 'acid'; // 산에 염기를 넣으면 pH가 오른다
    const start = ph(p, 0);
    const end = ph(p, limit);
    if (up ? target <= start || target > end : target >= start || target < end) return null;
    let lo = 0;
    let hi = limit;
    for (let i = 0; i < 80; i += 1) {
      const mid = (lo + hi) / 2;
      const value = ph(p, mid);
      if (up ? value < target : value > target) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // 그래프의 가로축 끝 (mL): 당량점의 두 배를 보기 좋은 수로 올린다.
  function span(p) {
    const veq = equivalence(p);
    const raw = veq * 2;
    const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
    const unit = steps.find((s) => raw / s <= 10) || 1000;
    return Math.max(unit, Math.ceil(raw / unit - 1e-9) * unit);
  }

  // 곡선을 그릴 점들 [[부피, pH], …]. 당량점 근처는 촘촘하게 찍는다.
  function points(p, limit) {
    const veq = equivalence(p);
    const xs = new Set();
    const n = 160;
    for (let i = 0; i <= n; i += 1) xs.add((limit * i) / n);
    for (let k = -30; k <= 30; k += 1) {
      if (k === 0) continue;
      const offset = Math.sign(k) * veq * 0.1 * 10 ** (-(30 - Math.abs(k)) / 6); // 당량점에서 10 % ~ 0.00015 % 떨어진 곳
      const x = veq + offset;
      if (x > 0 && x < limit) xs.add(x);
    }
    if (veq < limit) xs.add(veq);
    return Array.from(xs)
      .sort((a, b) => a - b)
      .map((x) => [x, ph(p, x)]);
  }

  // 곡선에서 읽어 낼 값들
  function describe(p) {
    const kind = findKind(p.kind);
    const veq = equivalence(p);
    const out = {
      kind,
      veq,
      start: ph(p, 0),
      atEq: ph(p, veq),
      // 당량점의 0.2 % 앞과 뒤(25 mL라면 한 방울 앞뒤)의 pH. 이 사이가 곡선이 곧게 서는 구간이다.
      jump: [ph(p, veq * (1 - GOOD / 100)), ph(p, veq * (1 + GOOD / 100))],
      half: null,
      pk: null,
    };
    if (kind.weak) {
      out.half = ph(p, veq / 2);
      out.pk = kind.analyte === 'acid' ? -Math.log10(p.k) : 14 + Math.log10(p.k); // 짝산의 pKa
    }
    return out;
  }

  // 지시약의 변색 범위들 [[낮은 pH, 높은 pH], …]. stops는 labcalc.js의 INDICATORS와 같은 꼴이다.
  function ranges(indicator) {
    const out = [];
    for (let i = 0; i < indicator.stops.length - 1; i += 1) {
      const [pa, na] = indicator.stops[i];
      const [pb, nb] = indicator.stops[i + 1];
      if (na !== nb) out.push([pa, pb]);
    }
    return out;
  }

  // 이 적정에 이 지시약이 맞는가.
  //   변색 범위의 가운데 pH에서 색이 바뀐다고 보고, 그때의 부피가 당량점에서 몇 % 어긋나는지를 본다.
  //   알맞다(good): 0.2 % 안쪽으로 맞고, 변색 범위 전체가 곡선이 곧게 서는 구간 안에 든다(색이 한 방울에 바뀐다).
  //   쓸 수는 있다(fair): 1 % 안쪽으로 맞는다. 맞지 않는다(bad): 그보다 더 어긋나거나 색이 변하지 않는다.
  //   변색 범위가 둘인 지시약(티몰 블루)은 당량점의 pH에 가까운 쪽을 쓴다.
  function judge(p, indicator) {
    const info = describe(p);
    const list = ranges(indicator);
    const range = list.slice().sort((a, b) => Math.abs((a[0] + a[1]) / 2 - info.atEq) - Math.abs((b[0] + b[1]) / 2 - info.atEq))[0];
    const middle = (range[0] + range[1]) / 2;
    const volume = volumeAt(p, middle, info.veq * 3);
    const low = Math.min(info.jump[0], info.jump[1]);
    const high = Math.max(info.jump[0], info.jump[1]);
    const inside = range[0] >= low - 0.05 && range[1] <= high + 0.05;
    if (volume == null) return { range, middle, volume: null, diff: null, percent: null, inside, verdict: 'bad', never: true };
    const diff = volume - info.veq;
    const percent = (diff / info.veq) * 100;
    const size = Math.abs(percent);
    return { range, middle, volume, diff, percent, inside, verdict: size <= GOOD && inside ? 'good' : size <= FAIR ? 'fair' : 'bad', never: false };
  }

  const api = { KW, KINDS, GOOD, FAIR, findKind, check, ph, equivalence, volumeAt, span, points, describe, ranges, judge };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LabCurve = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
