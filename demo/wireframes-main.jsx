// Main window layouts — 4 variations
// All use WindowChrome from shared

const MW_W = 1200;
const MW_H = 760;

// ============= V1: Classic IDE — left activity rail + connections + terminal + bottom command pills =============
function MainV1_ClassicIDE({ platform = 'mac' }) {
  const { ink, paper, pencil, faint, highlight, envProd, envStg, envDev } = WF;
  return (
    <WFWindowChrome title="TermFlow — prod-api-01" platform={platform} w={MW_W} h={MW_H}>
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        {/* Activity rail */}
        <div style={{ width: 56, borderRight: `1.2px solid ${faint}`, display: 'flex',
                      flexDirection: 'column', alignItems: 'center', padding: '14px 0', gap: 18,
                      background: '#F3EFE6' }}>
          {['server','folder','chart','bolt','search','gear'].map((k,i) => (
            <div key={k} style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: i === 0 ? paper : 'transparent',
                                  border: i === 0 ? `1.3px solid ${ink}` : 'none',
                                  borderRadius: 8 }}>
              <WFIcon kind={k} size={20} color={i===0 ? ink : pencil} />
            </div>
          ))}
        </div>

        {/* Connection sidebar */}
        <div style={{ width: 240, borderRight: `1.2px solid ${faint}`, padding: 14, background: '#FBF8F1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <WFHand size={20} weight={700}>Connections</WFHand>
            <WFIcon kind="plus" size={16} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14,
                        border: `1.2px dashed ${pencil}`, borderRadius: 6, padding: '4px 8px' }}>
            <WFIcon kind="search" size={13} color={pencil}/>
            <WFHand size={15} color={pencil} font="kalam">search servers…</WFHand>
          </div>

          {[
            { g: 'Production', env: 'prod', items: ['api-01 ⬤', 'api-02', 'db-primary'] },
            { g: 'Staging', env: 'stg', items: ['stg-web', 'stg-worker'] },
            { g: 'Dev', env: 'dev', items: ['localbox', 'sandbox'] },
          ].map((grp, gi) => (
            <div key={gi} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <WFEnvDot env={grp.env}/>
                <WFHand size={16} weight={700} color={pencil}>{grp.g}</WFHand>
              </div>
              {grp.items.map((it,i) => {
                const active = gi === 0 && i === 0;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
                                        background: active ? highlight : 'transparent',
                                        border: active ? `1.3px solid ${ink}` : 'none',
                                        borderRadius: 5, marginBottom: 2,
                                        transform: `rotate(${(Math.random()-0.5)*0.3}deg)` }}>
                    <WFIcon kind="server" size={14} color={pencil}/>
                    <WFHand size={16} font="kalam">{it}</WFHand>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1.2px solid ${faint}`,
                        padding: '0 8px', height: 38, gap: 4, background: '#F6F2E9' }}>
            {[
              { name: 'api-01', env: 'prod', active: true },
              { name: 'api-02', env: 'prod' },
              { name: 'stg-web', env: 'stg' },
            ].map((t,i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                background: t.active ? paper : 'transparent',
                border: t.active ? `1.2px solid ${ink}` : 'none',
                borderBottom: t.active ? `2px solid ${paper}` : 'none',
                borderRadius: '6px 6px 0 0', marginBottom: -1
              }}>
                <WFEnvDot env={t.env} size={8}/>
                <WFHand size={16}>{t.name}</WFHand>
                {t.active && <WFIcon kind="close" size={11} color={pencil}/>}
              </div>
            ))}
            <div style={{ padding: '5px 10px' }}><WFIcon kind="plus" size={14} color={pencil}/></div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <WFIcon kind="split" size={16} color={pencil}/>
              <WFIcon kind="upload" size={16} color={pencil}/>
              <WFIcon kind="chart" size={16} color={pencil}/>
            </div>
          </div>

          {/* Terminal area */}
          <div style={{ flex: 1, background: '#1E1D1B', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                          color: '#E8E4DA', lineHeight: 1.55 }}>
              <div style={{ color: '#95D98C' }}>user@prod-api-01:~$ <span style={{ color: '#E8E4DA' }}>systemctl status nginx</span></div>
              <div style={{ opacity: 0.8 }}>● nginx.service - A high performance web server</div>
              <div style={{ opacity: 0.8 }}>   Loaded: loaded (/lib/systemd/system/nginx.service; enabled)</div>
              <div style={{ opacity: 0.8 }}>   Active: <span style={{ color: '#95D98C' }}>active (running)</span> since Tue 2025-04-22 09:14:22</div>
              <div style={{ opacity: 0.8 }}>     Docs: man:nginx(8)</div>
              <div style={{ opacity: 0.8 }}>   Memory: 12.4M</div>
              <div style={{ opacity: 0.8 }}>      CPU: 1.258s</div>
              <div style={{ color: '#95D98C', marginTop: 10 }}>user@prod-api-01:~$ <span style={{ background: '#E8E4DA', color: '#1E1D1B', padding: '0 4px' }}>_</span></div>
            </div>
            {/* Decorative scan glow not needed in wireframe */}
          </div>

          {/* Quick command pills */}
          <div style={{ borderTop: `1.2px solid ${faint}`, padding: '10px 14px', background: '#F6F2E9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <WFHand size={15} weight={700} color={pencil}>Quick commands</WFHand>
              <WFHand size={13} color={pencil} font="kalam">· prod-api-01</WFHand>
              <div style={{ flex: 1 }}/>
              <WFIcon kind="gear" size={13} color={pencil}/>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <WFPill color={WF.envProd} filled>⟳ Restart Nginx</WFPill>
              <WFPill color={WF.ink}>📜 Tail access.log</WFPill>
              <WFPill color={WF.ink}>💾 Disk usage</WFPill>
              <WFPill color={WF.ink}>🐳 docker ps</WFPill>
              <WFPill color={WF.ink}>🧹 Clear cache</WFPill>
              <WFPill color={WF.accent}>📊 htop</WFPill>
              <WFPill color={pencil} style={{ borderStyle: 'dashed' }}>+ add</WFPill>
            </div>
          </div>

          {/* Status bar */}
          <div style={{ height: 26, borderTop: `1.2px solid ${faint}`, display: 'flex',
                        alignItems: 'center', padding: '0 12px', gap: 14, fontSize: 12, background: '#F0ECE2' }}>
            <WFEnvDot env="dev" size={8}/><WFHand size={14} color={pencil}>connected · 42ms</WFHand>
            <WFHand size={14} color={pencil} font="kalam">·</WFHand>
            <WFHand size={14} color={pencil}>~/www/app</WFHand>
            <div style={{ flex: 1 }}/>
            <WFHand size={14} color={pencil}>heartbeat 60s</WFHand>
            <WFHand size={14} color={pencil}>·</WFHand>
            <WFHand size={14} color={pencil}>utf-8</WFHand>
          </div>
        </div>
      </div>

      {/* Annotations overlay */}
      <WFAnnotation x={72} y={100} dir="right">activity rail · switch modules</WFAnnotation>
      <WFAnnotation x={310} y={90} dir="right">env color dot = one glance identify</WFAnnotation>
      <WFAnnotation x={MW_W - 280} y={MW_H - 170} dir="left">pills = one-click standardized commands</WFAnnotation>
      <WFAnnotation x={MW_W - 260} y={MW_H - 70} dir="left">heartbeat + auto reconnect status</WFAnnotation>
    </WFWindowChrome>
  );
}

// ============= V2: Split terminal + SFTP side-by-side =============
function MainV2_SplitSFTP({ platform = 'mac' }) {
  const { ink, paper, pencil, faint, highlight } = WF;
  return (
    <WFWindowChrome title="TermFlow — prod-api-01 · split" platform={platform} w={MW_W} h={MW_H}>
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        {/* Slim rail */}
        <div style={{ width: 44, borderRight: `1.2px solid ${faint}`, display: 'flex',
                      flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 16,
                      background: '#F3EFE6' }}>
          {['server','folder','chart','bolt','gear'].map((k,i) => (
            <WFIcon key={k} kind={k} size={18} color={i===0 ? ink : pencil}/>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1.2px solid ${faint}`,
                        padding: '0 10px', height: 34, gap: 6, background: '#F6F2E9' }}>
            <WFEnvDot env="prod" size={8}/>
            <WFHand size={15} weight={700}>api-01</WFHand>
            <WFHand size={13} color={pencil} font="mono">· 10.0.1.24</WFHand>
            <div style={{ flex: 1 }}/>
            <WFHand size={13} color={pencil}>split view</WFHand>
          </div>

          {/* Split body */}
          <div style={{ flex: 1, display: 'flex' }}>
            {/* Terminal left */}
            <div style={{ flex: 1.1, background: '#1E1D1B', padding: 14,
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5,
                          color: '#E8E4DA', borderRight: `1.2px solid ${faint}` }}>
              <div style={{ color: '#95D98C' }}>$ cd /var/www/releases/2025-04</div>
              <div style={{ color: '#95D98C' }}>$ ls -lh</div>
              <div style={{ opacity: 0.8 }}>-rw-r--r--  1 deploy  942M  app.tar.gz</div>
              <div style={{ opacity: 0.8 }}>-rw-r--r--  1 deploy  3.2K  release.json</div>
              <div style={{ color: '#95D98C', marginTop: 8 }}>$ tail -f app.log</div>
              <div style={{ opacity: 0.7 }}>[14:22:01] INFO  request id=a8b2 method=POST path=/api/login</div>
              <div style={{ opacity: 0.7 }}>[14:22:01] INFO  user_id=3821 authenticated</div>
              <div style={{ opacity: 0.7 }}>[14:22:02] WARN  rate limit hit ip=10.0.3.4</div>
              <div style={{ color: '#95D98C', marginTop: 8 }}>$ <span style={{ background:'#E8E4DA', color:'#1E1D1B', padding:'0 3px'}}>_</span></div>
            </div>

            {/* SFTP right */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FBF8F1' }}>
              <div style={{ padding: '8px 12px', borderBottom: `1.2px solid ${faint}`,
                            display: 'flex', alignItems: 'center', gap: 8, background: '#F6F2E9' }}>
                <WFIcon kind="folder" size={14} color={pencil}/>
                <WFHand size={14} weight={700}>SFTP</WFHand>
                <WFHand size={13} color={pencil} font="mono">~/www/releases</WFHand>
              </div>
              {/* Dual panel */}
              <div style={{ flex: 1, display: 'flex' }}>
                {['local','remote'].map((side,i) => (
                  <div key={side} style={{ flex: 1, padding: 10, borderRight: i===0 ? `1.2px dashed ${pencil}` : 'none' }}>
                    <WFHand size={13} weight={700} color={pencil} style={{ display:'block', marginBottom: 8 }}>{side === 'local' ? '⌂ Local' : '☁ Remote'}</WFHand>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: pencil, marginBottom: 6 }}>
                      {side === 'local' ? '~/projects/app/dist' : '/var/www/releases'}
                    </div>
                    {[
                      { n: 'app.tar.gz', s: '942M', active: side === 'remote' },
                      { n: 'config.yml', s: '3.2K' },
                      { n: 'README.md', s: '8K' },
                      { n: 'logs/', s: '—', folder: true },
                      { n: 'assets/', s: '—', folder: true },
                    ].map((f,j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '3px 6px', borderRadius: 4,
                                            background: f.active ? highlight : 'transparent' }}>
                        <WFIcon kind={f.folder ? 'folder':'server'} size={12} color={pencil}/>
                        <WFHand size={14} font="kalam" style={{ flex: 1 }}>{f.n}</WFHand>
                        <WFHand size={12} color={pencil} font="mono">{f.s}</WFHand>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {/* Transfer queue */}
              <div style={{ borderTop: `1.2px solid ${faint}`, padding: 10, background: '#F6F2E9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <WFHand size={13} weight={700}>Transfers</WFHand>
                  <WFHand size={12} color={pencil} font="kalam">· 1 active · resumable</WFHand>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <WFIcon kind="upload" size={12} color={pencil}/>
                  <WFHand size={13} font="mono">app.tar.gz</WFHand>
                  <div style={{ flex: 1, height: 6, border: `1px solid ${ink}`, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position:'absolute', inset:0, width:'68%', background: WF.envDev }}/>
                  </div>
                  <WFHand size={12} color={pencil} font="mono">68% · 4.2MB/s</WFHand>
                </div>
              </div>
            </div>
          </div>

          {/* Command pills */}
          <div style={{ borderTop: `1.2px solid ${faint}`, padding: '8px 12px', background: '#F6F2E9', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <WFPill color={WF.envProd} filled>⟳ deploy</WFPill>
            <WFPill color={WF.ink}>📜 tail log</WFPill>
            <WFPill color={WF.ink}>🐳 docker ps</WFPill>
            <WFPill color={WF.ink}>💾 df -h</WFPill>
            <WFPill color={WF.ink}>↻ reload</WFPill>
          </div>
        </div>
      </div>
      <WFAnnotation x={520} y={60} dir="left">terminal + SFTP same screen, no context switch</WFAnnotation>
      <WFAnnotation x={MW_W - 330} y={MW_H - 140} dir="left">drag across divider = upload</WFAnnotation>
      <WFAnnotation x={MW_W - 310} y={MW_H - 80} dir="left">resumable on reconnect</WFAnnotation>
    </WFWindowChrome>
  );
}

// ============= V3: Command-palette-centric — minimal chrome, everything via ⌘P =============
function MainV3_Palette({ platform = 'mac' }) {
  const { ink, paper, pencil, faint, highlight } = WF;
  return (
    <WFWindowChrome title="TermFlow" platform={platform} w={MW_W} h={MW_H}>
      {/* Full-bleed terminal */}
      <div style={{ width: '100%', height: '100%', background: '#1A1917', position: 'relative',
                    fontFamily: "'JetBrains Mono', monospace" }}>

        {/* floating breadcrumb pill */}
        <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex',
                      alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: 20,
                      border: '1px solid rgba(255,255,255,0.15)', color: '#E8E4DA' }}>
          <WFEnvDot env="prod" size={8}/>
          <WFHand size={15} color="#E8E4DA">prod-api-01</WFHand>
          <WFHand size={13} color="#9A968A" font="mono">· 10.0.1.24 · 42ms</WFHand>
        </div>

        {/* floating tab stack (top right) */}
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6 }}>
          {[{e:'prod',a:true},{e:'prod'},{e:'stg'},{e:'dev'}].map((t,i) => (
            <div key={i} style={{ width: 12, height: 28, background: t.a ? WF.envProd : 'rgba(255,255,255,0.12)',
                                  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 3 }}/>
          ))}
          <div style={{ width: 28, height: 28, display:'flex', alignItems:'center', justifyContent:'center',
                        border: '1px dashed rgba(255,255,255,0.25)', borderRadius: 4 }}>
            <WFIcon kind="plus" size={12} color="#9A968A"/>
          </div>
        </div>

        {/* Terminal body */}
        <div style={{ padding: '62px 24px 24px', fontSize: 13.5, color: '#E8E4DA', lineHeight: 1.6 }}>
          <div style={{ color: '#95D98C' }}>deploy@prod-api-01:~$ docker ps --format "table {"{"}.Names{"}"}\t{"{"}.Status{"}"}"</div>
          <div style={{ opacity: 0.85 }}>NAMES           STATUS</div>
          <div style={{ opacity: 0.85 }}>app-web         Up 2 days</div>
          <div style={{ opacity: 0.85 }}>app-worker      Up 2 days</div>
          <div style={{ opacity: 0.85 }}>redis           Up 2 days</div>
          <div style={{ opacity: 0.85 }}>postgres        Up 2 days</div>
          <div style={{ color: '#95D98C', marginTop: 12 }}>deploy@prod-api-01:~$ <span style={{ background:'#E8E4DA', color:'#1E1D1B', padding:'0 3px'}}>_</span></div>
        </div>

        {/* Command palette overlay */}
        <div style={{ position: 'absolute', left: '50%', top: '28%', transform: 'translateX(-50%)',
                      width: 560, background: '#F8F4EA', border: `1.5px solid ${ink}`, borderRadius: 12,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.45)', padding: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                        borderBottom: `1.2px solid ${faint}` }}>
            <WFIcon kind="search" size={16} color={pencil}/>
            <WFHand size={18} color={ink} font="kalam">restart</WFHand>
            <span style={{ width: 1.5, height: 18, background: ink, marginLeft: -4 }}/>
            <div style={{ flex: 1 }}/>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize: 11, color: pencil,
                           border: `1px solid ${pencil}`, padding: '1px 6px', borderRadius: 3 }}>⌘P</span>
          </div>
          {[
            { i: 'bolt',   t: 'Restart Nginx',     s: 'prod-api-01 · quick command', k: true },
            { i: 'bolt',   t: 'Restart Postgres',  s: 'prod-api-01 · quick command' },
            { i: 'server', t: 'Connect to stg-worker', s: 'staging · SSH' },
            { i: 'folder', t: 'Open SFTP on api-01', s: 'recent' },
            { i: 'chart',  t: 'Monitor · api-02',  s: 'dashboard' },
          ].map((r,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap: 10, padding: '9px 10px',
                                  background: i === 0 ? WF.highlight : 'transparent',
                                  border: i === 0 ? `1.2px solid ${ink}` : 'none',
                                  borderRadius: 5 }}>
              <WFIcon kind={r.i} size={16} color={i===0?ink:pencil}/>
              <WFHand size={17} color={ink}>{r.t}</WFHand>
              <div style={{ flex: 1 }}/>
              <WFHand size={13} color={pencil} font="kalam">{r.s}</WFHand>
              {r.k && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:pencil,
                                     border: `1px solid ${pencil}`, padding:'1px 5px', borderRadius:3 }}>↵</span>}
            </div>
          ))}
        </div>

        {/* Bottom pill dock */}
        <div style={{ position:'absolute', bottom: 16, left: '50%', transform:'translateX(-50%)',
                      display:'flex', gap: 6, padding: '8px 10px',
                      background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.18)', borderRadius: 24 }}>
          {[
            { l: 'Restart Nginx', c: WF.envProd },
            { l: 'Tail log',      c: '#E8E4DA' },
            { l: 'docker ps',     c: '#E8E4DA' },
            { l: 'df -h',         c: '#E8E4DA' },
            { l: 'htop',          c: WF.accent },
          ].map((p,i) => (
            <span key={i} style={{ padding:'5px 12px', borderRadius: 20,
                                   border: `1px solid ${p.c}`,
                                   color: p.c, fontFamily:"'Caveat',cursive", fontSize: 16, fontWeight: 600 }}>{p.l}</span>
          ))}
          <span style={{ padding:'5px 10px', borderRadius:20, border:'1px dashed rgba(255,255,255,0.3)',
                         color:'#9A968A', fontFamily:"'Caveat',cursive", fontSize: 16 }}>+</span>
        </div>
      </div>

      <WFAnnotation x={MW_W/2 - 120} y={150} dir="right">⌘P · everything lives here</WFAnnotation>
      <WFAnnotation x={60} y={60} dir="right">ambient server tag · always visible</WFAnnotation>
      <WFAnnotation x={MW_W - 280} y={MW_H - 90} dir="left">floating command dock</WFAnnotation>
    </WFWindowChrome>
  );
}

// ============= V4: Hybrid "canvas" — connections as cards on left, stacked terminals, right monitor rail =============
function MainV4_Canvas({ platform = 'mac' }) {
  const { ink, paper, pencil, faint, highlight } = WF;
  return (
    <WFWindowChrome title="TermFlow — canvas view" platform={platform} w={MW_W} h={MW_H}>
      <div style={{ display:'flex', width:'100%', height:'100%' }}>
        {/* Connection cards rail */}
        <div style={{ width: 220, borderRight: `1.2px solid ${faint}`, padding: 12,
                      background: '#FBF8F1', overflow: 'hidden' }}>
          <WFHand size={19} weight={700} style={{ display:'block', marginBottom: 10 }}>Servers</WFHand>
          {[
            { n: 'api-01', env: 'prod', s: '42ms · up', active: true },
            { n: 'api-02', env: 'prod', s: '48ms · up' },
            { n: 'stg-web', env: 'stg', s: '—' },
            { n: 'dev-box', env: 'dev', s: '12ms · up' },
            { n: 'db-primary', env: 'prod', s: 'reconnecting', warn: true },
          ].map((c,i) => (
            <div key={i} style={{ marginBottom: 8, border: `1.3px solid ${c.active ? ink : faint}`,
                                  borderRadius: 8, padding: 10, background: c.active ? highlight : paper,
                                  transform: `rotate(${(Math.random()-0.5)*0.4}deg)` }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom: 4 }}>
                <WFEnvDot env={c.env} size={9}/>
                <WFHand size={17} weight={700}>{c.n}</WFHand>
              </div>
              <WFHand size={13} color={c.warn ? WF.envProd : pencil} font="kalam">{c.s}</WFHand>
            </div>
          ))}
        </div>

        {/* Stacked terminal canvas */}
        <div style={{ flex: 1, padding: 14, background: '#F3EFE6', display: 'flex',
                      flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <WFHand size={19} weight={700}>Open sessions</WFHand>
            <WFHand size={14} color={pencil} font="kalam">· 3 active · sync broadcast ON</WFHand>
            <div style={{ flex: 1 }}/>
            <WFPill color={ink}>sync to all</WFPill>
            <WFPill color={pencil} style={{ borderStyle:'dashed' }}>+ new</WFPill>
          </div>

          {[
            { n: 'api-01', env: 'prod', active: true },
            { n: 'api-02', env: 'prod' },
            { n: 'stg-web', env: 'stg' },
          ].map((t,i) => (
            <div key={i} style={{ border: `1.3px solid ${t.active ? ink : faint}`, borderRadius: 8,
                                  overflow: 'hidden', flex: t.active ? 2 : 1, minHeight: 0,
                                  background: '#1E1D1B' }}>
              <div style={{ padding: '4px 10px', background: '#2B2A28', display: 'flex',
                            alignItems: 'center', gap: 8, color: '#E8E4DA' }}>
                <WFEnvDot env={t.env} size={7}/>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize: 12 }}>{t.n}</span>
                <div style={{ flex: 1 }}/>
                <span style={{ fontSize: 11, opacity: 0.6, fontFamily:"'JetBrains Mono',monospace" }}>{t.active?'▾':'▸'}</span>
              </div>
              <div style={{ padding: '8px 12px', fontFamily:"'JetBrains Mono',monospace",
                            fontSize: 12, color: '#E8E4DA', lineHeight: 1.5 }}>
                {t.active ? (
                  <>
                    <div style={{ color:'#95D98C' }}>$ tail -f /var/log/app.log</div>
                    <div style={{ opacity:0.75 }}>[14:22:01] INFO  request id=a8b2</div>
                    <div style={{ opacity:0.75 }}>[14:22:02] WARN  rate limit hit ip=10.0.3.4</div>
                    <div style={{ opacity:0.75 }}>[14:22:03] INFO  cache hit ratio=94%</div>
                    <div style={{ color:'#95D98C' }}>$ <span style={{ background:'#E8E4DA', color:'#1E1D1B'}}>_</span></div>
                  </>
                ) : (
                  <div style={{ opacity:0.6 }}>$ tail -f /var/log/app.log  &nbsp;···&nbsp; collapsed</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right monitor rail */}
        <div style={{ width: 220, borderLeft: `1.2px solid ${faint}`, padding: 12, background: '#FBF8F1' }}>
          <WFHand size={17} weight={700} style={{ display: 'block', marginBottom: 10 }}>api-01 live</WFHand>
          {[
            { l: 'CPU',     v: '38%', p: 0.38, c: WF.envDev },
            { l: 'Memory',  v: '62%', p: 0.62, c: WF.envStg },
            { l: 'Disk',    v: '71%', p: 0.71, c: WF.envStg },
            { l: 'Net ↓',   v: '2.1 MB/s', p: 0.28, c: WF.accent },
          ].map((m,i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 4 }}>
                <WFHand size={14} color={pencil} font="kalam">{m.l}</WFHand>
                <WFHand size={13} font="mono">{m.v}</WFHand>
              </div>
              <svg width="100%" height="38" viewBox="0 0 180 38" preserveAspectRatio="none">
                <path d={`M 0 28 L ${180 * m.p} 28`} stroke={m.c} strokeWidth="3" strokeLinecap="round"/>
                <path d={`M ${180 * m.p} 28 L 180 28`} stroke={faint} strokeWidth="2.5" strokeLinecap="round"/>
                {/* mini sparkline */}
                <path d="M 0 22 L 15 18 L 28 24 L 42 14 L 56 19 L 72 10 L 88 15 L 104 8 L 120 12 L 138 6 L 158 10 L 180 5"
                      stroke={m.c} strokeWidth="1.2" fill="none" opacity="0.6" />
              </svg>
            </div>
          ))}
          <div style={{ borderTop: `1.2px dashed ${faint}`, paddingTop: 10, marginTop: 4 }}>
            <WFHand size={14} weight={700} color={pencil} style={{ display:'block', marginBottom: 4 }}>Top proc</WFHand>
            {['nginx · 12%','pg · 8%','node · 6%'].map((p,i) => (
              <div key={i} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize: 11, color: pencil }}>{p}</div>
            ))}
          </div>
        </div>
      </div>
      <WFAnnotation x={260} y={70} dir="right">server cards · colored by environment</WFAnnotation>
      <WFAnnotation x={500} y={60} dir="right">stacked sessions · compare logs live</WFAnnotation>
      <WFAnnotation x={MW_W - 350} y={80} dir="left">live monitor rail · no separate page</WFAnnotation>
    </WFWindowChrome>
  );
}

Object.assign(window, {
  MainV1_ClassicIDE, MainV2_SplitSFTP, MainV3_Palette, MainV4_Canvas
});
