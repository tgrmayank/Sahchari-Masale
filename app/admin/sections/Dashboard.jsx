'use client';
import { supabase } from '@/lib/supabase';
import { useRows, money, dt, STATUS, STATUS_CLS } from '@/lib/admin';
import { Loading, Err } from '../ui';

export default function Dashboard({ go }) {
  const o = useRows(() => supabase.from('orders').select('id,total,status,created_at,customer_name,items').order('created_at', { ascending: false }).limit(1000));
  const p = useRows(() => supabase.from('products').select('id,name,images,packs,is_active,in_stock'));
  const c = useRows(() => supabase.from('categories').select('id'));
  if (!o.rows || !p.rows || !c.rows) return <Loading />;

  const orders = o.rows;
  const key = (d) => new Date(d).toDateString();
  const today = key(new Date());
  const live = orders.filter((x) => x.status !== 5);
  const sum = (a) => a.reduce((s, x) => s + Number(x.total), 0);
  const tdy = live.filter((x) => key(x.created_at) === today);
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const l = live.filter((x) => key(x.created_at) === d.toDateString());
    return { label: d.toLocaleDateString('en-IN', { weekday: 'short' }), n: l.length, v: sum(l) };
  });
  const max = Math.max(1, ...days.map((d) => d.v));
  const noImg = p.rows.filter((x) => !(x.images || []).length).length;
  const noPack = p.rows.filter((x) => !(x.packs || []).length).length;
  const oos = p.rows.filter((x) => !x.in_stock).length;
  const sold = {};
  live.forEach((x) => (x.items || []).forEach((i) => { sold[i.n] = (sold[i.n] || 0) + Number(i.q || 0); }));
  const top = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <Err msg={o.err || p.err || c.err} />
      <div className="a-stats">
        <div className="a-stat"><small>Today's orders</small><b>{tdy.length}</b></div>
        <div className="a-stat"><small>Today's sales</small><b>{money(sum(tdy))}</b></div>
        <div className="a-stat"><small>New (not packed)</small><b>{orders.filter((x) => x.status === 0).length}</b></div>
        <div className="a-stat"><small>Total sales</small><b>{money(sum(live))}</b></div>
        <div className="a-stat"><small>Average order</small><b>{money(live.length ? Math.round(sum(live) / live.length) : 0)}</b></div>
        <div className="a-stat"><small>On the way</small><b>{orders.filter((x) => x.status === 1 || x.status === 2 || x.status === 3).length}</b></div>
        <div className="a-stat"><small>Products</small><b>{p.rows.length}</b></div>
        <div className="a-stat"><small>Categories</small><b>{c.rows.length}</b></div>
      </div>

      {noPack || noImg || oos || !c.rows.length || !p.rows.length ? (
        <div className="a-card">
          <h3>To do</h3>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {!c.rows.length ? <div className="a-warn">No category yet. <a href="#categories" onClick={() => go('categories')}>Add your first category</a></div> : null}
            {c.rows.length && !p.rows.length ? <div className="a-warn">No product yet. <a href="#products" onClick={() => go('products')}>Add your first product</a></div> : null}
            {noPack ? <div className="a-warn">{noPack} product(s) have no pack/price, so they are hidden on the website.</div> : null}
            {noImg ? <div className="a-warn">{noImg} product(s) have no photo.</div> : null}
            {oos ? <div className="a-warn">{oos} product(s) are marked out of stock.</div> : null}
          </div>
        </div>
      ) : null}

      <div className="a-card">
        <h3>Last 7 days sales</h3>
        <div className="a-chart">
          {days.map((d, i) => (
            <div key={i}><b>{d.v ? money(d.v) : ''}</b><i style={{ height: Math.max(3, (d.v / max) * 100) + '%' }} />{d.label}</div>
          ))}
        </div>
      </div>

      {top.length ? (
        <div className="a-card">
          <h3>Best sellers</h3>
          <p className="a-sub">By units sold in your latest orders (cancelled orders excluded).</p>
          {top.map(([name, n], i) => (
            <div className="a-bs" key={name}><span>{i + 1}</span><b className="a-grow">{name}</b><small>{n} sold</small></div>
          ))}
        </div>
      ) : null}

      <div className="a-card">
        <div className="a-row sb"><h3>Recent orders</h3><button className="a-btn sm ghost" onClick={() => go('orders')}>View all</button></div>
        {orders.slice(0, 6).map((x) => (
          <div className="a-item" key={x.id} style={{ marginTop: 10, cursor: 'pointer' }} onClick={() => go('orders')}>
            <div className="a-grow"><h4>{x.id}</h4><small>{x.customer_name} · {dt(x.created_at)}</small></div>
            <b>{money(x.total)}</b>
            <span className={'a-badge ' + STATUS_CLS[x.status]}>{STATUS[x.status]}</span>
          </div>
        ))}
        {!orders.length ? <p className="a-sub" style={{ marginTop: 8 }}>No orders yet.</p> : null}
      </div>
    </>
  );
}
