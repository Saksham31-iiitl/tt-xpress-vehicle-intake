import { useState, useCallback } from "react";

// ─── Constants (outside component, never recreated) ───────────────────────────
const INITIAL = {
  vehicleNumber: "", companyName: "", ownerName: "",
  contact: "", email: "", issue: "",
  jobType: "Quick Service",
  bodyCondition: "", paintCondition: "",
  batteryHealth: 75, tyrePressure: ""
};

const BODY_OPTIONS  = [{ value: "Good", icon: "✅", label: "Good" }, { value: "Minor Damage", icon: "🟡", label: "Minor Damage" }, { value: "Major Damage", icon: "🔴", label: "Major Damage" }];
const PAINT_OPTIONS = [{ value: "Good", icon: "🎨", label: "Good" }, { value: "Faded", icon: "🌫️", label: "Faded" }, { value: "Scratched/Chipped", icon: "⚡", label: "Scratched" }];

function genReportId() { return "SVC-" + Date.now().toString(36).toUpperCase(); }

function getHealthScore(data) {
  if (data.jobType !== "General Service") return null;
  let score = 100, flags = [];
  if (data.bodyCondition === "Minor Damage")       { score -= 15; flags.push({ text: "Minor exterior body damage detected", level: "warning" }); }
  if (data.bodyCondition === "Major Damage")       { score -= 35; flags.push({ text: "Major body damage — immediate inspection required", level: "critical" }); }
  if (data.paintCondition === "Faded")             { score -= 10; flags.push({ text: "Paint fading — consider repainting", level: "warning" }); }
  if (data.paintCondition === "Scratched/Chipped") { score -= 15; flags.push({ text: "Paint scratches/chips — touch-up recommended", level: "critical" }); }
  const bat = parseInt(data.batteryHealth);
  if (bat < 30)      { score -= 25; flags.push({ text: `Battery at ${bat}% — replacement advised`, level: "critical" }); }
  else if (bat < 60) { score -= 10; flags.push({ text: `Battery at ${bat}% — monitor closely`, level: "warning" }); }
  const psi = parseInt(data.tyrePressure);
  if (!isNaN(psi) && (psi < 28 || psi > 40)) { score -= 12; flags.push({ text: `Tyre pressure at ${psi} PSI — adjust to 30–36 PSI`, level: "warning" }); }
  score = Math.max(0, score);
  return { score, flags, status: score >= 75 ? "good" : score >= 50 ? "warning" : "critical" };
}

// ─── Static CSS (module level — never recreated on render) ────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:#0a0c10;color:#e2e8f0;font-family:'Inter',sans-serif;min-height:100vh}

  /* ── Dark mode (default) ── */
  .app-root{min-height:100vh;transition:background .3s,color .3s;background:radial-gradient(ellipse 80% 40% at 50% -10%,#f9731615 0%,transparent 70%),radial-gradient(ellipse 60% 30% at 80% 90%,#3b82f610 0%,transparent 60%),#0a0c10;color:#e2e8f0}
  .hdr{padding:28px 40px 20px;border-bottom:1px solid #1e2535;display:flex;align-items:center;gap:16px;background:#10141ccc;backdrop-filter:blur(12px);position:sticky;top:0;z-index:100;transition:background .3s,border-color .3s}
  .logo{width:44px;height:44px;background:linear-gradient(135deg,#f97316,#dc2626);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 0 20px #f9731622;flex-shrink:0}
  .hdr-txt h1{font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700;letter-spacing:1px;transition:color .3s}
  .hdr-txt p{font-size:11px;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin-top:2px;transition:color .3s}
  .badge{padding:5px 14px;border-radius:999px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;border:1px solid;background:#f9731622;color:#f97316;border-color:#7c3912;white-space:nowrap}
  .fc{max-width:760px;margin:48px auto;padding:0 24px 80px}
  .slbl{font-family:'Rajdhani',sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#64748b;margin-bottom:20px;display:flex;align-items:center;gap:12px;transition:color .3s}
  .slbl::after{content:'';flex:1;height:1px;background:#1e2535;transition:background .3s}
  .card{background:#151a24;border:1px solid #1e2535;border-radius:16px;padding:28px;margin-bottom:20px;position:relative;overflow:hidden;transition:border-color .3s,background .3s}
  .card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#f9731644,transparent)}
  .card:hover{border-color:#2a3345}
  .ctitle{font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:600;letter-spacing:1px;color:#94a3b8;margin-bottom:22px;transition:color .3s}
  .g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .g1{display:grid;gap:16px}
  .fld{display:flex;flex-direction:column;gap:7px}
  .fld label{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;font-weight:500;transition:color .3s}
  .req{color:#f97316;margin-left:2px}
  .inp,.tarea{background:#10141c;border:1px solid #1e2535;border-radius:10px;padding:12px 16px;color:#e2e8f0;font-family:'Inter',sans-serif;font-size:14px;transition:border-color .2s,box-shadow .2s,background .2s,color .2s;outline:none;width:100%}
  .inp:focus,.tarea:focus{border-color:#f9731688;box-shadow:0 0 0 3px #f9731622;background:#0d1118}
  .inp.er,.tarea.er{border-color:#ef444488;box-shadow:0 0 0 3px #ef444415}
  .inp::placeholder,.tarea::placeholder{color:#2e3a4e}
  .tarea{resize:vertical;min-height:90px;line-height:1.6}
  .emsg{font-size:11px;color:#ef4444;margin-top:3px;animation:sli .2s ease}
  @keyframes sli{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  .rg{display:flex;gap:10px;flex-wrap:wrap}
  .ro{flex:1;min-width:90px}
  .ro input{display:none}
  .rl{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 10px;border-radius:10px;border:1px solid #1e2535;cursor:pointer;font-size:12px;font-weight:500;color:#64748b;background:#10141c;transition:all .2s;gap:6px;text-align:center}
  .rl:hover{border-color:#f9731655;color:#e2e8f0}
  .ro input:checked+.rl{border-color:#f97316;background:#f9731622;color:#f97316;box-shadow:0 0 12px #f9731622}
  .jtabs{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px}
  .jtab{padding:16px;border-radius:12px;border:1px solid #1e2535;background:#10141c;cursor:pointer;transition:all .25s;text-align:center}
  .jtab:hover{border-color:#2a3345}
  .jtab.tq{border-color:#3b82f6;background:#3b82f622;box-shadow:0 0 20px #3b82f622}
  .jtab.tg{border-color:#f97316;background:#f9731622;box-shadow:0 0 20px #f9731622}
  .ti{font-size:24px;margin-bottom:6px}
  .tt{font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:600;letter-spacing:.5px;transition:color .3s}
  .td{font-size:11px;color:#64748b;margin-top:3px;transition:color .3s}
  .jtab.tq .tt{color:#3b82f6}.jtab.tg .tt{color:#f97316}
  .csec{animation:expin .35s cubic-bezier(.34,1.56,.64,1)}
  @keyframes expin{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
  .bwrap{display:flex;align-items:center;gap:14px}
  .bval{font-family:'Rajdhani',sans-serif;font-size:24px;font-weight:700;min-width:56px;text-align:right}
  input[type=range]{-webkit-appearance:none;flex:1;height:6px;border-radius:999px;background:#1e2535;outline:none;cursor:pointer;transition:background .3s}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#f97316;box-shadow:0 0 10px #f9731688;cursor:pointer;transition:transform .15s}
  input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.2)}
  .hbg{height:8px;border-radius:4px;margin-top:8px;background:#1e2535;overflow:hidden;transition:background .3s}
  .hfill{height:100%;border-radius:4px;transition:width .3s,background .3s}
  .srow{margin-top:32px;display:flex;justify-content:flex-end;gap:14px;align-items:center}
  .breset{padding:14px 28px;border-radius:10px;border:1px solid #1e2535;background:transparent;color:#64748b;font-size:14px;font-family:'Inter',sans-serif;cursor:pointer;transition:all .2s}
  .breset:hover{border-color:#64748b;color:#e2e8f0}
  .bsubmit{padding:14px 40px;border-radius:10px;border:none;background:linear-gradient(135deg,#f97316,#dc2626);color:#fff;font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;transition:all .25s;box-shadow:0 4px 20px #f9731644;position:relative;overflow:hidden}
  .bsubmit::after{content:'';position:absolute;top:0;left:-100%;right:0;bottom:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);transition:left .4s}
  .bsubmit:hover::after{left:100%}
  .bsubmit:hover{transform:translateY(-2px);box-shadow:0 8px 30px #f9731666}
  .bsubmit:active{transform:translateY(0)}

  /* ── Report styles ── */
  .rpage{max-width:800px;margin:0 auto;padding:40px 24px 80px;animation:fup .5s ease}
  @keyframes fup{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  .rhero{text-align:center;padding:40px 24px;background:#151a24;border:1px solid #1e2535;border-radius:20px;margin-bottom:28px;position:relative;overflow:hidden;transition:background .3s,border-color .3s}
  .rhero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 0%,#f9731622,transparent)}
  .rsi{font-size:56px;margin-bottom:14px;display:block;animation:ipop .6s cubic-bezier(.34,1.56,.64,1) .2s both}
  @keyframes ipop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
  .rtitle{font-family:'Rajdhani',sans-serif;font-size:32px;font-weight:700;letter-spacing:1px;transition:color .3s}
  .rsub{color:#64748b;font-size:14px;margin-top:6px}
  .rid{display:inline-block;margin-top:16px;padding:6px 18px;border-radius:999px;border:1px solid #1e2535;font-family:'Rajdhani',sans-serif;font-size:13px;letter-spacing:2px;color:#64748b;transition:border-color .3s,color .3s}
  .sban{border-radius:16px;padding:24px 28px;margin-bottom:24px;border:1px solid;display:flex;align-items:center;gap:20px}
  .sban.good{background:#22c55e22;border-color:#22c55e55}
  .sban.warning{background:#f9731622;border-color:#f9731655}
  .sban.critical{background:#ef444411;border-color:#ef444455}
  .sban.info{background:#3b82f622;border-color:#3b82f655}
  .sil{font-size:36px;flex-shrink:0}
  .stxt h3{font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:700;letter-spacing:.5px}
  .stxt p{font-size:13px;color:#94a3b8;margin-top:4px;transition:color .3s}
  .sbdg{margin-left:auto;padding:8px 20px;border-radius:999px;font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border:1px solid;flex-shrink:0}
  .bgd{background:#22c55e22;color:#22c55e;border-color:#22c55e55}
  .bwr{background:#f9731622;color:#f97316;border-color:#7c3912}
  .bcr{background:#ef444411;color:#ef4444;border-color:#ef444455}
  .bin{background:#3b82f622;color:#3b82f6;border-color:#3b82f655}
  .rgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
  .rcard{background:#151a24;border:1px solid #1e2535;border-radius:14px;padding:20px;transition:background .3s,border-color .3s}
  .rctit{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#64748b;margin-bottom:14px;transition:color .3s}
  .rfld{display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid #1e2535;gap:12px;transition:border-color .3s}
  .rfld:last-child{border-bottom:none}
  .rfk{font-size:12px;color:#64748b;flex-shrink:0;transition:color .3s}
  .rfv{font-size:13px;color:#e2e8f0;font-weight:500;text-align:right;word-break:break-all;transition:color .3s}
  .hm{margin-bottom:16px}
  .hmh{display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px}
  .swrap{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px}
  .sring{position:relative;width:100px;height:100px}
  .sring svg{transform:rotate(-90deg)}
  .snbox{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .snum{font-family:'Rajdhani',sans-serif;font-size:28px;font-weight:700;line-height:1}
  .slb{font-size:10px;color:#64748b;letter-spacing:1px}
  .sgr{font-family:'Rajdhani',sans-serif;font-size:14px;letter-spacing:1px}
  .recs{background:#151a24;border:1px solid #1e2535;border-radius:14px;padding:20px;margin-bottom:20px;transition:background .3s,border-color .3s}
  .ri{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #1e2535;font-size:13px;transition:border-color .3s}
  .ri:last-child{border-bottom:none}
  .rdot{width:8px;height:8px;border-radius:50%;margin-top:4px;flex-shrink:0}
  .bback{padding:14px 32px;border-radius:10px;border:1px solid #1e2535;background:transparent;color:#e2e8f0;font-size:14px;font-family:'Inter',sans-serif;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:8px}
  .bback:hover{border-color:#f9731655;background:#f9731622;color:#f97316}

  /* ── Toggle button ── */
  .theme-toggle{display:flex;align-items:center;gap:8px;cursor:pointer;background:none;border:1px solid #1e2535;border-radius:999px;padding:6px 14px 6px 10px;color:#94a3b8;font-family:'Inter',sans-serif;font-size:12px;font-weight:500;transition:all .2s;white-space:nowrap;flex-shrink:0}
  .theme-toggle:hover{border-color:#f9731655;color:#f97316}
  .tog-track{width:36px;height:20px;border-radius:999px;background:#1e2535;position:relative;transition:background .25s;flex-shrink:0}
  .tog-track.on{background:#f97316}
  .tog-thumb{position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .25s;box-shadow:0 1px 4px rgba(0,0,0,.3)}
  .tog-thumb.on{transform:translateX(16px)}

  /* ── Light mode overrides ── */
  .light{background:#f1f5f9;color:#0f172a}
  .light .app-root{background:radial-gradient(ellipse 80% 40% at 50% -10%,#f9731612 0%,transparent 70%),radial-gradient(ellipse 60% 30% at 80% 90%,#3b82f608 0%,transparent 60%),#f1f5f9;color:#0f172a}
  .light .hdr{background:#ffffffcc;border-color:#e2e8f0}
  .light .hdr-txt h1{color:#0f172a}
  .light .hdr-txt p{color:#94a3b8}
  .light .badge{background:#fff7ed;color:#f97316;border-color:#fdba74}
  .light .slbl{color:#94a3b8}
  .light .slbl::after{background:#e2e8f0}
  .light .card{background:#ffffff;border-color:#e2e8f0}
  .light .card:hover{border-color:#cbd5e1}
  .light .card::before{background:linear-gradient(90deg,transparent,#f9731630,transparent)}
  .light .ctitle{color:#475569}
  .light .fld label{color:#64748b}
  .light .inp,.light .tarea{background:#f8fafc;border-color:#e2e8f0;color:#0f172a}
  .light .inp:focus,.light .tarea:focus{border-color:#f9731688;box-shadow:0 0 0 3px #f9731618;background:#fff}
  .light .inp.er,.light .tarea.er{border-color:#ef444488;box-shadow:0 0 0 3px #ef444412}
  .light .inp::placeholder,.light .tarea::placeholder{color:#cbd5e1}
  .light .jtab{background:#f8fafc;border-color:#e2e8f0}
  .light .jtab:hover{border-color:#cbd5e1}
  .light .jtab.tq{background:#eff6ff;border-color:#93c5fd;box-shadow:0 0 20px #3b82f615}
  .light .jtab.tg{background:#fff7ed;border-color:#fdba74;box-shadow:0 0 20px #f9731615}
  .light .td{color:#94a3b8}
  .light .rl{background:#f8fafc;border-color:#e2e8f0;color:#64748b}
  .light .rl:hover{border-color:#f9731655;color:#0f172a}
  .light .ro input:checked+.rl{border-color:#f97316;background:#fff7ed;color:#f97316;box-shadow:0 0 12px #f9731618}
  .light .breset{border-color:#e2e8f0;color:#64748b}
  .light .breset:hover{border-color:#94a3b8;color:#0f172a}
  .light .hbg{background:#e2e8f0}
  .light input[type=range]{background:#e2e8f0}
  .light .rhero{background:#fff;border-color:#e2e8f0}
  .light .rhero::before{background:radial-gradient(ellipse 60% 50% at 50% 0%,#f9731615,transparent)}
  .light .rtitle{color:#0f172a}
  .light .rsub{color:#94a3b8}
  .light .rid{border-color:#e2e8f0;color:#94a3b8}
  .light .rcard{background:#fff;border-color:#e2e8f0}
  .light .rctit{color:#94a3b8}
  .light .rfld{border-color:#f1f5f9}
  .light .rfk{color:#94a3b8}
  .light .rfv{color:#0f172a}
  .light .stxt p{color:#64748b}
  .light .recs{background:#fff;border-color:#e2e8f0}
  .light .ri{border-color:#f1f5f9;color:#475569}
  .light .bback{border-color:#e2e8f0;color:#0f172a}
  .light .bback:hover{border-color:#f9731655;background:#fff7ed;color:#f97316}
  .light .theme-toggle{border-color:#e2e8f0;color:#64748b}
  .light .theme-toggle:hover{border-color:#f9731655;color:#f97316}
  .light .tog-track{background:#e2e8f0}
  .light .tog-track.on{background:#f97316}
  .light .sban.good{background:#f0fdf4;border-color:#86efac}
  .light .sban.warning{background:#fff7ed;border-color:#fdba74}
  .light .sban.critical{background:#fef2f2;border-color:#fca5a5}
  .light .sban.info{background:#eff6ff;border-color:#93c5fd}

  @media(max-width:600px){
    .g2,.rgrid,.jtabs{grid-template-columns:1fr}
    .hdr{padding:20px}
    .fc,.rpage{padding:0 16px 60px}
    .srow{flex-direction:column-reverse}
    .bsubmit,.breset{width:100%}
    .sbdg{display:none}
    .hdr-txt h1{font-size:18px}
  }
`;

// ─── Sub-components (outside App — stable references, no remount on rerender) ─

function ScoreRing({ score, color }) {
  const r = 40, circ = 2 * Math.PI * r;
  return (
    <div className="sring">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1e2535" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="snbox">
        <span className="snum" style={{ color }}>{score}</span>
        <span className="slb">SCORE</span>
      </div>
    </div>
  );
}

function Field({ label, required, error, touched, children }) {
  return (
    <div className="fld">
      <label>{label}{required && <span className="req">*</span>}</label>
      {children}
      {touched && error && <div className="emsg">⚠ {error}</div>}
    </div>
  );
}

function ReportPage({ data, reportId, onBack }) {
  const health = getHealthScore(data);
  const isGeneral = data.jobType === "General Service";
  const batColor = data.batteryHealth >= 60 ? "#22c55e" : data.batteryHealth >= 30 ? "#f97316" : "#ef4444";
  const stMap = {
    good:     { icon: "✅", label: "OPTIMAL",         cls: "good",     bdg: "bgd", title: "Vehicle in Good Condition",  desc: "All parameters within acceptable range.", color: "#22c55e" },
    warning:  { icon: "⚠️", label: "NEEDS ATTENTION", cls: "warning",  bdg: "bwr", title: "Some Issues Detected",       desc: "Minor issues found. Schedule maintenance soon.", color: "#f97316" },
    critical: { icon: "🚨", label: "CRITICAL",        cls: "critical", bdg: "bcr", title: "Immediate Action Required",  desc: "Significant problems detected. Do not delay.", color: "#ef4444" },
  };
  const st = health ? stMap[health.status] : null;

  return (
    <div className="rpage">
      <div className="rhero">
        <span className="rsi">🚛</span>
        <div className="rtitle">Service Intake Report</div>
        <div className="rsub">Generated · {new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
        <div className="rid">{reportId}</div>
      </div>

      {health ? (
        <div className={`sban ${st.cls}`}>
          <span className="sil">{st.icon}</span>
          <div className="stxt">
            <h3 style={{ color: st.color }}>{st.title}</h3>
            <p>{st.desc}</p>
          </div>
          <div className={`sbdg ${st.bdg}`}>{st.label}</div>
        </div>
      ) : (
        <div className="sban info">
          <span className="sil">⚡</span>
          <div className="stxt">
            <h3 style={{ color: "#3b82f6" }}>Quick Service Scheduled</h3>
            <p>Vehicle queued for quick service. No detailed inspection required.</p>
          </div>
          <div className="sbdg bin">QUEUED</div>
        </div>
      )}

      <div className="rgrid">
        <div className="rcard">
          <div className="rctit">🚗 Vehicle Details</div>
          {[["Vehicle No.", data.vehicleNumber], ["Company", data.companyName], ["Job Type", data.jobType]].map(([k, v]) => (
            <div className="rfld" key={k}><span className="rfk">{k}</span><span className="rfv">{v || "—"}</span></div>
          ))}
        </div>
        <div className="rcard">
          <div className="rctit">👤 Fleet Owner</div>
          {[["Name", data.ownerName], ["Contact", data.contact], ["Email", data.email]].map(([k, v]) => (
            <div className="rfld" key={k}><span className="rfk">{k}</span><span className="rfv">{v || "—"}</span></div>
          ))}
        </div>
      </div>

      {data.issue && (
        <div className="rcard" style={{ marginBottom: 20 }}>
          <div className="rctit">📋 Issue Description</div>
          <p style={{ fontSize: 14, lineHeight: 1.7, marginTop: 4 }}>{data.issue}</p>
        </div>
      )}

      {isGeneral && health && (
        <div className="rgrid">
          <div className="rcard">
            <div className="rctit">📊 Health Metrics</div>
            <div className="hm">
              <div className="hmh">
                <span style={{ color: "#64748b" }}>Battery Health</span>
                <span style={{ fontWeight: 600, color: batColor }}>{data.batteryHealth}%</span>
              </div>
              <div className="hbg"><div className="hfill" style={{ width: `${data.batteryHealth}%`, background: batColor }} /></div>
            </div>
            {[["Exterior Body", data.bodyCondition, { "Good": "#22c55e", "Minor Damage": "#f97316", "Major Damage": "#ef4444" }],
              ["Paint Condition", data.paintCondition, { "Good": "#22c55e", "Faded": "#f97316", "Scratched/Chipped": "#ef4444" }]
            ].map(([lbl, val, cm]) => (
              <div className="rfld" key={lbl}><span className="rfk">{lbl}</span><span className="rfv" style={{ color: cm[val] || "#64748b" }}>{val || "—"}</span></div>
            ))}
            <div className="rfld"><span className="rfk">Tyre Pressure</span><span className="rfv">{data.tyrePressure || "—"}</span></div>
          </div>
          <div className="rcard">
            <div className="rctit">🏆 Overall Score</div>
            <div className="swrap">
              <ScoreRing score={health.score} color={st.color} />
              <div className="sgr" style={{ color: st.color }}>{health.status === "good" ? "EXCELLENT" : health.status === "warning" ? "FAIR" : "POOR"}</div>
              <p style={{ fontSize: 11, color: "#64748b", textAlign: "center", lineHeight: 1.6, marginTop: 4 }}>Based on all checked<br />vehicle parameters</p>
            </div>
          </div>
        </div>
      )}

      {health && (
        <div className="recs">
          <div className="rctit" style={{ marginBottom: 14 }}>🔧 Recommendations</div>
          {health.flags.length === 0
            ? <div className="ri"><div className="rdot" style={{ background: "#22c55e" }} /><span style={{ color: "#94a3b8" }}>All parameters within acceptable range — no immediate action required.</span></div>
            : health.flags.map((f, i) => (
              <div className="ri" key={i}>
                <div className="rdot" style={{ background: f.level === "critical" ? "#ef4444" : "#f97316" }} />
                <span style={{ color: "#94a3b8" }}>{f.text}</span>
              </div>
            ))
          }
        </div>
      )}

      <button className="bback" onClick={onBack}>← New Intake</button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]           = useState("form");
  const [submitted, setSubmitted] = useState(null);
  const [reportId]                = useState(genReportId);
  const [form, setForm]           = useState(INITIAL);
  const [errors, setErrors]       = useState({});
  const [touched, setTouched]     = useState({});
  const [dark, setDark]           = useState(true);   // ← theme state

  const handleChange = useCallback((name, value) => {
    setForm(f => ({ ...f, [name]: value }));
    setTouched(t => ({ ...t, [name]: true }));
    setErrors(e => ({ ...e, [name]: "" }));
  }, []);

  const handleBlur = useCallback((name) => {
    setTouched(t => ({ ...t, [name]: true }));
  }, []);

  const validate = (data) => {
    const e = {};
    if (!data.vehicleNumber.trim()) e.vehicleNumber = "Vehicle number is required";
    if (!data.companyName.trim())   e.companyName   = "Company name is required";
    if (!data.ownerName.trim())     e.ownerName     = "Fleet owner name is required";
    if (!data.contact.trim())       e.contact       = "Contact is required";
    else if (!/^[\d\s+\-]{7,15}$/.test(data.contact)) e.contact = "Enter a valid phone number";
    if (!data.email.trim())         e.email         = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Enter a valid email";
    if (!data.issue.trim())         e.issue         = "Please describe the issue";
    if (data.jobType === "General Service") {
      if (!data.bodyCondition)       e.bodyCondition  = "Select body condition";
      if (!data.paintCondition)      e.paintCondition = "Select paint condition";
      if (!data.tyrePressure.trim()) e.tyrePressure   = "Enter tyre pressure";
    }
    return e;
  };

  const handleSubmit = () => {
    const allTouched = Object.fromEntries(Object.keys(INITIAL).map(k => [k, true]));
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    console.log("Form Submitted:", JSON.stringify(form, null, 2));
    setSubmitted({ ...form });
    setPage("report");
  };

  const handleReset = () => { setForm(INITIAL); setErrors({}); setTouched({}); };

  const batColor = form.batteryHealth >= 60 ? "#22c55e" : form.batteryHealth >= 30 ? "#f97316" : "#ef4444";

  const inp = (name, placeholder, type = "text") => (
    <input
      className={`inp${touched[name] && errors[name] ? " er" : ""}`}
      type={type}
      value={form[name]}
      placeholder={placeholder}
      onChange={e => handleChange(name, e.target.value)}
      onBlur={() => handleBlur(name)}
    />
  );

  return (
    <>
      <style>{CSS}</style>
      <div className={dark ? "app-root" : "app-root light"}>
        <header className="hdr">
          <div className="logo">🚛</div>
          <div className="hdr-txt">
            <h1>TT XPRESS</h1>
            <p>Fleet Service Management</p>
          </div>
          <div className="badge">{page === "form" ? "NEW INTAKE" : "REPORT"}</div>

          {/* ── Dark / Light Toggle ── */}
          <button className="theme-toggle" onClick={() => setDark(d => !d)}>
            <div className={`tog-track${dark ? " on" : ""}`}>
              <div className={`tog-thumb${dark ? " on" : ""}`} />
            </div>
            {dark ? "🌙 Dark" : "☀️ Light"}
          </button>
        </header>

        {page === "report" ? (
          <ReportPage data={submitted} reportId={reportId}
            onBack={() => { setPage("form"); setForm(INITIAL); setErrors({}); setTouched({}); }} />
        ) : (
          <div className="fc">

            <div className="slbl">01 &nbsp; Vehicle Information</div>
            <div className="card">
              <div className="ctitle">🚗 Basic Details</div>
              <div className="g2">
                <Field label="Vehicle Number" required error={errors.vehicleNumber} touched={touched.vehicleNumber}>
                  {inp("vehicleNumber", "e.g. MH04 AB 1234")}
                </Field>
                <Field label="Company Name" required error={errors.companyName} touched={touched.companyName}>
                  {inp("companyName", "e.g. TT Xpress Pvt. Ltd.")}
                </Field>
              </div>
            </div>

            <div className="slbl">02 &nbsp; Fleet Owner Details</div>
            <div className="card">
              <div className="ctitle">👤 Contact Information</div>
              <div className="g2">
                <Field label="Fleet Owner Name" required error={errors.ownerName} touched={touched.ownerName}>
                  {inp("ownerName", "Full name")}
                </Field>
                <Field label="Contact Number" required error={errors.contact} touched={touched.contact}>
                  {inp("contact", "+91 XXXXX XXXXX")}
                </Field>
              </div>
              <div style={{ marginTop: 16 }}>
                <Field label="Email Address" required error={errors.email} touched={touched.email}>
                  {inp("email", "fleet@company.com", "email")}
                </Field>
              </div>
            </div>

            <div className="slbl">03 &nbsp; Service Details</div>
            <div className="card">
              <div className="ctitle">🔧 Issue & Job Type</div>
              <div className="g1">
                <Field label="Issue Description" required error={errors.issue} touched={touched.issue}>
                  <textarea
                    className={`tarea${touched.issue && errors.issue ? " er" : ""}`}
                    value={form.issue}
                    placeholder="Describe the problem in detail..."
                    rows={3}
                    onChange={e => handleChange("issue", e.target.value)}
                    onBlur={() => handleBlur("issue")}
                  />
                </Field>
                <div className="fld">
                  <label>Job Type <span className="req">*</span></label>
                  <div className="jtabs">
                    {["Quick Service", "General Service"].map(type => (
                      <div key={type}
                        className={`jtab ${form.jobType === type ? (type === "Quick Service" ? "tq" : "tg") : ""}`}
                        onClick={() => handleChange("jobType", type)}>
                        <div className="ti">{type === "Quick Service" ? "⚡" : "🔩"}</div>
                        <div className="tt">{type}</div>
                        <div className="td">{type === "Quick Service" ? "Oil, filter, basic checks" : "Full inspection & service"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {form.jobType === "General Service" && (
              <div className="csec">
                <div className="slbl">04 &nbsp; General Service Inspection</div>
                <div className="card">
                  <div className="ctitle">🛡 Vehicle Condition Assessment</div>

                  <div className="fld" style={{ marginBottom: 20 }}>
                    <label>Exterior Body Condition <span className="req">*</span></label>
                    <div className="rg">
                      {BODY_OPTIONS.map(opt => (
                        <label key={opt.value} className="ro">
                          <input type="radio" name="bodyCondition" value={opt.value}
                            checked={form.bodyCondition === opt.value}
                            onChange={() => handleChange("bodyCondition", opt.value)} />
                          <div className="rl"><span style={{ fontSize: 18 }}>{opt.icon}</span>{opt.label}</div>
                        </label>
                      ))}
                    </div>
                    {touched.bodyCondition && errors.bodyCondition && <div className="emsg">⚠ {errors.bodyCondition}</div>}
                  </div>

                  <div className="fld" style={{ marginBottom: 20 }}>
                    <label>Paint Condition <span className="req">*</span></label>
                    <div className="rg">
                      {PAINT_OPTIONS.map(opt => (
                        <label key={opt.value} className="ro">
                          <input type="radio" name="paintCondition" value={opt.value}
                            checked={form.paintCondition === opt.value}
                            onChange={() => handleChange("paintCondition", opt.value)} />
                          <div className="rl"><span style={{ fontSize: 18 }}>{opt.icon}</span>{opt.label}</div>
                        </label>
                      ))}
                    </div>
                    {touched.paintCondition && errors.paintCondition && <div className="emsg">⚠ {errors.paintCondition}</div>}
                  </div>

                  <div className="g2">
                    <div className="fld">
                      <label>Battery Health</label>
                      <div className="bwrap">
                        <input type="range" min="0" max="100" value={form.batteryHealth}
                          onChange={e => handleChange("batteryHealth", parseInt(e.target.value))} />
                        <span className="bval" style={{ color: batColor }}>{form.batteryHealth}%</span>
                      </div>
                      <div className="hbg"><div className="hfill" style={{ width: `${form.batteryHealth}%`, background: batColor }} /></div>
                    </div>
                    <Field label="Tyre Pressure" required error={errors.tyrePressure} touched={touched.tyrePressure}>
                      {inp("tyrePressure", "e.g. 32 PSI")}
                    </Field>
                  </div>
                </div>
              </div>
            )}

            <div className="srow">
              <button className="breset" onClick={handleReset}>Reset Form</button>
              <button className="bsubmit" onClick={handleSubmit}>Generate Report →</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}