// F24 (A135) 절대영도 안내: `node --test`
// 온도가 −273.15 °C 이하(0 K 이하)이면 계산하지 않고 안내를 보인다.
// 25 °C의 기대값은 고치기 전의 결과를 node로 따로 불러 적은 것이다.
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../labcalc.js');
const TH = require('../theory.js');

const COLD_L = '온도는 절대영도(−273.15 °C)보다 높아야 합니다.';
const COLD_TH = '온도는 절대영도(−273.15 °C)보다 높아야 해요.';

const value = (res, label) => res.rows.find((r) => r.label === label).value;

const cases = [
  {
    name: 'labcalc ideal-gas',
    run: (t) => L.run('ideal-gas', { p: '1013', punit: 'hPa', vol: '250', t }),
    cold: COLD_L,
    // 25 °C: T = 298.15 K, n = 0.9998 × 0.250 ÷ (0.082057 × 298.15) = 0.01022 mol
    at25: (res) => {
      assert.equal(value(res, '절대 온도'), '298.15 K');
      assert.equal(value(res, '몰수'), '0.01022 mol');
    },
  },
  {
    name: 'labcalc gas-collect',
    run: (t) => L.run('gas-collect', { mass: '0.0243', mm: '24.305', ratio: '1', vol: '24.9', t, p: '1013', punit: 'hPa', pw: '19.8' }),
    cold: COLD_L,
    // 25 °C: R = 0.9737 × 0.0249 ÷ (0.0009998 × 298.15) = 0.0813, 몰 부피 22.22 L/mol
    at25: (res) => {
      assert.equal(value(res, '기체 상수 R'), '0.0813 L·atm/(mol·K)');
      assert.equal(value(res, '0 °C, 1 atm에서의 몰 부피'), '22.22 L/mol');
    },
  },
  {
    name: 'labcalc calorimetry',
    run: (t) => L.run('calorimetry', { mass: '100', c: '4.18', t1: t, t2: '28.7', ccal: '0', mol: '' }),
    cold: COLD_L,
    // 25 °C → 28.7 °C: ΔT = 3.70 °C, q = 100 × 4.18 × 3.70 = 1547 J
    at25: (res) => {
      assert.equal(value(res, '온도 변화'), '3.70 °C');
      assert.equal(value(res, '주고받은 열량 q'), '1547 J (1.55 kJ)');
    },
  },
  {
    name: 'labcalc arrhenius',
    run: (t) => L.run('arrhenius', { T1: t, t1: '60', T2: '30', t2: '30' }),
    cold: COLD_L,
    // 25 °C, 30 °C: Ea = 8.314 × ln 2 ÷ (1/298.15 − 1/303.15) ≈ 104 kJ/mol
    at25: (res) => {
      assert.equal(value(res, '활성화 에너지 Ea'), '104 kJ/mol');
    },
  },
  {
    name: 'theory neutralization-heat',
    run: (t0) => TH.run('neutralization-heat', Object.assign(TH.defaults('neutralization-heat'), { t0 })),
    cold: COLD_TH,
    // 처음 25 °C: ΔT = 2790 ÷ (100 × 4.18) = +6.67 °C, 나중 31.7 °C
    at25: (res) => {
      assert.equal(value(res, '예상 온도 변화'), '+6.67 °C');
      assert.equal(value(res, '예상 나중 온도'), '31.7 °C');
    },
  },
  {
    name: 'theory dissolution-heat',
    run: (t0) => TH.run('dissolution-heat', Object.assign(TH.defaults('dissolution-heat'), { t0 })),
    cold: COLD_TH,
    // 처음 25 °C: ΔT = −1605 ÷ (55 × 4.18) = −6.98 °C, 나중 18.0 °C
    at25: (res) => {
      assert.equal(value(res, '예상 온도 변화'), '-6.98 °C');
      assert.equal(value(res, '예상 나중 온도'), '18.0 °C');
    },
  },
];

for (const c of cases) {
  test(`A135 ${c.name}: −300 °C와 −273.15 °C는 절대영도 안내`, () => {
    for (const t of ['-300', '-273.15']) {
      const res = c.run(t);
      assert.equal(res.ok, false, t);
      assert.equal(res.message, c.cold, t);
    }
  });

  test(`A135 ${c.name}: −273.14 °C는 계산한다`, () => {
    const res = c.run('-273.14');
    assert.equal(res.ok, true);
  });

  test(`A135 ${c.name}: 25 °C의 값은 그대로`, () => {
    const res = c.run('25');
    assert.equal(res.ok, true);
    c.at25(res);
  });

  test(`A135 ${c.name}: 숫자가 아니면 절대영도 안내가 아니다`, () => {
    const res = c.run('abc');
    assert.equal(res.ok, false);
    assert.notEqual(res.message, c.cold);
  });
}
