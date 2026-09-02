import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import styles from "./page.module.css";

type Row=Record<string,unknown>;
type Payload={signal_session?:string;formula_version?:string;ranking?:Row[]};
const payload=JSON.parse(fs.readFileSync(path.join(process.cwd(),"public/data/optio-stock-signal/latest.json"),"utf8")) as Payload;
const fmt=(v:unknown,d=4)=>v===null||v===undefined||v===""?"—":Number.isFinite(Number(v))?Number(v).toFixed(d):String(v);
const ret=(v:unknown)=>v===null||v===undefined||v===""?null:`${Number(v)>=0?"+":""}${(Math.abs(Number(v))<=1.5?Number(v)*100:Number(v)).toFixed(2)}%`;

export default function Page(){
 const ranking=Array.isArray(payload.ranking)?payload.ranking:[];
 const params=[
 ["Status","Research / Forward Validation — Not Production"],
 ["Formula","THREE_FACTOR_V1_FROZEN"],
 ["Forward Validation Start","2026-09-02"],
 ["Universe","35 stocks"],
 ["Ranking Buckets","Top 20% / Middle 60% / Bottom 20%"],
 ["Factor 1","Options Activity Composite: Call OI, Put OI, Call Volume"],
 ["Factor 2","Call Delta: lower is favorable"],
 ["Factor 3","Put IV Range: higher is favorable"],
 ["Factor Weighting","Equal weight across all three factors"],
 ["Entry","Next trading day open"],
 ["H1 Exit","First future trading day close"],
 ["H3 Exit","Third future trading day close"],
 ["H5 Exit","Fifth future trading day close"],
 ["Website Role","Read-only; no scoring, inference, modification, or re-fitting"]
 ];
 return <main className={styles.page}><div className={styles.shell}>
  <div className={styles.eyebrow}>Atra Optio Research</div><h1 className={styles.title}>Ata Optio Test 1</h1>
  <p className={styles.subtitle}>Prospective forward validation of the frozen three-factor stock-ranking research.</p>
  <div className={styles.warning}>Research / Forward Validation — Not Production</div>
  <div className={styles.nav}><Link className={styles.link} href="/optio">Atra Optio Live Monitor</Link><Link className={styles.link} href="/">Atra Vigil Home</Link></div>

  <section className={styles.section}><h2 className={styles.sectionTitle}>Test Parameters</h2><div className={styles.params}>{params.map(([a,b])=><div className={styles.param} key={a}><div className={styles.paramLabel}>{a}</div><div className={styles.paramValue}>{b}</div></div>)}</div></section>

  <div className={styles.cards}>
   <div className={styles.card}><div className={styles.label}>Latest Signal</div><div className={styles.value}>{payload.signal_session}</div></div>
   <div className={styles.card}><div className={styles.label}>Formula Version</div><div className={styles.value}>{payload.formula_version}</div></div>
   <div className={styles.card}><div className={styles.label}>Completed Sessions</div><div className={styles.value}>0</div></div>
   <div className={styles.card}><div className={styles.label}>H1 / H3 / H5</div><div className={styles.value}>PENDING</div></div>
  </div>

  <section className={styles.section}><h2 className={styles.sectionTitle}>Current Ranking</h2><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Rank</th><th>Ticker</th><th>Group</th><th>Score</th><th>Activity</th><th>Delta</th><th>Put IV Range</th><th>Bucket</th><th>H1</th><th>H3</th><th>H5</th></tr></thead><tbody>
  {ranking.map((r,i)=>{const b=String(r.bucket??(i<7?"TOP_20":i>=28?"BOTTOM_20":"MIDDLE_60"));return <tr key={String(r.ticker)} className={b==="TOP_20"?styles.top:b==="BOTTOM_20"?styles.bottom:""}><td>{fmt(r.rank,0)}</td><td><strong>{String(r.ticker)}</strong></td><td>{String(r.group??"—")}</td><td>{fmt(r.percentile_score)}</td><td>{fmt(r.options_activity_rank)}</td><td>{fmt(r.call_delta_favorable_rank)}</td><td>{fmt(r.put_iv_range_favorable_rank)}</td><td><span className={styles.pill}>{b}</span></td><td>{ret(r.return_h1)??<span className={styles.pill}>PENDING</span>}</td><td>{ret(r.return_h3)??<span className={styles.pill}>PENDING</span>}</td><td>{ret(r.return_h5)??<span className={styles.pill}>PENDING</span>}</td></tr>})}
  </tbody></table></div></section>

  <section className={styles.section}><h2 className={styles.sectionTitle}>In-Sample Research Context</h2><div className={styles.contextGrid}>
   <div className={styles.context}><strong>H1</strong><div className={styles.stat}><span>Top-20 mean</span><b>+0.06%</b></div><div className={styles.stat}><span>Bottom-20 mean</span><b>-1.18%</b></div><div className={styles.stat}><span>Spread</span><b>+1.25 pp</b></div><div className={styles.stat}><span>Session win rate</span><b>59.1%</b></div></div>
   <div className={styles.context}><strong>H3</strong><div className={styles.stat}><span>Top-20 mean</span><b>+1.08%</b></div><div className={styles.stat}><span>Bottom-20 mean</span><b>-1.69%</b></div><div className={styles.stat}><span>Spread</span><b>+2.78 pp</b></div><div className={styles.stat}><span>Session win rate</span><b>80.0%</b></div></div>
   <div className={styles.context}><strong>H5</strong><div className={styles.stat}><span>Top-20 mean</span><b>+2.47%</b></div><div className={styles.stat}><span>Bottom-20 mean</span><b>-2.87%</b></div><div className={styles.stat}><span>Spread</span><b>+5.34 pp</b></div><div className={styles.stat}><span>Session win rate</span><b>83.3%</b></div></div>
  </div><p className={styles.note}>These figures are in-sample research results, not forward-validated performance.</p></section>
 </div></main>
}
