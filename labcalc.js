/*
 * 용액 레시피 메이커 — 실험 계산 모음 (SPEC.md 12장)
 *
 * 계산 하나가 { id, group, title, hint, inputs, compute } 한 묶음이다.
 * 화면(app.js)은 inputs로 입력 칸을 만들고 compute의 결과를 그대로 보여 준다.
 * compute(values)는 입력 칸의 글자를 받아 { ok: true, rows, note } 또는 { ok: false, message }를 돌려준다.
 * rows의 한 줄은 { label, value, main, swatch }이다. swatch가 있으면 값 앞에 그 색을 보여 준다(null이면 무색).
 * 브라우저에서는 window.LabCalc, Node에서는 require('./labcalc.js').
 */
(function (root) {
  'use strict';

  const IS_NODE = typeof module !== 'undefined' && module.exports;
  const C = IS_NODE ? require('./calc.js') : root.RecipeCalc;
  const num = C.parseNumber;
  const sig = C.formatSig;
  const fix = C.formatFixed;

  const R_ATM = 0.082057; // L·atm/(mol·K)
  const R_J = 8.314; // J/(mol·K)
  const FARADAY = 96485; // C/mol
  const AVOGADRO = 6.022e23;
  const WATER = 18.015; // g/mol
  const KW_EXP = 14; // 25 °C에서 pH + pOH
  const NERNST = 0.05916; // 25 °C에서 2.303RT/F (V)
  const ATM = { atm: 1, hPa: 1013.25, kPa: 101.325, mmHg: 760 }; // 1 atm을 각 단위로

  // 물의 증기압 (mmHg), 15~30 °C. 일반화학 교재의 표에 실리는 값이다.
  const VAPOR = [12.8, 13.6, 14.5, 15.5, 16.5, 17.5, 18.7, 19.8, 21.1, 22.4, 23.8, 25.2, 26.7, 28.3, 30.0, 31.8];

  // 표준 환원 전위 (V, 25 °C). 교재에 흔히 실리는 소수 둘째 자리 값이다.
  const HALF = {
    Mg: { z: 2, e: -2.37, ion: 'Mg²⁺' },
    Al: { z: 3, e: -1.66, ion: 'Al³⁺' },
    Zn: { z: 2, e: -0.76, ion: 'Zn²⁺' },
    Fe: { z: 2, e: -0.44, ion: 'Fe²⁺' },
    Ni: { z: 2, e: -0.26, ion: 'Ni²⁺' },
    Sn: { z: 2, e: -0.14, ion: 'Sn²⁺' },
    Pb: { z: 2, e: -0.13, ion: 'Pb²⁺' },
    Cu: { z: 2, e: 0.34, ion: 'Cu²⁺' },
    Ag: { z: 1, e: 0.8, ion: 'Ag⁺' },
  };
  const METALS = Object.keys(HALF).map((m) => [m, `${m} (${HALF[m].ion}, ${HALF[m].e > 0 ? '+' : ''}${HALF[m].e.toFixed(2)} V)`]);

  const NEED = '빈칸에 0보다 큰 숫자를 입력하세요.';
  const fail = (message) => ({ ok: false, message: message || NEED });
  // 학교에 흔한 부피 플라스크의 크기 (mL), 큰 것부터
  const FLASKS = [1000, 500, 250, 100, 50, 25, 10];
  const pos = (...xs) => xs.every((x) => x > 0);
  const isNum = (...xs) => xs.every((x) => !Number.isNaN(x));
  const kelvin = (celsius) => celsius + 273.15;
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const listOf = (text) => String(text || '').split(/[\s,;]+/).filter(Boolean).map(Number);

  function vaporPressure(celsius) {
    if (!(celsius >= 15 && celsius <= 30)) return NaN;
    const i = Math.min(Math.floor(celsius) - 15, VAPOR.length - 2);
    const t = celsius - (i + 15);
    return VAPOR[i] + (VAPOR[i + 1] - VAPOR[i]) * t;
  }

  // 산·염기 지시약의 변색 범위와 색. 범위는 흔히 쓰는 표의 값이고 문헌마다 0.1~0.4쯤 다르다.
  // stops의 한 줄은 [pH, 색 이름, 화면에 보일 색]이다. 색이 null이면 무색이다.
  // mids는 이웃한 두 줄 사이(변색 중)의 색 이름이다. 화면의 색은 대략을 보여 주는 것이다.
  const INDICATORS = [
    { id: 'thymol-blue', name: '티몰 블루', stops: [[1.2, '빨강', '#d8343a'], [2.8, '노랑', '#f2c81e'], [8.0, '노랑', '#f2c81e'], [9.6, '파랑', '#2456c9']], mids: ['주황', '노랑', '초록'] },
    { id: 'methyl-orange', name: '메틸 오렌지', stops: [[3.1, '빨강', '#e2412d'], [4.4, '노랑', '#f5b921']], mids: ['주황'] },
    { id: 'bromocresol-green', name: '브로모크레졸 그린', stops: [[3.8, '노랑', '#eed21f'], [5.4, '파랑', '#1f6fc4']], mids: ['초록'] },
    { id: 'methyl-red', name: '메틸 레드', stops: [[4.4, '빨강', '#e0352f'], [6.2, '노랑', '#f3cf24']], mids: ['주황'] },
    { id: 'litmus', name: '리트머스', stops: [[4.5, '빨강', '#d94a55'], [8.3, '파랑', '#3f66c9']], mids: ['보라'] },
    { id: 'btb', name: 'BTB', stops: [[6.0, '노랑', '#f0cf1c'], [7.6, '파랑', '#1e55c4']], mids: ['초록'] },
    { id: 'phenol-red', name: '페놀 레드', stops: [[6.4, '노랑', '#f2c624'], [8.0, '빨강', '#d9304a']], mids: ['주황'] },
    { id: 'phenolphthalein', name: '페놀프탈레인', stops: [[8.3, '무색', null], [10.0, '붉은색', '#e0218a']], mids: ['옅은 분홍'] },
    { id: 'thymolphthalein', name: '티몰프탈레인', stops: [[9.3, '무색', null], [10.5, '파랑', '#2b62d0']], mids: ['옅은 파랑'] },
    // 적양배추 즙은 자연물이라 진하기와 품종에 따라 다르다. 어림값이다.
    { id: 'red-cabbage', name: '적양배추 즙', rough: true, stops: [[2, '빨강', '#d9344f'], [4, '자주', '#b03a8c'], [6, '보라', '#7b3fa8'], [7.5, '파랑', '#2f62c4'], [9, '청록', '#2a9d8f'], [10.5, '초록', '#3e9d5a'], [12, '노랑', '#e6c832']] },
  ];

  function hexToHsl(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = ((n >> 16) & 255) / 255;
    const g = ((n >> 8) & 255) / 255;
    const b = (n & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d === 0) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    let h;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [(h * 60 + 360) % 360, s, l];
  }

  function hslToHex(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return '#' + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
  }

  // 두 색을 t(0~1)만큼 섞는다. 색상환에서 가까운 쪽으로 돌아가므로 노랑과 파랑 사이는 초록, 빨강과 파랑 사이는 보라가 된다.
  // 한쪽이 무색이면 다른 쪽 색이 옅어지는 것으로 본다.
  function mixColor(a, b, t) {
    if (!a || !b) {
      const [h, s, l] = hexToHsl(a || b);
      const k = a ? 1 - t : t;
      return hslToHex(h, s, 1 - (1 - l) * k);
    }
    const [h1, s1, l1] = hexToHsl(a);
    const [h2, s2, l2] = hexToHsl(b);
    let dh = h2 - h1;
    if (dh > 180) dh -= 360;
    if (dh < -180) dh += 360;
    // 노랑과 파랑처럼 먼 색 사이를 색상환으로 그대로 지나가면 가운데가 형광색처럼 튄다. 가운데로 갈수록 조금 탁하고 어둡게 한다.
    const dip = Math.sin(Math.PI * t) * Math.min(1, Math.abs(dh) / 150); // 색상이 멀리 떨어진 두 색일수록 크게
    return hslToHex((h1 + dh * t + 360) % 360, (s1 + (s2 - s1) * t) * (1 - 0.28 * dip), l1 + (l2 - l1) * t - 0.05 * dip);
  }

  // 지시약 하나가 주어진 pH에서 띠는 색: { name, color(null이면 무색), changing, from, to }
  function indicatorColor(indicator, ph) {
    const stops = indicator.stops;
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (ph <= first[0]) return { name: first[1], color: first[2], changing: false };
    if (ph >= last[0]) return { name: last[1], color: last[2], changing: false };
    let i = 0;
    while (ph >= stops[i + 1][0]) i += 1;
    const [pa, na, ca] = stops[i];
    const [pb, nb, cb] = stops[i + 1];
    if (na === nb) return { name: na, color: ca, changing: false };
    const t = (ph - pa) / (pb - pa);
    const color = t === 0 ? ca : mixColor(ca, cb, t);
    if (indicator.rough) return { name: t < 0.5 ? na : nb, color, changing: false };
    if (t === 0) return { name: na, color: ca, changing: false };
    return { name: indicator.mids[i], color, changing: true, from: na, to: nb };
  }

  // 변색 범위를 글로: "3.1~4.4", 두 번 변하면 "1.2~2.8, 8.0~9.6"
  function indicatorRange(indicator) {
    const out = [];
    for (let i = 0; i < indicator.stops.length - 1; i += 1) {
      const [pa, na] = indicator.stops[i];
      const [pb, nb] = indicator.stops[i + 1];
      if (na !== nb) out.push(`${pa.toFixed(1)}~${pb.toFixed(1)}`);
    }
    return out.join(', ');
  }

  const PRESSURE_UNITS = [['hPa', 'hPa'], ['atm', 'atm'], ['kPa', 'kPa'], ['mmHg', 'mmHg']];
  const VALENCE = [['1', '1가'], ['2', '2가'], ['3', '3가']];

  const CALCS = [
    /* ---------- 기본 계산에 함께 묶이는 것 (용액을 만들 때 쓰는 작은 계산) ---------- */
    {
      id: 'max-volume',
      group: '기본 계산',
      title: '가진 시약으로 만들 수 있는 부피',
      hint: '부피 = 질량 × 순도 ÷ (몰질량 × 농도). 부피 플라스크는 그 부피를 넘지 않는 것 가운데 가장 큰 것으로 고릅니다.',
      inputs: [
        { id: 'mass', label: '가진 시약의 질량', unit: 'g', placeholder: '2.50' },
        { id: 'mm', label: '몰질량', unit: 'g/mol', placeholder: '58.44' },
        { id: 'conc', label: '만들 농도', unit: 'M', placeholder: '0.100' },
        { id: 'purity', label: '순도', unit: '%', value: '100' },
      ],
      compute(v) {
        const mass = num(v.mass);
        const mm = num(v.mm);
        const conc = num(v.conc);
        const purity = num(v.purity);
        if (!pos(mass, mm, conc)) return fail();
        if (!isNum(purity) || purity < 50 || purity > 100) return fail('순도는 50에서 100 사이로 입력하세요.');
        const mol = (mass * purity) / 100 / mm;
        const ml = (mol / conc) * 1000;
        const rows = [
          { label: '만들 수 있는 가장 큰 부피', value: `${sig(ml, 4)} mL`, main: true },
          { label: '시약의 몰수', value: `${sig(mol, 4)} mol` },
        ];
        const flask = FLASKS.find((size) => size <= ml);
        if (flask) {
          const need = (((conc * flask) / 1000) * mm) / (purity / 100);
          rows.push({ label: `${flask} mL 부피 플라스크로 만들면`, value: `${fix(need, 3)} g을 달아요 (남는 시약 ${fix(mass - need, 3)} g)` });
        } else {
          rows.push({ label: '부피 플라스크', value: '가장 작은 10 mL 플라스크로도 모자라요' });
        }
        return { ok: true, rows };
      },
    },
    {
      id: 'mix',
      group: '기본 계산',
      title: '농도가 다른 두 용액 섞기',
      hint: '섞은 뒤의 농도 = (C₁V₁ + C₂V₂) ÷ (V₁ + V₂). 부피는 그대로 더해진다고 봅니다. 용질이 같아야 하고, 물로 묽히는 것이면 용액 2의 농도에 0을 넣습니다.',
      inputs: [
        { id: 'c1', label: '용액 1의 농도', unit: 'M', placeholder: '1.00' },
        { id: 'v1', label: '용액 1의 부피', unit: 'mL', placeholder: '50.0' },
        { id: 'c2', label: '용액 2의 농도 (물이면 0)', unit: 'M', placeholder: '0.100' },
        { id: 'v2', label: '용액 2의 부피 (목표 농도만 볼 때는 비움)', unit: 'mL', placeholder: '150' },
        { id: 'target', label: '목표 농도 (없으면 비움)', unit: 'M', placeholder: '0.250' },
      ],
      compute(v) {
        const c1 = num(v.c1);
        const v1 = num(v.v1);
        const c2 = num(v.c2);
        const hasV2 = String(v.v2 == null ? '' : v.v2).trim() !== '';
        const hasTarget = String(v.target == null ? '' : v.target).trim() !== '';
        if (!pos(c1, v1) || !isNum(c2) || c2 < 0) return fail('용액 1의 농도와 부피는 0보다 큰 숫자로, 용액 2의 농도는 0 이상인 숫자로 입력하세요.');
        if (!hasV2 && !hasTarget) return fail('용액 2의 부피나 목표 농도 가운데 하나는 입력하세요.');
        const rows = [];
        if (hasV2) {
          const v2 = num(v.v2);
          if (!pos(v2)) return fail('용액 2의 부피는 0보다 큰 숫자로 입력하세요.');
          rows.push({ label: '섞은 뒤의 농도', value: `${sig((c1 * v1 + c2 * v2) / (v1 + v2), 4)} M`, main: true });
          rows.push({ label: '섞은 뒤의 부피', value: `${sig(v1 + v2, 4)} mL` });
        }
        if (hasTarget) {
          const target = num(v.target);
          if (!pos(target)) return fail('목표 농도는 0보다 큰 숫자로 입력하세요.');
          if (!(target < Math.max(c1, c2) && target > Math.min(c1, c2))) return fail('목표 농도는 두 용액의 농도 사이여야 합니다.');
          const need = (v1 * (c1 - target)) / (target - c2);
          rows.push({ label: `목표 농도 ${sig(target, 4)} M에 맞추려면`, value: `용액 1 ${sig(v1, 4)} mL에 용액 2 ${sig(need, 4)} mL`, main: !hasV2 });
          rows.push({ label: '그때의 전체 부피', value: `${sig(v1 + need, 4)} mL` });
        }
        return { ok: true, rows };
      },
    },
    /* ---------- 물질의 양 ---------- */
    {
      id: 'mole',
      group: '물질의 양',
      title: '질량 ↔ 몰 ↔ 입자 수',
      hint: '몰수 = 질량 ÷ 몰질량, 입자 수 = 몰수 × 6.022 × 10²³',
      inputs: [
        { id: 'mass', label: '질량', unit: 'g', placeholder: '5.844' },
        { id: 'mm', label: '몰질량', unit: 'g/mol', placeholder: '58.44' },
      ],
      compute(v) {
        const mass = num(v.mass);
        const mm = num(v.mm);
        if (!pos(mass, mm)) return fail();
        const mol = mass / mm;
        return { ok: true, rows: [{ label: '몰수', value: `${sig(mol, 4)} mol`, main: true }, { label: '입자 수', value: `${sig(mol * AVOGADRO, 4)} 개` }] };
      },
    },
    {
      id: 'hydrate',
      group: '물질의 양',
      title: '수화물의 화학식 (가열 전후 질량)',
      hint: 'x = (날아간 물의 몰수) ÷ (남은 무수물의 몰수). 황산 구리(CuSO₄)의 몰질량은 159.61입니다.',
      inputs: [
        { id: 'm0', label: '빈 도가니', unit: 'g', placeholder: '20.000' },
        { id: 'm1', label: '가열 전 (도가니 + 수화물)', unit: 'g', placeholder: '22.497' },
        { id: 'm2', label: '가열 후 (도가니 + 무수물)', unit: 'g', placeholder: '21.596' },
        { id: 'mm', label: '무수물의 몰질량', unit: 'g/mol', value: '159.61' },
      ],
      compute(v) {
        const m0 = num(v.m0);
        const m1 = num(v.m1);
        const m2 = num(v.m2);
        const mm = num(v.mm);
        if (!pos(m0, m1, m2, mm)) return fail();
        const water = m1 - m2;
        const anhydrous = m2 - m0;
        if (!pos(water, anhydrous)) return fail('질량은 가열 전 > 가열 후 > 빈 도가니 순서여야 합니다.');
        const x = water / WATER / (anhydrous / mm);
        return {
          ok: true,
          rows: [
            { label: '날아간 물', value: `${fix(water, 3)} g (${sig(water / WATER, 4)} mol)` },
            { label: '남은 무수물', value: `${fix(anhydrous, 3)} g (${sig(anhydrous / mm, 4)} mol)` },
            { label: '무수물 1몰당 물 x', value: fix(x, 2), main: true },
            { label: '가장 가까운 정수', value: String(Math.round(x)) },
            { label: '수화물 속 물의 질량 백분율', value: `${fix((water / (m1 - m0)) * 100, 1)} %` },
          ],
        };
      },
    },
    {
      id: 'empirical',
      group: '물질의 양',
      title: '실험식 (금속의 연소)',
      hint: '결합한 원소의 질량 = 화합물의 질량 − 금속의 질량. 기본값은 마그네슘과 산소입니다.',
      inputs: [
        { id: 'ma', label: '금속의 질량', unit: 'g', placeholder: '0.243' },
        { id: 'awa', label: '금속의 원자량', unit: 'g/mol', value: '24.305' },
        { id: 'mc', label: '생성된 화합물의 질량', unit: 'g', placeholder: '0.403' },
        { id: 'awb', label: '결합한 원소의 원자량', unit: 'g/mol', value: '15.999' },
      ],
      compute(v) {
        const ma = num(v.ma);
        const awa = num(v.awa);
        const mc = num(v.mc);
        const awb = num(v.awb);
        if (!pos(ma, awa, mc, awb)) return fail();
        const mb = mc - ma;
        if (!(mb > 0)) return fail('화합물의 질량이 금속의 질량보다 커야 합니다.');
        const na = ma / awa;
        const nb = mb / awb;
        return {
          ok: true,
          rows: [
            { label: '결합한 원소의 질량', value: `${fix(mb, 3)} g` },
            { label: '금속의 몰수', value: `${sig(na, 4)} mol` },
            { label: '결합한 원소의 몰수', value: `${sig(nb, 4)} mol` },
            { label: '몰비 (금속 : 결합한 원소)', value: `1 : ${fix(nb / na, 2)}`, main: true },
          ],
        };
      },
    },
    {
      id: 'limiting',
      group: '물질의 양',
      title: '한계 반응물과 수득률 (고체 + 용액)',
      hint: 'aA(고체) + bB(용액) → cC. 계수로 나눈 몰수가 작은 쪽이 한계 반응물입니다.',
      inputs: [
        { id: 'am', label: '고체 A의 질량', unit: 'g', placeholder: '1.00' },
        { id: 'amm', label: 'A의 몰질량', unit: 'g/mol', placeholder: '100.09' },
        { id: 'a', label: 'A의 계수 a', value: '1' },
        { id: 'bc', label: '용액 B의 농도', unit: 'M', placeholder: '1.00' },
        { id: 'bv', label: 'B의 부피', unit: 'mL', placeholder: '50.0' },
        { id: 'b', label: 'B의 계수 b', value: '2' },
        { id: 'c', label: '생성물 C의 계수 c', value: '1' },
        { id: 'cmm', label: 'C의 몰질량', unit: 'g/mol', placeholder: '44.01' },
        { id: 'actual', label: '실제로 얻은 C (없으면 비움)', unit: 'g' },
      ],
      compute(v) {
        const am = num(v.am);
        const amm = num(v.amm);
        const a = num(v.a);
        const bc = num(v.bc);
        const bv = num(v.bv);
        const b = num(v.b);
        const c = num(v.c);
        const cmm = num(v.cmm);
        if (!pos(am, amm, a, bc, bv, b, c, cmm)) return fail('실제로 얻은 양을 뺀 모든 칸에 0보다 큰 숫자를 입력하세요.');
        const na = am / amm;
        const nb = (bc * bv) / 1000;
        const limitA = na / a <= nb / b;
        const extent = Math.min(na / a, nb / b);
        const product = extent * c;
        const rows = [
          { label: 'A의 몰수', value: `${sig(na, 4)} mol` },
          { label: 'B의 몰수', value: `${sig(nb, 4)} mol` },
          { label: '한계 반응물', value: limitA ? 'A (고체)' : 'B (용액)', main: true },
          { label: '남는 반응물', value: limitA ? `B ${sig(nb - extent * b, 4)} mol` : `A ${sig((na - extent * a) * amm, 4)} g` },
          { label: 'C의 이론 수득량', value: `${sig(product * cmm, 4)} g (${sig(product, 4)} mol)`, main: true },
        ];
        const actual = num(v.actual);
        if (actual > 0) rows.push({ label: '수득률', value: `${fix((actual / (product * cmm)) * 100, 1)} %`, main: true });
        return { ok: true, rows };
      },
    },

    /* ---------- 기체와 열 ---------- */
    {
      id: 'ideal-gas',
      group: '기체와 열',
      title: '이상 기체의 몰수 (PV = nRT)',
      hint: 'n = PV ÷ RT, R = 0.082057 L·atm/(mol·K)',
      inputs: [
        { id: 'p', label: '압력', placeholder: '1013' },
        { id: 'punit', label: '압력의 단위', type: 'select', options: PRESSURE_UNITS },
        { id: 'vol', label: '부피', unit: 'mL', placeholder: '250' },
        { id: 't', label: '온도', unit: '°C', placeholder: '25' },
      ],
      compute(v) {
        const p = num(v.p) / (ATM[v.punit] || ATM.hPa);
        const vol = num(v.vol) / 1000;
        const t = kelvin(num(v.t));
        if (!pos(p, vol, t)) return fail('압력과 부피는 0보다 큰 숫자로, 온도는 숫자로 입력하세요.');
        const n = (p * vol) / (R_ATM * t);
        return { ok: true, rows: [{ label: '압력', value: `${sig(p, 4)} atm` }, { label: '절대 온도', value: `${fix(t, 2)} K` }, { label: '몰수', value: `${sig(n, 4)} mol`, main: true }] };
      },
    },
    {
      id: 'gas-collect',
      group: '기체와 열',
      title: '수상 치환으로 모은 기체 (기체 상수와 몰 부피)',
      hint: '기체의 분압 = 대기압 − 물의 증기압. 증기압 칸을 비우면 15~30 °C의 표 값을 씁니다.',
      inputs: [
        { id: 'mass', label: '반응한 금속의 질량', unit: 'g', placeholder: '0.0243' },
        { id: 'mm', label: '금속의 몰질량', unit: 'g/mol', value: '24.305' },
        { id: 'ratio', label: '금속 1몰당 기체의 몰수', value: '1' },
        { id: 'vol', label: '모은 기체의 부피', unit: 'mL', placeholder: '24.9' },
        { id: 't', label: '물의 온도', unit: '°C', placeholder: '22' },
        { id: 'p', label: '대기압', placeholder: '1013' },
        { id: 'punit', label: '대기압의 단위', type: 'select', options: PRESSURE_UNITS },
        { id: 'pw', label: '물의 증기압 (비우면 표 값)', unit: 'mmHg' },
      ],
      compute(v) {
        const mass = num(v.mass);
        const mm = num(v.mm);
        const ratio = num(v.ratio);
        const vol = num(v.vol) / 1000;
        const celsius = num(v.t);
        const total = num(v.p) / (ATM[v.punit] || ATM.hPa);
        if (!pos(mass, mm, ratio, vol, total) || Number.isNaN(celsius)) return fail('증기압을 뺀 모든 칸에 숫자를 입력하세요.');
        let vapor = num(v.pw);
        if (Number.isNaN(vapor)) vapor = vaporPressure(celsius);
        if (Number.isNaN(vapor)) return fail('15~30 °C 밖에서는 물의 증기압을 직접 입력하세요.');
        const partial = total - vapor / ATM.mmHg;
        if (!(partial > 0)) return fail('대기압이 물의 증기압보다 커야 합니다.');
        const n = (mass / mm) * ratio;
        const t = kelvin(celsius);
        const r = (partial * vol) / (n * t);
        const molarVolume = (vol * partial * (273.15 / t)) / n;
        return {
          ok: true,
          rows: [
            { label: '기체의 몰수', value: `${sig(n, 4)} mol` },
            { label: '물의 증기압', value: `${fix(vapor, 1)} mmHg` },
            { label: '기체의 분압', value: `${sig(partial, 4)} atm` },
            { label: '기체 상수 R', value: `${sig(r, 3)} L·atm/(mol·K)`, main: true },
            { label: 'R의 오차율 (0.08206 기준)', value: `${fix(((r - 0.08206) / 0.08206) * 100, 1)} %` },
            { label: '0 °C, 1 atm에서의 몰 부피', value: `${sig(molarVolume, 4)} L/mol`, main: true },
          ],
        };
      },
    },
    {
      id: 'calorimetry',
      group: '기체와 열',
      title: '열량계: 반응열과 중화열',
      hint: 'q = (용액의 질량 × 비열 + 열량계의 열용량) × 온도 변화. 온도가 오르면 발열이므로 ΔH는 음수입니다.',
      inputs: [
        { id: 'mass', label: '용액의 질량', unit: 'g', placeholder: '100' },
        { id: 'c', label: '비열', unit: 'J/(g·°C)', value: '4.18' },
        { id: 't1', label: '처음 온도', unit: '°C', placeholder: '22.0' },
        { id: 't2', label: '나중 온도', unit: '°C', placeholder: '28.7' },
        { id: 'ccal', label: '열량계의 열용량 (모르면 0)', unit: 'J/°C', value: '0' },
        { id: 'mol', label: '반응한 물질의 양 (없으면 비움)', unit: 'mol' },
      ],
      compute(v) {
        const mass = num(v.mass);
        const c = num(v.c);
        const t1 = num(v.t1);
        const t2 = num(v.t2);
        const ccal = v.ccal === '' || v.ccal == null ? 0 : num(v.ccal);
        if (!pos(mass, c) || !isNum(t1, t2, ccal) || ccal < 0) return fail('질량과 비열은 0보다 큰 숫자로, 온도는 숫자로 입력하세요.');
        const dt = t2 - t1;
        const q = (mass * c + ccal) * dt;
        const rows = [
          { label: '온도 변화', value: `${fix(dt, 2)} °C` },
          { label: '주고받은 열량 q', value: `${sig(Math.abs(q), 4)} J (${sig(Math.abs(q) / 1000, 3)} kJ)`, main: true },
          { label: '반응의 종류', value: dt > 0 ? '발열 (온도가 올랐다)' : dt < 0 ? '흡열 (온도가 내렸다)' : '변화 없음' },
        ];
        const mol = num(v.mol);
        if (mol > 0) rows.push({ label: '몰당 반응 엔탈피 ΔH', value: `${sig(-q / 1000 / mol, 3)} kJ/mol`, main: true });
        return { ok: true, rows };
      },
    },
    {
      id: 'fp-molar-mass',
      group: '기체와 열',
      title: '어는점 내림으로 분자량 구하기',
      hint: 'ΔTf = i·Kf·m 에서 m을 구한 뒤 분자량 = 용질의 질량 ÷ (m × 용매의 kg). 물의 Kf는 1.86입니다.',
      inputs: [
        { id: 'solute', label: '용질의 질량', unit: 'g', placeholder: '3.00' },
        { id: 'solvent', label: '용매의 질량', unit: 'g', placeholder: '50.0' },
        { id: 'kf', label: '용매의 Kf', unit: '°C/m', value: '1.86' },
        { id: 'fp0', label: '순수한 용매의 어는점', unit: '°C', value: '0.00' },
        { id: 'fp', label: '용액의 어는점', unit: '°C', placeholder: '-1.86' },
        { id: 'i', label: '반트호프 인자 i', value: '1' },
      ],
      compute(v) {
        const solute = num(v.solute);
        const solvent = num(v.solvent);
        const kf = num(v.kf);
        const fp0 = num(v.fp0);
        const fp = num(v.fp);
        const i = num(v.i);
        if (!pos(solute, solvent, kf, i) || !isNum(fp0, fp)) return fail('질량·Kf·i는 0보다 큰 숫자로, 어는점은 숫자로 입력하세요.');
        const dt = fp0 - fp;
        if (!(dt > 0)) return fail('용액의 어는점이 순수한 용매보다 낮아야 합니다.');
        const molality = dt / (i * kf);
        const mm = solute / (molality * (solvent / 1000));
        return {
          ok: true,
          rows: [
            { label: '어는점 내림 ΔTf', value: `${fix(dt, 2)} °C` },
            { label: '몰랄 농도', value: `${sig(molality, 4)} m` },
            { label: '용질의 분자량', value: `${sig(mm, 4)} g/mol`, main: true },
          ],
        };
      },
    },

    /* ---------- 반응 속도와 평형 ---------- */
    {
      id: 'rate-order',
      group: '반응 속도와 평형',
      title: '반응 차수 (걸린 시간으로)',
      hint: '속도는 걸린 시간에 반비례한다고 봅니다. 차수 = log(t₁ ÷ t₂) ÷ log(c₂ ÷ c₁)',
      inputs: [
        { id: 'c1', label: '실험 1의 농도', unit: 'M', placeholder: '0.10' },
        { id: 't1', label: '실험 1의 시간', unit: 's', placeholder: '40' },
        { id: 'c2', label: '실험 2의 농도', unit: 'M', placeholder: '0.20' },
        { id: 't2', label: '실험 2의 시간', unit: 's', placeholder: '20' },
      ],
      compute(v) {
        const c1 = num(v.c1);
        const t1 = num(v.t1);
        const c2 = num(v.c2);
        const t2 = num(v.t2);
        if (!pos(c1, t1, c2, t2)) return fail();
        if (c1 === c2) return fail('두 실험의 농도가 달라야 합니다.');
        const order = Math.log(t1 / t2) / Math.log(c2 / c1);
        return {
          ok: true,
          rows: [
            { label: '농도의 비 (실험 2 ÷ 실험 1)', value: sig(c2 / c1, 3) },
            { label: '속도의 비 (실험 2 ÷ 실험 1)', value: sig(t1 / t2, 3) },
            { label: '반응 차수', value: fix(order, 2), main: true },
            { label: '가장 가까운 정수', value: String(Math.round(order)) },
          ],
        };
      },
    },
    {
      id: 'arrhenius',
      group: '반응 속도와 평형',
      title: '활성화 에너지 (두 온도에서 걸린 시간)',
      hint: 'ln(k₂ ÷ k₁) = (Ea ÷ R)(1/T₁ − 1/T₂), k는 걸린 시간에 반비례한다고 봅니다.',
      inputs: [
        { id: 'T1', label: '온도 1', unit: '°C', placeholder: '20' },
        { id: 't1', label: '온도 1에서 걸린 시간', unit: 's', placeholder: '60' },
        { id: 'T2', label: '온도 2', unit: '°C', placeholder: '30' },
        { id: 't2', label: '온도 2에서 걸린 시간', unit: 's', placeholder: '30' },
      ],
      compute(v) {
        const T1 = kelvin(num(v.T1));
        const T2 = kelvin(num(v.T2));
        const t1 = num(v.t1);
        const t2 = num(v.t2);
        if (!pos(T1, T2, t1, t2)) return fail('온도는 숫자로, 시간은 0보다 큰 숫자로 입력하세요.');
        if (T1 === T2) return fail('두 온도가 달라야 합니다.');
        const ea = (R_J * Math.log(t1 / t2)) / (1 / T1 - 1 / T2);
        return {
          ok: true,
          rows: [
            { label: '속도 상수의 비 k₂ ÷ k₁', value: sig(t1 / t2, 3) },
            { label: '활성화 에너지 Ea', value: `${sig(ea / 1000, 3)} kJ/mol`, main: true },
          ],
        };
      },
    },
    {
      id: 'beer',
      group: '반응 속도와 평형',
      title: '검량선으로 농도 구하기 (비어-람베르트 법칙)',
      hint: '표준 용액의 농도와 흡광도를 쉼표로 나누어 같은 순서로 적습니다. 최소 제곱법으로 직선을 구합니다.',
      inputs: [
        { id: 'conc', label: '표준 용액의 농도들', type: 'list', placeholder: '1, 2, 4, 6, 8' },
        { id: 'abs', label: '흡광도들', type: 'list', placeholder: '0.12, 0.24, 0.48, 0.72, 0.96' },
        { id: 'unknown', label: '미지 시료의 흡광도 (없으면 비움)', placeholder: '0.45' },
      ],
      compute(v) {
        const xs = listOf(v.conc);
        const ys = listOf(v.abs);
        if (xs.length < 2 || xs.length !== ys.length || !isNum(...xs, ...ys)) return fail('농도와 흡광도를 같은 개수(2개 이상)의 숫자로 입력하세요.');
        const n = xs.length;
        const mx = xs.reduce((s, x) => s + x, 0) / n;
        const my = ys.reduce((s, y) => s + y, 0) / n;
        const sxx = xs.reduce((s, x) => s + (x - mx) * (x - mx), 0);
        const sxy = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
        const syy = ys.reduce((s, y) => s + (y - my) * (y - my), 0);
        if (!(sxx > 0)) return fail('표준 용액의 농도가 서로 달라야 합니다.');
        const slope = sxy / sxx;
        const intercept = my - slope * mx;
        const rows = [
          { label: '기울기 (흡광도 ÷ 농도)', value: sig(slope, 4) },
          { label: '절편', value: sig(C.roundTo(intercept, 6), 3) },
          { label: '결정 계수 R²', value: syy > 0 ? fix((sxy * sxy) / (sxx * syy), 4) : '1.0000' },
        ];
        const unknown = num(v.unknown);
        if (!Number.isNaN(unknown) && slope !== 0) rows.push({ label: '미지 시료의 농도', value: sig((unknown - intercept) / slope, 4), main: true });
        return { ok: true, rows, note: '농도의 단위는 표준 용액에 쓴 단위와 같습니다.' };
      },
    },
    {
      id: 'ksp',
      group: '반응 속도와 평형',
      title: '수산화 칼슘의 용해도곱 상수 (적정으로)',
      hint: '[OH⁻] = (염산의 농도 × 부피) ÷ 시료의 부피, [Ca²⁺] = [OH⁻] ÷ 2, Ksp = [Ca²⁺][OH⁻]²',
      inputs: [
        { id: 'c', label: '염산의 농도', unit: 'M', placeholder: '0.0500' },
        { id: 'v', label: '적정에 쓴 염산', unit: 'mL', placeholder: '11.0' },
        { id: 'sample', label: '포화 용액 시료', unit: 'mL', placeholder: '25.0' },
      ],
      compute(v) {
        const c = num(v.c);
        const vol = num(v.v);
        const sample = num(v.sample);
        if (!pos(c, vol, sample)) return fail();
        const oh = (c * vol) / sample;
        const ca = oh / 2;
        return {
          ok: true,
          rows: [
            { label: '[OH⁻]', value: `${sig(oh, 3)} M` },
            { label: '[Ca²⁺]', value: `${sig(ca, 3)} M` },
            { label: 'Ksp', value: sig(ca * oh * oh, 3), main: true },
            { label: '용해도', value: `${sig(ca * 74.09, 3)} g/L` },
          ],
        };
      },
    },

    /* ---------- 산과 염기 ---------- */
    {
      id: 'ph-target',
      group: '산과 염기',
      title: '목표 pH를 맞추는 강산·강염기의 농도',
      hint: '강산은 [H⁺] = 10^(−pH), 강염기는 [OH⁻] = 10^(pH − 14). 원액 농도와 부피를 넣으면 취할 부피도 알려 줍니다.',
      inputs: [
        { id: 'ph', label: '목표 pH', placeholder: '2.00' },
        { id: 'kind', label: '종류', type: 'select', options: [['acid', '강산'], ['base', '강염기']] },
        { id: 'n', label: '가수', type: 'select', options: VALENCE },
        { id: 'stock', label: '원액의 농도 (없으면 비움)', unit: 'M', placeholder: '1.00' },
        { id: 'vol', label: '만들 부피 (없으면 비움)', unit: 'mL', placeholder: '500' },
      ],
      compute(v) {
        const ph = num(v.ph);
        const n = num(v.n) || 1;
        const base = v.kind === 'base';
        if (Number.isNaN(ph) || ph < 0 || ph > KW_EXP) return fail('목표 pH를 0~14 사이의 숫자로 입력하세요.');
        if ((!base && ph >= 7) || (base && ph <= 7)) return fail('강산으로는 pH 7보다 낮게, 강염기로는 pH 7보다 높게만 맞출 수 있습니다.');
        const ion = Math.pow(10, base ? ph - KW_EXP : -ph);
        const conc = ion / n;
        const rows = [
          { label: base ? '[OH⁻]' : '[H⁺]', value: `${sig(ion, 3)} M` },
          { label: '필요한 농도', value: `${sig(conc, 3)} M`, main: true },
        ];
        let note = ion < 1e-6 ? C.TEXT.veryDilute : '';
        const stock = num(v.stock);
        const vol = num(v.vol);
        if (stock > 0 && vol > 0) {
          if (conc > stock) note = '원액이 필요한 농도보다 묽습니다. 더 진한 원액이 필요합니다.';
          else rows.push({ label: '원액에서 취할 부피', value: `${sig((conc * vol) / stock, 3)} mL`, main: true }, { label: '희석 배수', value: `${sig(stock / conc, 3)}배` });
        }
        return { ok: true, rows, note };
      },
    },
    {
      id: 'ph-weak',
      group: '산과 염기',
      title: '약산·약염기의 pH',
      // K 값의 출처: OpenStax Chemistry 2e 부록 H·I (화면에는 적지 않는다. README에 있다)
      hint: 'x² ÷ (C − x) = K 를 근의 공식으로 풉니다 (25 °C).',
      inputs: [
        {
          id: 'preset',
          label: '물질',
          type: 'preset',
          options: [['acetic', '아세트산'], ['formic', '폼산'], ['ammonia', '암모니아'], ['', '직접 입력']],
          fills: { acetic: { kind: 'acid', k: '1.8e-5' }, formic: { kind: 'acid', k: '1.8e-4' }, ammonia: { kind: 'base', k: '1.8e-5' } },
        },
        { id: 'kind', label: '종류', type: 'select', options: [['acid', '약산 (Ka)'], ['base', '약염기 (Kb)']] },
        { id: 'k', label: 'Ka 또는 Kb', value: '1.8e-5' },
        { id: 'conc', label: '농도', unit: 'M', placeholder: '0.10' },
      ],
      compute(v) {
        const k = num(v.k);
        const conc = num(v.conc);
        if (!pos(k, conc)) return fail('K와 농도를 0보다 큰 숫자로 입력하세요. 1.8 × 10⁻⁵는 1.8e-5로 적습니다.');
        const x = (-k + Math.sqrt(k * k + 4 * k * conc)) / 2;
        const p = -Math.log10(x);
        const base = v.kind === 'base';
        const ph = base ? KW_EXP - p : p;
        return {
          ok: true,
          rows: [
            { label: base ? '[OH⁻]' : '[H⁺]', value: `${sig(x, 3)} M` },
            { label: 'pH', value: fix(ph, 2), main: true },
            { label: '이온화도', value: `${sig((x / conc) * 100, 3)} %` },
          ],
        };
      },
    },
    {
      id: 'buffer',
      group: '산과 염기',
      title: '완충 용액 설계 (목표 pH 맞추기)',
      // pKa는 OpenStax Chemistry 2e 부록 H·I의 K로 계산한 값이다
      hint: 'pH = pKa + log([짝염기] ÷ [산]). pKa는 25 °C의 값입니다.',
      inputs: [
        {
          id: 'pair',
          label: '산과 짝염기',
          type: 'preset',
          options: [
            ['acetate', '아세트산 / 아세트산 나트륨'],
            ['phosphate', '인산 이수소 나트륨 / 인산 수소 이나트륨'],
            ['ammonium', '염화 암모늄 / 암모니아'],
            ['carbonate', '탄산수소 나트륨 / 탄산 나트륨'],
            ['', '직접 입력'],
          ],
          fills: { acetate: { pka: '4.74' }, phosphate: { pka: '7.21' }, ammonium: { pka: '9.26' }, carbonate: { pka: '10.33' } },
        },
        { id: 'pka', label: '산의 pKa', value: '4.74' },
        { id: 'ph', label: '목표 pH', placeholder: '5.00' },
        { id: 'total', label: '산 + 짝염기의 농도', unit: 'M', placeholder: '0.100' },
        { id: 'vol', label: '만들 부피', unit: 'mL', placeholder: '100' },
      ],
      compute(v) {
        const pka = num(v.pka);
        const ph = num(v.ph);
        const total = num(v.total);
        const vol = num(v.vol);
        if (!isNum(pka, ph) || !pos(total, vol)) return fail('pKa와 목표 pH는 숫자로, 농도와 부피는 0보다 큰 숫자로 입력하세요.');
        const ratio = Math.pow(10, ph - pka);
        const acid = total / (1 + ratio);
        const baseConc = total - acid;
        return {
          ok: true,
          rows: [
            { label: '[짝염기] ÷ [산]', value: sig(ratio, 3), main: true },
            { label: '산의 농도', value: `${sig(acid, 3)} M` },
            { label: '짝염기의 농도', value: `${sig(baseConc, 3)} M` },
            { label: '넣을 산의 양', value: `${sig(acid * vol, 3)} mmol`, main: true },
            { label: '넣을 짝염기의 양', value: `${sig(baseConc * vol, 3)} mmol`, main: true },
          ],
          note: Math.abs(ph - pka) > 1 ? '목표 pH가 pKa ± 1 밖이라 완충 능력이 약합니다. pKa가 더 가까운 쌍을 고르세요.' : '같은 농도의 두 용액을 섞는다면 부피의 비가 위의 [짝염기] ÷ [산]과 같습니다.',
        };
      },
    },
    {
      id: 'ka',
      group: '산과 염기',
      title: '약산의 이온화 상수 (농도와 pH로)',
      hint: '[H⁺] = 10^(−pH), Ka = [H⁺]² ÷ (C − [H⁺])',
      inputs: [
        { id: 'conc', label: '약산의 농도', unit: 'M', placeholder: '0.100' },
        { id: 'ph', label: '측정한 pH', placeholder: '2.88' },
      ],
      compute(v) {
        const conc = num(v.conc);
        const ph = num(v.ph);
        if (!pos(conc) || Number.isNaN(ph)) return fail('농도는 0보다 큰 숫자로, pH는 숫자로 입력하세요.');
        const h = Math.pow(10, -ph);
        if (!(h < conc)) return fail('[H⁺]가 산의 농도보다 큽니다. 농도와 pH를 확인하세요.');
        const ka = (h * h) / (conc - h);
        return {
          ok: true,
          rows: [
            { label: '[H⁺]', value: `${sig(h, 3)} M` },
            { label: 'Ka', value: sig(ka, 3), main: true },
            { label: 'pKa', value: fix(-Math.log10(ka), 2) },
            { label: '이온화도', value: `${sig((h / conc) * 100, 3)} %` },
          ],
        };
      },
    },
    {
      id: 'indicator',
      group: '산과 염기',
      title: '지시약의 색 (pH에 따라)',
      hint: '지시약마다 색이 바뀌는 pH 구간이 다릅니다. 막대를 움직여 pH를 바꿔 보세요.',
      inputs: [{ id: 'ph', label: 'pH', type: 'range', min: 0, max: 14, step: 0.1, value: '7.0' }],
      compute(v) {
        const ph = num(v.ph);
        if (Number.isNaN(ph) || ph < 0 || ph > 14) return fail('pH는 0에서 14 사이의 숫자로 입력하세요.');
        return {
          ok: true,
          rows: INDICATORS.map((indicator) => {
            const c = indicatorColor(indicator, ph);
            return {
              label: indicator.rough ? `${indicator.name} (어림)` : `${indicator.name} (${indicatorRange(indicator)})`,
              value: c.changing ? `${c.name} (${c.from}에서 ${c.to}으로 바뀌는 중)` : c.name,
              swatch: c.color,
            };
          }),
          note: '화면의 색은 대략을 보여 줍니다. 변색 범위는 책마다 0.1~0.4쯤 다르고, 실제 색은 지시약의 양과 조명에 따라 달라집니다.',
        };
      },
    },
    {
      id: 'vinegar',
      group: '산과 염기',
      title: '식초 속 아세트산의 함량 (중화 적정)',
      hint: '원래 식초의 농도 = (NaOH의 농도 × 부피 ÷ 시료의 부피) × 묽힌 배수. % (w/v) = M × 60.05 ÷ 10',
      inputs: [
        { id: 'c', label: 'NaOH 표준 용액의 농도', unit: 'M', value: '0.100' },
        { id: 'v', label: '적정에 쓴 NaOH', unit: 'mL', placeholder: '17.5' },
        { id: 'sample', label: '적정한 시료의 부피', unit: 'mL', value: '20.0' },
        { id: 'fold', label: '식초를 묽힌 배수', unit: '배', value: '10' },
      ],
      compute(v) {
        const c = num(v.c);
        const vol = num(v.v);
        const sample = num(v.sample);
        const fold = num(v.fold);
        if (!pos(c, vol, sample, fold)) return fail();
        const diluted = (c * vol) / sample;
        const original = diluted * fold;
        return {
          ok: true,
          rows: [
            { label: '묽힌 시료의 농도', value: `${sig(diluted, 3)} M` },
            { label: '원래 식초의 농도', value: `${sig(original, 3)} M`, main: true },
            { label: '아세트산의 함량', value: `${sig((original * 60.05) / 10, 3)} % (w/v)`, main: true },
          ],
        };
      },
    },

    /* ---------- 산화·환원과 전기화학 ---------- */
    {
      id: 'redox',
      group: '산화·환원과 전기화학',
      title: '산화·환원 적정',
      hint: '주고받은 전자의 몰수가 같습니다: n₁M₁V₁ = n₂M₂V₂. KMnO₄는 5, H₂O₂와 옥살산은 2, Fe²⁺은 1입니다.',
      inputs: [
        { id: 'c1', label: '표준 용액의 농도', unit: 'M', value: '0.0200' },
        { id: 'v1', label: '적정에 쓴 표준 용액', unit: 'mL', placeholder: '18.0' },
        { id: 'n1', label: '표준 용액 1몰이 받는 전자', value: '5' },
        { id: 'v2', label: '시료의 부피', unit: 'mL', placeholder: '10.0' },
        { id: 'n2', label: '시료 1몰이 주는 전자', value: '2' },
        { id: 'mm', label: '시료 물질의 몰질량 (없으면 비움)', unit: 'g/mol', placeholder: '34.01' },
      ],
      compute(v) {
        const c1 = num(v.c1);
        const v1 = num(v.v1);
        const n1 = num(v.n1);
        const v2 = num(v.v2);
        const n2 = num(v.n2);
        if (!pos(c1, v1, n1, v2, n2)) return fail('몰질량을 뺀 모든 칸에 0보다 큰 숫자를 입력하세요.');
        const c2 = (n1 * c1 * v1) / (n2 * v2);
        const rows = [
          { label: '주고받은 전자', value: `${sig((n1 * c1 * v1) / 1000, 3)} mol` },
          { label: '시료의 농도', value: `${sig(c2, 3)} M`, main: true },
        ];
        const mm = num(v.mm);
        if (mm > 0) rows.push({ label: '질량 농도', value: `${sig(c2 * mm, 4)} g/L (${sig((c2 * mm) / 10, 4)} % (w/v))` });
        return { ok: true, rows };
      },
    },
    {
      id: 'cell',
      group: '산화·환원과 전기화학',
      title: '화학 전지의 전위 (네른스트 식)',
      hint: 'E° = E°(환원 전극) − E°(산화 전극), E = E° − (0.05916 ÷ n) log Q (25 °C)',
      inputs: [
        { id: 'anode', label: '(−)극: 산화되는 금속', type: 'select', options: METALS, value: 'Zn' },
        { id: 'ca', label: '(−)극 쪽 이온의 농도', unit: 'M', value: '1.0' },
        { id: 'cathode', label: '(+)극: 이온이 환원되는 금속', type: 'select', options: METALS, value: 'Cu' },
        { id: 'cc', label: '(+)극 쪽 이온의 농도', unit: 'M', value: '1.0' },
      ],
      compute(v) {
        const anode = HALF[v.anode];
        const cathode = HALF[v.cathode];
        const ca = num(v.ca);
        const cc = num(v.cc);
        if (!anode || !cathode || !pos(ca, cc)) return fail('두 금속을 고르고 농도를 0보다 큰 숫자로 입력하세요.');
        const e0 = cathode.e - anode.e;
        const n = (anode.z * cathode.z) / gcd(anode.z, cathode.z);
        const q = Math.pow(ca, n / anode.z) / Math.pow(cc, n / cathode.z);
        const e = e0 - (NERNST / n) * Math.log10(q);
        return {
          ok: true,
          rows: [
            { label: '표준 전지 전위 E°', value: `${fix(e0, 2)} V` },
            { label: '이동하는 전자 수 n', value: String(n) },
            { label: '전지 전위 E', value: `${fix(e, 3)} V`, main: true },
          ],
          note: e < 0 ? '이 방향으로는 저절로 반응하지 않습니다. 두 전극을 바꾸어 보세요.' : '',
        };
      },
    },
    {
      id: 'faraday',
      group: '산화·환원과 전기화학',
      title: '전기 분해로 석출되는 금속 (패러데이 법칙)',
      hint: '전하량 = 전류 × 시간, 석출 질량 = 전하량 × 몰질량 ÷ (전하수 × 96485). 기본값은 구리입니다.',
      inputs: [
        { id: 'i', label: '전류', unit: 'A', placeholder: '0.500' },
        { id: 't', label: '시간', unit: '분', placeholder: '30.0' },
        { id: 'mm', label: '금속의 몰질량', unit: 'g/mol', value: '63.55' },
        { id: 'z', label: '이온의 전하수', value: '2' },
        { id: 'actual', label: '실제로 늘어난 질량 (없으면 비움)', unit: 'g' },
      ],
      compute(v) {
        const i = num(v.i);
        const t = num(v.t);
        const mm = num(v.mm);
        const z = num(v.z);
        if (!pos(i, t, mm, z)) return fail('실제 질량을 뺀 모든 칸에 0보다 큰 숫자를 입력하세요.');
        const charge = i * t * 60;
        const mass = (charge * mm) / (z * FARADAY);
        const rows = [
          { label: '흐른 전하량', value: `${sig(charge, 4)} C` },
          { label: '전자의 몰수', value: `${sig(charge / FARADAY, 4)} mol` },
          { label: '석출되는 금속 (이론값)', value: `${sig(mass, 4)} g`, main: true },
        ];
        const actual = num(v.actual);
        if (actual > 0) rows.push({ label: '오차율', value: `${fix(((actual - mass) / mass) * 100, 1)} %` });
        return { ok: true, rows };
      },
    },

    /* ---------- 실험 정리 ---------- */
    {
      id: 'percent-error',
      group: '실험 정리',
      title: '오차율',
      hint: '오차율 = (실험값 − 이론값) ÷ 이론값 × 100',
      inputs: [
        { id: 'exp', label: '실험값', placeholder: '22.9' },
        { id: 'theory', label: '이론값', placeholder: '22.4' },
      ],
      compute(v) {
        const exp = num(v.exp);
        const theory = num(v.theory);
        if (!isNum(exp, theory) || theory === 0) return fail('실험값과 이론값을 숫자로 입력하세요. 이론값은 0이 아니어야 합니다.');
        const error = ((exp - theory) / theory) * 100;
        return { ok: true, rows: [{ label: '오차율', value: `${fix(Math.abs(error), 2)} %`, main: true }, { label: '방향', value: error > 0 ? '이론값보다 크다' : error < 0 ? '이론값보다 작다' : '같다' }] };
      },
    },
    {
      id: 'stats',
      group: '실험 정리',
      title: '여러 번 잰 값의 평균과 표준 편차',
      hint: '값을 쉼표로 나누어 적습니다. 표준 편차는 (n − 1)로 나눈 값입니다.',
      inputs: [{ id: 'values', label: '측정값들', type: 'list', placeholder: '10.1, 10.3, 10.2' }],
      compute(v) {
        const xs = listOf(v.values);
        if (xs.length < 2 || !isNum(...xs)) return fail('숫자를 2개 이상 쉼표로 나누어 입력하세요.');
        const n = xs.length;
        const mean = xs.reduce((s, x) => s + x, 0) / n;
        const sd = Math.sqrt(xs.reduce((s, x) => s + (x - mean) * (x - mean), 0) / (n - 1));
        return {
          ok: true,
          rows: [
            { label: '측정 횟수', value: `${n}회` },
            { label: '평균', value: sig(mean, 5), main: true },
            { label: '표준 편차', value: sig(C.roundTo(sd, 9), 3) },
            { label: '상대 표준 편차', value: mean !== 0 ? `${sig(C.roundTo((sd / Math.abs(mean)) * 100, 9), 3)} %` : '—' },
          ],
        };
      },
    },
  ];

  function find(id) {
    return CALCS.find((c) => c.id === id) || null;
  }

  function run(id, values) {
    const calc = find(id);
    return calc ? calc.compute(values || {}) : fail('없는 계산입니다.');
  }

  // 실험 자료(experiments.js)의 시약 한 줄을 조제 계산으로 바꾼다.
  function prepareReagent(spec, groups) {
    const times = groups > 1 ? Math.round(groups) : 1;
    if (spec.text) {
      const amount = spec.amount ? (times > 1 ? `${spec.amount} × ${times}조` : spec.amount) : '';
      return { ok: true, name: spec.text, formula: '', target: '', amount, result: null };
    }
    const volume = times > 1 ? String(C.roundTo(num(spec.volume) * times, 3)) : spec.volume;
    const base = { unit: spec.unit, conc: spec.conc, volume };
    let result;
    let name;
    let formula = '';
    if (spec.preset) {
      const p = C.LIQUID_PRESETS.find((x) => x.id === spec.preset);
      if (!p) return { ok: false, name: spec.preset, formula: '', target: '', amount: '', result: null };
      result = C.computeLiquid(Object.assign({ name: p.korean, label: p.label, formula: p.formula, molarMass: p.molarMass, percent: p.percent, density: p.density, caution: true }, base));
      name = `${p.korean} (진한 시약 ${p.percent}%)`;
    } else if (spec.id) {
      const reagent = C.findReagent(spec.id);
      result = C.computeSolid(Object.assign({ reagentId: spec.id, purity: C.DEFAULT_PURITY }, base));
      name = reagent ? reagent.korean : spec.id;
      formula = reagent && reagent.korean !== spec.id ? spec.id : '';
    } else {
      result = C.computeSolid(Object.assign({ reagentId: C.CUSTOM_ID, customName: spec.name, customMolarMass: spec.mm, purity: C.DEFAULT_PURITY }, base));
      name = spec.name;
      formula = spec.formula || '';
    }
    return {
      ok: result.ok,
      name,
      formula,
      target: `${spec.conc} ${spec.unit} ${volume} mL`,
      amount: result.ok ? result.item.amountText : '',
      result,
    };
  }

  // 여러 실험의 시약을 한데 모은다 (여러 실험 준비, SPEC 22장).
  //   같은 용액(같은 시약, 같은 농도와 단위)은 부피를 더해 한 줄로 만들고, 조 수만큼 늘린다.
  //   계산하지 않는 재료(글로만 적힌 것)는 이름이 같은 것끼리 묶어 실험마다의 양을 적는다.
  //   labs: experiments.js의 실험들. 돌려주는 값: { solutions: [{ prep, labs }], others: [{ name, uses: [{ lab, amount }] }] }
  function mergeReagents(labs, groups) {
    const times = groups > 1 ? Math.round(groups) : 1;
    const made = new Map();
    const others = new Map();
    for (const lab of labs || []) {
      for (const spec of lab.reagents) {
        if (spec.text) {
          if (!others.has(spec.text)) others.set(spec.text, { name: spec.text, uses: [] });
          others.get(spec.text).uses.push({ lab: lab.id, amount: prepareReagent(spec, times).amount });
          continue;
        }
        const who = spec.preset ? `p:${spec.preset}` : spec.id ? `i:${spec.id}` : `n:${spec.name}:${spec.mm}`;
        const key = [who, spec.conc, spec.unit].join('|');
        if (!made.has(key)) made.set(key, { spec, volume: 0, labs: [] });
        const entry = made.get(key);
        entry.volume += num(spec.volume) * times;
        if (!entry.labs.includes(lab.id)) entry.labs.push(lab.id);
      }
    }
    const solutions = Array.from(made.values(), (entry) => ({
      prep: prepareReagent(Object.assign({}, entry.spec, { volume: String(C.roundTo(entry.volume, 3)) }), 1),
      labs: entry.labs,
    }));
    return { solutions, others: Array.from(others.values()) };
  }

  const api = { CALCS, HALF, INDICATORS, find, run, vaporPressure, prepareReagent, mergeReagents, indicatorColor, indicatorRange, mixColor };
  if (IS_NODE) module.exports = api;
  else root.LabCalc = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
