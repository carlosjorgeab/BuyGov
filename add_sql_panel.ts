import fs from 'fs';

let content = fs.readFileSync('app/page.tsx', 'utf-8');

const stateCode = `  const [migrationSql, setMigrationSql] = useState('');
  useEffect(() => {
     fetch('/api/migration').then(r=>r.json()).then(d=>setMigrationSql(d.sql || '')).catch(console.error);
  }, []);
`;

const stateTarget = "  const [stateLoaded, setStateLoaded] = useState(false);";
content = content.replace(stateTarget, stateTarget + "\n" + stateCode);

const sqlPanelCode = `
                 <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-2 mt-6 flex items-center gap-2"><Database className="w-4 h-4 text-indigo-600" /> Histórico de Migrations SQL do Banco</h3>
                    <div className="bg-slate-900 rounded border border-slate-700 p-4 overflow-x-auto" style={{ maxHeight: '300px' }}>
                       <pre className="text-[10px] sm:text-xs font-mono text-emerald-400">
                          {migrationSql || "Carregando SQL do banco de dados..."}
                       </pre>
                    </div>
                 </div>`;

const panelTarget = `                       <input type="password" placeholder="Chave Anônima" value={supabaseKey} onChange={e=>setSupabaseKey(e.target.value)} className="w-full p-2 border rounded text-sm focus:outline-none" style={{ borderColor: panelBorderColor }} />
                    </div>
                 </div>`;

content = content.replace(panelTarget, panelTarget + sqlPanelCode);

fs.writeFileSync('app/page.tsx', content, 'utf-8');
console.log('SQL Migration Panel Added.');
