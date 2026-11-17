// 파일 읽기: CSV·TSV·TXT, 엑셀(.xlsx), 한글(.hwpx), 워드(.docx)를 브라우저 안에서 읽어 글과 표로 바꾼다 (SPEC 24장).
// 파일은 이 기기 밖으로 나가지 않는다. 외부 라이브러리 없이, 압축은 브라우저의 DecompressionStream('deflate-raw')으로 푼다.
// 읽은 결과: { ok, kind, name, blocks: [{ type: 'p', text } | { type: 'table', rows: [[글]] }], tables: [{ name, rows }], message }
// 결과 정리에 쓰는 분석(analyze)도 여기에 있다: 표에서 반복 측정값이나 연속 자료(x–y)를 찾는다.
(function () {
  'use strict';

  const MAX_BYTES = 8 * 1024 * 1024;
  const MAX_ROWS = 2000;

  /* ---------- 글자 풀기 ---------- */

  // UTF-8(BOM 포함)을 먼저 해 보고, 깨지면 EUC-KR(CP949, 한국어 엑셀의 CSV)로 읽는다.
  function decodeText(bytes) {
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder('utf-16le').decode(b.subarray(2));
    if (b[0] === 0xfe && b[1] === 0xff) return new TextDecoder('utf-16be').decode(b.subarray(2));
    const start = b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf ? 3 : 0;
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(b.subarray(start));
    } catch (error) {
      try {
        return new TextDecoder('euc-kr').decode(b);
      } catch (e) {
        return new TextDecoder('utf-8').decode(b.subarray(start));
      }
    }
  }

  /* ---------- CSV ---------- */

  function sniffDelimiter(text) {
    const sample = text.split(/\r?\n/).slice(0, 10).join('\n');
    const count = (ch) => {
      let n = 0;
      let quoted = false;
      for (const c of sample) {
        if (c === '"') quoted = !quoted;
        else if (c === ch && !quoted) n += 1;
      }
      return n;
    };
    const tabs = count('\t');
    const commas = count(',');
    const semis = count(';');
    if (tabs >= commas && tabs >= semis && tabs > 0) return '\t';
    if (semis > commas) return ';';
    return ',';
  }

  function parseCSV(text, delimiter) {
    const d = delimiter || sniffDelimiter(text);
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            cell += '"';
            i += 1;
          } else quoted = false;
        } else cell += c;
      } else if (c === '"' && cell === '') quoted = true;
      else if (c === d) {
        row.push(cell);
        cell = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i += 1;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
        if (rows.length >= MAX_ROWS) break;
      } else cell += c;
    }
    if (cell !== '' || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return trimRows(rows.map((r) => r.map((x) => x.trim())));
  }

  // 끝의 빈 줄과 빈 칸을 지운다
  function trimRows(rows) {
    const out = rows.map((r) => {
      const copy = r.slice();
      while (copy.length && String(copy[copy.length - 1]).trim() === '') copy.pop();
      return copy;
    });
    while (out.length && !out[out.length - 1].length) out.pop();
    while (out.length && !out[0].length) out.shift();
    return out;
  }

  /* ---------- 작은 XML 읽개 (엑셀·한글·워드의 속은 XML이다) ---------- */

  const ENT = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
  function unescapeXml(text) {
    return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-z]+);/g, (m, e) => {
      if (e[0] === '#') {
        const code = e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return ENT[e] != null ? ENT[e] : m;
    });
  }

  // { name, attrs, children: [node | 글] }. 이름은 접두어를 뺀 것(hp:t → t)을 local에 둔다.
  function parseXml(xml) {
    const root = { name: '#root', local: '#root', attrs: {}, children: [] };
    const stack = [root];
    const re = /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/([^\s>]+)\s*>|<([^\s/>]+)((?:\s+[^\s=]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
    let m;
    while ((m = re.exec(xml))) {
      const top = stack[stack.length - 1];
      if (m[1] != null) top.children.push(m[1]);
      else if (m[2]) {
        // 닫는 태그: 같은 이름이 나올 때까지 올라간다
        for (let i = stack.length - 1; i > 0; i -= 1) {
          if (stack[i].name === m[2]) {
            stack.length = i;
            break;
          }
        }
      } else if (m[3]) {
        const attrs = {};
        const attrRe = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
        let a;
        while ((a = attrRe.exec(m[4] || ''))) attrs[a[1]] = unescapeXml(a[3] != null ? a[3] : a[4]);
        const node = { name: m[3], local: m[3].replace(/^.*:/, ''), attrs, children: [] };
        top.children.push(node);
        if (!m[5]) stack.push(node);
      } else if (m[6] != null) {
        if (m[6].trim() || top.children.length) top.children.push(unescapeXml(m[6]));
      }
    }
    return root;
  }

  const kids = (node, local) => node.children.filter((c) => typeof c === 'object' && c.local === local);
  function find(node, local, out) {
    const list = out || [];
    for (const c of node.children) {
      if (typeof c !== 'object') continue;
      if (c.local === local) list.push(c);
      else find(c, local, list);
    }
    return list;
  }
  function textOf(node) {
    let out = '';
    for (const c of node.children) out += typeof c === 'string' ? c : textOf(c);
    return out;
  }

  /* ---------- ZIP (엑셀·한글·워드 파일은 ZIP으로 묶여 있다) ---------- */

  async function inflate(data) {
    if (typeof DecompressionStream === 'undefined') throw new Error('이 브라우저는 압축 파일을 풀 수 없어요. 최신 크롬·엣지·사파리에서 열어 주세요.');
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  // 이름 → () => Promise<Uint8Array>
  function unzip(bytes) {
    const b = bytes;
    const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
    let eocd = -1;
    for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i -= 1) {
      if (view.getUint32(i, true) === 0x06054b50) {
        eocd = i;
        break;
      }
    }
    if (eocd < 0) throw new Error('압축 파일의 목차를 찾지 못했어요.');
    const count = view.getUint16(eocd + 10, true);
    let p = view.getUint32(eocd + 16, true);
    const files = new Map();
    const utf8 = new TextDecoder('utf-8');
    for (let n = 0; n < count; n += 1) {
      if (view.getUint32(p, true) !== 0x02014b50) break;
      const method = view.getUint16(p + 10, true);
      const size = view.getUint32(p + 20, true);
      const nameLen = view.getUint16(p + 28, true);
      const extraLen = view.getUint16(p + 30, true);
      const commentLen = view.getUint16(p + 32, true);
      const local = view.getUint32(p + 42, true);
      const name = utf8.decode(b.subarray(p + 46, p + 46 + nameLen));
      p += 46 + nameLen + extraLen + commentLen;
      files.set(name, async () => {
        const lnName = view.getUint16(local + 26, true);
        const lnExtra = view.getUint16(local + 28, true);
        const start = local + 30 + lnName + lnExtra;
        const data = b.subarray(start, start + size);
        if (method === 0) return data;
        if (method === 8) return inflate(data);
        throw new Error('이 압축 방식은 읽을 수 없어요.');
      });
    }
    return files;
  }

  async function zipText(files, name) {
    const get = files.get(name);
    if (!get) return null;
    return new TextDecoder('utf-8').decode(await get());
  }

  /* ---------- 엑셀 (.xlsx) ---------- */

  function colIndex(ref) {
    const letters = String(ref || '').replace(/[^A-Z]/g, '');
    let n = 0;
    for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
  }

  // 엑셀이 저장한 실수(19.850000000000001)를 사람이 적은 모양으로
  function tidyNumber(v) {
    const x = Number(v);
    if (!Number.isFinite(x)) return String(v);
    return String(parseFloat(x.toPrecision(12)));
  }

  async function readXlsx(files) {
    const shared = [];
    const ss = await zipText(files, 'xl/sharedStrings.xml');
    if (ss) for (const si of find(parseXml(ss), 'si')) shared.push(find(si, 't').map(textOf).join(''));
    const book = parseXml((await zipText(files, 'xl/workbook.xml')) || '');
    const rels = parseXml((await zipText(files, 'xl/_rels/workbook.xml.rels')) || '');
    const target = {};
    for (const r of find(rels, 'Relationship')) target[r.attrs.Id] = r.attrs.Target;
    const sheets = find(book, 'sheet').map((s) => {
      const t = target[s.attrs['r:id']] || '';
      const path = t.startsWith('/') ? t.slice(1) : `xl/${t.replace(/^\.\//, '')}`;
      return { name: s.attrs.name || '', path };
    });
    const tables = [];
    for (const sheet of sheets) {
      const xml = await zipText(files, sheet.path);
      if (!xml) continue;
      const rows = [];
      for (const row of find(parseXml(xml), 'row')) {
        const r = Number(row.attrs.r || rows.length + 1) - 1;
        if (r >= MAX_ROWS) break;
        const cells = [];
        for (const c of kids(row, 'c')) {
          const col = c.attrs.r ? colIndex(c.attrs.r) : cells.length;
          const v = kids(c, 'v')[0];
          let text = '';
          if (c.attrs.t === 's') text = shared[Number(v ? textOf(v) : -1)] || '';
          else if (c.attrs.t === 'inlineStr') text = find(c, 't').map(textOf).join('');
          else if (c.attrs.t === 'b') text = v && textOf(v) === '1' ? 'TRUE' : 'FALSE';
          else if (c.attrs.t === 'str' || c.attrs.t === 'e') text = v ? textOf(v) : '';
          else text = v && textOf(v).trim() !== '' ? tidyNumber(textOf(v)) : '';
          while (cells.length < col) cells.push('');
          cells[col] = text.trim();
        }
        while (rows.length < r) rows.push([]);
        rows[r] = cells;
      }
      const trimmed = trimRows(rows);
      if (trimmed.length) tables.push({ name: sheet.name, rows: trimmed });
    }
    return { blocks: tables.map((t) => ({ type: 'table', rows: t.rows, name: t.name })), tables };
  }

  /* ---------- 워드 (.docx) ---------- */

  function docxText(node) {
    let out = '';
    for (const c of node.children) {
      if (typeof c === 'string') continue;
      if (c.local === 't') out += textOf(c);
      else if (c.local === 'tab') out += '\t';
      else if (c.local === 'br' || c.local === 'cr') out += '\n';
      else if (c.local !== 'tbl' && c.local !== 'instrText' && c.local !== 'delText') out += docxText(c);
    }
    return out;
  }

  function docxTable(tbl) {
    return kids(tbl, 'tr').map((tr) => kids(tr, 'tc').map((tc) => find(tc, 'p').map(docxText).join('\n').trim()));
  }

  async function readDocx(files) {
    const xml = await zipText(files, 'word/document.xml');
    if (!xml) throw new Error('워드 문서의 본문을 찾지 못했어요.');
    const body = find(parseXml(xml), 'body')[0];
    const blocks = [];
    const walk = (node) => {
      for (const c of node.children) {
        if (typeof c !== 'object') continue;
        if (c.local === 'p') {
          const text = docxText(c).trim();
          if (text) blocks.push({ type: 'p', text });
        } else if (c.local === 'tbl') {
          blocks.push({ type: 'table', rows: docxTable(c) });
        } else if (c.local === 'sdt' || c.local === 'sdtContent' || c.local === 'customXml') walk(c);
      }
    };
    if (body) walk(body);
    return { blocks, tables: blocks.filter((x) => x.type === 'table').map((t, i) => ({ name: `표 ${i + 1}`, rows: t.rows })) };
  }

  /* ---------- 한글 (.hwpx) ---------- */

  // 문단(p) 안의 글. 표(tbl)는 따로 꺼낸다(문단 속에 들어 있다).
  function hwpParagraph(p, blocks) {
    let text = '';
    const visit = (node) => {
      for (const c of node.children) {
        if (typeof c === 'string') continue;
        if (c.local === 't') {
          for (const t of c.children) {
            if (typeof t === 'string') text += t;
            else if (t.local === 'tab') text += '\t';
            else if (t.local === 'lineBreak') text += '\n';
          }
        } else if (c.local === 'tbl') {
          if (text.trim()) blocks.push({ type: 'p', text: text.trim() });
          text = '';
          blocks.push({ type: 'table', rows: hwpTable(c) });
        } else if (c.local !== 'secPr' && c.local !== 'ctrl' && c.local !== 'linesegarray') visit(c);
      }
    };
    visit(p);
    if (text.trim()) blocks.push({ type: 'p', text: text.trim() });
  }

  function hwpTable(tbl) {
    const rows = [];
    for (const tr of kids(tbl, 'tr')) {
      const cells = [];
      for (const tc of kids(tr, 'tc')) {
        const inner = [];
        for (const p of find(tc, 'p')) hwpParagraph(p, inner);
        cells.push(inner.filter((x) => x.type === 'p').map((x) => x.text).join('\n').trim());
      }
      rows.push(cells);
    }
    return rows;
  }

  async function readHwpx(files) {
    const names = Array.from(files.keys())
      .filter((n) => /^Contents\/section\d+\.xml$/i.test(n))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    if (!names.length) throw new Error('한글 문서의 본문을 찾지 못했어요.');
    const blocks = [];
    for (const name of names) {
      const sec = parseXml((await zipText(files, name)) || '');
      const top = sec.children.find((c) => typeof c === 'object');
      if (!top) continue;
      for (const p of kids(top, 'p')) hwpParagraph(p, blocks);
    }
    return { blocks, tables: blocks.filter((x) => x.type === 'table').map((t, i) => ({ name: `표 ${i + 1}`, rows: t.rows })) };
  }

  /* ---------- 글 (.txt, .md) ---------- */

  function readPlain(text) {
    const blocks = [];
    let table = null;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.replace(/\s+$/, '');
      const md = /^\s*\|.*\|\s*$/.test(line);
      const tabbed = line.includes('\t');
      if (md || tabbed) {
        if (md && /^\s*\|[\s:|-]+\|\s*$/.test(line)) continue; // 마크다운 표의 구분선
        const cells = md ? line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()) : line.split('\t').map((c) => c.trim());
        if (!table) {
          table = { type: 'table', rows: [] };
          blocks.push(table);
        }
        table.rows.push(cells);
      } else {
        table = null;
        if (line.trim()) blocks.push({ type: 'p', text: line.trim() });
      }
    }
    return { blocks, tables: blocks.filter((x) => x.type === 'table').map((t, i) => ({ name: `표 ${i + 1}`, rows: t.rows })) };
  }

  /* ---------- 파일 하나 읽기 ---------- */

  const NOT_READ = {
    hwp: '한글 파일(.hwp)은 읽을 수 없어요. 한글에서 [다른 이름으로 저장하기] → 파일 형식 "HWPX 문서"로 저장해서 넣어 주세요.',
    xls: '엑셀 97-2003 파일(.xls)은 읽을 수 없어요. 엑셀에서 .xlsx나 CSV로 저장해서 넣어 주세요.',
    doc: '워드 97-2003 파일(.doc)은 읽을 수 없어요. 워드에서 .docx로 저장해서 넣어 주세요.',
    pdf: 'PDF는 읽을 수 없어요. 원래 파일(한글 .hwpx, 워드 .docx, 엑셀 .xlsx)이나 CSV를 넣어 주세요.',
    image: '사진 속 글자는 읽을 수 없어요. 표를 엑셀이나 CSV로 옮겨서 넣어 주세요.',
  };

  function kindOf(name) {
    const ext = String(name || '').toLowerCase().split('.').pop();
    if (['csv', 'tsv'].includes(ext)) return 'csv';
    if (['txt', 'md', 'text'].includes(ext)) return 'txt';
    if (ext === 'xlsx' || ext === 'xlsm') return 'xlsx';
    if (ext === 'docx') return 'docx';
    if (ext === 'hwpx') return 'hwpx';
    if (ext === 'hwp') return 'hwp';
    if (ext === 'xls') return 'xls';
    if (ext === 'doc') return 'doc';
    if (ext === 'pdf') return 'pdf';
    if (['png', 'jpg', 'jpeg', 'gif', 'heic', 'webp', 'bmp'].includes(ext)) return 'image';
    return '';
  }

  // bytes: Uint8Array. name: 파일 이름(확장자로 종류를 정한다)
  async function readBytes(name, bytes) {
    const kind = kindOf(name);
    const fail = (message) => ({ ok: false, kind, name, blocks: [], tables: [], message });
    if (NOT_READ[kind]) return fail(NOT_READ[kind]);
    if (!bytes || !bytes.length) return fail('빈 파일이에요.');
    if (bytes.length > MAX_BYTES) return fail('파일이 너무 커요(8 MB까지). 필요한 표만 남겨서 넣어 주세요.');
    try {
      let out;
      const zipped = bytes[0] === 0x50 && bytes[1] === 0x4b;
      if (kind === 'xlsx' || kind === 'docx' || kind === 'hwpx') {
        if (!zipped) return fail('파일이 깨졌거나 이름과 다른 종류예요.');
        const files = unzip(bytes);
        out = kind === 'xlsx' ? await readXlsx(files) : kind === 'docx' ? await readDocx(files) : await readHwpx(files);
      } else if (kind === 'csv') {
        const text = decodeText(bytes);
        const rows = parseCSV(text, name.toLowerCase().endsWith('.tsv') ? '\t' : '');
        out = { blocks: [{ type: 'table', rows }], tables: [{ name: '표 1', rows }] };
      } else if (kind === 'txt') {
        out = readPlain(decodeText(bytes));
      } else {
        return fail('읽을 수 있는 파일은 CSV·TXT, 엑셀(.xlsx), 한글(.hwpx), 워드(.docx)예요.');
      }
      out.tables = out.tables.filter((t) => t.rows.some((r) => r.some((c) => String(c).trim())));
      if (!out.blocks.length) return fail('파일 안에서 글이나 표를 찾지 못했어요.');
      return { ok: true, kind, name, blocks: out.blocks, tables: out.tables, message: '' };
    } catch (error) {
      return fail(`파일을 읽지 못했어요. ${error && error.message ? error.message : ''}`.trim());
    }
  }

  async function readFile(file) {
    if (!file) return { ok: false, kind: '', name: '', blocks: [], tables: [], message: '파일을 골라 주세요.' };
    if (file.size > MAX_BYTES) return { ok: false, kind: kindOf(file.name), name: file.name, blocks: [], tables: [], message: '파일이 너무 커요(8 MB까지). 필요한 표만 남겨서 넣어 주세요.' };
    const bytes = new Uint8Array(await file.arrayBuffer());
    return readBytes(file.name, bytes);
  }

  // 문서 전체를 글 한 덩어리로 (실험 짐작에 쓴다)
  const allText = (doc) => (doc.blocks || []).map((b) => (b.type === 'p' ? b.text : b.rows.map((r) => r.join(' ')).join('\n'))).join('\n');

  /* ---------- 결과 정리에 쓰는 분석 ---------- */

  // "19.85", "19.85 mL", "−0.5", "1.2e-3" → { value, unit }. 숫자가 아니면 null.
  function parseCell(text) {
    const t = String(text == null ? '' : text).trim().replace(/[−–]/g, '-').replace(/,(?=\d{3}(\D|$))/g, '');
    const m = t.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*([A-Za-zμµ°%Ω/·]+[A-Za-z0-9/·⁻¹²³]*)?$/);
    if (!m) return null;
    const value = Number(m[1]);
    return Number.isFinite(value) ? { value, unit: m[2] || '' } : null;
  }

  // "부피 (mL)", "부피[mL]", "Volume / mL" → { name: '부피', unit: 'mL' }
  function splitHead(text) {
    const t = String(text || '').trim();
    const m = t.match(/^(.*?)\s*[([［（]\s*([^)\]］）]{1,12})\s*[)\]］）]\s*$/) || t.match(/^(.*?)\s*\/\s*([A-Za-zμµ°%·/]{1,10})$/);
    if (m && m[1].trim()) return { name: m[1].trim(), unit: m[2].trim() };
    return { name: t, unit: '' };
  }

  // 한글 뒤에는 \b가 서지 않아 로마자가 이어지지 않는 것으로 끝을 본다
  const SUMMARY_WORD = /^(평균|합계|합|표준\s*편차|표준편차|편차|오차|오차율|상대\s*오차|최대|최소|mean|avg|average|sum|sd|stdev|std)(?![A-Za-z])/i;
  const TRIAL_HEAD = /^(\d+\s*(회|차|번)(째)?|(trial|run|측정)\s*\d+|\d+)$/i;

  // 표 하나를 읽어 { kind: 'trials' | 'series' | 'none', quantities, x, ys, rows, head, note }
  function analyzeTable(rows) {
    const R = rows.filter((r) => r.some((c) => String(c).trim()));
    if (!R.length) return { kind: 'none', quantities: [], note: '표가 비어 있어요.' };
    const width = Math.max(...R.map((r) => r.length));
    const numericRow = (r) => r.filter((c) => parseCell(c)).length;
    const textRow = (r) => r.filter((c) => String(c).trim() && !parseCell(c)).length;
    // 머리 줄: 숫자 줄 바로 위에 있는, 글이 숫자보다 많은 줄
    let head = -1;
    for (let i = 0; i < Math.min(R.length - 1, 10); i += 1) {
      if (textRow(R[i]) >= 1 && textRow(R[i]) >= numericRow(R[i]) && numericRow(R[i + 1]) >= 1) {
        head = i;
        break;
      }
    }
    const heads = head >= 0 ? R[head] : [];
    const body = R.slice(head + 1);

    // 가로로 놓인 반복 측정: 머리 줄이 1회·2회·3회…이고 맨 앞 칸이 잰 것의 이름
    const trialCols = heads.map((h, i) => (i > 0 && TRIAL_HEAD.test(String(h).trim()) ? i : -1)).filter((i) => i > 0);
    if (trialCols.length >= 2) {
      const quantities = [];
      for (const r of body) {
        const label = String(r[0] || '').trim();
        if (!label || SUMMARY_WORD.test(label)) continue;
        const cells = trialCols.map((i) => ({ text: String(r[i] || '').trim(), cell: parseCell(r[i]) })).filter((x) => x.cell);
        if (cells.length < 1) continue;
        const h = splitHead(label);
        quantities.push({ name: h.name, unit: h.unit || cells.find((x) => x.cell.unit)?.cell.unit || '', values: cells.map((x) => x.cell.value), texts: cells.map((x) => x.text.replace(/\s*[A-Za-zμµ°%].*$/, '')) });
      }
      if (quantities.length) return { kind: 'trials', orient: 'row', quantities, head: heads, rows: R, note: '' };
    }

    // 세로로 놓인 자료: 숫자가 대부분인 열을 찾는다
    const dataRows = body.filter((r) => !(String(r[0] || '').trim() && SUMMARY_WORD.test(String(r[0]).trim())) && !r.some((c) => SUMMARY_WORD.test(String(c).trim()) && !parseCell(c)));
    const cols = [];
    for (let i = 0; i < width; i += 1) {
      const cells = dataRows.map((r) => String(r[i] == null ? '' : r[i]).trim());
      const filled = cells.filter(Boolean);
      const nums = filled.map(parseCell).filter(Boolean);
      if (nums.length >= 2 && nums.length >= filled.length * 0.6) {
        const h = splitHead(heads[i] || '');
        const isIndex = /^(회차|회|차|번호|no\.?|#|순서|trial|run)$/i.test(h.name) || (nums.every((n, k) => n.value === k + 1) && !h.unit && nums.length <= 12 && /회|차|번|^$/.test(h.name));
        cols.push({ index: i, name: h.name || `값 ${cols.length + 1}`, unit: h.unit || (nums.find((n) => n.unit) || {}).unit || '', values: nums.map((n) => n.value), texts: cells.filter((c) => parseCell(c)).map((c) => c.replace(/\s*[A-Za-zμµ°%].*$/, '')), isIndex, rowsWith: cells.map((c) => Boolean(parseCell(c))) });
      }
    }
    const measured = cols.filter((c) => !c.isIndex);
    if (!measured.length) return { kind: 'none', quantities: [], head: heads, rows: R, note: '숫자로 된 열을 찾지 못했어요.' };
    const n = Math.max(...measured.map((c) => c.values.length));
    const increasing = (c) => c.values.every((v, k) => k === 0 || v >= c.values[k - 1]);
    if (measured.length >= 2 && n >= 9) {
      const xCol = measured.find((c) => /시간|time|부피|volume|mL|농도|온도|거리|초|분|s$/i.test(`${c.name} ${c.unit}`) && increasing(c)) || measured.find(increasing) || measured[0];
      const ys = measured.filter((c) => c !== xCol);
      // x와 y를 같은 줄끼리 짝짓는다
      const pairs = (y) =>
        dataRows
          .map((r) => [parseCell(r[xCol.index]), parseCell(r[y.index])])
          .filter(([a, b]) => a && b)
          .map(([a, b]) => [a.value, b.value]);
      return {
        kind: 'series',
        x: { name: xCol.name, unit: xCol.unit },
        ys: ys.map((y) => ({ name: y.name, unit: y.unit, points: pairs(y) })),
        quantities: measured.map((c) => ({ name: c.name, unit: c.unit, values: c.values, texts: c.texts })),
        head: heads,
        rows: R,
        note: '',
      };
    }
    return { kind: 'trials', orient: 'col', quantities: measured.map((c) => ({ name: c.name, unit: c.unit, values: c.values, texts: c.texts })), head: heads, rows: R, note: '' };
  }

  // 표가 여럿이면 숫자가 가장 많은 표를 먼저
  function analyze(doc) {
    const list = (doc.tables || []).map((t, i) => Object.assign({ table: i, name: t.name }, analyzeTable(t.rows)));
    const score = (a) => (a.kind === 'none' ? 0 : a.quantities.reduce((s, q) => s + q.values.length, 0) + (a.kind === 'series' ? 1000 : 0));
    const order = list.slice().sort((a, b) => score(b) - score(a));
    return { tables: list, best: order[0] && order[0].kind !== 'none' ? order[0] : null };
  }

  // 연속 자료에서 가장 가파르게 변한 곳 (적정 곡선이면 당량점 근처)
  function steepest(points) {
    let best = null;
    for (let i = 1; i < points.length; i += 1) {
      const dx = points[i][0] - points[i - 1][0];
      if (dx <= 0) continue;
      const slope = (points[i][1] - points[i - 1][1]) / dx;
      if (!best || Math.abs(slope) > Math.abs(best.slope)) best = { x: (points[i][0] + points[i - 1][0]) / 2, y: (points[i][1] + points[i - 1][1]) / 2, slope };
    }
    return best;
  }

  const api = { MAX_BYTES, decodeText, parseCSV, sniffDelimiter, parseXml, textOf, unzip, readBytes, readFile, kindOf, allText, parseCell, splitHead, analyzeTable, analyze, steepest, NOT_READ };
  if (typeof window !== 'undefined') window.FileIn = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
