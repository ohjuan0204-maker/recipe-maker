// 전체 검증 (24장: 파일 읽기와 결과 정리의 분석): `node --test`
// 시험용 파일은 tests/fixtures/에 있다(tools/make_fixtures.py가 만든 지어낸 값).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const F = require('../filein.js');

const FX = path.join(__dirname, 'fixtures');
const readFx = (name) => F.readBytes(name, new Uint8Array(fs.readFileSync(path.join(FX, name))));
const bytes = (text, enc) => new Uint8Array(Buffer.from(text, enc || 'utf8'));

// 아주 작은 ZIP을 만든다 (압축한 것과 그대로 둔 것)
function makeZip(files) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, text, deflate] of files) {
    const raw = Buffer.from(text, 'utf8');
    const data = deflate ? zlib.deflateRawSync(raw) : raw;
    const nameBuf = Buffer.from(name, 'utf8');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(deflate ? 8 : 0, 8);
    local.writeUInt32LE(crc32(raw), 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(deflate ? 8 : 0, 10);
    central.writeUInt32LE(crc32(raw), 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, nameBuf, data);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...locals, cd, end]));
}

test('A95 파일 읽기: CSV(UTF-8, EUC-KR, 따옴표, 탭·세미콜론), 텍스트의 표', async () => {
  const csv = await F.readBytes('a.csv', bytes('﻿회차,"부피, mL"\r\n1,"19.85"\r\n2,19.90\r\n'));
  assert.ok(csv.ok);
  assert.deepEqual(csv.tables[0].rows, [['회차', '부피, mL'], ['1', '19.85'], ['2', '19.90']]);
  const quoted = F.parseCSV('a,"b ""c""",d\n1,2,3');
  assert.deepEqual(quoted, [['a', 'b "c"', 'd'], ['1', '2', '3']]);
  assert.deepEqual(F.parseCSV('x;y\n1,5;2'), [['x', 'y'], ['1,5', '2']]);
  assert.deepEqual(F.parseCSV('x\ty\n1\t2'), [['x', 'y'], ['1', '2']]);
  const kr = await readFx('trials-euckr.csv');
  assert.ok(kr.ok);
  assert.deepEqual(kr.tables[0].rows[0], ['잰 것', '1회', '2회', '3회', '평균']);
  const md = await F.readBytes('note.md', bytes('# 결과\n\n| 회 | 값 |\n|---|---|\n| 1 | 2.5 |\n| 2 | 2.7 |\n\n끝'));
  assert.deepEqual(md.blocks.map((b) => b.type), ['p', 'table', 'p']);
  assert.deepEqual(md.tables[0].rows, [['회', '값'], ['1', '2.5'], ['2', '2.7']]);
});

test('A95 파일 읽기: 엑셀(.xlsx), 워드(.docx), 한글(.hwpx)의 글과 표', async () => {
  const x = await readFx('titration.xlsx');
  assert.ok(x.ok, x.message);
  assert.deepEqual(x.tables.map((t) => t.name), ['반복 측정', '적정 곡선']);
  assert.deepEqual(x.tables[0].rows.slice(0, 2), [['회차', '적정 부피 (mL)', '온도 (°C)'], ['1', '19.85', '21']]);
  assert.deepEqual(x.tables[0].rows[4], ['평균']); // 값이 저장되지 않은 수식 칸은 비운다
  assert.equal(x.tables[1].rows.length, 14);
  const d = await readFx('plan-form.docx');
  assert.ok(d.ok, d.message);
  assert.deepEqual(d.blocks.slice(0, 3).map((b) => b.text), ['2학년 화학 실험 계획서', '1. 탐구 주제', '(내용을 적으시오)']);
  assert.deepEqual(d.tables[0].rows.map((r) => r[0]), ['준비물', '실험 방법', '안전 유의 사항']);
  const h = await readFx('plan-form.hwpx');
  assert.ok(h.ok, h.message);
  assert.deepEqual(h.blocks.map((b) => b.type), ['p', 'p', 'p', 'table', 'p', 'p']);
  assert.equal(h.blocks[0].text, '실험 계획서 & 결과'); // &amp; 풀기
  assert.equal(h.blocks[2].text, '식초 속 아세트산의 함량을 중화 적정으로 구한다.'); // 문단 속 여러 run을 잇는다
  assert.deepEqual(h.tables[0].rows[1], ['1', '16.42']);
  // 압축하지 않은 항목이 섞인 ZIP도 읽는다
  const sec = '<hs:sec xmlns:hp="p"><hp:p><hp:run><hp:t>가<hp:tab/>나</hp:t></hp:run></hp:p></hs:sec>';
  const zipped = await F.readBytes('x.hwpx', makeZip([['mimetype', 'application/hwp+zip', false], ['Contents/section0.xml', sec, true]]));
  assert.equal(zipped.blocks[0].text, '가\t나');
});

test('A95 파일 읽기: 읽지 못하는 파일은 까닭과 할 일을 알려 준다', async () => {
  for (const [name, word] of [['a.hwp', 'HWPX'], ['a.xls', '.xlsx'], ['a.doc', '.docx'], ['a.pdf', 'PDF'], ['a.jpg', '사진']]) {
    const r = await F.readBytes(name, bytes('x'));
    assert.equal(r.ok, false);
    assert.ok(r.message.includes(word), `${name}: ${r.message}`);
  }
  assert.equal((await F.readBytes('a.csv', new Uint8Array(0))).message, '빈 파일이에요.');
  assert.match((await F.readBytes('a.csv', new Uint8Array(F.MAX_BYTES + 1))).message, /너무 커요/);
  assert.match((await F.readBytes('a.xlsx', bytes('not a zip'))).message, /깨졌거나/);
  assert.match((await F.readBytes('a.zip', bytes('x'))).message, /읽을 수 있는 파일/);
});

test('A96 결과 정리의 분석: 반복 측정(세로·가로)과 연속 자료를 가리고, 평균 줄은 뺀다', async () => {
  assert.deepEqual(F.parseCell('19.85 mL'), { value: 19.85, unit: 'mL' });
  assert.deepEqual(F.parseCell('−0.5'), { value: -0.5, unit: '' });
  assert.deepEqual(F.parseCell('1.2e-3 M'), { value: 0.0012, unit: 'M' });
  assert.equal(F.parseCell('1회'), null);
  assert.deepEqual(F.splitHead('부피 (mL)'), { name: '부피', unit: 'mL' });
  assert.deepEqual(F.splitHead('Volume / mL'), { name: 'Volume', unit: 'mL' });
  // 세로: 회차 열은 값이 아니다. 평균 줄은 뺀다.
  const col = F.analyzeTable([['회차', '적정 부피 (mL)', '온도 (°C)'], ['1', '19.85', '21'], ['2', '19.90', '21.2'], ['3', '20.05', '21.1'], ['평균', '19.93', '21.1']]);
  assert.equal(col.kind, 'trials');
  assert.deepEqual(col.quantities.map((q) => `${q.name}|${q.unit}|${q.values.join(',')}`), ['적정 부피|mL|19.85,19.9,20.05', '온도|°C|21,21.2,21.1']);
  assert.deepEqual(col.quantities[0].texts, ['19.85', '19.90', '20.05']); // 적은 자릿수를 그대로
  // 가로: 1회·2회·3회 열, 평균 열은 뺀다
  const kr = await readFx('trials-euckr.csv');
  const row = F.analyze(kr).best;
  assert.equal(row.kind, 'trials');
  assert.deepEqual(row.quantities.map((q) => `${q.name}|${q.unit}|${q.values.join(',')}`), ['아세트산 농도|M|0.0821,0.0835,0.0829', '적정 부피|mL|16.42,16.7,16.58']);
  // 연속 자료: 늘어나는 부피를 가로축으로
  const x = await readFx('titration.xlsx');
  const a = F.analyze(x);
  assert.equal(a.tables.length, 2);
  assert.equal(a.best.kind, 'series');
  assert.equal(a.best.name, '적정 곡선');
  assert.deepEqual(a.best.x, { name: 'NaOH 부피', unit: 'mL' });
  assert.equal(a.best.ys[0].name, 'pH');
  assert.equal(a.best.ys[0].points.length, 13);
  const steep = F.steepest(a.best.ys[0].points);
  assert.equal(steep.x, 25.25); // 25.0 → 25.5 mL 사이에서 pH가 가장 크게 뛴다
  // 숫자가 없는 표
  assert.equal(F.analyzeTable([['이름', '메모'], ['가', '나']]).kind, 'none');
});
