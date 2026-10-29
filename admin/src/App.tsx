import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { CasePreview } from './components/CasePreview';
import { TemplateEditor } from './components/TemplateEditor';
import { CameraDesigner } from './components/CameraDesigner';
import { hasSupabase, supabase } from './lib/supabase';
import { fallbackPreviewModelId, MODELS } from './lib/types';
import { useCustomModels } from './lib/customModels';
import type { AdminRow, BackgroundRow, DesignRow, FrontPage, OrderRow, TemplateRow } from './lib/types';
import { mockAdmins, mockBackgrounds, mockDesigns, mockFrontPage, mockOrders, mockTemplates } from './mock';

// 'editor' is intentionally not in the sidebar nav — it's only reached via
// the "+ Add Template" button on the Gallery page, and closes back to it.
type Page = 'overview' | 'front' | 'designs' | 'orders' | 'gallery' | 'backgrounds' | 'admins' | 'cameras' | 'editor';
type Role = 'admin' | 'staff';
const ORDER_STATUSES = ['pending', 'paid', 'printing', 'shipped', 'ready_pickup', 'completed', 'cancelled'];
const money = (c: number) => `$${(c / 100).toFixed(2)}`;

export default function App() {
  useCustomModels();
  const [session, setSession] = useState<boolean>(!hasSupabase); // demo mode = logged in
  const [isAdmin, setIsAdmin] = useState<boolean>(!hasSupabase);
  // 'admin' can delete things and manage other admins' roles; 'staff' can't.
  // Demo mode acts as the full 'admin' role.
  const [role, setRole] = useState<Role>('admin');
  const [ready, setReady] = useState<boolean>(!hasSupabase);
  const [page, setPage] = useState<Page>('overview');
  const [email, setEmail] = useState<string>('demo mode');
  const [myUserId, setMyUserId] = useState<string>('demo-admin');
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null);

  useEffect(() => {
    if (!supabase) return;
    // A valid login is not enough — the dashboard is for rows in `admins` only.
    const apply = async (s: Session | null) => {
      setSession(!!s);
      setEmail(s?.user.email ?? '');
      setMyUserId(s?.user.id ?? '');
      if (s) {
        const { data } = await supabase!.rpc('am_i_admin');
        setIsAdmin(data === true);
        if (data === true) {
          const { data: row } = await supabase!.from('admins').select('role').eq('user_id', s.user.id).single();
          setRole((row?.role as Role) ?? 'staff');
        }
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
        <a className="brand" href="https://caseycase.design" title="Back to the storefront"><img className="logo" src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Casey" /><span className="word">casey</span></a>
        <NavItem icon="📊" label="Overview" active={page === 'overview'} onClick={() => setPage('overview')} />
        <NavItem icon="🏠" label="Front Page" active={page === 'front'} onClick={() => setPage('front')} />
        <NavItem icon="🎨" label="Designs" active={page === 'designs'} onClick={() => setPage('designs')} />
        <NavItem icon="✨" label="Gallery" active={page === 'gallery'} onClick={() => setPage('gallery')} />
        <NavItem icon="🌈" label="Colors" active={page === 'backgrounds'} onClick={() => setPage('backgrounds')} />
        <NavItem icon="📦" label="Orders" active={page === 'orders'} onClick={() => setPage('orders')} />
        <NavItem icon="📷" label="Cameras" active={page === 'cameras'} onClick={() => setPage('cameras')} />
        {role === 'admin' && <NavItem icon="🔑" label="Admins" active={page === 'admins'} onClick={() => setPage('admins')} />}
        <div className="nav-spacer" />
        <div className="nav-user">{email}</div>
        {supabase && <button className="nav-item" onClick={() => supabase!.auth.signOut()}>↩︎ Sign out</button>}
      </aside>
      <main className="main">
        {!hasSupabase && <div className="notice">🔌 Demo mode — showing sample data. Add <code>VITE_SUPABASE_URL</code> &amp; <code>VITE_SUPABASE_ANON_KEY</code> in <code>admin/.env</code> to connect the live backend.</div>}
        {page === 'overview' && <Overview />}
        {page === 'front' && <FrontPageEditor />}
        {page === 'designs' && <Designs />}
        {page === 'gallery' && (
          <Gallery
            role={role}
            onNew={() => { setEditingTemplate(null); setPage('editor'); }}
            onEdit={(t) => { setEditingTemplate(t); setPage('editor'); }}
          />
        )}
        {page === 'backgrounds' && <Backgrounds role={role} />}
        {page === 'orders' && <Orders role={role} />}
        {page === 'admins' && role === 'admin' && <Admins myUserId={myUserId} />}
        {page === 'cameras' && <CameraDesigner role={role} myUserId={myUserId} />}
        {page === 'editor' && <TemplateEditor initial={editingTemplate} onClose={() => setPage('gallery')} />}
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
  const [designs, setDesigns] = useState<DesignRow[]>(hasSupabase ? [] : mockDesigns);
  const [orders, setOrders] = useState<OrderRow[]>(hasSupabase ? [] : mockOrders);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('designs').select('*').neq('status', 'draft').then(({ data }) => data && setDesigns(data as DesignRow[]));
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
  const [templates, setTemplates] = useState<TemplateRow[]>(hasSupabase ? [] : mockTemplates);

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
  const [designs, setDesigns] = useState<DesignRow[]>(hasSupabase ? [] : mockDesigns);
  useEffect(() => {
    if (!supabase) return;
    supabase.from('designs').select('*').neq('status', 'draft').order('created_at', { ascending: false }).then(({ data }) => data && setDesigns(data as DesignRow[]));
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

  const inbox = designs.filter((d) => d.contact_phone);

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
                  {d.contact_phone}{d.contact_email ? ` · ${d.contact_email}` : ''}<br />
                  {d.contact_address && (
                    <>
                      📍 {d.contact_lat != null && d.contact_lng != null ? (
                        <a href={`https://maps.google.com/?q=${d.contact_lat},${d.contact_lng}`} target="_blank" rel="noreferrer">{d.contact_address}</a>
                      ) : d.contact_address}
                      <br />
                    </>
                  )}
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
  window.alert(error ? `Failed: ${error.message}` : `"${name.trim()}" added to Already Made Template ✨`);
}

/* ───────────────────────── Gallery ───────────────────────── */
function Gallery({ role, onNew, onEdit }: { role: Role; onNew: () => void; onEdit: (t: TemplateRow) => void }) {
  const [templates, setTemplates] = useState<TemplateRow[]>(hasSupabase ? [] : mockTemplates);
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
      <div className="gallery-header">
        <div>
          <h1 className="page-title">Already Made Template</h1>
          <p className="page-sub">
            Styles customers browse on the home screen — promoted from a customer design in the Designs tab, or built from scratch. {templates.length} total.
          </p>
        </div>
        <button className="btn cool" onClick={onNew}>+ Add Template</button>
      </div>
      {sorted.length === 0 ? (
        <div className="empty">No gallery styles yet 🐰 — promote one from the Designs tab.</div>
      ) : (
        <div className="tpl-grid">
          {sorted.map((t) => (
            <div className="card tpl-card" key={t.id}>
              <CasePreview modelId={t.preview_model_id ?? fallbackPreviewModelId(t.id)} background={t.background} layers={t.layers} width={140} />
              <select
                className="tpl-model-select"
                value={t.preview_model_id ?? ''}
                onChange={(e) => patch(t.id, { preview_model_id: e.target.value || null })}
                title="Preview device (cosmetic only — doesn't change which phones this style is offered for)"
              >
                <option value="">Default (random)</option>
                {Object.values(MODELS).map((m) => (
                  <option key={m.id} value={m.id}>{m.brand} {m.name}</option>
                ))}
              </select>
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
                  <button className="tpl-edit" onClick={() => onEdit(t)} title="Edit this template">✏️ Edit</button>
                  {role === 'admin' && <button className="tpl-delete" onClick={() => remove(t.id)} title="Remove from gallery">🗑️</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ───────────────────────── Backgrounds ───────────────────────── */
function Backgrounds({ role }: { role: Role }) {
  const [rows, setRows] = useState<BackgroundRow[]>(hasSupabase ? [] : mockBackgrounds);
  const [name, setName] = useState('');
  const [color1, setColor1] = useState('#FF7EC0');
  const [color2, setColor2] = useState('#FF3E9A');
  const [gingham, setGingham] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('backgrounds').select('*').order('sort', { ascending: true }).then(({ data }) => data && setRows(data as BackgroundRow[]));
  }, []);

  const add = async () => {
    if (!name.trim()) return;
    const id = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Math.random().toString(36).slice(2, 6)}`;
    const row: BackgroundRow = { id, name: name.trim(), colors: [color1, color2], pattern: gingham ? 'gingham' : null, active: true, sort: rows.length };
    setSaving(true);
    if (supabase) {
      const { error } = await supabase.from('backgrounds').insert(row);
      setSaving(false);
      if (error) {
        window.alert(`Couldn't add: ${error.message}`);
        return;
      }
    } else {
      setSaving(false);
    }
    setRows((rs) => [...rs, row]);
    setName('');
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this color? Customers will no longer be able to pick it.')) return;
    const prev = rows;
    setRows((rs) => rs.filter((r) => r.id !== id));
    if (supabase) {
      const { error } = await supabase.from('backgrounds').delete().eq('id', id);
      if (error) {
        setRows(prev);
        window.alert(`Couldn't delete: ${error.message}`);
      }
    }
  };

  const sorted = [...rows].sort((a, b) => a.sort - b.sort);

  return (
    <>
      <h1 className="page-title">Base Colors</h1>
      <p className="page-sub">The color options customers can pick when designing a blank case. {rows.length} total.</p>

      <div className="card" style={{ maxWidth: 480, marginBottom: 24 }}>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label>Name</label>
            <input className="bg-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Berry Fizz" />
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div>
              <label>Color 1</label><br />
              <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} />
            </div>
            <div>
              <label>Color 2</label><br />
              <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 18 }}>
              <input type="checkbox" checked={gingham} onChange={(e) => setGingham(e.target.checked)} /> Gingham
            </label>
          </div>
          <div className="bg-swatch-lg" style={{ background: `linear-gradient(135deg, ${color1}, ${color2})` }} />
          <button className="btn cool" style={{ width: 160, opacity: name.trim() ? 1 : 0.5 }} disabled={!name.trim() || saving} onClick={add}>
            {saving ? 'Adding…' : '+ Add color'}
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty">No colors yet 🐰</div>
      ) : (
        <div className="tpl-grid">
          {sorted.map((b) => (
            <div className="card tpl-card" key={b.id}>
              <div className="bg-swatch-lg" style={{ background: `linear-gradient(135deg, ${b.colors[0]}, ${b.colors[b.colors.length - 1]})` }} />
              <div className="tpl-info"><strong>{b.name}</strong></div>
              {role === 'admin' && <button className="tpl-delete" onClick={() => remove(b.id)} title="Delete color">🗑️</button>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ───────────────────────── Orders ───────────────────────── */
function Orders({ role }: { role: Role }) {
  const [orders, setOrders] = useState<OrderRow[]>(hasSupabase ? [] : mockOrders);
  useEffect(() => {
    if (!supabase) return;
    supabase.from('orders').select('*, order_items(id, model_id, quantity, price_cents, preview_url, print_url)').order('created_at', { ascending: false }).then(({ data }) => data && setOrders(data as OrderRow[]));
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

  const remove = async (id: string) => {
    if (!window.confirm("Delete this order permanently? This can't be undone.")) return;
    const prev = orders;
    setOrders((os) => os.filter((o) => o.id !== id));
    if (supabase) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) {
        setOrders(prev);
        window.alert(`Couldn't delete the order: ${error.message}`);
      }
    }
  };

  const total = useMemo(() => orders.reduce((a, o) => a + o.total_cents, 0), [orders]);

  // preview_url is a public Supabase Storage URL on a different origin, so a
  // plain <a download> gets ignored by the browser (it just navigates). Fetch
  // it ourselves and save the blob instead so "download" actually downloads.
  const downloadPreview = async (url: string, filename: string) => {
    try {
      const blob = await (await fetch(url)).blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <h1 className="page-title">Orders</h1>
      <p className="page-sub">{orders.length} orders · {money(total)} lifetime</p>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr><th>Design</th><th>Order</th><th>Customer</th><th>Fulfillment</th><th>Total</th><th>Date</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const item = o.order_items?.[0];
              return (
                <tr key={o.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {item?.preview_url ? (
                        <a href={item.preview_url} target="_blank" rel="noopener noreferrer" title="View full size">
                          <img src={item.preview_url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                        </a>
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--surface-2, #f2f2f5)' }} />
                      )}
                      {(item?.print_url ?? item?.preview_url) && (
                        <button
                          className="tpl-delete"
                          title="Download print-ready design (camera cutout left continuous, no overlay)"
                          onClick={() => downloadPreview(item!.print_url ?? item!.preview_url!, `${o.order_no}-${item!.model_id ?? 'design'}.png`)}
                        >
                          ⬇️
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
                      {MODELS[item?.model_id ?? '']?.name ?? item?.model_id ?? '—'}
                    </div>
                  </td>
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
                  <td>{role === 'admin' && <button className="tpl-delete" onClick={() => remove(o.id)} title="Delete order">🗑️</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ───────────────────────── Admins ───────────────────────── */
// Only reachable by the 'admin' role (App.tsx gates the nav item + route) —
// 'staff' can't see or change who has dashboard access. "+ Add admin" calls
// the admin-create-user edge function (needs the service-role key to create
// an auth user, so it can't be done with the browser's anon key) — you set
// the password yourself here and send it to the person directly.
const genPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

function Admins({ myUserId }: { myUserId: string }) {
  const [rows, setRows] = useState<AdminRow[]>(hasSupabase ? [] : mockAdmins);
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState(genPassword());
  const [newRole, setNewRole] = useState<AdminRow['role']>('staff');
  const [creating, setCreating] = useState(false);
  const [justAdded, setJustAdded] = useState<{ email: string; password: string } | null>(null);

  const refresh = () => {
    if (!supabase) return;
    supabase.from('admins').select('*').order('created_at', { ascending: true }).then(({ data }) => data && setRows(data as AdminRow[]));
  };
  useEffect(refresh, []);

  const setRole = async (userId: string, role: AdminRow['role']) => {
    if (userId === myUserId && role !== 'admin' && !window.confirm("Remove your own admin access? You'll lose the Admins tab and delete permissions.")) return;
    const prev = rows;
    setRows((rs) => rs.map((r) => (r.user_id === userId ? { ...r, role } : r)));
    if (supabase) {
      const { error } = await supabase.from('admins').update({ role }).eq('user_id', userId);
      if (error) {
        setRows(prev);
        window.alert(`Couldn't update role: ${error.message}`);
      }
    }
  };

  const addAdmin = async () => {
    if (!newEmail.trim() || newPassword.length < 8) {
      window.alert('Enter an email and a password of at least 8 characters.');
      return;
    }
    if (!supabase) {
      window.alert('Connect Supabase to add admins — this is demo mode only.');
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { email: newEmail.trim(), password: newPassword, role: newRole },
    });
    setCreating(false);
    if (error || !data?.ok) {
      window.alert(`Couldn't add admin: ${data?.error ?? error?.message ?? 'unknown error'}`);
      return;
    }
    setJustAdded({ email: newEmail.trim(), password: newPassword });
    setShowAdd(false);
    setNewEmail('');
    setNewPassword(genPassword());
    setNewRole('staff');
    refresh();
  };

  return (
    <>
      <div className="gallery-header">
        <div>
          <h1 className="page-title">Admins</h1>
          <p className="page-sub">Who has dashboard access, and what they can do. {rows.length} total.</p>
        </div>
        <button className="btn cool" onClick={() => { setShowAdd((v) => !v); setJustAdded(null); }}>+ Add admin</button>
      </div>

      {justAdded && (
        <div className="card" style={{ maxWidth: 480, marginBottom: 24, border: '2px solid var(--success)' }}>
          <h3 style={{ marginTop: 0 }}>Account created ✓</h3>
          <p className="page-sub">Send these to {justAdded.email} so they can sign in — this password won't be shown again.</p>
          <p style={{ fontFamily: 'monospace' }}>Email: {justAdded.email}<br />Password: {justAdded.password}</p>
        </div>
      )}

      {showAdd && (
        <div className="card" style={{ maxWidth: 480, marginBottom: 24 }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label>Email</label>
              <input className="bg-field" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="teammate@example.com" />
            </div>
            <div>
              <label>Password</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="bg-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <button className="btn soft" type="button" onClick={() => setNewPassword(genPassword())}>Generate</button>
              </div>
            </div>
            <div>
              <label>Role</label>
              <select className="status" value={newRole} onChange={(e) => setNewRole(e.target.value as AdminRow['role'])}>
                <option value="staff">Staff — can't delete or manage admins</option>
                <option value="admin">Admin — full access</option>
              </select>
            </div>
            <button className="btn cool" style={{ width: 160 }} disabled={creating} onClick={addAdmin}>
              {creating ? 'Adding…' : 'Create account'}
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr><th>Email</th><th>Role</th><th>Added</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id}>
                <td>{r.email ?? r.user_id}{r.user_id === myUserId && <span className="page-sub" style={{ margin: '0 0 0 6px' }}>(you)</span>}</td>
                <td>
                  <select className="status" value={r.role} onChange={(e) => setRole(r.user_id, e.target.value as AdminRow['role'])}>
                    <option value="admin">Admin — full access</option>
                    <option value="staff">Staff — can't delete or manage admins</option>
                  </select>
                </td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
