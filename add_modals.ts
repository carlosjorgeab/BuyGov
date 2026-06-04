import fs from 'fs';

let content = fs.readFileSync('app/page.tsx', 'utf-8');

const modalsCode = `
          {/* CRUD Modals Wrapper */}
          {Object.values([isAddingCompany, isAddingUser, isAddingCert, isAddingBid]).some(Boolean) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-auto">
              {/* Company Modal */}
              {isAddingCompany && (
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md m-auto animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Nova Empresa / Filial</h3>
                    <button onClick={() => setIsAddingCompany(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Razão Social</label>
                      <input type="text" value={newCompanyName} onChange={e=>setNewCompanyName(e.target.value)} className="w-full border p-2 rounded focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Chave / Apelido Único</label>
                      <input type="text" value={newCompanyKey} onChange={e=>setNewCompanyKey(e.target.value)} className="w-full border p-2 rounded focus:outline-none uppercase" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">CNPJ</label>
                      <input type="text" value={newCompanyCnpj} onChange={e=>setNewCompanyCnpj(e.target.value)} className="w-full border p-2 rounded focus:outline-none font-mono" />
                    </div>
                    <button onClick={handleAddCompany} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded mt-2">Salvar Empresa</button>
                  </div>
                </div>
              )}

              {/* User Modal */}
              {isAddingUser && (
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md m-auto animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Novo Usuário</h3>
                    <button onClick={() => setIsAddingUser(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Nome Completo</label>
                      <input type="text" value={newUserName} onChange={e=>setNewUserName(e.target.value)} className="w-full border p-2 rounded focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">E-mail (Login)</label>
                      <input type="email" value={newUserEmail} onChange={e=>setNewUserEmail(e.target.value)} className="w-full border p-2 rounded focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Senha Inicial</label>
                      <input type="text" value={newUserPassword} onChange={e=>setNewUserPassword(e.target.value)} className="w-full border p-2 rounded focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Perfil de Acesso</label>
                        <select value={newUserProfileId} onChange={e=>setNewUserProfileId(e.target.value)} className="w-full border p-2 rounded focus:outline-none text-sm">
                          {perfis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Empresa</label>
                         <select value={newUserCompanyKey} onChange={e=>setNewUserCompanyKey(e.target.value)} className="w-full border p-2 rounded focus:outline-none text-sm">
                           <option value="ALL">Todas (Matriz)</option>
                           {empresas.map(e => <option key={e.chave_empresa} value={e.chave_empresa}>{e.nome}</option>)}
                         </select>
                      </div>
                    </div>
                    <button onClick={handleAddUser} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded mt-2">Salvar Usuário</button>
                  </div>
                </div>
              )}

              {/* Certificado Modal */}
              {isAddingCert && (
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl m-auto animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Novo Atestado Técnico</h3>
                    <button onClick={() => setIsAddingCert(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nome/Ref. do Atestado</label>
                        <input type="text" value={newCertName} onChange={e=>setNewCertName(e.target.value)} className="w-full border p-2 rounded focus:outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Órgão/Cliente Emissor</label>
                        <input type="text" value={newCertEmissor} onChange={e=>setNewCertEmissor(e.target.value)} className="w-full border p-2 rounded focus:outline-none text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Data Emissão</label>
                      <input type="date" value={newCertData} onChange={e=>setNewCertData(e.target.value)} className="w-full border p-2 rounded text-sm focus:outline-none font-mono max-w-[200px]" />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Observações</label>
                       <textarea value={newCertObs} onChange={e=>setNewCertObs(e.target.value)} className="w-full border p-2 rounded text-sm focus:outline-none h-16"></textarea>
                    </div>
                    <div className="border border-slate-100 rounded p-3 bg-slate-50">
                       <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Itens Técnicos Averbados</h4>
                       {newCertItems.map((it, idx) => (
                         <div key={idx} className="flex gap-2 items-center mb-2">
                           <input type="text" placeholder="Descrição Técnica" value={it.descricao} onChange={(e) => { const cp = [...newCertItems]; cp[idx].descricao = e.target.value; setNewCertItems(cp); }} className="flex-1 border p-1.5 rounded text-sm min-w-[200px]" />
                           <input type="number" step="0.01" placeholder="Qtd" value={it.quantidade} onChange={(e) => { const cp = [...newCertItems]; cp[idx].quantidade = Number(e.target.value); setNewCertItems(cp); }} className="w-20 border p-1.5 rounded text-sm" />
                           <input type="text" placeholder="Un" value={it.unidade} onChange={(e) => { const cp = [...newCertItems]; cp[idx].unidade = e.target.value; setNewCertItems(cp); }} className="w-16 border p-1.5 rounded text-sm" />
                           <select value={it.relevancia_tecnica} onChange={(e) => { const cp = [...newCertItems]; cp[idx].relevancia_tecnica = e.target.value; setNewCertItems(cp); }} className="w-24 border p-1.5 rounded text-sm text-slate-600">
                             <option value="Alta">Alta</option>
                             <option value="Média">Média</option>
                             <option value="Baixa">Baixa</option>
                           </select>
                           <button onClick={() => { const cp = [...newCertItems]; cp.splice(idx, 1); setNewCertItems(cp); }} className="text-red-500 p-1"><Trash className="w-4 h-4"/></button>
                         </div>
                       ))}
                       <button onClick={() => setNewCertItems([...newCertItems, { descricao: '', quantidade: 1, unidade: 'un', relevancia_tecnica: 'Média' }])} className="text-xs font-bold text-emerald-600 mt-2">+ Adicionar Linha</button>
                    </div>
                    <button onClick={handleSaveCertificate} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded mt-2">Salvar Atestado Completo</button>
                  </div>
                </div>
              )}

              {/* Bid Modal */}
              {isAddingBid && (
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl m-auto animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Novo Certame (Edital Ativo)</h3>
                    <button onClick={() => setIsAddingBid(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Órgão Licitante</label>
                        <input type="text" value={newBidOrgao} onChange={e=>setNewBidOrgao(e.target.value)} className="w-full border p-2 rounded focus:outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Modalidade</label>
                        <input type="text" value={newBidModalidade} onChange={e=>setNewBidModalidade(e.target.value)} className="w-full border p-2 rounded focus:outline-none text-sm" />
                      </div>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Objeto do Edital</label>
                       <textarea value={newBidObjeto} onChange={e=>setNewBidObjeto(e.target.value)} className="w-full border p-2 rounded text-sm focus:outline-none h-16"></textarea>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Valor Estimado (R$)</label>
                        <input type="number" step="1000" value={newBidValor} onChange={e=>setNewBidValor(Number(e.target.value))} className="w-full border p-2 rounded focus:outline-none text-sm font-mono" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Prazo Proposta</label>
                         <input type="date" value={newBidPrazoProp?.split('T')[0] || ''} onChange={e=>setNewBidPrazoProp(e.target.value)} className="w-full border p-2 rounded text-sm focus:outline-none font-mono" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Sessão</label>
                         <input type="date" value={newBidPrazoAber?.split('T')[0] || ''} onChange={e=>setNewBidPrazoAber(e.target.value)} className="w-full border p-2 rounded text-sm focus:outline-none font-mono" />
                      </div>
                    </div>
                    <button onClick={handleAddBid} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded mt-4">Gravar Certame</button>
                  </div>
                </div>
              )}
            </div>
          )}
`;

const insertTarget = "          </AnimatePresence>";
content = content.replace(insertTarget, modalsCode + "\n" + insertTarget);

fs.writeFileSync('app/page.tsx', content, 'utf-8');
console.log('Modals Code Added.');
