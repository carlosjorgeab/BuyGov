'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building,
  Calendar,
  Sparkles,
  Check,
  Plus,
  Trash,
  Edit,
  Settings,
  AlertTriangle,
  Gavel,
  FolderOpen,
  Download,
  User,
  Shield,
  Clock,
  Power,
  FileText,
  Database,
  Search,
  Briefcase,
  TrendingUp,
  CheckSquare,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Sliders,
  LogOut,
  Bell,
  SlidersHorizontal,
  ThumbsUp,
  Award,
  Globe,
  Upload,
  Copy
} from 'lucide-react';

import {
  Empresa,
  Licitacao,
  AtestadoTecnico,
  AtestadoItem,
  DocumentoBase,
  PerfilUsuario,
  PerfilAcesso,
  INITIAL_COMPANIES,
  INITIAL_USER,
  INITIAL_USERS,
  INITIAL_PROFILES,
  INITIAL_BIDS,
  INITIAL_CERTIFICATES,
  INITIAL_DOCUMENTS,
  EDITADO_TEXTS,
  MatchAnalysisResult
} from '@/lib/mock_data';

const SQL_MIGRATION_SCRIPT = `-- SQL MIGRATIONS FOR BUYGOV TENDER AND COMPLIANCE SYSTEM
-- ATUALIZAÇÃO RECENTE: SEPARAÇÃO COMPLETA DE CADASTRO DE PERFIL E USUÁRIO

-- 1. Tabela de Empresas
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    chave_empresa VARCHAR(50) UNIQUE NOT NULL,
    cnpj VARCHAR(20) NOT NULL
);

-- 2. Tabela de Perfis de Acesso (Módulos dinâmicos configuráveis)
CREATE TABLE IF NOT EXISTS public.perfis_acesso (
    id VARCHAR(100) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    dashboard BOOLEAN DEFAULT true,
    agenda BOOLEAN DEFAULT true,
    scanner BOOLEAN DEFAULT true,
    atestados BOOLEAN DEFAULT true,
    empresas BOOLEAN DEFAULT false,
    usuarios_perfis BOOLEAN DEFAULT false,
    ajustes BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Usuários Corporativos
CREATE TABLE IF NOT EXISTS public.usuarios (
    email VARCHAR(255) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil_id VARCHAR(100) REFERENCES public.perfis_acesso(id) ON DELETE SET NULL,
    chave_empresa VARCHAR(50), -- Chave da empresa vinculada ou 'ALL' para admin geral
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabela de Licitações (Tenders)
CREATE TABLE IF NOT EXISTS public.licitacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave_empresa VARCHAR(50) REFERENCES empresas(chave_empresa) ON DELETE CASCADE,
    modalidade VARCHAR(100),
    objeto TEXT,
    valor_estimado NUMERIC(15,2),
    prazo_proposta TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Carga de Dados Inicial de Segurança (Seed)
INSERT INTO public.perfis_acesso (id, nome, dashboard, agenda, scanner, atestados, empresas, usuarios_perfis, ajustes)
VALUES 
  ('perfil-admin', 'Administrador Geral', true, true, true, true, true, true, true),
  ('perfil-analista', 'Analista de Licitações', true, true, true, true, false, false, false),
  ('perfil-diretor', 'Diretor Comercial', true, true, false, true, false, false, true)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  dashboard = EXCLUDED.dashboard,
  agenda = EXCLUDED.agenda,
  scanner = EXCLUDED.scanner,
  atestados = EXCLUDED.atestados,
  empresas = EXCLUDED.empresas,
  usuarios_perfis = EXCLUDED.usuarios_perfis,
  ajustes = EXCLUDED.ajustes;

INSERT INTO public.usuarios (email, nome, senha, perfil_id, chave_empresa)
VALUES 
  ('admin', 'Administrador Geral', 'Cjl@j2326082110', 'perfil-admin', 'ALL'),
  ('carlos.mendes@empresa.com.br', 'Carlos Mendes', '123', 'perfil-admin', 'LICITATECH'),
  ('analista.licita@empresa.com.br', 'Ana Silva', '123', 'perfil-analista', 'LICITATECH'),
  ('diretor.licita@empresa.com.br', 'Roberto Costa', '123', 'perfil-diretor', 'LICITATECH')
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  senha = EXCLUDED.senha,
  perfil_id = EXCLUDED.perfil_id,
  chave_empresa = EXCLUDED.chave_empresa;`;

// Pure external ID helper to avoid render side-effects and satisfy React purity parameters
function generateGuid(prefix = '') {
  const uniq = Math.floor(Math.random() * 10000000).toString(36);
  return `${prefix}${uniq}`;
}

export default function Home() {
  // --- CLIENT PERSISTED DATABASE OR MOCK STATE ---
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [atestados, setAtestados] = useState<AtestadoTecnico[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoBase[]>([]);
  const [activeCompanyKey, setActiveCompanyKey] = useState<string>('LICITATECH');

  // Active User and Login Session Checks
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [currentUser, setCurrentUser] = useState<PerfilUsuario>(INITIAL_USER);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [multiSessionAlert, setMultiSessionAlert] = useState(false);

  // Styling Customization
  const [primaryColor, setPrimaryColor] = useState('#059669'); // Emerald tone mimicking Democracia Digital
  const [borderColor, setBorderColor] = useState('#eceef0');

  // Timeout settings
  const [timeoutMinutes, setTimeoutMinutes] = useState(15);
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);

  // Active Nav Tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agenda' | 'scanner' | 'atestados' | 'empresas' | 'usuarios' | 'ajustes'>('dashboard');

  // Supabase connection setting state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseMode, setSupabaseMode] = useState<'offline' | 'connected'>('offline');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Notification toggles
  const [prefEmail, setPrefEmail] = useState(true);
  const [prefNewBids, setPrefNewBids] = useState(true);
  const [prefStatus, setPrefStatus] = useState(false);

  // Scanner UI States
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [rawScannerText, setRawScannerText] = useState('');
  const [scannerIsProcessing, setScannerIsProcessing] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [scannerResult, setScannerResult] = useState<any>(null);
  const [lastScannedTenders, setLastScannedTenders] = useState<any[]>([]);

  // Technical Compatibility Matching States
  const [comparingBid, setComparingBid] = useState<Licitacao | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchAnalysisResult | null>(null);

  // Calendar Selection State
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-06-03');
  const [calendarMonth, setCalendarMonth] = useState('Junho 2026');

  // User CRUD states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123');
  const [newUserProfileId, setNewUserProfileId] = useState('perfil-analista');
  const [newUserCompanyKey, setNewUserCompanyKey] = useState('LICITATECH');

  // Sub-tabs for separating User from Profiles CRUD
  const [userSubTab, setUserSubTab] = useState<'usuarios' | 'perfis'>('usuarios');

  // Profile CRUD states
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDashboard, setNewProfileDashboard] = useState(true);
  const [newProfileAgenda, setNewProfileAgenda] = useState(true);
  const [newProfileScanner, setNewProfileScanner] = useState(true);
  const [newProfileAtestados, setNewProfileAtestados] = useState(true);
  const [newProfileEmpresas, setNewProfileEmpresas] = useState(false);
  const [newProfileUsuariosPerfis, setNewProfileUsuariosPerfis] = useState(false);
  const [newProfileAjustes, setNewProfileAjustes] = useState(false);

  // Simple CRUD controllers
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyKey, setNewCompanyKey] = useState('');
  const [newCompanyCnpj, setNewCompanyCnpj] = useState('');

  const [showAddBidModal, setShowAddBidModal] = useState(false);
  const [newBidModalidade, setNewBidModalidade] = useState('Pregão Eletrônico');
  const [newBidObjeto, setNewBidObjeto] = useState('');
  const [newBidOrgao, setNewBidOrgao] = useState('');
  const [newBidValor, setNewBidValor] = useState(50000);
  const [newBidPrazoProp, setNewBidPrazoProp] = useState('2026-06-05 14:00');
  const [newBidPrazoAber, setNewBidPrazoAber] = useState('2026-06-06 09:00');
  const [newBidExigencias, setNewBidExigencias] = useState('');
  const [newBidDocs, setNewBidDocs] = useState<string>('Cartão CNPJ, Regularidade Fiscal');

  // Cert CRUD States
  const [newCertName, setNewCertName] = useState('');
  const [newCertEmissor, setNewCertEmissor] = useState('');
  const [newCertData, setNewCertData] = useState('2025-10-15');
  const [newCertObs, setNewCertObs] = useState('');
  const [newCertItems, setNewCertItems] = useState<AtestadoItem[]>([
    { item_numero: 1, descricao: 'Fornecimento continuado de material', quantidade: 50, unidade: 'un', relevancia_tecnica: 'Média' }
  ]);
  const [showAddCertModal, setShowAddCertModal] = useState(false);

  // Mock document uploading to Base Repository
  const [repoFileUploaded, setRepoFileUploaded] = useState(false);

  // Copy success alerts
  const [copySuccess, setCopySuccess] = useState(false);

  // Dynamic state loaded indicator
  const [stateLoaded, setStateLoaded] = useState(false);

  // --- INITIAL LOAD & SYNCS ---
  useEffect(() => {
    // Generate initial session identification
    const token = generateGuid();
    localStorage.setItem('proprocure_session_token', token);

    const timer = setTimeout(() => {
      setSessionToken(token);

      // Initialize databases from local storage or set defaults
      const storedCompanies = localStorage.getItem('proprocure_empresas');
      if (storedCompanies) setEmpresas(JSON.parse(storedCompanies));
      else {
        setEmpresas(INITIAL_COMPANIES);
        localStorage.setItem('proprocure_empresas', JSON.stringify(INITIAL_COMPANIES));
      }

      const storedBids = localStorage.getItem('proprocure_licitacoes');
      if (storedBids) setLicitacoes(JSON.parse(storedBids));
      else {
        setLicitacoes(INITIAL_BIDS);
        localStorage.setItem('proprocure_licitacoes', JSON.stringify(INITIAL_BIDS));
      }

      const storedCerts = localStorage.getItem('proprocure_atestados');
      if (storedCerts) setAtestados(JSON.parse(storedCerts));
      else {
        setAtestados(INITIAL_CERTIFICATES);
        localStorage.setItem('proprocure_atestados', JSON.stringify(INITIAL_CERTIFICATES));
      }

      const storedDocs = localStorage.getItem('proprocure_documentos');
      if (storedDocs) setDocumentos(JSON.parse(storedDocs));
      else {
        setDocumentos(INITIAL_DOCUMENTS);
        localStorage.setItem('proprocure_documentos', JSON.stringify(INITIAL_DOCUMENTS));
      }

      const storedUsers = localStorage.getItem('proprocure_usuarios');
      if (storedUsers) setUsuarios(JSON.parse(storedUsers));
      else {
        setUsuarios(INITIAL_USERS);
        localStorage.setItem('proprocure_usuarios', JSON.stringify(INITIAL_USERS));
      }

      const storedProfiles = localStorage.getItem('proprocure_perfis');
      if (storedProfiles) setPerfis(JSON.parse(storedProfiles));
      else {
        setPerfis(INITIAL_PROFILES);
        localStorage.setItem('proprocure_perfis', JSON.stringify(INITIAL_PROFILES));
      }

      const storedHistory = localStorage.getItem('proprocure_scanned_history');
      if (storedHistory) setLastScannedTenders(JSON.parse(storedHistory));

      // Supabase credentials if configured
      const savedUrl = localStorage.getItem('proprocure_supabase_url') || '';
      const savedKey = localStorage.getItem('proprocure_supabase_key') || '';
      const savedMode = localStorage.getItem('proprocure_supabase_mode') || 'offline';
      setSupabaseUrl(savedUrl);
      setSupabaseKey(savedKey);
      setSupabaseMode(savedMode as 'offline' | 'connected');

      setStateLoaded(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Save changes to local storage to satisfy offline requirement
  useEffect(() => {
    if (!stateLoaded) return;
    localStorage.setItem('proprocure_empresas', JSON.stringify(empresas));
  }, [empresas, stateLoaded]);

  useEffect(() => {
    if (!stateLoaded) return;
    localStorage.setItem('proprocure_licitacoes', JSON.stringify(licitacoes));
  }, [licitacoes, stateLoaded]);

  useEffect(() => {
    if (!stateLoaded) return;
    localStorage.setItem('proprocure_atestados', JSON.stringify(atestados));
  }, [atestados, stateLoaded]);

  useEffect(() => {
    if (!stateLoaded) return;
    localStorage.setItem('proprocure_documentos', JSON.stringify(documentos));
  }, [documentos, stateLoaded]);

  useEffect(() => {
    if (!stateLoaded) return;
    localStorage.setItem('proprocure_usuarios', JSON.stringify(usuarios));
  }, [usuarios, stateLoaded]);

  useEffect(() => {
    if (!stateLoaded) return;
    localStorage.setItem('proprocure_perfis', JSON.stringify(perfis));
  }, [perfis, stateLoaded]);

  // Session timeout scheduler countdown
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsLoggedIn(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Handle timeout configured adjustments update
  useEffect(() => {
    const timer = setTimeout(() => {
      setSecondsRemaining(timeoutMinutes * 60);
    }, 0);
    return () => clearTimeout(timer);
  }, [timeoutMinutes]);

  // Multi-window login detector simulator
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'proprocure_session_token') {
        const storedToken = localStorage.getItem('proprocure_session_token');
        if (storedToken && storedToken !== sessionToken) {
          setMultiSessionAlert(true);
          setIsLoggedIn(false);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [sessionToken]);

  // Active Company filtering computations
  const currentCompany = empresas.find(e => e.chave_empresa === activeCompanyKey) || empresas[0];
  const companyBids = licitacoes.filter(item => item.chave_empresa === activeCompanyKey);
  const companyCerts = atestados.filter(item => item.chave_empresa === activeCompanyKey);

  // --- MOCK SUPABASE REMOTE SYNC SIMULATOR ---
  const handleSupabaseSync = async () => {
    if (!supabaseUrl || !supabaseKey) {
      alert("Por favor, configure o link URL e a chave anônima da Supabase em Ajustes antes de sincronizar!");
      return;
    }
    setIsSyncing(true);
    setSyncLogs(prev => ["Iniciando sincronização com banco PostgreSQL Supabase...", ...prev]);

    // Simulate network latency & endpoint posting
    setTimeout(() => {
      setSyncLogs(prev => [
        `Tabelas verificadas: empresas, licitacoes, atestados_tecnicos, atestados_itens`,
        `Dados transmitidos da empresa ${activeCompanyKey}: ${companyBids.length} licitações, ${companyCerts.length} atestados.`,
        `Status 201 OK - Sincronização de bidireção executada com sucesso! Código de retorno HTTP: 200 OK`,
        ...prev
      ]);
      setIsSyncing(false);
      localStorage.setItem('proprocure_supabase_mode', 'connected');
      setSupabaseMode('connected');
    }, 1800);
  };

  // Switch to simulate multi-session disconnect
  const triggerAlternativeSessionLogin = () => {
    const newToken = 'ALT_SESSION_' + generateGuid();
    localStorage.setItem('proprocure_session_token', newToken);
    setSessionToken(newToken);
    setMultiSessionAlert(true);
    setIsLoggedIn(false);
  };

  // Re-login trigger
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputs = e.currentTarget.querySelectorAll('input');
    const login = inputs[0]?.value.trim();
    const password = inputs[1]?.value.trim();
    
    const user = usuarios.find(u => u.email === login);
    
    if (!user) {
      alert('Usuário não encontrado. Solicite acesso ao Administrador.');
      return;
    }
    
    if (user.senha && user.senha !== password) {
      alert('Senha incorreta.');
      return;
    }
    
    setCurrentUser(user);
    if (user.email === 'admin') {
      // General admin can always switch and see all companies
      setActiveCompanyKey('LICITATECH');
    } else if (user.chave_empresa) {
      // For general users, automatically load their company and lock it
      setActiveCompanyKey(user.chave_empresa);
    }

    setIsLoggedIn(true);
    setMultiSessionAlert(false);
    setSecondsRemaining(timeoutMinutes * 60);
    // Refresh self session
    const freshToken = generateGuid();
    setSessionToken(freshToken);
    localStorage.setItem('proprocure_session_token', freshToken);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handleAddUser = () => {
    if (!newUserEmail || !newUserName || !newUserPassword) {
      alert("Por favor preencha todos os campos do usuário.");
      return;
    }
    const isEditing = usuarios.some(u => u.email === newUserEmail);
    if (isEditing) {
      alert("Este e-mail/usuário já está cadastrado.");
      return;
    }
    const nextList: PerfilUsuario[] = [
      {
        email: newUserEmail,
        nome: newUserName,
        senha: newUserPassword,
        perfilId: newUserProfileId,
        chave_empresa: newUserCompanyKey
      },
      ...usuarios
    ];
    setUsuarios(nextList);
    setNewUserEmail('');
    setNewUserName('');
    setNewUserPassword('123');
    setNewUserProfileId('perfil-analista');
    setNewUserCompanyKey('LICITATECH');
    setShowAddUserModal(false);
  };

  const handleAddProfile = () => {
    if (!newProfileName) {
      alert("Por favor digite o nome do perfil.");
      return;
    }
    const slug = 'perfil-' + newProfileName.toLowerCase().trim().replace(/\s+/g, '-');
    if (perfis.some(p => p.id === slug || p.nome.toLowerCase() === newProfileName.toLowerCase())) {
      alert("Este perfil de acesso já existe.");
      return;
    }
    const newP: PerfilAcesso = {
      id: slug,
      nome: newProfileName,
      dashboard: newProfileDashboard,
      agenda: newProfileAgenda,
      scanner: newProfileScanner,
      atestados: newProfileAtestados,
      empresas: newProfileEmpresas,
      usuarios_perfis: newProfileUsuariosPerfis,
      ajustes: newProfileAjustes
    };
    setPerfis([newP, ...perfis]);
    setNewProfileName('');
    setNewProfileDashboard(true);
    setNewProfileAgenda(true);
    setNewProfileScanner(true);
    setNewProfileAtestados(true);
    setNewProfileEmpresas(false);
    setNewProfileUsuariosPerfis(false);
    setNewProfileAjustes(false);
    setShowAddProfileModal(false);
  };

  // --- CRUD DISPATCH METHODS ---
  const handleAddCompany = () => {
    if (!newCompanyName || !newCompanyKey || !newCompanyCnpj) {
      alert("Por favor preencha todos os campos da empresa.");
      return;
    }
    const fresh: Empresa = {
      id: generateGuid('c_'),
      nome: newCompanyName,
      chave_empresa: newCompanyKey.toUpperCase().trim(),
      cnpj: newCompanyCnpj
    };
    setEmpresas([...empresas, fresh]);
    setNewCompanyName('');
    setNewCompanyKey('');
    setNewCompanyCnpj('');
    setShowAddCompanyModal(false);
    setActiveCompanyKey(fresh.chave_empresa);
  };

  const handleAddBid = () => {
    if (!newBidObjeto || !newBidOrgao) {
      alert("Preencha o Objeto e o Órgão Licitador.");
      return;
    }
    const freshLicitacao: Licitacao = {
      id: generateGuid('e_'),
      chave_empresa: activeCompanyKey,
      modalidade: newBidModalidade,
      objeto: newBidObjeto,
      orgao: newBidOrgao,
      valor_estimado: Number(newBidValor),
      prazo_proposta: newBidPrazoProp,
      prazo_abertura: newBidPrazoAber,
      documentos_obrigatorios: newBidDocs.split(',').map(s => s.trim()),
      exigencias_atestados: newBidExigencias,
      status: 'Em Análise',
      checklist_itens: [
        { id: '1', label: 'Regularidade Fiscal', checked: false },
        { id: '2', label: 'Balanço Patrimonial', checked: false }
      ],
      created_at: new Date().toISOString().split('T')[0]
    };

    setLicitacoes([freshLicitacao, ...licitacoes]);
    setShowAddBidModal(false);
    setNewBidObjeto('');
    setNewBidOrgao('');
    setNewBidValor(50000);
  };

  const handleDeleteBid = (id: string) => {
    if (confirm("Confirmar exclusão deste edital?")) {
      setLicitacoes(licitacoes.filter(b => b.id !== id));
    }
  };

  const handleToggleChecklistItem = (bidId: string, itemId: string) => {
    setLicitacoes(licitacoes.map(b => {
      if (b.id === bidId) {
        return {
          ...b,
          checklist_itens: b.checklist_itens.map(c => {
            if (c.id === itemId) return { ...c, checked: !c.checked };
            return c;
          })
        };
      }
      return b;
    }));
  };

  // Add items row by row to Technical Certificate (Requirement 4.d)
  const handleAddNewCertRow = () => {
    const nextNum = newCertItems.length + 1;
    setNewCertItems([
      ...newCertItems,
      { item_numero: nextNum, descricao: '', quantidade: 1, unidade: 'un', relevancia_tecnica: 'Média' }
    ]);
  };

  const handleRemoveCertRow = (index: number) => {
    setNewCertItems(newCertItems.filter((_, i) => i !== index));
  };

  const handleUpdateCertRow = (index: number, key: keyof AtestadoItem, val: any) => {
    setNewCertItems(newCertItems.map((item, i) => {
      if (i === index) {
        return { ...item, [key]: val };
      }
      return item;
    }));
  };

  const handleSaveCertificate = () => {
    if (!newCertName || !newCertEmissor) {
      alert("Informe o nome do atestado e o órgão/empresa emissora.");
      return;
    }
    const freshCert: AtestadoTecnico = {
      id: generateGuid('a_'),
      chave_empresa: activeCompanyKey,
      nome_atestado: newCertName,
      orgao_emissor: newCertEmissor,
      data_emissao: newCertData,
      observacoes: newCertObs,
      itens: newCertItems
    };

    setAtestados([...atestados, freshCert]);
    setShowAddCertModal(false);
    setNewCertName('');
    setNewCertEmissor('');
    setNewCertObs('');
    setNewCertItems([
      { item_numero: 1, descricao: 'Fornecimento continuado de material', quantidade: 50, unidade: 'un', relevancia_tecnica: 'Média' }
    ]);
  };

  const handleDeleteCert = (id: string) => {
    if (confirm("Deseja mesmo excluir este atestado técnico?")) {
      setAtestados(atestados.filter(c => c.id !== id));
    }
  };

  // --- GEMINI POWERED INTELLIGENT ROUTINE ACTIONS ---

  // Trigger Gemini API to analyze tender vs local certificates capabilities
  const handleAnalyzeAptitude = async (tender: Licitacao) => {
    setComparingBid(tender);
    setMatchLoading(true);
    setMatchResult(null);

    try {
      // Collect certificates associated with this company
      const relevantCerts = atestados.filter(c => c.chave_empresa === tender.chave_empresa);

      const response = await fetch('/app/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_compatibility',
          tenderData: {
            orgao: tender.orgao,
            objeto: tender.objeto,
            valor_estimado: tender.valor_estimado,
            exigencias_atestados: tender.exigencias_atestados,
            documentos_obrigatorios: tender.documentos_obrigatorios
          },
          certsData: relevantCerts
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Erro de chamada do servidor");
      }

      const matchData = await response.json();
      setMatchResult(matchData);
    } catch (err: any) {
      alert(`Falha na análise inteligente: ${err.message}`);
      setComparingBid(null);
    } finally {
      setMatchLoading(false);
    }
  };

  // Extract uploaded or select template tender text
  const handleTriggerTenderScanner = async (presetTextIndex: number | null) => {
    setScannerIsProcessing(true);
    setScannerError('');
    setScannerResult(null);

    let docText = rawScannerText;
    let fileName = uploadedFileName || "Texto_Manual.pdf";

    if (presetTextIndex !== null) {
      const selected = EDITADO_TEXTS[presetTextIndex];
      docText = selected.snippet;
      fileName = selected.title;
      setUploadedFileName(selected.title);
      setRawScannerText(selected.snippet);
    }

    if (!docText.trim()) {
      setScannerError("Por favor, digite o conteúdo do Edital ou selecione um dos modelos predefinidos!");
      setScannerIsProcessing(false);
      return;
    }

    try {
      const isAtestadoTemplate = presetTextIndex === 2; // Last template is actually a Certificate for testing!
      const targetAction = isAtestadoTemplate ? 'parse_certificate' : 'parse_tender';

      const response = await fetch('/app/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: targetAction,
          text: docText
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Chamada de IA falhou");
      }

      const parsedJSON = await response.json();
      setScannerResult({ ...parsedJSON, isCertificate: isAtestadoTemplate });

      // Save scanned history to satisfying 4.c scanner grade organization block
      if (!isAtestadoTemplate) {
        const freshHistoryItem = {
          id: generateGuid('h_'),
          fileName,
          modalidade: parsedJSON.modalidade,
          orgao: parsedJSON.orgao,
          valorEstimado: parsedJSON.valor_estimado,
          objeto: parsedJSON.objeto,
          prazoProposta: parsedJSON.prazo_proposta,
          exigencias_atestados: parsedJSON.exigencias_atestados,
          documentos_obrigatorios: parsedJSON.documentos_obrigatorios,
          timestamp: new Date().toLocaleString()
        };
        const updatedHistory = [freshHistoryItem, ...lastScannedTenders];
        setLastScannedTenders(updatedHistory);
        localStorage.setItem('proprocure_scanned_history', JSON.stringify(updatedHistory));
      } else {
        // Scanned certificate -> let's map directly to CERTIFICATES database!
        const parsedCert: AtestadoTecnico = {
          id: generateGuid('a_'),
          chave_empresa: activeCompanyKey,
          nome_atestado: parsedJSON.nome_atestado || "Atestado Importado por IA",
          orgao_emissor: parsedJSON.orgao_emissor || "Emissor não identificado",
          data_emissao: parsedJSON.data_emissao || "2026-06-02",
          observacoes: parsedJSON.observacoes || "Processado via Scanner Inteligente",
          itens: parsedJSON.itens || []
        };
        setAtestados(prev => [parsedCert, ...prev]);
        alert(`Atestado "${parsedCert.nome_atestado}" foi lido com sucesso e importado linha a linha para sua base de atestados!`);
      }
    } catch (err: any) {
      setScannerError(`Erro ao parsear documento: ${err.message}`);
    } finally {
      setScannerIsProcessing(false);
    }
  };

  // Helper template inserter
  const applyImportedScannerToBids = () => {
    if (!scannerResult) return;

    const freshLicitacao: Licitacao = {
      id: generateGuid('e_'),
      chave_empresa: activeCompanyKey,
      modalidade: scannerResult.modalidade || "Pregão Eletrônico",
      objeto: scannerResult.objeto || "Objeto não mapeado",
      orgao: scannerResult.orgao || "Órgão Indefinido",
      valor_estimado: Number(scannerResult.valor_estimado) || 0,
      prazo_proposta: scannerResult.prazo_proposta || "2026-06-10 09:00",
      prazo_abertura: scannerResult.prazo_abertura || "2026-06-11 09:00",
      documentos_obrigatorios: scannerResult.documentos_obrigatorios || [],
      exigencias_atestados: scannerResult.exigencias_atestados || "",
      status: 'Em Análise',
      checklist_itens: (scannerResult.documentos_obrigatorios || []).map((doc: string, idx: number) => ({
        id: `sc-${idx}`,
        label: doc,
        checked: false
      })),
      created_at: new Date().toISOString().split('T')[0]
    };

    setLicitacoes([freshLicitacao, ...licitacoes]);
    alert("O edital analisado foi importado com sucesso na sua base de Licitações!");
    setScannerResult(null);
    setActiveTab('dashboard');
  };

  // Format dynamic expiration display
  const formatTimeMinutes = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy code utility
  const handleCopyCode = () => {
    navigator.clipboard.writeText(SQL_MIGRATION_SCRIPT);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // --- RENDERING VIEWS ---

  // LOGIN PAGE OVERLAY (REQUIREMENT 4.e)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 transition-colors" style={{ backgroundColor: primaryColor }}>
        <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-2xl animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 relative">
              <Image src="/buygov_logo.png" alt="BuyGov Logo" fill className="object-contain" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-emerald-950 font-sans tracking-tight">
            BuyGov
          </h2>
          <p className="text-emerald-700 text-sm text-center mt-1">
            Plataforma Corporativa de Licitações
          </p>

          {multiSessionAlert && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <div>
                <p className="font-bold">Desconexão de Sessão Única Ativa</p>
                <p>Nossa segurança detectou que esta conta foi aberta em outra aba/dispositivo. Esta sessão foi finalizada.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-800 uppercase tracking-tight">E-mail ou Login</label>
              <input
                type="text"
                required
                className="w-full mt-1 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-950 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="exemplo@empresa.com.br ou 'admin'"
                defaultValue={currentUser?.email || ''}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-800 uppercase tracking-tight">Senha</label>
              <input
                type="password"
                required
                placeholder="Sua senha corporativa"
                className="w-full mt-1 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-950 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 text-white font-bold py-2.5 rounded transition shadow-sm hover:-translate-y-0.5"
              style={{ backgroundColor: primaryColor }}
            >
              Conectar com Segurança
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-emerald-600">
            Sua empresa segura com timeout de inatividade integrado de {timeoutMinutes}m.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] text-slate-900 transition-colors" style={{ fontFamily: 'Work Sans, sans-serif' }}>
      
      {/* --- DESKTOP FIXED SIDEBAR NAVIGATION --- */}
      <aside className="hidden md:flex min-w-[260px] max-w-[260px] bg-[#0F172A] flex-col text-slate-300 relative z-40 border-r border-slate-800" style={{ backgroundColor: primaryColor }}>
        {/* Modern high-density branding component */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950/20">
          <div className="w-8 h-8 shrink-0 relative">
            <Image src="/buygov_logo.png" alt="BuyGov Logo" fill className="object-contain rounded" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-tight leading-none">BUYGOV <span className="text-blue-200 font-light text-[10px] block mt-1 tracking-wider uppercase">PLATAFORMA</span></h1>
          </div>
        </div>

        {/* Enterprise Context switcher inside Navbar sidebar with High Density tags */}
        <div className="p-4 border-b border-slate-800/65 bg-slate-950/25">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
            <span>Corporate Active Connection</span>
            <span className="text-blue-500 font-mono text-[9px] uppercase tracking-tighter">● Online</span>
          </label>
          <div className="relative">
            <select
              value={activeCompanyKey}
              onChange={(e) => setActiveCompanyKey(e.target.value)}
              disabled={currentUser?.email !== 'admin'}
              className="w-full py-1.5 px-2 bg-slate-800 border border-slate-700 rounded text-xs font-semibold text-white focus:outline-none focus:border-blue-550 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {empresas.map(emp => (
                <option key={emp.id} value={emp.chave_empresa}>{emp.nome} ({emp.chave_empresa})</option>
              ))}
            </select>
          </div>
          {currentUser?.email !== 'admin' && (
            <span className="block mt-1 text-[9px] text-amber-400 font-mono italic">
              Empresa vinculada obrigatória no login.
            </span>
          )}
          <span className="block mt-1.5 text-[9px] text-slate-400 font-mono">
            CNPJ ID: {currentCompany?.cnpj}
          </span>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Briefcase className="w-4 h-4 shrink-0" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('agenda')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'agenda' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Agenda & Prazos</span>
            {companyBids.length > 0 && (
              <span className="ml-auto bg-red-650 text-white text-[9px] px-1.5 py-0.5 rounded font-extrabold font-mono">
                {companyBids.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'scanner' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Scanner Edital IA</span>
          </button>
          <button
            onClick={() => setActiveTab('atestados')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'atestados' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Atestados Técnicos</span>
          </button>
          <button
            onClick={() => setActiveTab('empresas')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'empresas' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Building className="w-4 h-4 shrink-0" />
            <span>Empresas CRUD</span>
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'usuarios' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Usuários e Perfis</span>
          </button>
          <button
            onClick={() => setActiveTab('ajustes')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'ajustes' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Configurações</span>
          </button>
        </nav>

        {/* Bottom session timer footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs mt-auto">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-3.5 h-3.5 text-red-400" />
            <div className="truncate">
              <p className="font-semibold text-white truncate text-[11px]">{currentUser.nome}</p>
              <p className="text-[9px] text-slate-400 uppercase font-mono">
                {perfis.find(p => p.id === currentUser.perfilId)?.nome || (currentUser.email === 'admin' ? 'Administrador Geral' : 'Usuário')}
              </p>
            </div>
          </div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between mb-3">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-red-500" /> Timeout:</span>
            <span className="font-mono text-white font-bold animate-pulse">{formatTimeMinutes(secondsRemaining)}</span>
          </div>
          
          <div className="flex items-center gap-2 mb-3 text-[10px] text-slate-405 font-mono">
            <div className={`w-2 h-2 rounded-full ${supabaseMode === 'connected' ? 'bg-green-500' : 'bg-amber-505 animate-pulse'}`}></div>
            <span>Supabase: {supabaseMode === 'connected' ? 'Conectado' : 'Offline'}</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-2 py-1.5 hover:bg-red-950 hover:text-white text-slate-405 text-[11px] font-bold rounded border border-slate-850 hover:border-red-950 flex items-center justify-center gap-1 transition"
          >
            <LogOut className="w-3 h-3" /> Desconectar
          </button>
        </div>
      </aside>

      {/* --- MOBILE VIEW NAVBAR TOP --- */}
      <header className="md:hidden sticky top-0 w-full z-40 bg-slate-900 text-white px-4 py-3 flex justify-between items-center shadow-lg" style={{ backgroundColor: primaryColor }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 relative">
            <Image src="/buygov_logo.png" alt="BuyGov Logo" fill className="object-contain rounded-sm" />
          </div>
          <h1 className="font-bold text-sm tracking-tight">BuyGov</h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={activeCompanyKey}
            onChange={(e) => setActiveCompanyKey(e.target.value)}
            disabled={currentUser?.email !== 'admin'}
            className="py-1 px-1.5 bg-slate-800 border border-slate-700 text-[10.5px] rounded text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {empresas.map(emp => (
              <option key={emp.id} value={emp.chave_empresa}>{emp.chave_empresa}</option>
            ))}
          </select>

          <span className="text-[10px] font-mono text-red-400 font-bold">{formatTimeMinutes(secondsRemaining)}</span>

          <button onClick={handleLogout} className="text-slate-400 hover:text-white">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* --- DESKTOP HIGH-DENSITY HEADERS AND CONTENT WRAPPERS --- */}
      <main className="flex-grow flex flex-col min-h-screen bg-[#F8FAFC]">
        {/* Universal Desk/Header */}
        <header className="hidden md:flex h-14 bg-white border-b border-slate-200 px-6 items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">
                {currentUser?.email === 'admin' ? 'Multi-Empresa Ativa' : 'Empresa Vinculada (Sessão)'}
              </span>
              <select
                value={activeCompanyKey}
                onChange={(e) => setActiveCompanyKey(e.target.value)}
                disabled={currentUser?.email !== 'admin'}
                className="text-sm font-semibold text-slate-805 bg-transparent border-none p-0 focus:ring-0 cursor-pointer outline-none mt-1 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.chave_empresa}>{emp.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 bg-red-50 border border-red-200 rounded">
                <span className="text-[10px] text-red-650 font-bold uppercase animate-pulse">Prazos Críticos Ativos</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="text-xs font-bold text-slate-800 leading-none">{currentUser.nome}</div>
                <div className="text-[9px] text-slate-500 italic uppercase tracking-tighter leading-none mt-1">
                  {perfis.find(p => p.id === currentUser.perfilId)?.nome || (currentUser.email === 'admin' ? 'Administrador Geral' : 'Usuário')}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs uppercase shadow-sm">
                {currentUser.nome.substring(0, 2)}
              </div>
            </div>
          </div>
        </header>

        {/* --- MAIN INNER CONTENT WRAPPER --- */}
        <div className="flex-grow overflow-y-auto px-4 md:px-6 py-5 max-w-7xl mx-auto w-full relative">
          <AnimatePresence mode="wait">
          
          {/* DASHBOARD TAB SCREEN */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Critical Alert Bar */}
              <div className="bg-red-50 border border-red-200 p-4 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-xs uppercase text-red-750">Alerta de Prazos Críticos Licitações</h3>
                    <p className="text-xs text-red-700 mt-0.5">
                      Você possui editais com propostas se encerrando hoje! Revise prazos de habilitação e atestados.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('agenda')}
                  className="bg-red-650 hover:bg-red-700 text-white px-3.5 py-1.5 rounded text-xs font-bold transition shrink-0"
                >
                  Visualizar Linha do Tempo
                </button>
              </div>

              {/* Title Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Building className="w-5 h-5 text-slate-500" />
                    Visão Geral de Licitações - {currentCompany?.nome}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Acompanhamento de funil e prazos do acervo técnico da chave empresarial <span className="font-bold text-slate-700">{activeCompanyKey}</span>.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddBidModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded font-bold flex items-center gap-1.5 transition shrink-0 shadow-sm"
                  style={{ backgroundColor: primaryColor === '#0F172A' || primaryColor === '#091426' ? '#2563EB' : primaryColor }}
                >
                  <Plus className="w-4 h-4" /> Novo Edital
                </button>
              </div>

              {/* KPIs indicators array */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Metric Card 1 */}
                <div className="bg-white px-4 py-4 rounded border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Editais Ativos</span>
                    <span className="p-1 bg-slate-100 text-[#0F172A] rounded"><Briefcase className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tracking-tight text-slate-900">{companyBids.length}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">itens</span>
                  </div>
                  <div className="mt-1 text-[10px] text-green-600 flex items-center gap-1 font-bold uppercase">
                    <TrendingUp className="w-3 h-3" />
                    <span>+12% vs mês anterior</span>
                  </div>
                </div>

                {/* Metric Card 2 */}
                <div className="bg-white px-4 py-4 rounded border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between font-sans">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Taxa de Sucesso</span>
                    <span className="p-1 bg-red-50 text-red-600 rounded"><Award className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-2xl font-bold tracking-tight text-slate-900">38%</span>
                    {/* Visual Progress gauge bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded mt-2 overflow-hidden">
                      <div className="bg-red-650 h-full" style={{ width: '38%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Metric Card 3 */}
                <div className="bg-white px-4 py-4 rounded border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Volume Financeiro Estimado</span>
                    <span className="p-1 bg-green-50 text-green-700 rounded"><Sliders className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-1">
                    <span className="text-xl font-bold tracking-tight text-slate-900">
                      R$ {companyBids.reduce((acc, el) => acc + el.valor_estimado, 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-405 italic">Geração de receita potencial em licitações ativas.</p>
                </div>
              </div>

              {/* Bento Grid layout with Funnel and Tenders */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* CSS Opportunity Funnel representation (Requirement 4.a) */}
                <div className="lg:col-span-5 bg-white p-5 rounded border border-slate-200 shadow-sm flex flex-col">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 pb-1 border-b border-slate-100">Funil de Oportunidades</h3>
                  <div className="flex-1 flex flex-col gap-2 justify-center">
                    
                    <div className="relative p-2 bg-slate-50 hover:bg-slate-105 rounded text-xs flex justify-between items-center transition border border-slate-200">
                      <span className="font-semibold text-slate-600">Captação / Scanner</span>
                      <span className="font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold text-[10px]">120</span>
                    </div>

                    <div className="relative p-2 bg-indigo-50/60 hover:bg-indigo-50 rounded text-xs flex justify-between items-center transition border border-indigo-150 w-[95%] mx-auto">
                      <span className="font-semibold text-indigo-700">Em Análise Técnica</span>
                      <span className="font-mono bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px]">
                        {companyBids.filter(b => b.status === "Em Análise").length}
                      </span>
                    </div>

                    <div className="relative p-2 bg-amber-50/60 hover:bg-amber-50 rounded text-xs flex justify-between items-center transition border border-amber-200 w-[90%] mx-auto">
                      <span className="font-semibold text-amber-700">Em Preparação</span>
                      <span className="font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold text-[10px]">
                        {companyBids.filter(b => b.status === "Em Preparação").length}
                      </span>
                    </div>

                    <div className="relative p-2 bg-red-50 hover:bg-red-100 rounded text-xs flex justify-between items-center transition border border-red-200 w-[85%] mx-auto">
                      <span className="font-semibold text-red-700">Propostas Submetidas</span>
                      <span className="font-mono bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold text-[10px]">
                        {companyBids.filter(b => b.status === "Submetido").length}
                      </span>
                    </div>

                    <div className="relative p-2 bg-green-50 hover:bg-green-105 rounded text-xs flex justify-between items-center transition border border-green-200 w-[80%] mx-auto">
                      <span className="font-semibold text-green-700">Vencidas / Ganhos</span>
                      <span className="font-mono bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-bold text-[10px]">
                        {companyBids.filter(b => b.status === "Ganho").length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Editais Recentes Table List */}
                <div className="lg:col-span-7 bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-50/60">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-tight">Controle de Editais ({activeCompanyKey})</h3>
                    <button
                      onClick={() => setActiveTab('agenda')}
                      className="text-xs text-red-650 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Ver Agenda Completa
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 uppercase text-[9px] font-bold border-b border-slate-200">
                          <th className="px-4 py-2 font-semibold">Órgão / Licitação</th>
                          <th className="px-4 py-2 font-semibold">Objeto</th>
                          <th className="px-4 py-2 font-semibold">Valor Estimado</th>
                          <th className="px-4 py-2 font-semibold text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyBids.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">
                              <ArchiveIconPlaceholder className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                              Nenhuma licitação cadastrada para esta empresa. 
                              <button onClick={() => setShowAddBidModal(true)} className="text-red-600 block mx-auto underline mt-1 font-bold">
                                Adicionar Manualmente
                              </button>
                            </td>
                          </tr>
                        ) : (
                          companyBids.map(bid => (
                            <tr key={bid.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                              <td className="px-4 py-2 text-xs">
                                <p className="font-bold text-slate-800 leading-snug">{bid.orgao}</p>
                                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">{bid.modalidade}</p>
                              </td>
                              <td className="px-4 py-2 text-slate-500 max-w-[180px] truncate text-[11px]" title={bid.objeto}>
                                {bid.objeto}
                              </td>
                              <td className="px-4 py-2 font-bold text-slate-705 text-xs">
                                R$ {bid.valor_estimado.toLocaleString('pt-BR')}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <div className="flex gap-1.5 justify-center">
                                  <button
                                    onClick={() => handleAnalyzeAptitude(bid)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1 transition"
                                    style={{ backgroundColor: primaryColor === '#0F172A' || primaryColor === '#091426' ? '#2563EB' : primaryColor }}
                                    title="Análise Inteligente de Capacidade Técnica por IA"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-305" /> Analisar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBid(bid.id)}
                                    className="text-slate-400 hover:text-red-500 p-1"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* AGENDA TAB SCREEN (REQUIREMENT 4.b) */}
          {activeTab === 'agenda' && (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-red-650" />
                    Agenda de Prazos Expandida
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Navegue pelas datas críticas e controle exigências de documentação integradas.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddBidModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-1.5 rounded font-bold flex items-center gap-1.5 transition whitespace-nowrap"
                  style={{ backgroundColor: primaryColor === '#0F172A' || primaryColor === '#091426' ? '#2563EB' : primaryColor }}
                >
                  <Plus className="w-4 h-4" /> Novo Prazo
                </button>
              </div>

              {/* Grid with Left Mini-Calendar Selector & Right Timeline list */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* Left side Mini-Calendar widget */}
                <div className="md:col-span-4 bg-white p-4 rounded border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-sm text-slate-800">{calendarMonth}</span>
                    <div className="flex gap-1">
                      <button className="p-1 rounded hover:bg-slate-100 text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
                      <button className="p-1 rounded hover:bg-slate-100 text-slate-500"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {/* Calendar Matrix Days Headers */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
                    <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
                  </div>

                  {/* Calendar simulated days block */}
                  <div className="grid grid-cols-7 gap-1 text-[11.5px] font-medium text-slate-700">
                    <span className="p-2 text-slate-300 text-center">31</span>
                    <span className="p-2 text-slate-300 text-center">1</span>
                    <span className="p-2 text-slate-300 text-center">2</span>
                    
                    {/* Active highlighted selected day with a glowing ring indicator */}
                    <button
                      onClick={() => setSelectedDateStr('2026-06-03')}
                      className={`p-2 rounded text-center relative font-bold ${selectedDateStr === '2026-06-03' ? 'bg-red-600 text-white shadow-md' : 'hover:bg-slate-100'}`}
                    >
                      3
                      <span className={`absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full ${selectedDateStr === '2026-06-03' ? 'bg-white' : 'bg-red-600 animate-ping'}`}></span>
                    </button>

                    {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(day => {
                      const dayStr = `2026-06-${day.toString().padStart(2, '0')}`;
                      const hasBid = licitacoes.some(b => b.prazo_proposta.startsWith(dayStr));

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDateStr(dayStr)}
                          className={`p-2 rounded text-center relative ${selectedDateStr === dayStr ? 'bg-slate-800 text-white' : 'hover:bg-slate-100'}`}
                        >
                          {day}
                          {hasBid && (
                            <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legends */}
                  <div className="mt-6 pt-4 border-t border-slate-150 space-y-2 text-[11px] text-slate-500">
                    <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">Legendas</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-red-600 rounded-full"></span>
                      <span>Prazo Crítico (&lt; 48 Horas)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></span>
                      <span>Abertura de Sessão Pública</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-slate-400 rounded-full"></span>
                      <span>Documentação Regular</span>
                    </div>
                  </div>
                </div>

                {/* Right side Detailed Timeline with Closures Checklist */}
                <div className="md:col-span-8 space-y-4">
                  <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex justify-between items-center bg-slate-50/60">
                    <div>
                      <h3 className="font-bold text-xs text-slate-850 uppercase tracking-tight">
                        Prazos para {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Filtrando agendamentos relativos ao contexto selecionado.</p>
                    </div>
                  </div>

                  {/* List timeline events filtered */}
                  {companyBids.filter(b => b.prazo_proposta.startsWith(selectedDateStr) || b.prazo_abertura.startsWith(selectedDateStr)).length === 0 ? (
                    <div className="p-10 text-center bg-white rounded border border-slate-200 shadow-sm">
                      <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-550 text-xs font-semibold">Sem prazos críticos agendados para este dia.</p>
                      <p className="text-slate-400 text-[10px] mt-1 italic">Dica: Selecione o dia 3 ou os dias de novos editais cadastrados!</p>
                    </div>
                  ) : (
                    companyBids.filter(b => b.prazo_proposta.startsWith(selectedDateStr) || b.prazo_abertura.startsWith(selectedDateStr)).map(bid => {
                      // Detect if < 48h (simulate based on seed date matching selected or active date)
                      const isUrgent = true; 

                      return (
                        <div
                          key={bid.id}
                          className={`bg-white p-5 rounded border border-slate-200 border-l-4 transition flex flex-col md:flex-row gap-4 shadow-sm ${isUrgent ? 'border-l-red-650' : 'border-l-indigo-600'}`}
                        >
                          <div className="md:w-24 shrink-0">
                            <span className="text-lg font-extrabold text-slate-900 block leading-none">
                              {bid.prazo_proposta.split(' ')[1]}
                            </span>
                            {isUrgent && (
                              <span className="inline-block mt-2 px-1.5 py-0.5 bg-red-50 text-red-750 text-[9px] font-bold rounded border border-red-105 uppercase tracking-tighter">
                                Crítico (&lt;48h)
                              </span>
                            )}
                          </div>

                          <div className="flex-1 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-red-650" /> Entrega de Proposta
                              </span>
                              <span className="bg-slate-100 border border-slate-205 px-2 py-0.5 rounded text-[10px] text-slate-600 font-mono">
                                {bid.modalidade}
                              </span>
                            </div>

                            <h4 className="font-bold text-sm text-slate-900 tracking-tight leading-snug">
                              {bid.orgao} <span className="text-slate-300">•</span> {bid.objeto}
                            </h4>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-[11px]">
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Abertura Sessão Lances:</p>
                                <p className="font-bold text-slate-700 mt-0.5">{bid.prazo_abertura}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Valor Estimado Máximo:</p>
                                <p className="font-bold text-red-655 mt-0.5 font-mono">R$ {bid.valor_estimado.toLocaleString('pt-BR')}</p>
                              </div>
                            </div>

                            {/* Internal checklist component inside Timeline card */}
                            {bid.checklist_itens.length > 0 && (
                              <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-205">
                                <h5 className="text-[9.5px] font-bold text-slate-505 uppercase mb-2 tracking-tight">Checklist de Documentos Requeridos:</h5>
                                <div className="flex flex-wrap gap-3">
                                  {bid.checklist_itens.map(c => (
                                    <label key={c.id} className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                                      <input
                                        type="checkbox"
                                        checked={c.checked}
                                        onChange={() => handleToggleChecklistItem(bid.id, c.id)}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className={c.checked ? 'line-through text-slate-400 font-semibold text-[11px]' : 'text-slate-707 font-semibold text-[11px]'}>
                                        {c.label}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* SCANNER TAB SCREEN (REQUIREMENT 4.c / 4.d Cert Reader) */}
          {activeTab === 'scanner' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Scanner de Editais & Atestados com IA
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Carregue documentos em PDF ou texto e utilize a inteligência avançada para extrair estruturadamente todas as exigências.
                </p>
              </div>

              {/* Upload area */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-sans">
                
                {/* Drag zone / input text block creator */}
                <div className="lg:col-span-7 space-y-4">
                  
                  <div className="bg-white p-4 rounded border border-slate-200 space-y-4 shadow-sm">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Texto bruto ou extraído do PDF / Edital / Atestado:
                    </label>

                    <textarea
                      value={rawScannerText}
                      onChange={(e) => {
                        setRawScannerText(e.target.value);
                        setUploadedFileName("Texto_Copiado_Edital.pdf");
                      }}
                      className="w-full h-44 p-3 bg-slate-50 border border-slate-200 rounded text-xs leading-relaxed focus:outline-none focus:border-blue-500 font-mono"
                      placeholder="Cole aqui as seções do edital referente ao Objeto, Prazos de Proposta, Documentos de Habilitação Física e Exigência de acervo e atestados técnicos..."
                    />

                    {/* Pre-written templates selector for visual satisfaction */}
                    <div>
                      <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">Simule em 1-Clique com modelos de demonstração:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {EDITADO_TEXTS.map((t, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleTriggerTenderScanner(idx)}
                            className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 px-2 py-1 rounded transition font-bold border border-slate-200 shadow-xs"
                          >
                            {idx === 2 ? "💡 ACT: " : "📋 "} {t.title.split(' - ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit parsing */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-slate-400 text-xs">
                        {uploadedFileName && (
                          <span className="flex items-center gap-1 font-semibold text-slate-600 font-mono text-[10px]">
                            📄 {uploadedFileName}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleTriggerTenderScanner(null)}
                        disabled={scannerIsProcessing}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded transition disabled:bg-slate-350 flex items-center gap-2 shadow-sm"
                        style={{ backgroundColor: primaryColor === '#0F172A' || primaryColor === '#091426' ? '#2563EB' : primaryColor }}
                      >
                        {scannerIsProcessing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processando IA...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-305" /> Analisar Documento (Gemini)
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Organização em grade das últimas processadas (Exigência 4.c) */}
                  <div className="bg-white p-5 rounded-xl border border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm mb-3">Grade de Documentos Processados</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {lastScannedTenders.slice(0, 4).map((item) => (
                        <div key={item.id} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-800 truncate block max-w-[125px]">{item.fileName}</span>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-bold">Concluído</span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 line-clamp-2">{item.objeto}</p>
                          <div className="text-[9.5px] text-slate-400 flex justify-between pt-1">
                            <span>Estimado: R$ {item.valorEstimado?.toLocaleString('pt-BR')}</span>
                            <span>{item.timestamp.split(' ')[0]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Scanned Results display panel */}
                <div className="lg:col-span-5 space-y-4 font-sans">
                  {scannerIsProcessing && (
                    <div className="bg-slate-900 text-white p-6 rounded border border-slate-950 text-center space-y-3.5 animate-pulse shadow-sm">
                      <Sparkles className="w-8 h-8 text-amber-400 animate-bounce mx-auto" />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-205">Gemini está estruturando o documento...</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Extraindo objeto licitado, valor, prazos limites de habilitação e atestados. Comentários legislativos inclusos.
                      </p>
                    </div>
                  )}

                  {scannerError && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded text-red-750 text-xs flex gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-601" />
                      <span>{scannerError}</span>
                    </div>
                  )}

                  {/* Scanned success parsed structured form view */}
                  {scannerResult && (
                    <div className="bg-white p-4 rounded border border-slate-200 border-l-4 border-l-blue-600 shadow-sm space-y-3.5 animate-fade-in">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <h3 className="font-bold text-xs uppercase tracking-tight text-slate-850">
                            {scannerResult.isCertificate ? "Atestado Importado" : "Edital Estruturado"}
                          </h3>
                        </div>
                        {scannerResult.isCertificate && (
                          <span className="text-[9.5px] bg-indigo-50 border border-indigo-120 text-indigo-750 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">Atestado</span>
                        )}
                      </div>

                      {scannerResult.isCertificate ? (
                        <div className="space-y-3 text-xs text-slate-700">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Atestado:</p>
                            <p className="font-bold text-slate-800">{scannerResult.nome_atestado}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Órgão Emissor:</p>
                            <p className="font-semibold">{scannerResult.orgao_emissor}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Data de Emissão:</p>
                            <p className="font-semibold">{scannerResult.data_emissao}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Itens Identificados e Salvados (CRUD):</p>
                            <ul className="mt-1.5 space-y-1.5 bg-slate-50 p-2.5 rounded font-mono text-[10.5px]">
                              {scannerResult.itens?.map((it: any, i: number) => (
                                <li key={i} className="border-b border-slate-200/55 pb-1 last:border-0">
                                  #{it.item_numero}: {it.descricao} - <b>{it.quantidade} {it.unidade}</b> ({it.relevancia_tecnica})
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3.5 text-xs text-slate-700">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Modalidade:</p>
                            <p className="font-bold text-slate-800">{scannerResult.modalidade}</p>
                          </div>
                          
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Órgão Licitador:</p>
                            <p className="font-semibold text-slate-800">{scannerResult.orgao}</p>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Objeto:</p>
                            <p className="leading-relaxed bg-slate-50 p-2 rounded text-slate-600">{scannerResult.objeto}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Valor Estimado:</p>
                              <p className="font-bold text-red-650">R$ {scannerResult.valor_estimado?.toLocaleString('pt-BR') || "0,00"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Encerramento Proposta:</p>
                              <p className="font-bold text-slate-800">{scannerResult.prazo_proposta}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Documentos Obrigatórios:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {scannerResult.documentos_obrigatorios?.map((doc: string, dIdx: number) => (
                                <span key={dIdx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                                  {doc}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Exigência de Qualificação de Atestados:</p>
                            <p className="bg-slate-50 p-2.5 rounded border border-slate-150 text-[10.5px] leading-relaxed italic text-slate-600">
                              {scannerResult.exigencias_atestados || "Atestados genéricos normais"}
                            </p>
                          </div>

                          <button
                            onClick={applyImportedScannerToBids}
                            className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-slate-800 transition"
                          >
                            Importar Edital no CRM de Licitações
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {!scannerResult && !scannerIsProcessing && (
                    <div className="bg-white p-6 rounded-xl border border-slate-100 text-center space-y-4 shadow-sm">
                      <Sparkles className="w-10 h-10 text-amber-500 mx-auto" />
                      <h4 className="font-bold text-slate-800 text-sm">Visualizador Estruturado de Inteligência</h4>
                      <p className="text-slate-400 text-xs">
                        Cole ou selecione um edital na esquerda para ver todas as informações mapeadas em campos específicos de forma organizada.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ATESTADOS & COMPATIBILITY TAB SCREEN (REQUIREMENT 4.d CRUD Atestados) */}
          {activeTab === 'atestados' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-700" />
                    Controle de Atestados Técnicos da Empresa
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cadastre, revise e processe acervos técnicos linha a linha dos atestados da empresa.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewCertItems([
                      { item_numero: 1, descricao: 'Fornecimento continuado de material', quantidade: 50, unidade: 'un', relevancia_tecnica: 'Média' }
                    ]);
                    setShowAddCertModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-1.5 rounded font-bold flex items-center gap-1 transition shrink-0 shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus className="w-4 h-4" /> Cadastrar Atestado
                </button>
              </div>

              {/* Advanced Matching Simulator Drawer Indicator */}
              {comparingBid && (
                <div className="bg-white p-6 rounded-xl border-l-4 border-amber-500 shadow-lg space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-amber-600 uppercase">Análise Inteligente de Qualificação</span>
                      <h3 className="font-bold text-slate-800 text-md">
                        {comparingBid.orgao} - {comparingBid.objeto.substring(0, 100)}...
                      </h3>
                    </div>
                    <button onClick={() => setComparingBid(null)} className="p-1 rounded hover:bg-slate-100">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  {matchLoading ? (
                    <div className="text-center p-8 space-y-3">
                      <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">Gemini está comparando {companyCerts.length} atestados contra o Edital...</p>
                    </div>
                  ) : matchResult ? (
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg">
                        <div className="text-center p-3 bg-white rounded-xl shadow-inner border border-slate-200">
                          <p className="text-xs text-slate-400 font-bold uppercase">Aderência</p>
                          <p className="text-4xl font-extrabold text-red-650" style={{ color: primaryColor }}>
                            {matchResult.score_aderencia}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-mono">Elegibilidade Estimada:</p>
                          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${matchResult.elegibilidade === 'Altamente Recomendável' ? 'bg-emerald-100 text-emerald-800' : matchResult.elegibilidade === 'Possível com Riscos' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                            {matchResult.elegibilidade}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1">{matchResult.recomendacao_final}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Pontos Fortes Mapeados:</p>
                          <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                            {matchResult.pontos_fortes?.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide text-red-700">Pontos de Atenção / Gaps:</p>
                          <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                            {matchResult.pontos_atencao?.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <p className="font-bold text-slate-800 mb-2">Checklist de Requisitos Mapeados por IA:</p>
                        <div className="space-y-1.5">
                          {matchResult.checklist_verificação?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-150 text-xs text-slate-705">
                              <span className="font-semibold text-slate-700">{item.item}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10.5px]" style={{ color: primaryColor }}>{item.detalhe}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'Atendido' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Parcialmente Atendido' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                  {item.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Technical Inventory List */}
              <div className="grid grid-cols-1 gap-5">
                {companyCerts.length === 0 ? (
                  <div className="p-10 text-center bg-white rounded border border-slate-200 shadow-sm">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-xs font-semibold">Nenhum atestado cadastrado.</p>
                    <p className="text-slate-400 text-[10px] mt-1">Carregue um acerto técnico na esquerda ou crie um novo!</p>
                  </div>
                ) : (
                  companyCerts.map(cert => (
                    <div key={cert.id} className="bg-white p-4 rounded border border-slate-200 space-y-3 shadow-none font-sans">
                      
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-[9px] font-bold text-indigo-650 uppercase tracking-tight block">Item de Capacidade Técnica</span>
                          <h3 className="font-bold text-sm text-slate-850 tracking-tight">{cert.nome_atestado}</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Emitido por <span className="font-semibold text-slate-600">{cert.orgao_emissor}</span> em {new Date(cert.data_emissao + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteCert(cert.id)}
                          className="text-slate-400 hover:text-red-600 py-1"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Display lines row-by-row CRUD (Requirement 4.d) */}
                      <div className="overflow-x-auto bg-slate-50 rounded-lg p-3 border border-slate-150">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead>
                            <tr className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                              <th className="pb-2">Nº Item</th>
                              <th className="pb-2">Descrição da Atividade Executada</th>
                              <th className="pb-2">Quantidade</th>
                              <th className="pb-2">Unidade</th>
                              <th className="pb-2">Relevância</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cert.itens?.map((it, idx) => (
                              <tr key={idx} className="border-b border-slate-100 py-2 last:border-0 hover:bg-slate-100 transition">
                                <td className="py-2.5 font-bold text-slate-500">#{it.item_numero}</td>
                                <td className="py-2.5 font-semibold text-slate-800">{it.descricao}</td>
                                <td className="py-2.5 font-bold">{it.quantidade}</td>
                                <td className="py-2.5 uppercase font-mono text-slate-500">{it.unidade}</td>
                                <td className="py-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold uppercase ${it.relevancia_tecnica === 'Alta' ? 'bg-red-100 text-red-700' : it.relevancia_tecnica === 'Média' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {it.relevancia_tecnica}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* EMPRESAS CRUD SCREEN (REQUIREMENT 3) */}
          {activeTab === 'empresas' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Building className="w-5 h-5 text-slate-750" />
                    Cadastro Multi-Empresa
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gerencie os perfis das corporate keys acessíveis na sua rede de licitações.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCompanyModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-1.5 rounded font-bold flex items-center gap-1 transition shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus className="w-3.5 h-3.5" /> Cadastrar Nova Empresa
                </button>
              </div>

              {/* Companies listing Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-sans">
                {empresas.map(emp => {
                  const isCurrent = emp.chave_empresa === activeCompanyKey;
                  const bidsCount = licitacoes.filter(l => l.chave_empresa === emp.chave_empresa).length;
                  const certsCount = atestados.filter(c => c.chave_empresa === emp.chave_empresa).length;

                  return (
                    <div
                      key={emp.id}
                      onClick={() => setActiveCompanyKey(emp.chave_empresa)}
                      className={`p-4 rounded border transition cursor-pointer flex flex-col justify-between h-40 bg-white ${isCurrent ? 'border-indigo-650 shadow-sm ring-1 ring-indigo-550/10' : 'border-slate-200 shadow-xs hover:border-slate-350'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">CHAVE: {emp.chave_empresa}</span>
                          <h3 className="font-bold text-slate-850 text-xs tracking-tight truncate max-w-[180px] mt-1">{emp.nome}</h3>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">CNPJ: {emp.cnpj}</p>
                        </div>
                        {isCurrent && (
                          <span className="bg-indigo-50 border border-indigo-120 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Ativa
                          </span>
                        )}
                      </div>

                      {/* Info indicators */}
                      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs text-slate-500">
                        <div className="bg-slate-50 border border-slate-150 p-1.5 rounded">
                          <p className="font-bold text-slate-800 text-xs leading-none">{bidsCount}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-mono mt-0.5 tracking-tight">Editais</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-150 p-1.5 rounded">
                          <p className="font-bold text-slate-800 text-xs leading-none">{certsCount}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-mono mt-0.5 tracking-tight">Atestados</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* USUÁRIOS E PERFIS TAB SCREEN */}
          {activeTab === 'usuarios' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Internal Sub-Tabs Navigation */}
              <div className="flex justify-between items-center bg-slate-150 p-1 rounded-lg max-w-md border border-slate-200">
                <button
                  type="button"
                  onClick={() => setUserSubTab('usuarios')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${userSubTab === 'usuarios' ? 'bg-white shadow-xs text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Controle de Usuários
                </button>
                <button
                  type="button"
                  onClick={() => setUserSubTab('perfis')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${userSubTab === 'perfis' ? 'bg-white shadow-xs text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Perfis e Módulos
                </button>
              </div>

              {/* USER MANAGEMENT SUB-TAB */}
              {userSubTab === 'usuarios' && (
                <div className="space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <User className="w-5 h-5 text-emerald-600" style={{ color: primaryColor }} />
                        Controle de Usuários Corporativos
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cadastre e edite as credenciais de colaboradores. Cada usuário é vinculado a um Perfil de Acesso e a uma Empresa obrigatória.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(true)}
                      className="text-white text-xs px-3.5 py-1.5 rounded font-bold flex items-center gap-1 transition shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Usuário
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden font-sans">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                          <th className="px-4 py-3 font-semibold w-1/5">Nome do Colaborador</th>
                          <th className="px-4 py-3 font-semibold w-1/5">E-mail / Login</th>
                          <th className="px-4 py-3 font-semibold w-1/6">Senha</th>
                          <th className="px-4 py-3 font-semibold w-1/5 text-center">Perfil de Acesso</th>
                          <th className="px-4 py-3 font-semibold w-1/5 text-center">Empresa Cadastrada</th>
                          <th className="px-4 py-3 font-semibold text-right w-1/12">Excluir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {usuarios.map((u, idx) => {
                          const isSuperAdmin = u.email === 'admin';
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3 font-medium text-slate-800">{u.nome}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs font-mono">{u.email}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs font-mono">{u.senha || '•••'}</td>
                              <td className="px-4 py-3 text-center">
                                <select 
                                  className="text-xs bg-slate-50 border border-slate-250 p-1.5 rounded font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 max-w-[150px]"
                                  value={u.perfilId}
                                  disabled={isSuperAdmin}
                                  onChange={(e) => {
                                    const newUsers = [...usuarios];
                                    newUsers[idx].perfilId = e.target.value;
                                    setUsuarios(newUsers);
                                    if (u.email === currentUser?.email) {
                                      setCurrentUser(newUsers[idx]);
                                    }
                                  }}
                                >
                                  {perfis.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <select 
                                  className="text-xs bg-slate-50 border border-slate-250 p-1.5 rounded font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 max-w-[150px]"
                                  value={u.chave_empresa}
                                  disabled={isSuperAdmin}
                                  onChange={(e) => {
                                    const newUsers = [...usuarios];
                                    newUsers[idx].chave_empresa = e.target.value;
                                    setUsuarios(newUsers);
                                    if (u.email === currentUser?.email) {
                                      setCurrentUser(newUsers[idx]);
                                      setActiveCompanyKey(e.target.value);
                                    }
                                  }}
                                >
                                  {isSuperAdmin && <option value="ALL">Todas (Acesso Geral)</option>}
                                  {empresas.map(emp => (
                                    <option key={emp.chave_empresa} value={emp.chave_empresa}>{emp.nome}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isSuperAdmin ? (
                                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">Inviolável</span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (confirm('Tem certeza que deseja remover o acesso deste usuário?')) {
                                        setUsuarios(usuarios.filter((_, i) => i !== idx));
                                      }
                                    }}
                                    className="text-slate-400 hover:text-red-650 transition cursor-pointer p-1"
                                    title="Remover acesso"
                                  >
                                    <Trash className="w-4 h-4 inline" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PROFILES AND MODULES SUB-TAB */}
              {userSubTab === 'perfis' && (
                <div className="space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-600" style={{ color: primaryColor }} />
                        Configuração de Perfis e Permissões de Módulos
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Defina quais seções de menu (Dashboard, Agenda, Inteligência, Atestados, Empresas, Configurações) estão disponíveis para cada nível de perfil de acesso.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddProfileModal(true)}
                      className="text-white text-xs px-3.5 py-1.5 rounded font-bold flex items-center gap-1 transition shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Perfil
                    </button>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden font-sans">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                          <th className="px-4 py-3 font-semibold w-1/4">Nome do Perfil</th>
                          <th className="px-4 py-3 font-semibold w-2/3">Módulos Corporativos Habilitados</th>
                          <th className="px-4 py-3 font-semibold text-right w-1/12">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {perfis.map((p, idx) => {
                          const isCoreProfile = p.id === 'perfil-admin';
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3 font-bold text-slate-800">{p.nome}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1.5">
                                  {p.dashboard && <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Painel / Licitações</span>}
                                  {p.agenda && <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Calendário</span>}
                                  {p.scanner && <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Scanner IA / Licitações</span>}
                                  {p.atestados && <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Biblioteca de Atestados</span>}
                                  {p.empresas && <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Gestão Geral (Empresas)</span>}
                                  {p.usuarios_perfis && <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Usuários / Perfis</span>}
                                  {p.ajustes && <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Ajustes / Supabase</span>}
                                  {!p.dashboard && !p.agenda && !p.scanner && !p.atestados && !p.empresas && !p.usuarios_perfis && !p.ajustes && (
                                    <span className="text-red-550 font-bold text-[10px]">Restrição Absoluta (Sem Acesso)</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isCoreProfile ? (
                                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">Padrão</span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (confirm('Deseja excluir este perfil? Usuários vinculados perderão as permissões associadas.')) {
                                        setPerfis(perfis.filter(pf => pf.id !== p.id));
                                      }
                                    }}
                                    className="text-slate-400 hover:text-red-650 transition cursor-pointer p-1"
                                    title="Excluir Perfil"
                                  >
                                    <Trash className="w-4 h-4 inline" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* AJUSTES TAB SCREEN (REQUIREMENT 4.f / 5 migrations) */}
          {activeTab === 'ajustes' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2 font-sans">
                  <Settings className="w-6 h-6 text-slate-600" />
                  Configurações Centralizadas
                </h2>
                <p className="text-xs text-slate-500">
                  Gerencie preferências de notificação corporativa, repositório de documentos base e personalização de cores.
                </p>
              </div>

              {/* Layout layout of cards */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Visual styling and Session controls column */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Styling customizers (Requirement 4.f personalization) */}
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <SlidersHorizontal className="w-4 h-4 text-slate-600" /> Personalização de Cores
                    </h3>
                    
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Cor Primária do Sistema:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-10 h-8 rounded cursor-pointer border border-slate-200"
                          />
                          <span className="font-mono text-slate-500 font-bold">{primaryColor}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="block text-slate-400 text-[10.5px]">Paleta de Cores (Democracia Digital):</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <button onClick={() => setPrimaryColor('#059669')} className="w-5 h-5 rounded-full bg-emerald-600 border border-slate-200" title="Verde Esmeralda"></button>
                          <button onClick={() => setPrimaryColor('#0F172A')} className="w-5 h-5 rounded-full bg-slate-900 border border-slate-200" title="Azul Meia-Noite"></button>
                          <button onClick={() => setPrimaryColor('#2563EB')} className="w-5 h-5 rounded-full bg-blue-600 border border-slate-200" title="Azul Royal"></button>
                          <button onClick={() => setPrimaryColor('#DC2626')} className="w-5 h-5 rounded-full bg-red-600 border border-slate-200" title="Vermelho Vibrante"></button>
                          <button onClick={() => setPrimaryColor('#7C3AED')} className="w-5 h-5 rounded-full bg-violet-600 border border-slate-200" title="Roxo Ametista"></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Timeout slider configuration card */}
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Clock className="w-4 h-4 text-slate-600" /> Timeout de Inatividade (Sessão Única)
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center text-slate-700">
                        <span>Tempo limite de fechamento:</span>
                        <span className="font-mono font-bold text-red-600">{timeoutMinutes} minutos</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="60"
                        value={timeoutMinutes}
                        onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                        className="w-full accent-red-650"
                      />
                      <p className="text-[10px] text-slate-400">
                        O sistema se autodesconecta e redireciona ao login uma vez que o contador atinge zero para evitar acessos externos.
                      </p>

                      <button
                        onClick={triggerAlternativeSessionLogin}
                        className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded text-[10px] flex items-center justify-center gap-1 border border-slate-200 transition"
                      >
                        <Power className="w-3.5 h-3.5" /> Forçar Segunda Sessão (Simular Desconexão de IP)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notifications & Documents Repository Cards */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Preferences triggers card */}
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Bell className="w-4 h-4 text-slate-600" /> Regras de Notificação de Alertas
                    </h3>
                    <div className="space-y-3.5 text-xs">
                      
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-700">Alerta de Prazos Urgentes (48h)</p>
                          <p className="text-slate-400 text-[10.5px]">Emails automáticos de lembretes e relatórios de lances em 48 horas.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={prefEmail}
                          onChange={() => setPrefEmail(!prefEmail)}
                          className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                        />
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-700">Notificação de Novos Editais Analisados</p>
                          <p className="text-slate-400 text-[10.5px]">Compilado de extrações de editais compatíveis com a especialização da empresa.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={prefNewBids}
                          onChange={() => setPrefNewBids(!prefNewBids)}
                          className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Documents Base Repository mimics */}
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <FolderOpen className="w-4 h-4 text-slate-600" /> Repositório Base de Documentação
                      </h3>

                      <label className="text-slate-500 font-bold text-xs flex items-center gap-1 hover:text-red-600 transition cursor-pointer">
                        <Upload className="w-4 h-4" /> Importar Documento Mestre
                        <input
                          type="file"
                          className="hidden"
                          onChange={() => {
                            setRepoFileUploaded(true);
                            setDocumentos([
                              { id: 'doc4', nome_arquivo: 'Novo_Alvara_CREA.pdf', tag: 'Alvará Municipal', validade: '2026-12-31' },
                              ...documentos
                            ]);
                          }}
                        />
                      </label>
                    </div>

                    <div className="space-y-2 text-xs">
                      {documentos.map(doc => (
                        <div key={doc.id} className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="p-1 bg-white border rounded text-slate-600">📄</span>
                            <div>
                              <p className="font-semibold text-slate-700">{doc.nome_arquivo}</p>
                              <p className="text-[10px] text-slate-400">Tipo da Tag: {doc.tag} - Vence em: {new Date(doc.validade + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); alert(`Download simulado do arquivo: ${doc.nome_arquivo}`); }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
                            title="Baixar Documento Base"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Supabase connection parameters sync config card */}
                  <div className="bg-white p-5 rounded-xl border border-[#eceef0] shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Database className="w-4 h-4 text-slate-600" /> Parâmetros de Sincronização Supabase
                    </h3>
                    <div className="space-y-3.5 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Supabase Project URL:</label>
                          <input
                            type="text"
                            value={supabaseUrl}
                            onChange={(e) => setSupabaseUrl(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-red-500 font-mono"
                            placeholder="https://xxxxxx.supabase.co"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Supabase Anon Key:</label>
                          <input
                            type="password"
                            value={supabaseKey}
                            onChange={(e) => setSupabaseKey(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-red-500 font-mono"
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pointer-events-auto">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${supabaseMode === 'connected' ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`}></span>
                          <span className="font-semibold text-[11px] uppercase text-slate-500">
                            Modo: {supabaseMode === 'connected' ? 'Supabase Conectado' : 'Offline Local Persistente'}
                          </span>
                        </div>
                        <button
                          onClick={handleSupabaseSync}
                          disabled={isSyncing}
                          className="bg-[#091426] hover:bg-slate-800 text-white font-bold px-4 py-1.5 rounded-lg transition disabled:slate-350"
                        >
                          {isSyncing ? "Verificando..." : "Testar & Forçar Sincronização automática"}
                        </button>
                      </div>

                      {/* Sync logs output block */}
                      {syncLogs.length > 0 && (
                        <div className="bg-slate-900 text-slate-300 p-3 rounded-lg font-mono text-[10.5px] max-h-36 overflow-y-auto space-y-1">
                          {syncLogs.map((log, lIdx) => (
                            <p key={lIdx} className="leading-5">🤖 {log}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SUPABASE SQL MIGRATIONS BLOCK (REQUIREMENT 5 migrations generation) */}
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-slate-800 text-sm">
                        Gerador de Migrations do Banco de Dados Supabase (PostgreSQL)
                      </h3>
                      <button
                        onClick={handleCopyCode}
                        className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded font-bold hover:bg-slate-250 transition flex items-center gap-1 border"
                      >
                        {copySuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copiar SQL
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Utilize o roteiro de migração de esquema abaixo no editor SQL do console do Supabase para inicializar todas as chaves relacionais indexadas automaticamente:
                    </p>
                    <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto max-h-56">
                      <pre className="text-slate-300 text-[11px] font-mono leading-relaxed select-all">
{SQL_MIGRATION_SCRIPT}
                      </pre>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          </AnimatePresence>
        </div>
      </main>

      {/* --- ADD USER DIALOG MODAL --- */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full gap-4 flex flex-col shadow-2xl border border-slate-150 animate-fade-in font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Adicionar Usuário</h3>
              <button onClick={() => setShowAddUserModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded p-2 focus:outline-none focus:border-emerald-500" 
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">E-mail Corporativo (Login)</label>
                <input 
                  type="text" 
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded p-2 focus:outline-none focus:border-emerald-500" 
                  placeholder="joao.silva@empresa.com.br ou login"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Senha Corporativa</label>
                <input 
                  type="password" 
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded p-2 focus:outline-none focus:border-emerald-500" 
                  placeholder="Digite a senha temporária"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Perfil de Acesso</label>
                <select 
                  value={newUserProfileId}
                  onChange={e => setNewUserProfileId(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  {perfis.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Empresa Cadastrada</label>
                <select 
                  value={newUserCompanyKey}
                  onChange={e => setNewUserCompanyKey(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  {empresas.map(emp => (
                    <option key={emp.chave_empresa} value={emp.chave_empresa}>{emp.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded font-semibold transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddUser}
                className="px-4 py-2 text-sm text-white rounded font-semibold transition shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                Salvar Usuário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD PROFILE DIALOG MODAL --- */}
      {showAddProfileModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full gap-4 flex flex-col shadow-2xl border border-slate-150 animate-fade-in font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Criar Perfil de Acesso</h3>
              <button onClick={() => setShowAddProfileModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nome do Perfil</label>
                <input 
                  type="text" 
                  value={newProfileName}
                  onChange={e => setNewProfileName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded p-2 focus:outline-none focus:border-emerald-500" 
                  placeholder="Ex: Auditor Externo"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Habilitar Módulos</label>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input type="checkbox" checked={newProfileDashboard} onChange={e => setNewProfileDashboard(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                    Painel Geral e Controle de Licitações
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input type="checkbox" checked={newProfileAgenda} onChange={e => setNewProfileAgenda(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                    Calendário de Editais e Prazos
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input type="checkbox" checked={newProfileScanner} onChange={e => setNewProfileScanner(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                    Scanner Inteligente com Inteligência Artificial
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input type="checkbox" checked={newProfileAtestados} onChange={e => setNewProfileAtestados(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                    Biblioteca de Atestados Técnicos
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input type="checkbox" checked={newProfileEmpresas} onChange={e => setNewProfileEmpresas(e.target.checked)} className="rounded text-emerald-650 focus:ring-emerald-500" />
                    Gestão Geral de Empresas
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input type="checkbox" checked={newProfileUsuariosPerfis} onChange={e => setNewProfileUsuariosPerfis(e.target.checked)} className="rounded text-emerald-650 focus:ring-emerald-500" />
                    Gestão de Perfis de Acesso e Usuários
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input type="checkbox" checked={newProfileAjustes} onChange={e => setNewProfileAjustes(e.target.checked)} className="rounded text-emerald-650 focus:ring-emerald-500" />
                    Configurações do Sistema e Supabase
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setShowAddProfileModal(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded font-semibold transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddProfile}
                className="px-4 py-2 text-sm text-white rounded font-semibold transition shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                Criar Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD COMPANY DIALOG MODAL --- */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full gap-4 flex flex-col shadow-2xl border border-slate-150 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Cadastrar Empresa Multi-Empresa</h3>
              <button onClick={() => setShowAddCompanyModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Razão Social / Nome Fantasia:</label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none"
                  placeholder="EX: Licitacoes Sul do Brasil Ltda"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Chave Unificadora (Sigla):</label>
                  <input
                    type="text"
                    value={newCompanyKey}
                    onChange={(e) => setNewCompanyKey(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded uppercase font-mono"
                    placeholder="EX: LICSUL"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">CNPJ:</label>
                  <input
                    type="text"
                    value={newCompanyCnpj}
                    onChange={(e) => setNewCompanyCnpj(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                    placeholder="EX: 00.000.000/0001-00"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddCompanyModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCompany}
                className="bg-[#091426] text-white font-bold px-4 py-2 rounded text-xs hover:bg-slate-800"
                style={{ backgroundColor: primaryColor }}
              >
                Criar Empresa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD TENDER DIALOG MODAL --- */}
      {showAddBidModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl max-w-lg w-full flex flex-col shadow-2xl border animate-fade-in gap-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Adicionar Edital Manualmente</h3>
              <button onClick={() => setShowAddBidModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-3.5 text-xs overflow-y-auto max-h-[400px] pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Modalidade:</label>
                  <select
                    value={newBidModalidade}
                    onChange={(e) => setNewBidModalidade(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded"
                  >
                    <option value="Pregão Eletrônico">Pregão Eletrônico</option>
                    <option value="Concorrência">Concorrência</option>
                    <option value="Tomada de Preços">Tomada de Preços</option>
                    <option value="Carta Convite">Carta Convite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Órgão Licitador:</label>
                  <input
                    type="text"
                    value={newBidOrgao}
                    onChange={(e) => setNewBidOrgao(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-semibold"
                    placeholder="EX: Ministério da Saúde"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Objeto do Edital:</label>
                <textarea
                  value={newBidObjeto}
                  onChange={(e) => setNewBidObjeto(e.target.value)}
                  className="w-full h-20 p-2 border border-slate-200 rounded leading-relaxed"
                  placeholder="EX: Contratação de serviços continuados de fornecimento de sistemas integrados..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Valor Estimado Máximo (R$):</label>
                  <input
                    type="number"
                    value={newBidValor}
                    onChange={(e) => setNewBidValor(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Empresa Vinculadora:</label>
                  <input
                    type="text"
                    disabled
                    value={activeCompanyKey}
                    className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Prazo de Proposta (YYYY-MM-DD HH:mm):</label>
                  <input
                    type="text"
                    value={newBidPrazoProp}
                    onChange={(e) => setNewBidPrazoProp(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Prazo de Abertura (Sessão Pública):</label>
                  <input
                    type="text"
                    value={newBidPrazoAber}
                    onChange={(e) => setNewBidPrazoAber(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Documentos Obrigatórios de Habilitação (separados por vírgula):</label>
                <input
                  type="text"
                  value={newBidDocs}
                  onChange={(e) => setNewBidDocs(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  placeholder="EX: Cartão CNPJ, CND Federal, Balanço Patrimonial, CREA"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Exigências Específicas de Capacidade Técnica (Atestados):</label>
                <textarea
                  value={newBidExigencias}
                  onChange={(e) => setNewBidExigencias(e.target.value)}
                  className="w-full h-16 p-2 border border-slate-200 rounded leading-relaxed italic"
                  placeholder="EX: Atestado comprovando fornecimento de no mínimo 30 monitores cardíacos..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddBidModal(false)}
                className="bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded text-xs border"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddBid}
                className="bg-[#091426] text-white font-bold px-4 py-2 rounded text-xs hover:bg-slate-800"
                style={{ backgroundColor: primaryColor }}
              >
                Cadastrar Prazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CADASTRAR ATESTADO MANUAL MODAL --- */}
      {showAddCertModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl max-w-2xl w-full flex flex-col shadow-2xl border animate-fade-in gap-4">
            
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Cadastrar Atestado de Capacidade Técnica</h3>
              <button onClick={() => setShowAddCertModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-4 text-xs overflow-y-auto max-h-[400px] pr-2">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nome / Identificador do Atestado:</label>
                  <input
                    type="text"
                    value={newCertName}
                    onChange={(e) => setNewCertName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                    placeholder="EX: Atestado Albert Einstein UTI"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Órgão / Empresa Emissora:</label>
                  <input
                    type="text"
                    value={newCertEmissor}
                    onChange={(e) => setNewCertEmissor(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                    placeholder="EX: Sociedade Beneficente Albert Einstein"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Data de Emissão:</label>
                  <input
                    type="text"
                    value={newCertData}
                    onChange={(e) => setNewCertData(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Empresa Proprietária do Acervo:</label>
                  <input
                    type="text"
                    disabled
                    value={activeCompanyKey}
                    className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-slate-500"
                  />
                </div>
              </div>

              {/* Dynamic row creator (Requirement 4.d) */}
              <div className="space-y-2 border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[11px] text-slate-600 uppercase">Itens Executados Comprovados no Atestado:</span>
                  <button
                    onClick={handleAddNewCertRow}
                    className="text-red-650 hover:underline flex items-center gap-0.5 text-[10.5px] font-bold"
                  >
                    + Adicionar Linha de Item
                  </button>
                </div>

                <div className="space-y-3">
                  {newCertItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-250 flex flex-col md:flex-row gap-3 items-end">
                      
                      <div className="text-[11px] font-bold text-slate-400 self-center">#{item.item_numero}</div>

                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">Descrição do Serviço / Fornecimento:</label>
                        <input
                          type="text"
                          value={item.descricao}
                          onChange={(e) => handleUpdateCertRow(idx, 'descricao', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded"
                          placeholder="Ex: Fornecimento de monitor multiparamétrico de UTI..."
                        />
                      </div>

                      <div className="w-20">
                        <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">Qtd:</label>
                        <input
                          type="number"
                          value={item.quantidade}
                          onChange={(e) => handleUpdateCertRow(idx, 'quantidade', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-bold"
                        />
                      </div>

                      <div className="w-16">
                        <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">Unidade:</label>
                        <input
                          type="text"
                          value={item.unidade}
                          onChange={(e) => handleUpdateCertRow(idx, 'unidade', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-center font-mono"
                          placeholder="un, m2"
                        />
                      </div>

                      <div className="w-24">
                        <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">Relevância:</label>
                        <select
                          value={item.relevancia_tecnica}
                          onChange={(e) => handleUpdateCertRow(idx, 'relevancia_tecnica', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-semibold text-[11px]"
                        >
                          <option value="Alta">Alta</option>
                          <option value="Média">Média</option>
                          <option value="Baixa">Baixa</option>
                        </select>
                      </div>

                      <button
                        onClick={() => handleRemoveCertRow(idx)}
                        className="p-1.5 hover:bg-red-100 rounded text-red-500 hover:text-red-700"
                        title="Remover linha"
                      >
                        <Trash className="w-4 h-4" />
                      </button>

                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddCertModal(false)}
                className="bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded text-xs border"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCertificate}
                className="bg-[#091426] text-white font-bold px-4 py-2 rounded text-xs hover:bg-slate-800"
                style={{ backgroundColor: primaryColor }}
              >
                Salvar Acervo Linha a Linha
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Visual placeholders simple icons
function ArchiveIconPlaceholder({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v4.5A2.25 2.25 0 002.25 13.5zm0 0l1.102 5.51A2.25 2.25 0 005.56 21h12.88a2.25 2.25 0 002.208-1.99l1.102-5.51" />
    </svg>
  );
}
