/*
 * 용액 레시피 메이커 — 이론값 계산 (SPEC.md 21장)
 *
 * 실험 하나를 고르고 넣을 물질의 양을 적으면, 이론대로라면 나와야 할 값을 미리 계산한다.
 * 모델 하나는 { lab, equation, inputs, compute } 이다. lab은 experiments.js의 실험 id다.
 * compute(values)는 { ok: true, rows, steps, note, primary } 또는 { ok: false, message }를 돌려준다.
 *   rows    결과 줄 { label, value, main }
 *   steps   풀이 과정 (글 여러 줄)
 *   primary 실험값과 견줄 대표값 { label, value(숫자), unit }
 * 반응열 같은 문헌값은 입력 칸에 기본값으로 넣어 두어 고칠 수 있게 했다.
 * 브라우저에서는 window.LabTheory, Node에서는 require('./theory.js').
 */
(function (root) {
  'use strict';

  const IS_NODE = typeof module !== 'undefined' && module.exports;
  const C = IS_NODE ? require('./calc.js') : root.RecipeCalc;
  const L = IS_NODE ? require('./labcalc.js') : root.LabCalc;
  const num = C.parseNumber;
  const sig = C.formatSig;
  const fix = C.formatFixed;

  const R_ATM = 0.082057; // L·atm/(mol·K)
  const FARADAY = 96485; // C/mol
  const HEAT = 4.18; // 묽은 수용액의 비열 J/(g·°C)
  const KF_WATER = 1.86; // °C/m
  const MM = { hydrate: 249.69, cuso4: 159.61, mg: 24.305, mgo: 40.304, caco3: 100.09, co2: 44.01, agcl: 143.32, naoh: 40.0, acetic: 60.05, h2o2: 34.01, ascorbic: 176.12, i2: 253.81, nh3: 17.03, hcl: 36.46, caoh2: 74.09 };

  const NEED = '빈칸에 0보다 큰 숫자를 입력하세요.';
  const fail = (message) => ({ ok: false, message: message || NEED });
  const pos = (...xs) => xs.every((x) => x > 0);
  const isNum = (...xs) => xs.every((x) => !Number.isNaN(x));
  const signed = (x, digits) => `${x > 0 ? '+' : ''}${fix(x, digits)}`;
  // 절대영도(−273.15 °C) 이하의 처음 온도는 계산하지 않는다.
  const COLD = '온도는 절대영도(−273.15 °C)보다 높아야 해요.';
  const cold = (celsius) => !(celsius + 273.15 > 0);

  // 적정에서 뷰렛으로 넣을 부피가 너무 크거나 작으면 알려 준다.
  function buretteNote(ml) {
    if (ml > 50) return '뷰렛 한 번(50 mL)으로는 모자라요. 시료를 더 묽히거나 덜 넣으세요.';
    if (ml < 5) return '넣는 부피가 5 mL보다 작아 오차가 커져요. 시료를 더 넣거나 표준 용액을 묽히세요.';
    return '';
  }

  const METALS = L ? Object.keys(L.HALF).map((m) => [m, `${m} (${L.HALF[m].ion})`]) : [];

  const MODELS = [
    {
      lab: 'hydrate',
      equation: 'CuSO4·5H2O → CuSO4 + 5H2O',
      inputs: [{ id: 'm', label: '황산 구리(II) 오수화물의 질량', unit: 'g', value: '2.000' }],
      compute(v) {
        const m = num(v.m);
        if (!pos(m)) return fail();
        const n = m / MM.hydrate;
        const left = n * MM.cuso4;
        return {
          ok: true,
          rows: [
            { label: '가열 후 남는 무수물', value: `${fix(left, 3)} g`, main: true },
            { label: '날아가는 물', value: `${fix(m - left, 3)} g` },
            { label: '질량 감소율', value: `${fix(((m - left) / m) * 100, 2)} %` },
          ],
          steps: [`수화물의 몰수 = ${fix(m, 3)} g ÷ 249.69 g/mol = ${sig(n, 4)} mol`, `남는 무수물 = ${sig(n, 4)} mol × 159.61 g/mol = ${fix(left, 3)} g`, `날아가는 물 = ${fix(m, 3)} − ${fix(left, 3)} = ${fix(m - left, 3)} g`],
          primary: { label: '가열 후 남는 무수물', value: left, unit: 'g' },
        };
      },
    },
    {
      lab: 'mgo',
      equation: '2Mg + O2 → 2MgO',
      inputs: [{ id: 'm', label: '마그네슘의 질량', unit: 'g', value: '0.250' }],
      compute(v) {
        const m = num(v.m);
        if (!pos(m)) return fail();
        const n = m / MM.mg;
        const mgo = n * MM.mgo;
        return {
          ok: true,
          rows: [
            { label: '생기는 산화 마그네슘', value: `${fix(mgo, 3)} g`, main: true },
            { label: '결합하는 산소', value: `${fix(mgo - m, 3)} g` },
            { label: '마그네슘의 몰수', value: `${sig(n, 4)} mol` },
          ],
          steps: [`마그네슘의 몰수 = ${fix(m, 3)} g ÷ 24.305 g/mol = ${sig(n, 4)} mol`, `Mg와 MgO의 몰비는 1 : 1이므로 MgO = ${sig(n, 4)} mol × 40.304 g/mol = ${fix(mgo, 3)} g`],
          primary: { label: '생기는 산화 마그네슘', value: mgo, unit: 'g' },
        };
      },
    },
    {
      lab: 'limiting',
      equation: 'CaCO3 + 2HCl → CaCl2 + H2O + CO2',
      inputs: [
        { id: 'm', label: '탄산 칼슘의 질량', unit: 'g', value: '1.00' },
        { id: 'c', label: '염산의 농도', unit: 'M', value: '1.00' },
        { id: 'vol', label: '염산의 부피', unit: 'mL', value: '50.0' },
      ],
      compute(v) {
        const m = num(v.m);
        const c = num(v.c);
        const vol = num(v.vol);
        if (!pos(m, c, vol)) return fail();
        const nSolid = m / MM.caco3;
        const nAcid = (c * vol) / 1000;
        const solidLimits = nAcid >= 2 * nSolid;
        const nGas = solidLimits ? nSolid : nAcid / 2;
        const gas = nGas * MM.co2;
        return {
          ok: true,
          rows: [
            { label: '한계 반응물', value: solidLimits ? '탄산 칼슘' : '염산' },
            { label: '빠져나가는 이산화 탄소 (질량 감소)', value: `${fix(gas, 3)} g`, main: true },
            { label: '이산화 탄소의 몰수', value: `${sig(nGas, 4)} mol` },
            { label: '남는 반응물', value: solidLimits ? `염산 ${sig(nAcid - 2 * nSolid, 3)} mol` : `탄산 칼슘 ${fix((nSolid - nAcid / 2) * MM.caco3, 3)} g` },
          ],
          steps: [
            `탄산 칼슘 = ${sig(m, 4)} g ÷ 100.09 g/mol = ${sig(nSolid, 4)} mol`,
            `염산 = ${sig(c, 4)} M × ${sig(vol, 4)} mL = ${sig(nAcid, 4)} mol`,
            `탄산 칼슘 1몰에 염산 2몰이 필요하다. 필요한 염산은 ${sig(2 * nSolid, 4)} mol이므로 ${solidLimits ? '염산이 남고 탄산 칼슘이 모두 반응한다' : '염산이 모자라 염산이 모두 반응한다'}.`,
            `이산화 탄소 = ${sig(nGas, 4)} mol × 44.01 g/mol = ${fix(gas, 3)} g`,
          ],
          primary: { label: '빠져나가는 이산화 탄소', value: gas, unit: 'g' },
        };
      },
    },
    {
      lab: 'precipitate',
      equation: 'Ag⁺ + Cl⁻ → AgCl↓',
      inputs: [
        { id: 'ca', label: '질산 은 수용액의 농도', unit: 'M', value: '0.100' },
        { id: 'va', label: '질산 은 수용액의 부피', unit: 'mL', value: '10.0' },
        { id: 'cb', label: '염화 나트륨 수용액의 농도', unit: 'M', value: '0.100' },
        { id: 'vb', label: '염화 나트륨 수용액의 부피', unit: 'mL', value: '10.0' },
      ],
      compute(v) {
        const [ca, va, cb, vb] = [num(v.ca), num(v.va), num(v.cb), num(v.vb)];
        if (!pos(ca, va, cb, vb)) return fail();
        const nAg = ca * va; // mmol
        const nCl = cb * vb;
        const n = Math.min(nAg, nCl);
        const mass = (n * MM.agcl) / 1000;
        const left = nAg === nCl ? '없음 (딱 맞게 반응)' : nAg > nCl ? `은 이온 ${sig(nAg - nCl, 3)} mmol` : `염화 이온 ${sig(nCl - nAg, 3)} mmol`;
        return {
          ok: true,
          rows: [
            { label: '생기는 염화 은 앙금', value: `${fix(mass, 4)} g`, main: true },
            { label: '앙금의 몰수', value: `${sig(n, 4)} mmol` },
            { label: '남는 이온', value: left },
          ],
          steps: [`은 이온 = ${sig(ca, 4)} M × ${sig(va, 4)} mL = ${sig(nAg, 4)} mmol`, `염화 이온 = ${sig(cb, 4)} M × ${sig(vb, 4)} mL = ${sig(nCl, 4)} mmol`, `1 : 1로 반응하므로 적은 쪽인 ${sig(n, 4)} mmol만큼 앙금이 생긴다.`, `염화 은 = ${sig(n, 4)} mmol × 143.32 g/mol = ${fix(mass, 4)} g`],
          primary: { label: '생기는 염화 은 앙금', value: mass, unit: 'g' },
        };
      },
    },
    {
      lab: 'gas-constant',
      equation: 'Mg + 2HCl → MgCl2 + H2',
      inputs: [
        { id: 'm', label: '마그네슘의 질량', unit: 'g', value: '0.0400' },
        { id: 't', label: '실험실의 온도', unit: '°C', value: '22' },
        { id: 'p', label: '대기압', unit: 'hPa', value: '1013' },
      ],
      compute(v) {
        const [m, t, p] = [num(v.m), num(v.t), num(v.p)];
        if (!pos(m, p) || Number.isNaN(t)) return fail();
        const vapor = L.vaporPressure(t);
        if (Number.isNaN(vapor)) return fail('온도는 15~30 °C 사이로 입력하세요. 물의 증기압 표가 이 구간만 있어요.');
        const total = (p * 760) / 1013.25;
        const partial = total - vapor;
        const n = m / MM.mg;
        const ml = ((n * R_ATM * (t + 273.15)) / (partial / 760)) * 1000;
        return {
          ok: true,
          rows: [
            { label: '눈금 실린더에 모이는 수소', value: `${fix(ml, 1)} mL`, main: true },
            { label: '수소의 몰수', value: `${sig(n, 4)} mol` },
            { label: '수소의 부분 압력', value: `${fix(partial, 1)} mmHg` },
            { label: '물의 증기압', value: `${fix(vapor, 1)} mmHg` },
          ],
          steps: [
            `수소의 몰수 = 마그네슘의 몰수 = ${sig(m, 4)} g ÷ 24.305 g/mol = ${sig(n, 4)} mol`,
            `수소의 부분 압력 = 대기압 ${fix(total, 1)} mmHg − 물의 증기압 ${fix(vapor, 1)} mmHg = ${fix(partial, 1)} mmHg`,
            `V = nRT ÷ P = ${sig(n, 4)} × 0.082057 × ${fix(t + 273.15, 2)} ÷ ${sig(partial / 760, 4)} atm = ${fix(ml, 1)} mL`,
          ],
          note: ml > 50 ? '50 mL 눈금 실린더로는 모자라요. 100 mL짜리를 쓰거나 마그네슘을 줄이세요.' : '',
          primary: { label: '눈금 실린더에 모이는 수소', value: ml, unit: 'mL' },
        };
      },
    },
    {
      lab: 'graham',
      equation: 'NH3(g) + HCl(g) → NH4Cl(s)',
      inputs: [{ id: 'len', label: '유리관의 길이', unit: 'cm', value: '60.0' }],
      compute(v) {
        const len = num(v.len);
        if (!pos(len)) return fail();
        const ratio = Math.sqrt(MM.hcl / MM.nh3);
        const fromAmmonia = (len * ratio) / (1 + ratio);
        return {
          ok: true,
          rows: [
            { label: '흰 고리의 자리 (암모니아 쪽 끝에서)', value: `${fix(fromAmmonia, 1)} cm`, main: true },
            { label: '염산 쪽 끝에서', value: `${fix(len - fromAmmonia, 1)} cm` },
            { label: '속도의 비 (암모니아 ÷ 염화 수소)', value: fix(ratio, 2) },
          ],
          steps: [`속도의 비 = √(36.46 ÷ 17.03) = ${fix(ratio, 3)}`, `같은 시간 동안 간 거리의 비도 ${fix(ratio, 3)} : 1이다.`, `암모니아가 간 거리 = ${fix(len, 1)} cm × ${fix(ratio, 3)} ÷ (1 + ${fix(ratio, 3)}) = ${fix(fromAmmonia, 1)} cm`],
          note: '실제로는 공기 분자와 부딪히며 퍼지기 때문에 고리가 이론값보다 가운데 쪽에 생기기 쉬워요.',
          primary: { label: '흰 고리의 자리 (암모니아 쪽 끝에서)', value: fromAmmonia, unit: 'cm' },
        };
      },
    },
    {
      lab: 'neutralization-heat',
      equation: 'H⁺ + OH⁻ → H2O',
      inputs: [
        { id: 'ca', label: '염산의 농도', unit: 'M', value: '1.00' },
        { id: 'va', label: '염산의 부피', unit: 'mL', value: '50.0' },
        { id: 'cb', label: '수산화 나트륨 수용액의 농도', unit: 'M', value: '1.00' },
        { id: 'vb', label: '수산화 나트륨 수용액의 부피', unit: 'mL', value: '50.0' },
        { id: 't0', label: '처음 온도', unit: '°C', value: '20.0' },
        { id: 'dh', label: '중화열 (물 1몰이 생길 때)', unit: 'kJ/mol', value: '55.8' },
      ],
      compute(v) {
        const [ca, va, cb, vb, t0, dh] = [num(v.ca), num(v.va), num(v.cb), num(v.vb), num(v.t0), num(v.dh)];
        if (!pos(ca, va, cb, vb, dh) || Number.isNaN(t0)) return fail();
        if (cold(t0)) return fail(COLD);
        const n = Math.min(ca * va, cb * vb) / 1000;
        const q = n * dh * 1000;
        const mass = va + vb;
        const rise = q / (mass * HEAT);
        return {
          ok: true,
          rows: [
            { label: '예상 온도 변화', value: `${signed(rise, 2)} °C`, main: true },
            { label: '예상 나중 온도', value: `${fix(t0 + rise, 1)} °C` },
            { label: '생기는 물', value: `${sig(n, 4)} mol` },
            { label: '나오는 열', value: `${sig(q, 4)} J` },
          ],
          steps: [`생기는 물 = 적은 쪽의 몰수 = ${sig(n, 4)} mol`, `나오는 열 = ${sig(n, 4)} mol × ${sig(dh, 4)} kJ/mol = ${sig(q, 4)} J`, `용액의 질량은 ${sig(mass, 4)} g(밀도 1.00 g/mL로 봄), 비열은 4.18 J/(g·°C)로 본다.`, `ΔT = ${sig(q, 4)} ÷ (${sig(mass, 4)} × 4.18) = ${fix(rise, 2)} °C`],
          note: '열량계가 흡수하는 열과 밖으로 새는 열은 넣지 않았어요. 실제 온도 변화는 이보다 조금 작게 나와요.',
          primary: { label: '예상 온도 변화', value: rise, unit: '°C' },
        };
      },
    },
    {
      lab: 'hess',
      equation: 'ΔH3 = ΔH1 + ΔH2',
      inputs: [
        { id: 'm', label: '수산화 나트륨의 질량', unit: 'g', value: '2.00' },
        { id: 'dh1', label: '수산화 나트륨의 용해열 (내놓는 열)', unit: 'kJ/mol', value: '44.5' },
        { id: 'dh2', label: '중화열 (내놓는 열)', unit: 'kJ/mol', value: '55.8' },
      ],
      compute(v) {
        const [m, dh1, dh2] = [num(v.m), num(v.dh1), num(v.dh2)];
        if (!pos(m, dh1, dh2)) return fail();
        const n = m / MM.naoh;
        const acid = 0.05; // 반응 2는 1.00 M 50.0 mL씩, 반응 3은 0.500 M 염산 100 mL
        const rise1 = (n * dh1 * 1000) / ((100 + m) * HEAT);
        const rise2 = (acid * dh2 * 1000) / (100 * HEAT);
        const rise3 = ((n * dh1 + Math.min(n, acid) * dh2) * 1000) / ((100 + m) * HEAT);
        return {
          ok: true,
          rows: [
            { label: '반응 1 (고체를 물에 녹임)의 온도 변화', value: `${signed(rise1, 2)} °C` },
            { label: '반응 2 (두 수용액의 중화)의 온도 변화', value: `${signed(rise2, 2)} °C` },
            { label: '반응 3 (고체를 염산에 넣음)의 온도 변화', value: `${signed(rise3, 2)} °C`, main: true },
            { label: 'ΔH3 = ΔH1 + ΔH2', value: `−${sig(dh1 + dh2, 4)} kJ/mol` },
          ],
          steps: [
            `수산화 나트륨 = ${sig(m, 4)} g ÷ 40.00 g/mol = ${sig(n, 4)} mol`,
            `반응 1: ${sig(n, 4)} mol × ${sig(dh1, 4)} kJ/mol ÷ (${sig(100 + m, 4)} g × 4.18) = ${fix(rise1, 2)} °C`,
            `반응 2: 0.0500 mol × ${sig(dh2, 4)} kJ/mol ÷ (100 g × 4.18) = ${fix(rise2, 2)} °C`,
            `반응 3: 용해와 중화가 함께 일어나므로 두 열을 더해 ${fix(rise3, 2)} °C`,
          ],
          note: n > acid ? '수산화 나트륨이 염산(0.0500 mol)보다 많아요. 반응 3에서 남는 만큼은 중화되지 않아요.' : '용해열과 중화열은 책마다 조금 달라요. 교재의 값으로 고쳐 쓰세요.',
          primary: { label: '반응 3의 온도 변화', value: rise3, unit: '°C' },
        };
      },
    },
    {
      lab: 'dissolution-heat',
      equation: '고체 + 물 → 수용액 (열을 흡수하거나 내놓음)',
      inputs: [
        { id: 'sub', label: '녹이는 물질', type: 'preset', options: [['nh4no3', '질산 암모늄 (흡열)'], ['cacl2', '무수 염화 칼슘 (발열)']], fills: { nh4no3: { mm: '80.04', dh: '25.7' }, cacl2: { mm: '110.98', dh: '-82.8' } } },
        { id: 'm', label: '물질의 질량', unit: 'g', value: '5.00' },
        { id: 'mm', label: '몰질량', unit: 'g/mol', value: '80.04' },
        { id: 'dh', label: '용해 엔탈피 (흡열 +, 발열 −)', unit: 'kJ/mol', value: '25.7' },
        { id: 'water', label: '물의 질량', unit: 'g', value: '50.0' },
        { id: 't0', label: '처음 온도', unit: '°C', value: '20.0' },
      ],
      compute(v) {
        const [m, mm, dh, water, t0] = [num(v.m), num(v.mm), num(v.dh), num(v.water), num(v.t0)];
        if (!pos(m, mm, water) || !isNum(dh, t0) || dh === 0) return fail('질량과 몰질량은 0보다 큰 숫자로, 용해 엔탈피와 온도는 숫자로 입력하세요.');
        if (cold(t0)) return fail(COLD);
        const n = m / mm;
        const q = n * dh * 1000; // 흡수하는 열 (J)
        const change = -q / ((water + m) * HEAT);
        return {
          ok: true,
          rows: [
            { label: '예상 온도 변화', value: `${signed(change, 2)} °C`, main: true },
            { label: '예상 나중 온도', value: `${fix(t0 + change, 1)} °C` },
            { label: '녹는 물질', value: `${sig(n, 4)} mol` },
            { label: dh > 0 ? '물에서 빼앗는 열' : '물에 내놓는 열', value: `${sig(Math.abs(q), 4)} J` },
          ],
          steps: [`몰수 = ${sig(m, 4)} g ÷ ${sig(mm, 5)} g/mol = ${sig(n, 4)} mol`, `열 = ${sig(n, 4)} mol × ${sig(Math.abs(dh), 4)} kJ/mol = ${sig(Math.abs(q), 4)} J (${dh > 0 ? '흡수' : '방출'})`, `ΔT = ${dh > 0 ? '−' : '+'}${sig(Math.abs(q), 4)} ÷ (${sig(water + m, 4)} g × 4.18) = ${signed(change, 2)} °C`],
          primary: { label: '예상 온도 변화', value: change, unit: '°C' },
        };
      },
    },
    {
      lab: 'freezing',
      equation: 'ΔTf = i × Kf × m (물의 Kf = 1.86 °C/m)',
      inputs: [
        { id: 'sub', label: '용질', type: 'preset', options: [['urea', '요소'], ['glucose', '포도당'], ['nacl', '염화 나트륨'], ['mgcl2', '염화 마그네슘']], fills: { urea: { mm: '60.06', i: '1' }, glucose: { mm: '180.16', i: '1' }, nacl: { mm: '58.44', i: '2' }, mgcl2: { mm: '95.21', i: '3' } } },
        { id: 'm', label: '용질의 질량', unit: 'g', value: '3.00' },
        { id: 'mm', label: '용질의 몰질량', unit: 'g/mol', value: '60.06' },
        { id: 'i', label: '반트호프 인자 i', value: '1' },
        { id: 'water', label: '물의 질량', unit: 'g', value: '50.0' },
      ],
      compute(v) {
        const [m, mm, i, water] = [num(v.m), num(v.mm), num(v.i), num(v.water)];
        if (!pos(m, mm, i, water)) return fail();
        const molality = m / mm / (water / 1000);
        const drop = i * KF_WATER * molality;
        return {
          ok: true,
          rows: [
            { label: '예상 어는점', value: `${fix(-drop, 2)} °C`, main: true },
            { label: '어는점 내림', value: `${fix(drop, 2)} °C` },
            { label: '몰랄 농도', value: `${sig(molality, 4)} m` },
          ],
          steps: [`몰랄 농도 = (${sig(m, 4)} g ÷ ${sig(mm, 5)} g/mol) ÷ ${sig(water / 1000, 4)} kg = ${sig(molality, 4)} m`, `ΔTf = ${sig(i, 3)} × 1.86 × ${sig(molality, 4)} = ${fix(drop, 2)} °C`],
          note: i > 1 ? '전해질은 이온끼리 끌어당겨서 실제 어는점 내림이 이 값보다 조금 작게 나와요.' : '',
          primary: { label: '어는점 내림', value: drop, unit: '°C' },
        };
      },
    },
    {
      lab: 'ksp',
      equation: 'Ca(OH)2(s) ⇌ Ca²⁺ + 2OH⁻,  Ksp = 4s³',
      inputs: [
        { id: 'ksp', label: '용해도곱 상수 Ksp', unit: '× 10⁻⁶', value: '5.0' },
        { id: 'sample', label: '거른 포화 용액의 부피', unit: 'mL', value: '25.0' },
        { id: 'c', label: '염산의 농도', unit: 'M', value: '0.0500' },
      ],
      compute(v) {
        const [ksp, sample, c] = [num(v.ksp), num(v.sample), num(v.c)];
        if (!pos(ksp, sample, c)) return fail();
        const s = Math.cbrt((ksp * 1e-6) / 4);
        const oh = 2 * s;
        const ml = (oh * sample) / c;
        return {
          ok: true,
          rows: [
            { label: '종말점까지 넣는 염산', value: `${fix(ml, 2)} mL`, main: true },
            { label: '포화 용액의 [OH⁻]', value: `${sig(oh, 3)} M` },
            { label: '용해도', value: `${sig(s, 3)} M (${sig(s * MM.caoh2, 3)} g/L)` },
            { label: '포화 용액의 pH', value: fix(14 + Math.log10(oh), 2) },
          ],
          steps: [`Ksp = s × (2s)² = 4s³이므로, 용해도 s = (${sig(ksp, 3)} × 10⁻⁶ ÷ 4)의 세제곱근 = ${sig(s, 3)} M`, `[OH⁻] = 2s = ${sig(oh, 3)} M`, `염산의 부피 = ${sig(oh, 3)} M × ${sig(sample, 4)} mL ÷ ${sig(c, 4)} M = ${fix(ml, 2)} mL`],
          note: buretteNote(ml),
          primary: { label: '종말점까지 넣는 염산', value: ml, unit: 'mL' },
        };
      },
    },
    {
      lab: 'vinegar',
      equation: 'CH3COOH + NaOH → CH3COONa + H2O',
      inputs: [
        { id: 'pct', label: '식초의 아세트산 함량', unit: '% (w/v)', value: '6.0' },
        { id: 'dil', label: '묽힌 배수', unit: '배', value: '10' },
        { id: 'sample', label: '묽힌 식초의 부피', unit: 'mL', value: '20.00' },
        { id: 'c', label: '수산화 나트륨 수용액의 농도', unit: 'M', value: '0.100' },
      ],
      compute(v) {
        const [pct, dil, sample, c] = [num(v.pct), num(v.dil), num(v.sample), num(v.c)];
        if (!pos(pct, dil, sample, c)) return fail();
        const molar = (pct * 10) / MM.acetic;
        const diluted = molar / dil;
        const ml = (diluted * sample) / c;
        return {
          ok: true,
          rows: [
            { label: '종말점까지 넣는 수산화 나트륨 수용액', value: `${fix(ml, 2)} mL`, main: true },
            { label: '식초 속 아세트산의 농도', value: `${sig(molar, 4)} M` },
            { label: '묽힌 식초의 농도', value: `${sig(diluted, 4)} M` },
          ],
          steps: [`식초의 농도 = ${sig(pct, 3)} % × 10 ÷ 60.05 g/mol = ${sig(molar, 4)} M`, `${sig(dil, 3)}배 묽히면 ${sig(diluted, 4)} M`, `NaOH의 부피 = ${sig(diluted, 4)} M × ${sig(sample, 4)} mL ÷ ${sig(c, 4)} M = ${fix(ml, 2)} mL`],
          note: buretteNote(ml),
          primary: { label: '종말점까지 넣는 수산화 나트륨 수용액', value: ml, unit: 'mL' },
        };
      },
    },
    {
      lab: 'weak-acid',
      equation: 'CH3COOH ⇌ H⁺ + CH3COO⁻,  Ka = x² ÷ (C − x)',
      inputs: [
        { id: 'c', label: '아세트산의 농도', unit: 'M', value: '0.100' },
        { id: 'ka', label: '이온화 상수 Ka', unit: '× 10⁻⁵', value: '1.8' },
      ],
      compute(v) {
        const [c, kaIn] = [num(v.c), num(v.ka)];
        if (!pos(c, kaIn)) return fail();
        const ka = kaIn * 1e-5;
        const hOf = (conc) => (-ka + Math.sqrt(ka * ka + 4 * ka * conc)) / 2;
        const h = hOf(c);
        return {
          ok: true,
          rows: [
            { label: '예상 pH', value: fix(-Math.log10(h), 2), main: true },
            { label: '[H⁺]', value: `${sig(h, 3)} M` },
            { label: '이온화도', value: `${sig((h / c) * 100, 3)} %` },
            { label: '10배 묽힌 용액의 pH', value: fix(-Math.log10(hOf(c / 10)), 2) },
            { label: '100배 묽힌 용액의 pH', value: fix(-Math.log10(hOf(c / 100)), 2) },
          ],
          steps: [`x² ÷ (${sig(c, 4)} − x) = ${sig(kaIn, 3)} × 10⁻⁵ 을 근의 공식으로 풀면 x = [H⁺] = ${sig(h, 3)} M`, `pH = −log(${sig(h, 3)}) = ${fix(-Math.log10(h), 2)}`, '묽힐수록 이온화도가 커져서 pH가 1씩 오르지 않고 약 0.5씩 오른다.'],
          primary: { label: '예상 pH', value: -Math.log10(h), unit: '' },
        };
      },
    },
    {
      lab: 'buffer',
      equation: 'pH = pKa + log([CH3COO⁻] ÷ [CH3COOH])',
      inputs: [
        { id: 'ca', label: '아세트산의 농도', unit: 'M', value: '0.100' },
        { id: 'va', label: '아세트산의 부피', unit: 'mL', value: '12.5' },
        { id: 'cb', label: '아세트산 나트륨의 농도', unit: 'M', value: '0.100' },
        { id: 'vb', label: '아세트산 나트륨의 부피', unit: 'mL', value: '12.5' },
        { id: 'pka', label: 'pKa', value: '4.74' },
        { id: 'kind', label: '넣는 용액', type: 'select', options: [['acid', '염산'], ['base', '수산화 나트륨 수용액']] },
        { id: 'cs', label: '넣는 용액의 농도', unit: 'M', value: '0.100' },
        { id: 'vs', label: '넣는 용액의 부피', unit: 'mL', value: '1.0' },
      ],
      compute(v) {
        const [ca, va, cb, vb, pka, cs, vs] = [num(v.ca), num(v.va), num(v.cb), num(v.vb), num(v.pka), num(v.cs), num(v.vs)];
        if (!pos(ca, va, cb, vb, cs, vs) || Number.isNaN(pka)) return fail();
        const acid = ca * va; // mmol
        const base = cb * vb;
        const added = cs * vs;
        const isAcid = v.kind !== 'base';
        const acidAfter = isAcid ? acid + added : acid - added;
        const baseAfter = isAcid ? base - added : base + added;
        if (!(acidAfter > 0 && baseAfter > 0)) return fail('넣는 양이 완충 용액이 버틸 수 있는 양을 넘어요. 넣는 부피를 줄이세요.');
        const before = pka + Math.log10(base / acid);
        const after = pka + Math.log10(baseAfter / acidAfter);
        const inWater = added / (va + vb + vs);
        const waterPh = isAcid ? -Math.log10(inWater) : 14 + Math.log10(inWater);
        return {
          ok: true,
          rows: [
            { label: '완충 용액의 pH', value: fix(before, 2), main: true },
            { label: `${isAcid ? '염산' : '수산화 나트륨 수용액'}을 넣은 뒤의 pH`, value: fix(after, 2), main: true },
            { label: 'pH 변화', value: signed(after - before, 2) },
            { label: '같은 양을 증류수에 넣었을 때의 pH', value: fix(waterPh, 2) },
          ],
          steps: [
            `아세트산 ${sig(acid, 4)} mmol, 아세트산 이온 ${sig(base, 4)} mmol → pH = ${sig(pka, 4)} + log(${sig(base, 4)} ÷ ${sig(acid, 4)}) = ${fix(before, 2)}`,
            `${isAcid ? 'H⁺' : 'OH⁻'} ${sig(added, 3)} mmol을 넣으면 아세트산 ${sig(acidAfter, 4)} mmol, 아세트산 이온 ${sig(baseAfter, 4)} mmol이 된다.`,
            `pH = ${sig(pka, 4)} + log(${sig(baseAfter, 4)} ÷ ${sig(acidAfter, 4)}) = ${fix(after, 2)}`,
            `증류수 ${sig(va + vb, 4)} mL에 넣으면 ${isAcid ? '[H⁺]' : '[OH⁻]'} = ${sig(inWater, 3)} M → pH ${fix(waterPh, 2)}`,
          ],
          primary: { label: '넣은 뒤의 pH', value: after, unit: '' },
        };
      },
    },
    {
      lab: 'permanganate',
      equation: '2MnO4⁻ + 5H2O2 + 6H⁺ → 2Mn²⁺ + 5O2 + 8H2O',
      inputs: [
        { id: 'pct', label: '과산화 수소수의 함량', unit: '% (w/v)', value: '3.0' },
        { id: 'dil', label: '묽힌 배수', unit: '배', value: '10' },
        { id: 'sample', label: '묽힌 용액의 부피', unit: 'mL', value: '10.00' },
        { id: 'c', label: '과망가니즈산 칼륨 수용액의 농도', unit: 'M', value: '0.0200' },
      ],
      compute(v) {
        const [pct, dil, sample, c] = [num(v.pct), num(v.dil), num(v.sample), num(v.c)];
        if (!pos(pct, dil, sample, c)) return fail();
        const molar = (pct * 10) / MM.h2o2;
        const n = (molar / dil) * sample; // 과산화 수소 mmol
        const ml = (n * 2) / 5 / c;
        return {
          ok: true,
          rows: [
            { label: '종말점까지 넣는 과망가니즈산 칼륨 수용액', value: `${fix(ml, 2)} mL`, main: true },
            { label: '과산화 수소수의 농도', value: `${sig(molar, 4)} M` },
            { label: '시료 속 과산화 수소', value: `${sig(n, 4)} mmol` },
            { label: '나오는 산소', value: `${sig(n, 4)} mmol` },
          ],
          steps: [`과산화 수소수의 농도 = ${sig(pct, 3)} % × 10 ÷ 34.01 g/mol = ${sig(molar, 4)} M`, `시료 속 과산화 수소 = ${sig(molar / dil, 4)} M × ${sig(sample, 4)} mL = ${sig(n, 4)} mmol`, `과망가니즈산 이온은 그 2/5만큼 필요하다: ${sig((n * 2) / 5, 4)} mmol`, `부피 = ${sig((n * 2) / 5, 4)} mmol ÷ ${sig(c, 4)} M = ${fix(ml, 2)} mL`],
          note: buretteNote(ml),
          primary: { label: '종말점까지 넣는 과망가니즈산 칼륨 수용액', value: ml, unit: 'mL' },
        };
      },
    },
    { lab: 'daniell', equation: 'Zn + Cu²⁺ → Zn²⁺ + Cu', calc: 'cell', values: { ca: '0.100', cc: '0.100' } },
    { lab: 'electrolysis', equation: 'Cu²⁺ + 2e⁻ → Cu,  m = I × t × M ÷ (z × F)', calc: 'faraday', values: { i: '0.500', t: '30.0' } },
    {
      lab: 'ki-electrolysis',
      equation: '(+)극 2I⁻ → I2 + 2e⁻,  (−)극 2H2O + 2e⁻ → H2 + 2OH⁻',
      inputs: [
        { id: 'i', label: '전류', unit: 'A', value: '0.20' },
        { id: 't', label: '전류를 흘린 시간', unit: '분', value: '3.0' },
      ],
      compute(v) {
        const [i, t] = [num(v.i), num(v.t)];
        if (!pos(i, t)) return fail();
        const charge = i * t * 60;
        const electrons = charge / FARADAY;
        const iodine = (electrons / 2) * MM.i2 * 1000;
        const gas = (electrons / 2) * R_ATM * 298.15 * 1000;
        return {
          ok: true,
          rows: [
            { label: '(+)극에 생기는 아이오딘', value: `${sig(iodine, 3)} mg`, main: true },
            { label: '(−)극에서 나오는 수소 (25 °C, 1 atm)', value: `${sig(gas, 3)} mL` },
            { label: '(−)극 쪽에 생기는 수산화 이온', value: `${sig(electrons * 1000, 3)} mmol` },
            { label: '흐른 전하량', value: `${sig(charge, 3)} C` },
          ],
          steps: [`전하량 = ${sig(i, 3)} A × ${sig(t * 60, 4)} s = ${sig(charge, 3)} C`, `전자의 몰수 = ${sig(charge, 3)} ÷ 96485 = ${sig(electrons, 3)} mol`, `전자 2몰에 아이오딘 1몰이므로 ${sig(electrons / 2, 3)} mol × 253.81 g/mol = ${sig(iodine, 3)} mg`],
          primary: { label: '(+)극에 생기는 아이오딘', value: iodine, unit: 'mg' },
        };
      },
    },
    {
      lab: 'vitamin-c',
      equation: 'C6H8O6 + I2 → C6H6O6 + 2I⁻ + 2H⁺',
      inputs: [
        { id: 'mg', label: '정제 한 알의 비타민 C (포장의 표시량)', unit: 'mg', value: '500' },
        { id: 'flask', label: '녹여서 채운 부피', unit: 'mL', value: '100' },
        { id: 'sample', label: '덜어 낸 부피', unit: 'mL', value: '10.00' },
        { id: 'c', label: '아이오딘 용액의 농도', unit: 'M', value: '0.0100' },
      ],
      compute(v) {
        const [mg, flask, sample, c] = [num(v.mg), num(v.flask), num(v.sample), num(v.c)];
        if (!pos(mg, flask, sample, c)) return fail();
        if (sample > flask) return fail('덜어 낸 부피가 채운 부피보다 클 수 없어요.');
        const total = mg / MM.ascorbic; // mmol
        const n = (total * sample) / flask;
        const ml = n / c;
        return {
          ok: true,
          rows: [
            { label: '종말점까지 넣는 아이오딘 용액', value: `${fix(ml, 2)} mL`, main: true },
            { label: '정제 한 알의 비타민 C', value: `${sig(total, 4)} mmol` },
            { label: '덜어 낸 용액 속 비타민 C', value: `${sig(n, 4)} mmol` },
          ],
          steps: [`비타민 C = ${sig(mg, 4)} mg ÷ 176.12 g/mol = ${sig(total, 4)} mmol`, `덜어 낸 ${sig(sample, 4)} mL에는 ${sig(n, 4)} mmol`, `아이오딘과 1 : 1로 반응하므로 ${sig(n, 4)} mmol ÷ ${sig(c, 4)} M = ${fix(ml, 2)} mL`],
          note: buretteNote(ml),
          primary: { label: '종말점까지 넣는 아이오딘 용액', value: ml, unit: 'mL' },
        };
      },
    },
    {
      lab: 'metal-activity',
      equation: '금속 A + 금속 B의 이온 → 금속 A의 이온 + 금속 B',
      inputs: [
        { id: 'metal', label: '넣는 금속', type: 'select', options: METALS, value: 'Zn' },
        { id: 'ion', label: '수용액 속 금속 이온', type: 'select', options: METALS, value: 'Cu' },
      ],
      compute(v) {
        const metal = L.HALF[v.metal];
        const ion = L.HALF[v.ion];
        if (!metal || !ion) return fail('금속과 이온을 고르세요.');
        if (v.metal === v.ion) return fail('금속과 이온을 서로 다르게 고르세요.');
        const e = ion.e - metal.e;
        const happens = e > 0;
        return {
          ok: true,
          rows: [
            { label: '반응', value: happens ? '일어나요' : '일어나지 않아요', main: true },
            { label: 'E° (환원되는 쪽 − 산화되는 쪽)', value: `${signed(e, 2)} V` },
            { label: '보이는 변화', value: happens ? `금속 표면에 ${v.ion} 석출, ${v.metal} 금속은 녹음` : '변화 없음' },
          ],
          steps: [`${ion.ion} + ${ion.z}e⁻ → ${v.ion}: E° = ${signed(ion.e, 2)} V`, `${metal.ion} + ${metal.z}e⁻ → ${v.metal}: E° = ${signed(metal.e, 2)} V`, `E° = ${signed(ion.e, 2)} − (${signed(metal.e, 2)}) = ${signed(e, 2)} V. ${happens ? '0보다 크므로 저절로 일어난다.' : '0보다 작으므로 저절로 일어나지 않는다.'}`],
        };
      },
    },
  ];

  // 계산 모음(labcalc.js)의 계산을 그대로 쓰는 모델은 입력과 계산을 거기서 가져온다.
  for (const model of MODELS) {
    if (!model.calc || !L) continue;
    const calc = L.find(model.calc);
    // 실험 과정에 적힌 양을 기본값으로 넣는다.
    model.inputs = calc.inputs.map((input) => (model.values && model.values[input.id] != null ? Object.assign({}, input, { value: model.values[input.id] }) : input));
    model.compute = calc.compute;
  }

  function find(lab) {
    return MODELS.find((m) => m.lab === lab) || null;
  }

  function run(lab, values) {
    const model = find(lab);
    return model ? model.compute(values || {}) : fail('이론값 계산이 없는 실험입니다.');
  }

  // 입력 칸의 기본값만으로 계산한다 (실험 과정에 적힌 양).
  function defaults(lab) {
    const model = find(lab);
    const values = {};
    if (!model) return values;
    for (const input of model.inputs) values[input.id] = input.value != null ? input.value : input.options ? input.options[0][0] : '';
    return values;
  }

  // 실험값과 이론값의 차이 (%). 이론값이 0이면 계산하지 않는다.
  function percentError(measured, theory) {
    if (!isNum(measured, theory) || theory === 0) return NaN;
    return ((measured - theory) / Math.abs(theory)) * 100;
  }

  // 여러 번 잰 값을 정리한다: 평균, 표준 편차(n − 1로 나눔), 상대 표준 편차(%), 이론값에 대한 오차율(%).
  // 숫자가 아닌 값은 뺀다. theory를 주지 않으면 오차율은 NaN이다.
  function summarize(values, theory) {
    const xs = (values || []).filter((x) => typeof x === 'number' && Number.isFinite(x));
    const n = xs.length;
    if (n === 0) return { n: 0, mean: NaN, sd: NaN, rsd: NaN, error: NaN, each: [] };
    const mean = xs.reduce((sum, x) => sum + x, 0) / n;
    const sd = n >= 2 ? Math.sqrt(xs.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (n - 1)) : NaN;
    const rsd = n >= 2 && mean !== 0 ? (sd / Math.abs(mean)) * 100 : NaN;
    const target = typeof theory === 'number' ? theory : NaN;
    return {
      n,
      mean,
      sd,
      rsd,
      error: percentError(mean, target),
      each: xs.map((x) => ({ value: x, deviation: x - mean, error: percentError(x, target) })),
    };
  }

  const api = { MODELS, find, run, defaults, percentError, summarize };
  if (IS_NODE) module.exports = api;
  else root.LabTheory = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
