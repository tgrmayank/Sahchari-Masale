'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

/** Load rows. fn() must return a supabase query. */
export function useRows(fn, deps = []) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    const { data, error } = await fn();
    if (error) { setErr(error.message); setRows([]); }
    else { setErr(''); setRows(data || []); }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  return { rows, err, reload: load, setRows };
}

/** The single site_settings row. */
export function useSettings() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (error) setErr(error.message);
      setS(data || { id: 1 });
    });
  }, []);
  const save = async (patch) => {
    const { error } = await supabase.from('site_settings').upsert({ id: 1, ...patch, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    setS((x) => ({ ...x, ...patch }));
  };
  return { s, err, save };
}

/** Move row i up/down and renumber sort_order (10,20,30...). */
export async function reorder(table, rows, i, dir) {
  const j = i + dir;
  if (j < 0 || j >= rows.length) return null;
  const a = rows.slice();
  [a[i], a[j]] = [a[j], a[i]];
  const res = await Promise.all(a.map((r, n) => supabase.from(table).update({ sort_order: (n + 1) * 10 }).eq('id', r.id)));
  const bad = res.find((r) => r.error);
  return bad ? bad.error.message : null;
}

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const dt = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const STATUS = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
export const STATUS_CLS = ['o', 'b', 'p', 'b', 'g', 'r'];
