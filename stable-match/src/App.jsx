import {useState} from "react";
import Papa from "papaparse";

const clean=s=>s.trim().toLowerCase();
function csvToPrefs(file){
  return new Promise((resolve)=>{
    Papa.parse(file,{complete:({data})=>{
      const rows=data.filter(r=>r && r.length);
      const prefs={};
      for(let i=1;i<rows.length;i++){
        const row=rows[i]; if(!row[0]) continue;
        const name=clean(String(row[0]));
        prefs[name]={};
        [1,2,3,4,5].forEach((c,idx)=>{
          const v=row[c]; if(v && String(v).trim()) prefs[name][clean(String(v))]=idx+1;
        });
      }
      resolve(prefs);
    }});
  });
}

export default function App(){
  const [littleFile,setLittle]=useState(null);
  const [bigFile,setBig]=useState(null);
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");

  async function onSubmit(e){
    e.preventDefault(); setErr(""); setResult(null);
    if(!littleFile||!bigFile){setErr("Please select both CSV files.");return;}
    setLoading(true);
    const rankL=await csvToPrefs(littleFile);
    const rankB=await csvToPrefs(bigFile);
    const res=await fetch("/api/solve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rankL,rankB})});
    const json=await res.json();
    if(!res.ok) setErr(json.error||"Error");
    else setResult(json);
    setLoading(false);
  }

  return (
    <main style={{fontFamily:"system-ui",maxWidth:720,margin:"40px auto",padding:"0 16px"}}>
      <h1>Stable Matching (Hospitals/Residents)</h1>
      <p>Upload <code>littleForm.csv</code> and <code>bigForm.csv</code> (first column name; next five = top choices).</p>
      <form onSubmit={onSubmit} style={{display:"grid",gap:12,marginTop:12}}>
        <input type="file" accept=".csv" onChange={e=>setLittle(e.target.files?.[0]||null)} />
        <input type="file" accept=".csv" onChange={e=>setBig(e.target.files?.[0]||null)} />
        <button disabled={loading}>{loading?"Solving…":"Solve"}</button>
      </form>
      {err && <p style={{color:"#c00"}}>{err}</p>}
      {result?.matching && (
        <div style={{marginTop:16}}>
          <h2>Matching (little-proposing GS; big cap ≤2)</h2>
          {Object.entries(result.matching).map(([b,ls])=>(
            <div key={b} style={{border:"1px solid #ddd",borderRadius:8,padding:8,margin:"8px 0"}}>
              <strong>{b}</strong><div style={{opacity:.8}}>{ls.join(", ")||"(none)"}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
