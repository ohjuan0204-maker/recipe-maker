/*
 * 용액 레시피 메이커 — 조제 목록을 글자로 싸고 푸는 일 (SPEC.md 22장)
 *
 * 조제 목록과 희석 계열에 넣은 값을 짧은 글자로 싸서 링크 뒤(#list=…)에 붙이거나 브라우저에 보관한다.
 * 계산한 결과는 싸지 않는다. 풀 때 넣은 값으로 다시 계산한다(app.js).
 * 링크는 누구나 고쳐 쓸 수 있는 글자이므로, 풀 때는 아는 항목만, 정해진 길이까지만 받는다.
 * 조제자 이름처럼 사람을 알아볼 수 있는 값은 싸지 않는다.
 */
(function (root) {
  'use strict';

  const VERSION = 1;
  const MAX_TEXT = 12000; // 싼 글자의 가장 긴 길이
  const LIMITS = { list: 12, rows: 8, name: 40, number: 16 };

  const text = (value, max) => String(value == null ? '' : value).slice(0, max);
  const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

  // 글자 ↔ 주소에 넣을 수 있는 base64 (한글도 그대로 간다)
  function toBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64(str) {
    const binary = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  // 조제 목록의 한 줄(계산된 item)에서 다시 계산할 때 쓸 값만 뽑는다.
  function packItem(item) {
    const input = (item && item.input) || {};
    if (item && item.kind === 'liquid') {
      return {
        k: 'l',
        n: text(input.name, LIMITS.name),
        b: text(input.label, LIMITS.name),
        f: text(input.formula, LIMITS.name),
        m: text(input.molarMass, LIMITS.number),
        pc: text(input.percent, LIMITS.number),
        d: text(input.density, LIMITS.number),
        u: text(input.unit, LIMITS.number),
        c: text(input.conc, LIMITS.number),
        v: text(input.volume, LIMITS.number),
        x: input.caution ? 1 : 0,
      };
    }
    const out = { k: 's', r: text(input.reagentId, LIMITS.name), u: text(input.unit, LIMITS.number), c: text(input.conc, LIMITS.number), v: text(input.volume, LIMITS.number), p: text(input.purity, LIMITS.number) };
    if (input.customName || input.customMolarMass) {
      out.n = text(input.customName, LIMITS.name);
      out.m = text(input.customMolarMass, LIMITS.number);
    }
    return out;
  }

  // 싼 한 줄을 계산에 넣을 값으로 되돌린다. 모르는 꼴이면 null.
  function unpackItem(raw) {
    if (!isObject(raw)) return null;
    if (raw.k === 'l') {
      return {
        kind: 'liquid',
        input: {
          name: text(raw.n, LIMITS.name),
          label: text(raw.b, LIMITS.name),
          formula: text(raw.f, LIMITS.name),
          molarMass: text(raw.m, LIMITS.number),
          percent: text(raw.pc, LIMITS.number),
          density: text(raw.d, LIMITS.number),
          unit: text(raw.u, LIMITS.number),
          conc: text(raw.c, LIMITS.number),
          volume: text(raw.v, LIMITS.number),
          caution: raw.x === 1,
        },
      };
    }
    if (raw.k === 's') {
      return {
        kind: 'solid',
        input: {
          reagentId: text(raw.r, LIMITS.name),
          customName: text(raw.n, LIMITS.name),
          customMolarMass: text(raw.m, LIMITS.number),
          unit: text(raw.u, LIMITS.number),
          conc: text(raw.c, LIMITS.number),
          volume: text(raw.v, LIMITS.number),
          purity: text(raw.p, LIMITS.number),
        },
      };
    }
    return null;
  }

  // items: 조제 목록(state.list), dilution: 희석 화면에 넣은 값 { name, stock, unit, rows: [{ conc, volume }] }
  function encode(items, dilution) {
    const data = { v: VERSION, list: (items || []).slice(0, LIMITS.list).map(packItem) };
    const rows = dilution && Array.isArray(dilution.rows) ? dilution.rows.filter((row) => String(row.conc || '').trim() || String(row.volume || '').trim()) : [];
    if (dilution && (String(dilution.stock || '').trim() || rows.length)) {
      data.dil = {
        n: text(dilution.name, LIMITS.name),
        s: text(dilution.stock, LIMITS.number),
        u: text(dilution.unit, LIMITS.number),
        rows: rows.slice(0, LIMITS.rows).map((row) => [text(row.conc, LIMITS.number), text(row.volume, LIMITS.number)]),
      };
    }
    return toBase64(JSON.stringify(data));
  }

  // 싼 글자를 푼다. { ok, items: [{ kind, input }], dilution, dropped } 또는 { ok: false, message }
  function decode(str) {
    const fail = (message) => ({ ok: false, message });
    if (typeof str !== 'string' || !str || str.length > MAX_TEXT || !/^[A-Za-z0-9_-]+$/.test(str)) return fail('링크의 글자를 읽을 수 없어요.');
    let data;
    try {
      data = JSON.parse(fromBase64(str));
    } catch (error) {
      return fail('링크의 글자를 읽을 수 없어요.');
    }
    if (!isObject(data) || data.v !== VERSION || !Array.isArray(data.list)) return fail('이 앱에서 만든 링크가 아니에요.');
    const items = [];
    let dropped = 0;
    for (const raw of data.list.slice(0, LIMITS.list)) {
      const item = unpackItem(raw);
      if (item) items.push(item);
      else dropped += 1;
    }
    dropped += Math.max(0, data.list.length - LIMITS.list);
    let dilution = null;
    if (isObject(data.dil) && Array.isArray(data.dil.rows)) {
      dilution = {
        name: text(data.dil.n, LIMITS.name),
        stock: text(data.dil.s, LIMITS.number),
        unit: text(data.dil.u, LIMITS.number),
        rows: data.dil.rows
          .filter((row) => Array.isArray(row))
          .slice(0, LIMITS.rows)
          .map((row) => ({ conc: text(row[0], LIMITS.number), volume: text(row[1], LIMITS.number) })),
      };
    }
    return { ok: true, items, dilution, dropped };
  }

  const api = { VERSION, LIMITS, MAX_TEXT, encode, decode, packItem, unpackItem, toBase64, fromBase64 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ListShare = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
