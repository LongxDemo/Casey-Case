import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { CasePreview } from './components/CasePreview';
import { hasSupabase, supabase } from './lib/supabase';
import { MODELS } from './lib/types';
import type { DesignRow, FrontPage, OrderRow, TemplateRow } from './lib/types';
import { mockDesigns, mockFrontPage, mockOrders, mockTemplates } from './mock';

type Page = 'overview' | 'front' | 'designs' | 'orders' | 'gallery';
const ORDER_STATUSES = ['pending', 'paid', 'printing', 'shipped', 'ready_pickup', 'completed', 'cancelled'];
const money = (c: number) => `$${(c / 100).toFixed(2)}`;

export default function App() {
  const [session, setSession] = useState<boolean>(!hasSupabase); // demo mode = logged in
  const [isAdmin, setIsAdmin] = useState<boolean>(!hasSupabase);
  const [ready, setReady] = useState<boolean>(!hasSupabase);
  const [page, setPage] = useState<Page>('overview');
  const [email, setEmail] = useState<string>('demo mode');

  useEffect(() => {
    if (!supabase) return;
    // A valid login is not enough — the dashboard is for rows in `admins` only.
    const apply = async (s: Session | null) => {
      setSession(!!s);
      setEmail(s?.user.email ?? '');
      if (s) {
        const { data } = await supabase!.rpc('am_i_admin');
        setIsAdmin(data === true);
      } else {
        setIsAdmin(false);
      }
      setReady(true);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => void apply(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="login-wrap"><div className="login-card"><h1>casey</h1><p>Loading…</p></div></div>;
  if (!session) return <Login />;
  if (!isAdmin) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <h1>casey</h1>
          <p>{email} is signed in but is not an admin of this dashboard.</p>
          {supabase && <button className="btn" onClick={() => supabase!.auth.signOut()}>↩︎ Sign out</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><span className="logo">🐰</span><span className="word">casey</span></div>
        <NavItem icon="📊" label="Overview" active={page === 'overview'} onClick={() => setPage('overview')} />
        <NavItem icon="🏠" label="Front Page" active={page === 'front'} onClick={() => setPage('front')} />
        <NavItem icon="🎨" label="Designs" active={page === 'designs'} onClick={() => setPage('designs')} />
        <NavItem icon="✨" label="Gallery" active={page === 'gallery'} onClick={() => setPage('gallery')} />
        <NavItem icon="📦" label="Orders" active={page === 'orders'} onClick={() => setPage('orders')} />
        <div className="nav-spacer" />
        <div className="nav-user">{email}</div>
        {supabase && <button className="nav-item" onClick={() => supabase!.auth.signOut()}>↩︎ Sign out</button>}
      </aside>
      <main className="main">
        {!hasSupabase && <div className="notice">🔌 Demo mode — showing sample data. Add <code>VITE_SUPABASE_URL</code> &amp; <code>VITE_SUPABASE_ANON_KEY</code> in <code>admin/.env</code> to connect the live backend.</div>}
        {page === 'overview' && <Overview />}
        {page === 'front' && <FrontPageEditor />}
        {page === 'designs' && <Designs />}
        {page === 'gallery' && <Gallery />}
        {page === 'orders' && <Orders />}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><span>{icon}</span>{label}</button>;
}

/* ───────────────────────── Login ───────────────────────── */
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErr(error.message);
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>casey</h1>
        <p>Admin dashboard — sign in to continue 💗</p>
        <input className="f" type="email" autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="f" type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p style={{ color: '#ff5470' }}>{err}</p>}
        <button className="btn" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

/* ───────────────────────── Overview ───────────────────────── */
function Overview() {
  const [designs, setDesigns] = useState<DesignRow[]>(mockDesigns);
  const [orders, setOrders] = useState<OrderRow[]>(mockOrders);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('designs').select('*').then(({ data }) => data && setDesigns(data as DesignRow[]));
    supabase.from('orders').select('*').then(({ data }) => data && setOrders(data as OrderRow[]));
  }, []);

  const revenue = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'pending').reduce((a, o) => a + o.total_cents, 0);
  const pending = orders.filter((o) => ['paid', 'printing'].includes(o.status)).length;

  return (
    <>
      <h1 className="page-title">Overview</h1>
      <p className="page-sub">Your Casey store at a glance ✨</p>
      <div className="stat-row">
        <Stat n={String(designs.length)} l="Designs collected" />
        <Stat n={String(orders.length)} l="Total orders" />
        <Stat n={money(revenue)} l="Revenue" />
        <Stat n={String(pending)} l="To fulfill" />
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Latest designs</h3>
        <div className="design-grid">
          {designs.slice(0, 6).map((d) => (
            <div className="design-cell" key={d.id}>
              <CasePreview modelId={d.model_id} background={d.background} layers={d.layers} width={130} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return <div className="stat"><div className="n">{n}</div><div className="l">{l}</div></div>;
}

/* ───────────────────────── Front Page editor ───────────────────────── */
function FrontPageEditor() {
  const [fp, setFp] = useState<FrontPage>(mockFrontPage);
  const [saved, setSaved] = useState(false);
  const [templates, setTemplates] = useState<TemplateRow[]>(mockTemplates);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('front_page').select('*').eq('id', 1).single().then(({ data }) => data && setFp(data as FrontPage));
    supabase.from('templates').select('*').eq('active', true).order('sort', { ascending: true }).then(({ data }) => data && setTemplates(data as TemplateRow[]));
  }, []);

  const save = async () => {
    if (supabase) {
      const { error } = await supabase.from('front_page').update({ ...fp, updated_at: new Date().toISOString() }).eq('id', 1);
      if (error) {
        window.alert(`Save failed: ${error.message}`);
        return;
      }
    }
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  };

  const set = (patch: Partial<FrontPage>) => setFp((f) => ({ ...f, ...patch }));

  return (
    <>
      <h1 className="page-title">Front Page</h1>
      <p className="page-sub">Control what customers see when they open the app.</p>
      <div className="card" style={{ maxWidth: 620 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div><label>Hero title</label><textarea className="f" rows={2} value={fp.hero_title} onChange={(e) => set({ hero_title: e.target.value })} /></div>
          <div><label>Hero subtitle</label><input className="f" value={fp.hero_subtitle} onChange={(e) => set({ hero_subtitle: e.target.value })} /></div>
          <div><label>CTA button text</label><input className="f" value={fp.hero_cta} onChange={(e) => set({ hero_cta: e.target.value })} /></div>
          <div>
            <label>Featured templates</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {templates.length === 0 && <span className="page-sub" style={{ margin: 0 }}>No gallery styles yet — add some in the Gallery tab.</span>}
              {templates.map((t) => {
                const on = fp.featured_template_ids.includes(t.id);
                return (
                  <button key={t.id} className={`chip-pick ${on ? 'on' : ''}`} onClick={() => set({ featured_template_ids: on ? fp.featured_template_ids.filter((x) => x !== t.id) : [...fp.featured_template_ids, t.id] })}>
                    {on ? '✓ ' : ''}{t.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn cool" onClick={save}>Save changes</button>
            {saved && <span style={{ color: 'var(--success)', fontWeight: 700 }}>Saved ✓</span>}
          </div>
        </div>
      </div>
    </>
  );
}

/* ───────────────────────── Designs ───────────────────────── */
const DESIGN_STATUSES = ['new', 'contacted', 'done'];

function Designs() {
  const [designs, setDesigns] = useState<DesignRow[]>(mockDesigns);
  useEffect(() => {
    if (!supabase) return;
    supabase.from('designs').select('*').order('created_at', { ascending: false }).then(({ data }) => data && setDesigns(data as DesignRow[]));
  }, []);

  const setStatus = async (id: string, status: string) => {
    const prev = designs;
    setDesigns((ds) => ds.map((d) => (d.id === id ? { ...d, status: status as DesignRow['status'] } : d)));
    if (supabase) {
      const { error } = await supabase.from('designs').update({ status }).eq('id', id);
      if (error) {
        setDesigns(prev);
        window.alert(`Couldn't update status: ${error.message}`);
      }
    }
  };

  const inbox = designs.filter((d) => d.contact_email);

  return (
    <>
      <h1 className="page-title">Customer Designs</h1>
      <p className="page-sub">Every case your customers have created — {designs.length} collected.</p>

      {inbox.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>📩 Sent from the storefront — needs follow-up</h3>
          <div className="design-grid">
            {inbox.map((d) => (
              <div className="design-cell" key={d.id}>
                <CasePreview modelId={d.model_id} background={d.background} layers={d.layers} width={150} />
                <div className="design-meta">
                  {MODELS[d.model_id ?? '']?.name ?? d.model_id}<br />
                  <strong>{d.contact_name}</strong><br />
                  {d.contact_email}{d.contact_phone ? ` · ${d.contact_phone}` : ''}<br />
                  {d.note && <em>"{d.note}"</em>}
                </div>
                <select className="status" value={d.status ?? 'new'} onChange={(e) => setStatus(d.id, e.target.value)}>
                  {DESIGN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {designs.length === 0 ? (
        <div className="empty">No designs yet 🐰</div>
      ) : (
        <div className="design-grid">
          {designs.map((d) => (
            <div className="design-cell" key={d.id}>
              <CasePreview modelId={d.model_id} background={d.background} layers={d.layers} width={150} />
              <div className="design-meta">
                {MODELS[d.model_id ?? '']?.name ?? d.model_id}<br />
                {d.user_id ? '👤 member' : '👻 guest'} · {new Date(d.created_at).toLocaleDateString()}
              </div>
              <button className="btn soft tpl-promote" onClick={() => promoteDesign(d)}>⭐ Add to Gallery</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

async function promoteDesign(d: DesignRow) {
  if (!d.background) {
    window.alert("This design has no background set — can't promote it.");
    return;
  }
  const name = window.prompt('Gallery style name:', '');
  if (!name || !name.trim()) return;
  const tag = window.prompt('Tag (optional — e.g. Trending, New):', '') ?? undefined;
  if (!supabase) {
    window.alert('Connect Supabase to publish to the gallery — this is demo mode only.');
    return;
  }
  const id = `t-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40)}-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await supabase.from('templates').insert({
    id,
    name: name.trim(),
    tag: tag?.trim() || null,
    accent: '#FF3E9A',
    background: d.background,
    layers: d.layers,
    active: true,
  });
  window.alert(error ? `Failed: ${error.message}` : `"${name.trim()}" added to the Casey Case Gallery ✨`);
}

/* ───────────────────────── Gallery ───────────────────────── */
function Gallery() {
  const [templates, setTemplates] = useState<TemplateRow[]>(mockTemplates);
  useEffect(() => {
    if (!supabase) return;
    supabase.from('templates').select('*').order('sort', { ascending: true }).then(({ data }) => data && setTemplates(data as TemplateRow[]));
  }, []);

  const patch = async (id: string, changes: Partial<TemplateRow>) => {
    const prev = templates;
    setTemplates((ts) => ts.map((t) => (t.id === id ? { ...t, ...changes } : t)));
    if (supabase) {
      const { error } = await supabase.from('templates').update(changes).eq('id', id);
      if (error) {
        setTemplates(prev);
        window.alert(`Couldn't update the style: ${error.message}`);
      }
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Remove this style from the gallery?')) return;
    const prev = templates;
    setTemplates((ts) => ts.filter((t) => t.id !== id));
    if (supabase) {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) {
        setTemplates(prev);
        window.alert(`Couldn't remove the style: ${error.message}`);
      }
    }
  };

  const sorted = [...templates].sort((a, b) => a.sort - b.sort);
  const mostTried = Math.max(1, ...templates.map((t) => t.uses_count));

  return (
    <>
      <h1 className="page-title">Casey Case Gallery</h1>
      <p className="page-sub">
        Styles customers browse on the home screen — promoted from a customer design in the Designs tab. {templates.length} total.
      </p>
      {sorted.length === 0 ? (
        <div className="empty">No gallery styles yet 🐰 — promote one from the Designs tab.</div>
      ) : (
        <div className="tpl-grid">
          {sorted.map((t) => (
            <div className="card tpl-card" key={t.id}>
              <CasePreview modelId={null} background={t.background} layers={t.layers} width={140} />
              <div className="tpl-info">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <strong>{t.name}</strong>
                  {t.tag && <span className="badge">{t.tag}</span>}
                </div>
                <div className="tpl-uses">
                  <div className="tpl-uses-bar"><div className="tpl-uses-fill" style={{ width: `${Math.round((t.uses_count / mostTried) * 100)}%` }} /></div>
                  <span>{t.uses_count.toLocaleString()} tried</span>
                </div>
              </div>
              <div className="tpl-controls">
                <div className="tpl-controls-row">
                  <button className={`chip-pick ${t.active ? 'on' : ''}`} onClick={() => patch(t.id, { active: !t.active })}>
                    {t.active ? '✓ Active' : 'Hidden'}
                  </button>
                  <button className={`chip-pick ${t.featured ? 'on' : ''}`} onClick={() => patch(t.id, { featured: !t.featured })}>
                    {t.featured ? '★ Featured' : 'Feature'}
                  </button>
                </div>
                <div className="tpl-controls-row">
                  <input
                    className="tpl-sort-input"
                    type="number"
                    value={t.sort}
                    onChange={(e) => patch(t.id, { sort: Number(e.target.value) || 0 })}
                    title="Sort order"
                  />
                  <button className="tpl-delete" onClick={() => remove(t.id)} title="Remove from gallery">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ───────────────────────── Orders ───────────────────────── */
function Orders() {
  const [orders, setOrders] = useState<OrderRow[]>(mockOrders);
  useEffect(() => {
    if (!supabase) return;
    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data }) => data && setOrders(data as OrderRow[]));
  }, []);

  const setStatus = async (id: string, status: string) => {
    const prev = orders;
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    if (supabase) {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) {
        setOrders(prev);
        window.alert(`Couldn't update the order: ${error.message}`);
      }
    }
  };

  const total = useMemo(() => orders.reduce((a, o) => a + o.total_cents, 0), [orders]);

  return (
    <>
      <h1 className="page-title">Orders</h1>
      <p className="page-sub">{orders.length} orders · {money(total)} lifetime</p>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Fulfillment</th><th>Total</th><th>Date</th><th>Status</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td style={{ fontWeight: 800 }}>{o.order_no}</td>
                <td>{o.full_name}<br /><span style={{ color: 'var(--ink-faint)', fontWeight: 500 }}>{o.email}</span></td>
                <td><span className="badge">{o.fulfillment === 'ship' ? '📦 Ship' : '🏬 Pickup'}</span></td>
                <td style={{ fontWeight: 800, color: 'var(--pink-dark)' }}>{money(o.total_cents)}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>
                  <select className="status" value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
