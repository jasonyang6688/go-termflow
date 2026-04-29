// Module wireframes — SFTP, Monitor, Connection dialog, Quick commands, Empty state
const { ink, paper, pencil, faint, highlight, envProd, envStg, envDev, accent } = WF;

// ============ SFTP V1 — classic dual panel ============
function SFTPv1({ w = 900, h = 560 }) {
  return (
    <WFWindowChrome title="TermFlow · SFTP — api-01" platform="mac" w={w} h={h}>
      <div style={{ display:'flex', height:'100%', flexDirection:'column' }}>
        <div style={{ padding:'8px 14px', borderBottom:`1.2px solid ${faint}`, display:'flex', gap:12, alignItems:'center', background:'#F6F2E9' }}>
          <WFIcon kind="folder" size={16}/><WFHand size={17} weight={700}>Dual-panel SFTP</WFHand>
          <div style={{ flex:1 }}/>
          <WFPill color={ink}>↑ Upload</WFPill>
          <WFPill color={ink}>↓ Download</WFPill>
          <WFPill color={pencil}>⤷ New folder</WFPill>
        </div>
        <div style={{ flex:1, display:'flex' }}>
          {[
            { name:'Local', path:'~/projects/app/dist', files:[
              {n:'app.tar.gz', s:'942 MB', sel:true},
              {n:'config.yml', s:'3.2 KB'},
              {n:'README.md',  s:'8 KB'},
              {n:'assets/', s:'—', f:true},
              {n:'node_modules/', s:'—', f:true},
              {n:'package.json', s:'1.4 KB'},
            ]},
            { name:'Remote · api-01', path:'/var/www/releases', files:[
              {n:'2025-04-18/', s:'—', f:true},
              {n:'2025-04-20/', s:'—', f:true},
              {n:'current → 2025-04-20', s:'link'},
              {n:'release.json', s:'2.1 KB'},
            ]},
          ].map((side,i) => (
            <div key={i} style={{ flex:1, borderRight: i===0 ? `1.2px dashed ${pencil}`:'none', display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'8px 12px', background:'#FBF8F1', borderBottom:`1.2px solid ${faint}` }}>
                <WFHand size={15} weight={700} color={i===0?envDev:envProd}>{side.name}</WFHand>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:pencil, marginTop:2 }}>{side.path}</div>
              </div>
              <div style={{ padding:'6px 0', flex:1 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 120px', padding:'4px 14px', color:pencil, fontSize:12, borderBottom:`1px solid ${faint}` }}>
                  <WFHand size={13} color={pencil} font="kalam">name</WFHand>
                  <WFHand size={13} color={pencil} font="kalam">size</WFHand>
                  <WFHand size={13} color={pencil} font="kalam">modified</WFHand>
                </div>
                {side.files.map((f,j) => (
                  <div key={j} style={{ display:'grid', gridTemplateColumns:'1fr 80px 120px', padding:'6px 14px',
                                        alignItems:'center',
                                        background: f.sel ? highlight : 'transparent',
                                        border: f.sel ? `1.2px solid ${ink}`: 'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <WFIcon kind={f.f?'folder':'server'} size={13} color={pencil}/>
                      <WFHand size={15} font="kalam">{f.n}</WFHand>
                    </div>
                    <WFHand size={13} font="mono" color={pencil}>{f.s}</WFHand>
                    <WFHand size={13} font="mono" color={pencil}>Apr 22 14:22</WFHand>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* transfer queue */}
        <div style={{ borderTop:`1.2px solid ${faint}`, padding:'8px 14px', background:'#F6F2E9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <WFHand size={14} weight={700}>Transfer queue</WFHand>
            <WFHand size={12} color={pencil} font="kalam">2 active · 1 paused</WFHand>
            <div style={{ flex:1 }}/>
            <WFHand size={12} color={pencil} font="kalam">md5 verify ✓</WFHand>
          </div>
          {[
            { n:'app.tar.gz', p:0.68, s:'4.2 MB/s · 2m left', c:envDev, label:'68%' },
            { n:'config.yml', p:1.0,  s:'done', c:envDev, label:'✓' },
            { n:'assets.zip (resuming)', p:0.42, s:'paused at 42% · network hiccup', c:envStg, label:'42%' },
          ].map((t,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom: 3 }}>
              <WFIcon kind="upload" size={12} color={pencil}/>
              <WFHand size={13} font="mono" style={{ width: 200 }}>{t.n}</WFHand>
              <div style={{ flex:1, height:6, border:`1px solid ${ink}`, borderRadius:3, overflow:'hidden', position:'relative' }}>
                <div style={{ position:'absolute', inset:0, width:`${t.p*100}%`, background:t.c }}/>
              </div>
              <WFHand size={11} font="mono" color={pencil} style={{ width:170, textAlign:'right' }}>{t.s}</WFHand>
              <WFHand size={12} font="mono" style={{ width:34 }}>{t.label}</WFHand>
            </div>
          ))}
        </div>
      </div>
      <WFAnnotation x={w/2-60} y={60} dir="right">drag across divider</WFAnnotation>
      <WFAnnotation x={w-280} y={h-80} dir="left">断点续传 · auto resume</WFAnnotation>
    </WFWindowChrome>
  );
}

// ============ SFTP V2 — drawer over terminal (side slide-in) ============
function SFTPv2({ w = 900, h = 560 }) {
  return (
    <WFWindowChrome title="TermFlow — api-01 · SFTP drawer" platform="mac" w={w} h={h}>
      <div style={{ display:'flex', height:'100%' }}>
        {/* terminal stays */}
        <div style={{ flex: 1.1, background:'#1E1D1B', padding:16, fontFamily:"'JetBrains Mono',monospace", fontSize:12.5, color:'#E8E4DA' }}>
          <div style={{ color:'#95D98C' }}>$ ls /var/www/releases</div>
          <div>2025-04-18/  2025-04-20/  current  release.json</div>
          <div style={{ color:'#95D98C', marginTop:8 }}>$ <span style={{ background:'#E8E4DA', color:'#1E1D1B' }}>_</span></div>
        </div>
        {/* drawer */}
        <div style={{ width: 420, borderLeft:`1.5px solid ${ink}`, background: paper, display:'flex', flexDirection:'column',
                      boxShadow:'-8px 0 24px rgba(0,0,0,0.08)' }}>
          <div style={{ padding:'10px 14px', borderBottom:`1.2px solid ${faint}`, display:'flex', alignItems:'center', gap:8, background:'#F6F2E9' }}>
            <WFIcon kind="folder" size={15}/><WFHand size={16} weight={700}>Files · api-01</WFHand>
            <div style={{ flex:1 }}/>
            <WFIcon kind="split" size={13} color={pencil}/>
            <WFIcon kind="close" size={13} color={pencil}/>
          </div>
          {/* breadcrumbs */}
          <div style={{ padding:'6px 14px', fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:pencil }}>
            / &gt; var &gt; www &gt; releases &gt; <span style={{ color:ink }}>2025-04-20</span>
          </div>
          <div style={{ display:'flex', padding:'6px 14px', gap:6 }}>
            <WFPill color={ink} h={24}>↑ Upload</WFPill>
            <WFPill color={pencil} h={24}>⤷ Mkdir</WFPill>
            <WFPill color={pencil} h={24}>⟳ Refresh</WFPill>
          </div>
          {/* files */}
          <div style={{ flex:1, padding:'6px 0', overflow:'hidden' }}>
            {[
              {n:'app.tar.gz',  s:'942 MB', sel:true},
              {n:'nginx.conf',  s:'3.1 KB'},
              {n:'app.env',     s:'1.4 KB'},
              {n:'scripts/',    s:'—', f:true},
              {n:'static/',     s:'—', f:true},
              {n:'README.md',   s:'8 KB'},
            ].map((f,i) => (
              <div key={i} style={{ display:'flex', padding:'7px 14px', alignItems:'center', gap:8,
                                    background: f.sel ? highlight : 'transparent',
                                    border: f.sel ? `1.2px solid ${ink}` : 'none', margin: f.sel?'0 8px':0 }}>
                <WFIcon kind={f.f?'folder':'server'} size={13} color={pencil}/>
                <WFHand size={15} font="kalam" style={{ flex:1 }}>{f.n}</WFHand>
                <WFHand size={12} font="mono" color={pencil}>{f.s}</WFHand>
              </div>
            ))}
          </div>
          {/* drop zone */}
          <div style={{ margin:'8px 14px', padding:16, border:`1.5px dashed ${pencil}`, borderRadius:8,
                        textAlign:'center', background:'rgba(255,255,255,0.5)' }}>
            <WFHand size={17} color={pencil}>drop files here to upload</WFHand>
          </div>
          <div style={{ padding:'8px 14px', borderTop:`1.2px solid ${faint}`, background:'#F6F2E9', display:'flex', alignItems:'center', gap:8 }}>
            <WFIcon kind="upload" size={12} color={pencil}/>
            <WFHand size={13} font="mono">app.tar.gz</WFHand>
            <div style={{ flex:1, height:5, border:`1px solid ${ink}`, borderRadius:3, overflow:'hidden' }}>
              <div style={{ width:'68%', height:'100%', background: envDev }}/>
            </div>
            <WFHand size={12} font="mono" color={pencil}>68%</WFHand>
          </div>
        </div>
      </div>
      <WFAnnotation x={500} y={60} dir="right">drawer slides in · terminal stays visible</WFAnnotation>
    </WFWindowChrome>
  );
}

// ============ SFTP V3 — file tray with large drop target ============
function SFTPv3({ w = 900, h = 560 }) {
  return (
    <WFWindowChrome title="TermFlow · Quick transfer" platform="mac" w={w} h={h}>
      <div style={{ height:'100%', padding:24, background:'#FBF8F1', display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <WFHand size={22} weight={700}>Drop → anywhere</WFHand>
          <WFHand size={15} color={pencil} font="kalam">· 3 servers selected · fan-out upload</WFHand>
        </div>
        {/* server chips as drop targets */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {[
            {n:'api-01', e:'prod', sel:true},
            {n:'api-02', e:'prod', sel:true},
            {n:'stg-web',e:'stg',  sel:true},
            {n:'dev-box',e:'dev'},
          ].map((s,i) => (
            <div key={i} style={{ padding:'10px 16px', border:`1.5px solid ${s.sel?ink:faint}`, borderRadius:10,
                                  background: s.sel?highlight:paper, display:'flex', alignItems:'center', gap:8,
                                  transform:`rotate(${(Math.random()-0.5)*0.5}deg)` }}>
              <WFEnvDot env={s.e} size={9}/>
              <WFHand size={16} weight={700}>{s.n}</WFHand>
              <WFHand size={12} color={pencil} font="kalam">~/deploy</WFHand>
            </div>
          ))}
        </div>
        {/* big drop zone */}
        <div style={{ flex:1, border:`2px dashed ${pencil}`, borderRadius:14, background:'rgba(255,255,255,0.4)',
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
          <WFIcon kind="upload" size={48} color={pencil}/>
          <WFHand size={26} color={pencil}>drop files or folders</WFHand>
          <WFHand size={15} color={pencil} font="kalam">uploads to all selected servers in parallel</WFHand>
          <div style={{ marginTop:16, display:'flex', gap:8 }}>
            <WFPill color={ink}>browse local…</WFPill>
            <WFPill color={pencil}>paste path</WFPill>
          </div>
        </div>
        {/* recent */}
        <div>
          <WFHand size={15} weight={700} color={pencil} style={{ display:'block', marginBottom:6 }}>Recent transfers</WFHand>
          <div style={{ display:'flex', gap:8 }}>
            {['app.tar.gz → api-01 ✓','nginx.conf → api-01 ✓','assets.zip → stg-web ⏸'].map((t,i) => (
              <div key={i} style={{ padding:'5px 10px', border:`1.2px solid ${faint}`, borderRadius:14, background:paper }}>
                <WFHand size={13} font="kalam" color={pencil}>{t}</WFHand>
              </div>
            ))}
          </div>
        </div>
      </div>
      <WFAnnotation x={w/2-70} y={h/2+10} dir="right">fan-out to N servers</WFAnnotation>
    </WFWindowChrome>
  );
}

// ============ Monitor V1 — grid dashboard ============
function MonitorV1({ w = 900, h = 560 }) {
  return (
    <WFWindowChrome title="TermFlow · Monitor — api-01" platform="mac" w={w} h={h}>
      <div style={{ height:'100%', padding:18, background:'#FBF8F1', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <WFEnvDot env="prod"/>
          <WFHand size={22} weight={700}>api-01 · 10.0.1.24</WFHand>
          <WFHand size={14} color={pencil} font="kalam">· last 5 min · live</WFHand>
          <div style={{ flex:1 }}/>
          {['5m','30m','1h','6h','24h'].map((r,i) => (
            <span key={i} style={{ padding:'3px 10px', border:`1.2px solid ${i===0?ink:faint}`, borderRadius:14,
                                    background:i===0?highlight:'transparent' }}>
              <WFHand size={13} font="mono">{r}</WFHand>
            </span>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr 0.9fr', gap:14, height:'calc(100% - 60px)' }}>
          {[
            {l:'CPU',       v:'38%',     c:envDev,  spark:true, sub:'4 cores · load 1.12'},
            {l:'Memory',    v:'62%',     c:envStg,  spark:true, sub:'8 GB · 4.9 used'},
            {l:'Disk I/O',  v:'18 MB/s', c:accent,  spark:true, sub:'/dev/nvme0n1'},
            {l:'Network',   v:'↓2.1 ↑0.4 MB/s', c:accent, spark:true, sub:'eth0'},
          ].map((m,i) => (
            <div key={i} style={{ border:`1.3px solid ${ink}`, borderRadius:10, padding:14, background:paper }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div>
                  <WFHand size={15} color={pencil}>{m.l}</WFHand>
                  <div><WFHand size={28} weight={700}>{m.v}</WFHand></div>
                  <WFHand size={12} color={pencil} font="kalam">{m.sub}</WFHand>
                </div>
                <WFIcon kind="chart" size={18} color={pencil}/>
              </div>
              {/* sketch chart */}
              <svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none" style={{ marginTop:8 }}>
                <path d="M 0 60 L 30 55 L 60 62 L 90 48 L 120 52 L 150 38 L 180 45 L 210 32 L 240 40 L 270 28 L 300 35 L 330 22 L 360 30 L 400 18"
                      stroke={m.c} strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M 0 60 L 30 55 L 60 62 L 90 48 L 120 52 L 150 38 L 180 45 L 210 32 L 240 40 L 270 28 L 300 35 L 330 22 L 360 30 L 400 18 L 400 80 L 0 80 Z"
                      fill={m.c} opacity="0.12" stroke="none"/>
              </svg>
            </div>
          ))}
          {/* processes table — spans 2 cols */}
          <div style={{ gridColumn:'1 / span 2', border:`1.3px solid ${ink}`, borderRadius:10, padding:12, background:paper, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <WFHand size={15} weight={700}>Top processes</WFHand>
              <WFHand size={12} color={pencil} font="kalam">· right-click to kill / inspect</WFHand>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'40px 1fr 80px 80px 80px', fontSize:12, color:pencil, padding:'4px 0' }}>
              {['PID','command','CPU','MEM','time'].map((h,i) => <WFHand key={i} size={13} color={pencil} font="kalam">{h}</WFHand>)}
            </div>
            {[
              ['1823','nginx: master','12%','2.1%','2d'],
              ['1902','postgres','8%','18%','2d'],
              ['2104','node /app/server.js','6%','4%','2d'],
              ['2399','redis-server','2%','1.2%','2d'],
            ].map((r,i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'40px 1fr 80px 80px 80px', padding:'4px 0', borderTop:`1px solid ${faint}` }}>
                {r.map((c,j) => <WFHand key={j} size={13} font="mono">{c}</WFHand>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </WFWindowChrome>
  );
}

// ============ Monitor V2 — compact inline strip ============
function MonitorV2({ w = 900, h = 560 }) {
  return (
    <WFWindowChrome title="TermFlow — api-01 · monitor strip" platform="mac" w={w} h={h}>
      <div style={{ height:'100%', background:'#1E1D1B', position:'relative' }}>
        {/* top strip */}
        <div style={{ padding:'10px 14px', background:'#2B2A28', display:'flex', gap:14, alignItems:'center',
                      borderBottom:`1px solid rgba(255,255,255,0.08)` }}>
          <WFEnvDot env="prod" size={9}/>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", color:'#E8E4DA', fontSize:13 }}>api-01</span>
          {[
            {l:'CPU', v:'38%', c:envDev},
            {l:'MEM', v:'62%', c:envStg},
            {l:'DISK',v:'71%', c:envStg},
            {l:'NET', v:'2.1M',c:accent},
            {l:'UP',  v:'14d',  c:'#E8E4DA'},
          ].map((m,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:10, color:'#9A968A', fontFamily:"'JetBrains Mono',monospace" }}>{m.l}</span>
              <span style={{ color:m.c, fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:600 }}>{m.v}</span>
              {i < 3 && (
                <svg width="60" height="18" viewBox="0 0 60 18">
                  <path d="M 0 14 L 8 10 L 16 13 L 24 6 L 32 9 L 40 4 L 48 8 L 60 3"
                        stroke={m.c} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.7"/>
                </svg>
              )}
            </div>
          ))}
          <div style={{ flex:1 }}/>
          <span style={{ color:'#9A968A', fontSize:11, fontFamily:"'JetBrains Mono',monospace" }}>▌ expand dashboard ⌘M</span>
        </div>
        {/* terminal below */}
        <div style={{ padding:16, fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:'#E8E4DA' }}>
          <div style={{ color:'#95D98C' }}>$ htop</div>
          <div style={{ opacity:0.7 }}>  PID  CMD              CPU%  MEM%</div>
          <div style={{ opacity:0.85 }}> 1823 nginx: master    12.0   2.1</div>
          <div style={{ opacity:0.85 }}> 1902 postgres          8.0  18.0</div>
          <div style={{ opacity:0.85 }}> 2104 node /app         6.0   4.0</div>
          <div style={{ color:'#95D98C', marginTop:8 }}>$ <span style={{ background:'#E8E4DA', color:'#1E1D1B'}}>_</span></div>
        </div>
      </div>
      <WFAnnotation x={70} y={70} dir="right">ambient always-on strip · zero clicks</WFAnnotation>
    </WFWindowChrome>
  );
}

// ============ Monitor V3 — fleet overview ============
function MonitorV3({ w = 900, h = 560 }) {
  return (
    <WFWindowChrome title="TermFlow · Fleet monitor" platform="mac" w={w} h={h}>
      <div style={{ height:'100%', padding:18, background:'#FBF8F1' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <WFHand size={22} weight={700}>Fleet · 12 servers</WFHand>
          <WFHand size={14} color={pencil} font="kalam">· 2 alerts · 1 reconnecting</WFHand>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
          {Array.from({length:12}).map((_,i) => {
            const envs = ['prod','prod','prod','prod','stg','stg','stg','dev','dev','prod','stg','dev'];
            const statuses = ['ok','ok','warn','ok','ok','ok','reconnect','ok','ok','alert','ok','ok'];
            const cpu = [28,42,89,35,50,22,0,18,30,95,41,12][i];
            const mem = [42,55,71,38,60,33,0,22,41,88,50,20][i];
            const e = envs[i]; const s = statuses[i];
            const border = s==='alert'?envProd : s==='warn'?envStg : s==='reconnect'?pencil : ink;
            return (
              <div key={i} style={{ border:`1.4px ${s==='reconnect'?'dashed':'solid'} ${border}`, borderRadius:9, padding:10, background:paper,
                                    transform:`rotate(${(Math.random()-0.5)*0.3}deg)` }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <WFEnvDot env={e} size={8}/>
                  <WFHand size={15} weight={700}>{['api-01','api-02','api-03','api-04','stg-web','stg-api','stg-db','dev-box','sandbox','db-pri','stg-worker','playground'][i]}</WFHand>
                  {s==='alert' && <WFHand size={12} color={envProd} style={{marginLeft:'auto'}}>!</WFHand>}
                  {s==='warn'  && <WFHand size={12} color={envStg}  style={{marginLeft:'auto'}}>⚠</WFHand>}
                </div>
                <div style={{ display:'flex', gap:8, fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:pencil }}>
                  <span>CPU {cpu}%</span><span>MEM {mem}%</span>
                </div>
                {/* tiny spark */}
                <svg width="100%" height="22" viewBox="0 0 100 22" preserveAspectRatio="none" style={{ marginTop:4 }}>
                  <path d={`M 0 ${18-cpu*0.14} L 15 ${16-cpu*0.12} L 30 ${19-cpu*0.15} L 45 ${13-cpu*0.1} L 60 ${17-cpu*0.13} L 75 ${11-cpu*0.09} L 100 ${14-cpu*0.11}`}
                        stroke={s==='alert'?envProd:envDev} strokeWidth="1.5" fill="none"/>
                </svg>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:14, display:'flex', gap:8 }}>
          <WFPill color={ink}>filter: all</WFPill>
          <WFPill color={envProd}>alerts (1)</WFPill>
          <WFPill color={envStg}>warnings (1)</WFPill>
          <WFPill color={pencil}>sort by CPU</WFPill>
        </div>
      </div>
      <WFAnnotation x={w-280} y={60} dir="left">sketchy cards · glance-able fleet</WFAnnotation>
    </WFWindowChrome>
  );
}

// ============ Connection dialog V1 — classic modal ============
function ConnDialogV1({ w = 640, h = 560 }) {
  return (
    <div style={{ width:w, height:h, background:paper, border:`1.5px solid ${ink}`, borderRadius:12, position:'relative',
                  boxShadow:'0 20px 50px rgba(0,0,0,0.15)' }}>
      <div style={{ padding:'14px 20px', borderBottom:`1.2px solid ${faint}`, display:'flex', alignItems:'center' }}>
        <WFHand size={22} weight={700}>New connection</WFHand>
        <div style={{ flex:1 }}/>
        <WFIcon kind="close" size={16} color={pencil}/>
      </div>
      <div style={{ padding:20 }}>
        {/* tab modes */}
        <div style={{ display:'flex', gap:4, marginBottom:20 }}>
          {['SSH','Key','Jump host'].map((t,i) => (
            <span key={i} style={{ padding:'6px 14px', border:`1.3px solid ${i===0?ink:faint}`, borderRadius:16,
                                   background:i===0?highlight:'transparent' }}>
              <WFHand size={15} weight={i===0?700:500}>{t}</WFHand>
            </span>
          ))}
          <div style={{ flex:1 }}/>
          <WFHand size={13} color={pencil} font="kalam">paste ssh user@host ↓</WFHand>
        </div>
        {/* paste bar */}
        <div style={{ border:`1.3px dashed ${pencil}`, borderRadius:8, padding:'8px 12px', display:'flex', alignItems:'center', gap:8, marginBottom:20, background:'rgba(255,255,240,0.4)' }}>
          <WFHand size={15} font="mono" color={pencil}>ssh deploy@10.0.1.24 -p 22</WFHand>
          <div style={{ flex:1 }}/>
          <WFPill color={ink} h={24}>auto-parse</WFPill>
        </div>
        {/* fields */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {[
            {l:'Name', v:'prod-api-01 · us-east', full:true},
            {l:'Host', v:'10.0.1.24'},
            {l:'Port', v:'22'},
            {l:'User', v:'deploy'},
            {l:'Auth', v:'SSH key ▾'},
          ].map((f,i) => (
            <div key={i} style={{ gridColumn: f.full ? '1 / span 2':'auto' }}>
              <WFHand size={13} color={pencil} font="kalam" style={{ display:'block', marginBottom:4 }}>{f.l}</WFHand>
              <div style={{ border:`1.2px solid ${ink}`, borderRadius:6, padding:'8px 10px', background:paper }}>
                <WFHand size={16} font="mono">{f.v}</WFHand>
              </div>
            </div>
          ))}
          {/* key picker */}
          <div style={{ gridColumn: '1 / span 2' }}>
            <WFHand size={13} color={pencil} font="kalam" style={{ display:'block', marginBottom:4 }}>SSH key · scanned from ~/.ssh</WFHand>
            {['id_ed25519 (default)','id_rsa','deploy_key'].map((k,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px',
                                    border:`1.2px solid ${i===0?ink:faint}`, borderRadius:6, marginBottom:4,
                                    background:i===0?highlight:'transparent' }}>
                <WFIcon kind="key" size={13} color={pencil}/>
                <WFHand size={14} font="mono">{k}</WFHand>
              </div>
            ))}
          </div>
          {/* env + color */}
          <div>
            <WFHand size={13} color={pencil} font="kalam" style={{ display:'block', marginBottom:4 }}>Environment</WFHand>
            <div style={{ display:'flex', gap:6 }}>
              {['prod','stg','dev'].map((e,i) => (
                <span key={i} style={{ padding:'5px 12px', border:`1.3px solid ${i===0?ink:faint}`, borderRadius:14,
                                       background:i===0?highlight:'transparent', display:'flex', alignItems:'center', gap:5 }}>
                  <WFEnvDot env={e} size={8}/><WFHand size={13}>{e}</WFHand>
                </span>
              ))}
            </div>
          </div>
          <div>
            <WFHand size={13} color={pencil} font="kalam" style={{ display:'block', marginBottom:4 }}>Group</WFHand>
            <div style={{ border:`1.2px solid ${ink}`, borderRadius:6, padding:'7px 10px' }}>
              <WFHand size={15}>Production · us-east ▾</WFHand>
            </div>
          </div>
        </div>
      </div>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 20px', borderTop:`1.2px solid ${faint}`, display:'flex', gap:10, alignItems:'center', background:'#F6F2E9' }}>
        <WFPill color={pencil}>Test connection</WFPill>
        <WFHand size={13} color={envDev} font="kalam">✓ reachable · 42ms</WFHand>
        <div style={{ flex:1 }}/>
        <WFPill color={pencil}>Cancel</WFPill>
        <WFPill color={ink} filled>Save & connect</WFPill>
      </div>
      <WFAnnotation x={260} y={170} dir="right">paste ssh cmd · auto-fills all fields</WFAnnotation>
    </div>
  );
}

// ============ Connection dialog V2 — 2-step wizard ============
function ConnDialogV2({ w = 640, h = 560 }) {
  return (
    <div style={{ width:w, height:h, background:paper, border:`1.5px solid ${ink}`, borderRadius:12, position:'relative' }}>
      <div style={{ padding:'14px 20px', borderBottom:`1.2px solid ${faint}`, display:'flex', alignItems:'center', gap:10 }}>
        <WFHand size={22} weight={700}>Add server</WFHand>
        <div style={{ flex:1 }}/>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <span style={{ width:24, height:24, borderRadius:'50%', background:ink, color:paper, display:'flex',alignItems:'center',justifyContent:'center' }}><WFHand size={14} color={paper}>1</WFHand></span>
          <WFHand size={13} font="kalam">connect</WFHand>
          <span style={{ width:18, height:2, background:faint }}/>
          <span style={{ width:24, height:24, borderRadius:'50%', border:`1.3px solid ${faint}`, display:'flex',alignItems:'center',justifyContent:'center' }}><WFHand size={14} color={pencil}>2</WFHand></span>
          <WFHand size={13} font="kalam" color={pencil}>organize</WFHand>
        </div>
      </div>
      <div style={{ padding:'40px 40px' }}>
        <WFHand size={18} color={pencil} style={{ display:'block', textAlign:'center', marginBottom:18 }} font="kalam">paste anything that looks like an ssh connection</WFHand>
        <div style={{ border:`1.5px solid ${ink}`, borderRadius:10, padding:20, background:'rgba(255,255,240,0.4)', textAlign:'center' }}>
          <WFHand size={20} font="mono" weight={600}>ssh deploy@10.0.1.24 -p 22 -i ~/.ssh/id_ed25519</WFHand>
        </div>
        <WFHand size={14} color={pencil} style={{ display:'block', textAlign:'center', marginTop:8 }} font="kalam">or drop ~/.ssh/config to import all at once</WFHand>

        <div style={{ marginTop:36 }}>
          <WFHand size={15} weight={700} style={{ display:'block', marginBottom:10 }}>Detected</WFHand>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              {l:'host', v:'10.0.1.24'},
              {l:'port', v:'22'},
              {l:'user', v:'deploy'},
              {l:'key',  v:'~/.ssh/id_ed25519'},
            ].map((d,i) => (
              <div key={i} style={{ border:`1.2px solid ${faint}`, borderRadius:6, padding:'8px 12px', background:paper }}>
                <WFHand size={12} color={pencil} font="kalam">{d.l}</WFHand>
                <div><WFHand size={16} font="mono">{d.v}</WFHand></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 20px', borderTop:`1.2px solid ${faint}`, display:'flex', gap:10, background:'#F6F2E9' }}>
        <WFPill color={pencil}>Cancel</WFPill>
        <div style={{ flex:1 }}/>
        <WFPill color={pencil}>Skip organize</WFPill>
        <WFPill color={ink} filled>Continue →</WFPill>
      </div>
      <WFAnnotation x={180} y={140} dir="right">one paste, no form</WFAnnotation>
    </div>
  );
}

// ============ Connection dialog V3 — inline list edit ============
function ConnDialogV3({ w = 640, h = 560 }) {
  return (
    <div style={{ width:w, height:h, background:paper, border:`1.5px solid ${ink}`, borderRadius:12, position:'relative', overflow:'hidden' }}>
      <div style={{ padding:'14px 20px', borderBottom:`1.2px solid ${faint}`, display:'flex', alignItems:'center' }}>
        <WFHand size={22} weight={700}>Manage connections</WFHand>
        <div style={{ flex:1 }}/>
        <WFPill color={ink} h={26}>+ new</WFPill>
        <WFPill color={pencil} h={26} style={{marginLeft:6}}>import config</WFPill>
      </div>
      <div style={{ display:'flex', height:'calc(100% - 110px)' }}>
        {/* list */}
        <div style={{ width:260, borderRight:`1.2px solid ${faint}`, overflow:'hidden' }}>
          {[
            {n:'api-01', e:'prod', sel:true},
            {n:'api-02', e:'prod'},
            {n:'db-pri', e:'prod'},
            {n:'stg-web',e:'stg'},
            {n:'stg-api',e:'stg'},
            {n:'dev-box',e:'dev'},
            {n:'sandbox',e:'dev'},
          ].map((c,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px',
                                  background: c.sel ? highlight : 'transparent',
                                  borderLeft: c.sel ? `3px solid ${ink}` : '3px solid transparent',
                                  borderBottom:`1px solid ${faint}` }}>
              <WFEnvDot env={c.e} size={9}/>
              <WFHand size={16} weight={c.sel?700:500}>{c.n}</WFHand>
            </div>
          ))}
        </div>
        {/* detail */}
        <div style={{ flex:1, padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <WFEnvDot env="prod"/>
            <WFHand size={22} weight={700}>api-01</WFHand>
            <WFHand size={13} color={pencil} font="kalam">· last used 2h ago</WFHand>
          </div>
          {[
            {l:'Host',v:'10.0.1.24'},
            {l:'Port',v:'22'},
            {l:'User',v:'deploy'},
            {l:'Auth',v:'key · id_ed25519'},
            {l:'Group',v:'Production · us-east'},
            {l:'Tags',v:'api, web-tier, critical'},
            {l:'Notes',v:'main API node · bluegreen aware'},
          ].map((f,i) => (
            <div key={i} style={{ display:'flex', padding:'8px 0', borderBottom:`1px solid ${faint}` }}>
              <WFHand size={14} color={pencil} font="kalam" style={{ width:80 }}>{f.l}</WFHand>
              <WFHand size={15} font={f.l==='Host'||f.l==='Port'||f.l==='Auth'?'mono':'kalam'}>{f.v}</WFHand>
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <WFPill color={ink} filled>Connect</WFPill>
            <WFPill color={pencil}>Duplicate</WFPill>
            <WFPill color={envProd}>Delete</WFPill>
          </div>
        </div>
      </div>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 20px', borderTop:`1.2px solid ${faint}`, background:'#F6F2E9', display:'flex', gap:10 }}>
        <WFHand size={13} color={pencil} font="kalam">7 connections · 3 groups</WFHand>
        <div style={{ flex:1 }}/>
        <WFPill color={pencil}>Export encrypted</WFPill>
        <WFPill color={pencil}>Done</WFPill>
      </div>
    </div>
  );
}

// ============ Quick commands V1 — grid manager ============
function QuickCmdV1({ w = 760, h = 560 }) {
  return (
    <div style={{ width:w, height:h, background:paper, border:`1.5px solid ${ink}`, borderRadius:12, position:'relative', overflow:'hidden' }}>
      <div style={{ padding:'14px 20px', borderBottom:`1.2px solid ${faint}`, display:'flex', alignItems:'center', gap:12 }}>
        <WFHand size={22} weight={700}>Quick commands</WFHand>
        <span style={{ padding:'3px 10px', border:`1.2px solid ${faint}`, borderRadius:12 }}><WFHand size={13} color={pencil}>scope: api-01 ▾</WFHand></span>
        <div style={{ flex:1 }}/>
        <WFPill color={ink}>+ new</WFPill>
        <WFPill color={pencil}>import</WFPill>
      </div>
      <div style={{ display:'flex', height:'calc(100% - 56px)' }}>
        {/* scope sidebar */}
        <div style={{ width:180, borderRight:`1.2px solid ${faint}`, padding:14, background:'#FBF8F1' }}>
          {[
            {l:'Global',    n:24, sel:false, i:'star'},
            {l:'Production',n:12, sel:false, i:'server'},
            {l:'api-01',    n:6,  sel:true,  i:'server'},
            {l:'api-02',    n:6,  sel:false, i:'server'},
          ].map((s,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
                                  background: s.sel?highlight:'transparent',
                                  border: s.sel?`1.2px solid ${ink}`:'none',
                                  borderRadius:5, marginBottom:4 }}>
              <WFIcon kind={s.i} size={13} color={pencil}/>
              <WFHand size={15} font="kalam" style={{flex:1}}>{s.l}</WFHand>
              <WFHand size={12} color={pencil} font="mono">{s.n}</WFHand>
            </div>
          ))}
        </div>
        {/* grid */}
        <div style={{ flex:1, padding:16, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              {n:'Restart Nginx',    c:'sudo systemctl restart nginx',   col:envProd, icon:'⟳', hot:'⌘1'},
              {n:'Tail access log',  c:'tail -f /var/log/nginx/access.log', col:ink, icon:'📜', hot:'⌘2'},
              {n:'Disk usage',       c:'df -h | grep -v tmpfs',          col:ink, icon:'💾', hot:'⌘3'},
              {n:'Docker ps',        c:'docker ps --format "table ..."', col:ink, icon:'🐳', hot:'⌘4'},
              {n:'Tail app log',     c:'tail -n {{lines=200}} {{path}}', col:accent, icon:'📜', hot:'⌘5', param:true},
              {n:'Clear cache',      c:'sudo systemctl restart redis',   col:ink, icon:'🧹', hot:'⌘6'},
            ].map((c,i) => (
              <div key={i} style={{ border:`1.3px solid ${faint}`, borderRadius:8, padding:12, background:paper, position:'relative',
                                    transform:`rotate(${(Math.random()-0.5)*0.3}deg)` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:28, height:28, borderRadius:6, border:`1.3px solid ${c.col}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>{c.icon}</span>
                  <WFHand size={16} weight={700}>{c.n}</WFHand>
                  <div style={{flex:1}}/>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:pencil, border:`1px solid ${faint}`, padding:'1px 5px', borderRadius:3 }}>{c.hot}</span>
                </div>
                <div style={{ marginTop:6, padding:'6px 8px', background:'#F6F2E9', borderRadius:5, fontFamily:"'JetBrains Mono',monospace", fontSize:11.5, color:pencil }}>
                  {c.c}
                </div>
                {c.param && (
                  <div style={{ marginTop:5, display:'flex', gap:4 }}>
                    <span style={{ padding:'2px 8px', background:highlight, border:`1px solid ${ink}`, borderRadius:10, fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>{`{{lines}}`}</span>
                    <span style={{ padding:'2px 8px', background:highlight, border:`1px solid ${ink}`, borderRadius:10, fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>{`{{path}}`}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <WFAnnotation x={250} y={100} dir="right">scopes = global / group / per-connection</WFAnnotation>
      <WFAnnotation x={w-240} y={h-130} dir="left">{`{{placeholders}}`} prompt on click</WFAnnotation>
    </div>
  );
}

// ============ Quick commands V2 — command-as-chip editor ============
function QuickCmdV2({ w = 760, h = 560 }) {
  return (
    <div style={{ width:w, height:h, background:paper, border:`1.5px solid ${ink}`, borderRadius:12, position:'relative' }}>
      <div style={{ padding:'14px 20px', borderBottom:`1.2px solid ${faint}` }}>
        <WFHand size={22} weight={700}>Edit quick command</WFHand>
        <WFHand size={13} color={pencil} font="kalam">· live preview on right</WFHand>
      </div>
      <div style={{ display:'flex', height:'calc(100% - 120px)' }}>
        <div style={{ flex:1, padding:20, borderRight:`1.2px solid ${faint}` }}>
          <WFHand size={13} color={pencil} font="kalam">name</WFHand>
          <div style={{ border:`1.2px solid ${ink}`, borderRadius:6, padding:'8px 12px', marginBottom:14 }}>
            <WFHand size={18} weight={600}>Tail app log</WFHand>
          </div>
          <WFHand size={13} color={pencil} font="kalam">command (drag in placeholders)</WFHand>
          <div style={{ border:`1.2px solid ${ink}`, borderRadius:6, padding:'12px 14px', fontFamily:"'JetBrains Mono',monospace", fontSize:14, background:'#FBF8F1', marginBottom:14, lineHeight:2 }}>
            tail -n&nbsp;
            <span style={{ padding:'3px 10px', background:highlight, border:`1.3px solid ${ink}`, borderRadius:12, fontSize:12 }}>{`{{lines = 200}}`}</span>
            &nbsp;-f&nbsp;
            <span style={{ padding:'3px 10px', background:highlight, border:`1.3px solid ${ink}`, borderRadius:12, fontSize:12 }}>{`{{path = /var/log/app.log}}`}</span>
          </div>
          <div style={{ display:'flex', gap:6, marginBottom:14 }}>
            <WFPill color={pencil} h={24}>+ placeholder</WFPill>
            <WFPill color={pencil} h={24}>+ select param</WFPill>
            <WFPill color={pencil} h={24}>+ secret</WFPill>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <WFHand size={13} color={pencil} font="kalam">color</WFHand>
              <div style={{ display:'flex', gap:6, marginTop:4 }}>
                {[envProd,envStg,envDev,accent,ink].map((c,i) => (
                  <span key={i} style={{ width:24, height:24, borderRadius:'50%', background:c, border:i===3?`2.5px solid ${ink}`:`1px solid ${ink}` }}/>
                ))}
              </div>
            </div>
            <div>
              <WFHand size={13} color={pencil} font="kalam">behavior</WFHand>
              <div style={{ display:'flex', gap:4, marginTop:4 }}>
                <span style={{ padding:'4px 10px', border:`1.2px solid ${ink}`, borderRadius:12, background:highlight }}><WFHand size={12}>run immediately</WFHand></span>
                <span style={{ padding:'4px 10px', border:`1.2px solid ${faint}`, borderRadius:12 }}><WFHand size={12} color={pencil}>fill &amp; wait</WFHand></span>
              </div>
            </div>
          </div>
        </div>
        {/* preview */}
        <div style={{ width:260, padding:20, background:'#FBF8F1' }}>
          <WFHand size={13} color={pencil} font="kalam" style={{display:'block', marginBottom:8}}>preview</WFHand>
          <WFPill color={accent}>📜 Tail app log</WFPill>
          <WFHand size={13} color={pencil} font="kalam" style={{display:'block', marginTop:20, marginBottom:6}}>when clicked</WFHand>
          <div style={{ border:`1.3px solid ${ink}`, borderRadius:8, background:paper, padding:10 }}>
            <WFHand size={14} weight={700} style={{display:'block', marginBottom:8}}>Fill parameters</WFHand>
            <WFHand size={12} color={pencil} font="kalam">lines</WFHand>
            <div style={{ border:`1px solid ${ink}`, borderRadius:4, padding:'3px 6px', marginBottom:6, fontFamily:"'JetBrains Mono',monospace", fontSize:13 }}>200</div>
            <WFHand size={12} color={pencil} font="kalam">path</WFHand>
            <div style={{ border:`1px solid ${ink}`, borderRadius:4, padding:'3px 6px', marginBottom:8, fontFamily:"'JetBrains Mono',monospace", fontSize:13 }}>/var/log/app.log</div>
            <div style={{ display:'flex', gap:4 }}>
              <WFPill color={pencil} h={22}>cancel</WFPill>
              <WFPill color={ink} filled h={22}>run ↵</WFPill>
            </div>
          </div>
        </div>
      </div>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 20px', borderTop:`1.2px solid ${faint}`, background:'#F6F2E9', display:'flex', gap:8 }}>
        <WFPill color={envProd}>Delete</WFPill>
        <div style={{flex:1}}/>
        <WFPill color={pencil}>Cancel</WFPill>
        <WFPill color={ink} filled>Save</WFPill>
      </div>
    </div>
  );
}

// ============ Quick commands V3 — flow builder ============
function QuickCmdV3({ w = 760, h = 560 }) {
  return (
    <div style={{ width:w, height:h, background:paper, border:`1.5px solid ${ink}`, borderRadius:12, padding:20, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <WFHand size={22} weight={700}>Command flow · Deploy release</WFHand>
        <span style={{ padding:'3px 10px', border:`1.2px solid ${faint}`, borderRadius:12 }}><WFHand size={12} color={pencil}>chain of 4 steps</WFHand></span>
        <div style={{flex:1}}/>
        <WFPill color={ink} filled>▶ Run flow</WFPill>
      </div>
      <WFHand size={14} color={pencil} font="kalam" style={{display:'block', marginBottom:14}}>stepped execution · pause on error · confirm before destructive</WFHand>

      {[
        {n:'1 · Pull release', c:'git fetch && git reset --hard origin/main', done:true},
        {n:'2 · Build assets', c:'npm run build', done:true},
        {n:'3 · Restart worker', c:'sudo systemctl restart app-worker', current:true, confirm:true},
        {n:'4 · Smoke test',   c:'curl -f https://api.example.com/health', pending:true},
      ].map((s,i) => {
        const c = s.done? envDev : s.current? envStg : pencil;
        return (
          <div key={i} style={{ display:'flex', gap:12, marginBottom:8, alignItems:'stretch' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', border:`1.5px solid ${c}`,
                            background: s.done?c: paper, color:s.done?paper:c,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontFamily:"'Caveat',cursive", fontSize:16, fontWeight:700 }}>
                {s.done?'✓': s.current?'▶': i+1}
              </div>
              {i<3 && <div style={{ flex:1, width:2, background:faint, minHeight:20 }}/>}
            </div>
            <div style={{ flex:1, border:`1.3px ${s.current?'solid':'solid'} ${s.current?ink:faint}`,
                          borderRadius:8, padding:12,
                          background: s.current?highlight:paper,
                          transform:`rotate(${(Math.random()-0.5)*0.2}deg)` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <WFHand size={16} weight={700}>{s.n}</WFHand>
                {s.confirm && <span style={{padding:'1px 7px', background:envStg, color:ink, borderRadius:8, fontSize:10, fontFamily:"'Caveat',cursive", fontWeight:700}}>CONFIRM</span>}
                <div style={{flex:1}}/>
                {s.done && <WFHand size={12} color={pencil} font="kalam">0.8s</WFHand>}
                {s.current && <WFHand size={12} color={envStg} font="kalam">awaiting confirm</WFHand>}
              </div>
              <div style={{ marginTop:4, fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:pencil }}>{s.c}</div>
            </div>
          </div>
        );
      })}

      <div style={{ marginTop:14, border:`1.5px dashed ${pencil}`, borderRadius:8, padding:14, textAlign:'center' }}>
        <WFHand size={16} color={pencil}>+ add step · drop command or drag from library</WFHand>
      </div>
      <WFAnnotation x={50} y={160} dir="right">chain commands · human-in-loop for danger</WFAnnotation>
    </div>
  );
}

// ============ Empty/launch V1 — hero splash ============
function EmptyV1({ w = 900, h = 560 }) {
  return (
    <WFWindowChrome title="TermFlow" platform="mac" w={w} h={h}>
      <div style={{ height:'100%', background:'#FBF8F1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, textAlign:'center' }}>
        <div style={{ fontSize:80, marginBottom:8, color:ink, fontFamily:"'Caveat',cursive", fontWeight:700, letterSpacing:-2 }}>
          TermFlow
        </div>
        <WFHand size={22} color={pencil} font="kalam" style={{display:'block', marginBottom: 8}}>like opening a local folder, but it's a server</WFHand>
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <WFPill color={ink} filled h={36}>+ new connection  ⌘N</WFPill>
          <WFPill color={ink} h={36}>import ~/.ssh/config</WFPill>
        </div>
        <WFHand size={14} color={pencil} font="kalam" style={{display:'block', marginTop:36}}>or paste an ssh command anywhere to get going</WFHand>
        <div style={{ marginTop:36, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, width:'70%' }}>
          {[
            {i:'bolt',   t:'Smart keepalive', s:'never get dropped mid-command'},
            {i:'folder', t:'Resumable SFTP',  s:'pick up 2GB uploads where they stopped'},
            {i:'star',   t:'Quick commands',  s:'one-click your team playbook'},
          ].map((f,i) => (
            <div key={i} style={{ border:`1.3px solid ${faint}`, borderRadius:10, padding:14, background:paper, textAlign:'left',
                                  transform:`rotate(${(Math.random()-0.5)*0.4}deg)` }}>
              <WFIcon kind={f.i} size={22}/>
              <WFHand size={16} weight={700} style={{display:'block', marginTop:4}}>{f.t}</WFHand>
              <WFHand size={13} color={pencil} font="kalam">{f.s}</WFHand>
            </div>
          ))}
        </div>
      </div>
    </WFWindowChrome>
  );
}

// ============ Empty V2 — split onboarding ============
function EmptyV2({ w = 900, h = 560 }) {
  return (
    <WFWindowChrome title="TermFlow · welcome" platform="mac" w={w} h={h}>
      <div style={{ display:'flex', height:'100%' }}>
        <div style={{ flex:1, padding:40, background:'#F6F2E9', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <WFHand size={42} weight={700} style={{display:'block'}}>Get connected in</WFHand>
          <WFHand size={42} weight={700} style={{display:'block'}}>3 keystrokes</WFHand>
          <WFHand size={17} color={pencil} font="kalam" style={{display:'block', marginTop:12, marginBottom:24}}>no forms. no wizard. paste, hit enter.</WFHand>
          <div style={{ border:`1.5px solid ${ink}`, borderRadius:10, padding:16, background:paper }}>
            <WFHand size={18} font="mono" weight={600}>⌘V ssh deploy@10.0.1.24</WFHand>
            <div style={{ height:12 }}/>
            <WFHand size={13} color={pencil} font="kalam">↓ detected</WFHand>
            <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
              {['host: 10.0.1.24','port: 22','user: deploy','key: id_ed25519'].map((t,i) => (
                <span key={i} style={{ padding:'3px 8px', background:highlight, border:`1px solid ${ink}`, borderRadius:10, fontSize:11, fontFamily:"'JetBrains Mono',monospace" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ flex:1, padding:40, display:'flex', flexDirection:'column', justifyContent:'center', gap:14 }}>
          <WFHand size={18} weight={700}>or start with…</WFHand>
          {[
            {i:'folder', t:'Import ~/.ssh/config', s:'all your existing hosts, instantly'},
            {i:'link',   t:'Restore from another machine', s:'encrypted JSON · your key'},
            {i:'eye',    t:'Try demo server', s:'see the features, no real creds'},
          ].map((o,i) => (
            <div key={i} style={{ border:`1.3px solid ${faint}`, borderRadius:8, padding:14, display:'flex', alignItems:'center', gap:14, background:paper }}>
              <WFIcon kind={o.i} size={24}/>
              <div style={{flex:1}}>
                <WFHand size={16} weight={700} style={{display:'block'}}>{o.t}</WFHand>
                <WFHand size={13} color={pencil} font="kalam">{o.s}</WFHand>
              </div>
              <WFHand size={20} color={pencil}>→</WFHand>
            </div>
          ))}
        </div>
      </div>
    </WFWindowChrome>
  );
}

// ============ Empty V3 — reconnecting state (error / offline) ============
function EmptyV3({ w = 900, h = 560 }) {
  return (
    <WFWindowChrome title="TermFlow — api-01 · reconnecting" platform="mac" w={w} h={h}>
      <div style={{ height:'100%', background:'#1A1917', color:'#E8E4DA', position:'relative', padding:40 }}>
        {/* terminal frozen */}
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, opacity:0.35, marginBottom:40 }}>
          <div>$ tail -f /var/log/app.log</div>
          <div>[14:22:01] INFO  request id=a8b2 method=POST</div>
          <div>[14:22:02] INFO  user_id=3821 authenticated</div>
          <div>[14:22:03] WARN  rate limit hit</div>
          <div style={{ opacity:0.4 }}>— connection lost at 14:22:04 —</div>
        </div>
        {/* centered state */}
        <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)',
                      background:'rgba(255,255,255,0.08)', backdropFilter:'blur(12px)',
                      border:'1.5px solid rgba(255,255,255,0.18)', borderRadius:14, padding:'28px 36px',
                      textAlign:'center', minWidth:380 }}>
          <div style={{ width:60, height:60, border:`3px solid ${envStg}`, borderTopColor:'transparent', borderRadius:'50%',
                        margin:'0 auto 14px' }}/>
          <WFHand size={24} weight={700} color="#E8E4DA" style={{display:'block'}}>Reconnecting to api-01</WFHand>
          <WFHand size={15} color="#9A968A" font="kalam" style={{display:'block', marginTop:4}}>attempt 3 of 10 · next in 4s</WFHand>
          <div style={{ marginTop:14, display:'flex', gap:6, justifyContent:'center' }}>
            {[true,true,true,false,false,false,false,false,false,false].map((d,i) => (
              <span key={i} style={{ width:12, height:6, borderRadius:3, background: d ? envStg : 'rgba(255,255,255,0.2)' }}/>
            ))}
          </div>
          <WFHand size={13} color="#9A968A" font="kalam" style={{display:'block', marginTop:14}}>your session, SFTP transfer, and working dir will be restored</WFHand>
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16 }}>
            <span style={{ padding:'5px 14px', border:'1px solid #9A968A', borderRadius:16, color:'#E8E4DA', fontFamily:"'Caveat',cursive", fontSize:15 }}>retry now</span>
            <span style={{ padding:'5px 14px', border:'1px solid #9A968A', borderRadius:16, color:'#E8E4DA', fontFamily:"'Caveat',cursive", fontSize:15 }}>switch to cached session</span>
          </div>
        </div>
      </div>
      <WFAnnotation x={60} y={80} dir="right" color="oklch(0.7 0.15 75)">session frozen · not lost</WFAnnotation>
    </WFWindowChrome>
  );
}

Object.assign(window, {
  SFTPv1, SFTPv2, SFTPv3,
  MonitorV1, MonitorV2, MonitorV3,
  ConnDialogV1, ConnDialogV2, ConnDialogV3,
  QuickCmdV1, QuickCmdV2, QuickCmdV3,
  EmptyV1, EmptyV2, EmptyV3,
});
