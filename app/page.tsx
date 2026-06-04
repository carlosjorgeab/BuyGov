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
  Filter,
  Upload,
  Copy,
  Menu,
  Lock,
  LayoutDashboard,
  MapPin,
  Banknote,
  Layers,
  Landmark,
  Flag,
  Users,
  Tags,
  BarChart3,
  Share2
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

// Helper to map UI-friendly Font names to concrete CSS font stack
function getFontFamily(fontName: string) {
  switch (fontName) {
    case 'Inter': return "'Inter', sans-serif";
    case 'Fira Code': return "'Fira Code', monospace";
    case 'Georgia': return "Georgia, serif";
    case 'Space Grotesk': return "'Space Grotesk', sans-serif";
    default: return "'Work Sans', sans-serif";
  }
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [multiSessionAlert, setMultiSessionAlert] = useState(false);

  // Styling Customization
  const [primaryColor, setPrimaryColor] = useState('#059669'); // Emerald tone mimicking Democracia Digital
  const [borderColor, setBorderColor] = useState('#eceef0');
  const [appBgColor, setAppBgColor] = useState('#F8FAFC');
  const [panelBgColor, setPanelBgColor] = useState('#FFFFFF');
  const [panelBorderColor, setPanelBorderColor] = useState('#ECEEF0');
  const [panelBorderWidth, setPanelBorderWidth] = useState(1);
  const [systemFont, setSystemFont] = useState('Work Sans');
  const [fontSizeScale, setFontSizeScale] = useState<'small' | 'normal' | 'large' | 'xlarge'>('normal');

  // Timeout settings
  const [timeoutMinutes, setTimeoutMinutes] = useState(15);
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);

  // Active Nav Tab state
  const [activeTab, setActiveTab] = useState<'visao_geral' | 'visao_mapa' | 'adesao_edital' | 'emendas' | 'projetos' | 'editais' | 'ministerios' | 'partidos' | 'deputados' | 'areas_tematicas' | 'relatorios' | 'perfis' | 'usuarios' | 'configuracoes'>('visao_geral');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123');
  const [newUserProfileId, setNewUserProfileId] = useState('perfil-analista');
  const [newUserCompanyKey, setNewUserCompanyKey] = useState('LICITATECH');

  // Sub-tabs for separating User from Profiles CRUD
  const [userSubTab, setUserSubTab] = useState<'usuarios' | 'perfis'>('usuarios');

  // Profile CRUD states
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDashboard, setNewProfileDashboard] = useState(true);
  const [newProfileAgenda, setNewProfileAgenda] = useState(true);
  const [newProfileScanner, setNewProfileScanner] = useState(true);
  const [newProfileAtestados, setNewProfileAtestados] = useState(true);
  const [newProfileEmpresas, setNewProfileEmpresas] = useState(false);
  const [newProfileUsuariosPerfis, setNewProfileUsuariosPerfis] = useState(false);
  const [newProfileAjustes, setNewProfileAjustes] = useState(false);

  // Simple CRUD controllers
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyKey, setNewCompanyKey] = useState('');
  const [newCompanyCnpj, setNewCompanyCnpj] = useState('');

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

  // Full-page edit and add state controllers (No popups requirement)
  const [editingCompany, setEditingCompany] = useState<Empresa | null>(null);
  const [isAddingCompany, setIsAddingCompany] = useState(false);

  const [editingUser, setEditingUser] = useState<PerfilUsuario | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);

  const [editingProfile, setEditingProfile] = useState<PerfilAcesso | null>(null);
  const [isAddingProfile, setIsAddingProfile] = useState(false);

  const [editingBid, setEditingBid] = useState<Licitacao | null>(null);
  const [isAddingBid, setIsAddingBid] = useState(false);

  const [editingCert, setEditingCert] = useState<AtestadoTecnico | null>(null);
  const [isAddingCert, setIsAddingCert] = useState(false);

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
      let loadedUsers: PerfilUsuario[] = [];
      if (storedUsers) {
        try {
          loadedUsers = JSON.parse(storedUsers);
        } catch (e) {
          loadedUsers = [];
        }
      }

      if (loadedUsers.length === 0) {
        loadedUsers = [...INITIAL_USERS];
      }

      // Ensure that 'admin' is always present and has correct credentials
      const adminExists = loadedUsers.some(u => u.email.toLowerCase().trim() === 'admin');
      if (!adminExists) {
        loadedUsers.push({
          email: 'admin',
          nome: 'Administrador Geral',
          senha: 'Cjl@j2326082110',
          perfilId: 'perfil-admin',
          chave_empresa: 'ALL'
        });
      } else {
        loadedUsers = loadedUsers.map(u => u.email.toLowerCase().trim() === 'admin' ? {
          ...u,
          email: 'admin',
          senha: 'Cjl@j2326082110',
          perfilId: 'perfil-admin',
          chave_empresa: 'ALL'
        } : u);
      }

      setUsuarios(loadedUsers);
      localStorage.setItem('proprocure_usuarios', JSON.stringify(loadedUsers));

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

  const hasTabPermission = (tab: string) => {
    if (!currentUser) return false;
    if (currentUser.email === 'admin') return true;
    
    const userProfile = perfis.find(p => p.id === currentUser.perfilId);
    if (!userProfile) return false;
    
    switch (tab) {
      case 'dashboard': return !!userProfile.dashboard;
      case 'agenda': return !!userProfile.agenda;
      case 'scanner': return !!userProfile.scanner;
      case 'atestados': return !!userProfile.atestados;
      case 'empresas': return !!userProfile.empresas;
      case 'usuarios': return !!userProfile.usuarios_perfis;
      case 'ajustes': return !!userProfile.ajustes;
      default: return false;
    }
  };

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
    
    const user = usuarios.find(u => u.email.toLowerCase().trim() === login.toLowerCase().trim());
    
    if (!user) {
      alert('Usuário não encontrado. Solicite acesso ao Administrador.');
      return;
    }
    
    if (user.senha && user.senha.trim() !== password.trim()) {
      alert('Senha incorreta.');
      return;
    }
    
    setCurrentUser(user);
    if (user.email.toLowerCase().trim() === 'admin') {
      // General admin can always switch and see all companies
      setActiveCompanyKey('LICITATECH');
      setActiveTab('visao_geral');
    } else if (user.chave_empresa) {
      // For general users, automatically load their company and lock it
      setActiveCompanyKey(user.chave_empresa);
      
      // Determine their first permitted tab
      const profile = perfis.find(p => p.id === user.perfilId);
      if (profile) {
        if (profile.dashboard) setActiveTab('visao_geral');
        else if (profile.agenda) setActiveTab('visao_geral');
        else if (profile.scanner) setActiveTab('visao_geral');
        else if (profile.atestados) setActiveTab('visao_geral');
        else if (profile.empresas) setActiveTab('visao_geral');
        else if (profile.usuarios_perfis) setActiveTab('usuarios');
        else if (profile.ajustes) setActiveTab('configuracoes');
      } else {
        // Fallback default
        setActiveTab('visao_geral');
      }
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
    const isEditing = usuarios.some(u => u.email.toLowerCase().trim() === newUserEmail.toLowerCase().trim());
    if (isEditing) {
      alert("Este e-mail/usuário já está cadastrado.");
      return;
    }
    const nextList: PerfilUsuario[] = [
      {
        email: newUserEmail.trim(),
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
    setNewUserCompanyKey(newUserCompanyKey || 'LICITATECH');
    setIsAddingUser(false);
  };

  const handleSaveEditUser = (updatedUser: PerfilUsuario) => {
    setUsuarios(usuarios.map(u => u.email.toLowerCase().trim() === updatedUser.email.toLowerCase().trim() ? updatedUser : u));
    setEditingUser(null);
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
    setIsAddingProfile(false);
  };

  const handleSaveEditProfile = (updatedProfile: PerfilAcesso) => {
    setPerfis(perfis.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    setEditingProfile(null);
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
    setIsAddingCompany(false);
    setActiveCompanyKey(fresh.chave_empresa);
  };

  const handleSaveEditCompany = (updatedCompany: Empresa) => {
    setEmpresas(empresas.map(e => e.id === updatedCompany.id ? updatedCompany : e));
    setEditingCompany(null);
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
    setIsAddingBid(false);
    setNewBidObjeto('');
    setNewBidOrgao('');
    setNewBidValor(50000);
  };

  const handleSaveEditBid = (updatedBid: Licitacao) => {
    setLicitacoes(licitacoes.map(b => b.id === updatedBid.id ? updatedBid : b));
    setEditingBid(null);
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
    setIsAddingCert(false);
    setNewCertName('');
    setNewCertEmissor('');
    setNewCertObs('');
    setNewCertItems([
      { item_numero: 1, descricao: 'Fornecimento continuado de material', quantidade: 50, unidade: 'un', relevancia_tecnica: 'Média' }
    ]);
  };

  const handleSaveEditCert = (updatedCert: AtestadoTecnico) => {
    setAtestados(atestados.map(c => c.id === updatedCert.id ? updatedCert : c));
    setEditingCert(null);
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
    setActiveTab('visao_geral');
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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] text-slate-900 transition-colors" style={{ fontFamily: getFontFamily(systemFont) }}>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Fira+Code:wght@400;500;700&family=Georgia&display=swap');
        
        html {
          font-size: ${fontSizeScale === 'small' ? '12.5px' : fontSizeScale === 'large' ? '17px' : fontSizeScale === 'xlarge' ? '19.5px' : '15px'} !important;
        }
        body, .bg-slate-50, .bg-\\[\\#F8FAFC\\], .min-h-screen.bg-\\[\\#F8FAFC\\] {
          background-color: ${appBgColor} !important;
        }
        .bg-white, .bg-slate-50\\/50 {
          background-color: ${panelBgColor} !important;
        }
        /* Style standard panel borders */
        .border, .border-slate-100, .border-slate-150, .border-slate-200, .border-slate-300, .border-\\[\\#eceef0\\] {
          border-color: ${panelBorderColor} !important;
          border-width: ${panelBorderWidth}px !important;
        }
        /* Ensure table header backgrounds remain pleasant */
        .bg-slate-50, .hover\\:bg-slate-50\\/50:hover, .hover\\:bg-slate-50:hover {
          background-color: ${appBgColor === '#FFFFFF' || appBgColor === '#ffffff' ? '#F1F5F9' : appBgColor} !important;
        }
        /* Correct text colors for dark themes dynamically to keep contrast high */
        ${(appBgColor === '#0B0F19' || appBgColor === '#000000' || panelBgColor === '#161F30' || panelBgColor === '#111111') ? `
          .text-slate-800, .text-slate-700, .text-slate-900, .text-slate-600 {
            color: #F1F5F9 !important;
          }
          .text-slate-500, .text-slate-400 {
            color: #94A3B8 !important;
          }
          label, h1, h2, h3, h4, h5, th, span, p, td {
            color: #F1F5F9 !important;
          }
          input, select, textarea {
            background-color: ${appBgColor} !important;
            color: #F1F5F9 !important;
            border-color: ${panelBorderColor} !important;
          }
        ` : ''}
      `}} />
      
      {/* --- DESKTOP FIXED SIDEBAR NAVIGATION --- */}
      <aside className="hidden md:flex min-w-[260px] max-w-[260px] bg-slate-50 flex-col text-slate-600 relative z-40 border-r border-slate-200 shadow-sm">
        {/* Profile Card */}
        <div className="flex flex-col items-center pt-10 pb-6 border-b border-slate-200/50">
          <div className="w-24 h-24 relative mb-3 rounded-full overflow-hidden border-4 border-white shadow-sm">
            <Image src="https://picsum.photos/seed/carol/200/200" alt="Carol Dartora" fill className="object-cover" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Carol Dartora</h2>
          <p className="text-xs font-bold text-[#E60000] uppercase tracking-wider mt-1">PT - PR</p>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {[
            { id: 'visao_geral', label: 'Visão Geral', icon: LayoutDashboard },
            { id: 'visao_mapa', label: 'Visão Mapa', icon: MapPin },
            { id: 'adesao_edital', label: 'Adesão Edital', icon: FileText },
            { id: 'emendas', label: 'Emendas', icon: Banknote },
            { id: 'projetos', label: 'Projetos', icon: Layers },
            { id: 'editais', label: 'Editais', icon: FileText },
            { id: 'ministerios', label: 'Ministérios', icon: Landmark },
            { id: 'partidos', label: 'Partidos', icon: Flag },
            { id: 'deputados', label: 'Deputados', icon: Users },
            { id: 'areas_tematicas', label: 'Áreas Temáticas', icon: Tags },
            { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
            { id: 'perfis', label: 'Perfis', icon: Shield },
            { id: 'usuarios', label: 'Usuários', icon: User },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === item.id 
                  ? 'bg-red-50 text-[#E60000] border-l-2 border-[#E60000]' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border-l-2 border-transparent'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span>{item.label}</span>
            </button>
          ))}

          <div className="pt-6 pb-2">
            <button onClick={() => setActiveTab('configuracoes')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-all border-l-2 border-transparent">
              <Settings className="w-4 h-4 shrink-0 stroke-2" />
              <span>Configurações</span>
            </button>
          </div>
        </nav>

        {/* Action Buttons & Bottom section */}
        <div className="p-4 flex flex-col gap-2 mt-auto pb-6">
          <button className="w-full py-2.5 bg-[#E60000] hover:bg-red-700 text-white text-sm font-bold rounded-md flex items-center justify-center gap-2 transition shadow-sm">
            <Plus className="w-4 h-4 stroke-[3px]" /> NOVA EMENDA
          </button>
          <button className="w-full py-2.5 bg-slate-600 hover:bg-slate-700 text-white text-sm font-bold rounded-md flex items-center justify-center gap-2 transition shadow-sm">
            <Plus className="w-4 h-4 stroke-[3px]" /> NOVO PROJETO
          </button>
          <button
            onClick={handleLogout}
            className="w-full mt-4 py-2 text-slate-400 hover:text-slate-800 text-sm font-semibold flex items-center justify-start px-2 gap-2 transition"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* --- MOBILE VIEW NAVBAR TOP --- */}
      <header className="md:hidden sticky top-0 w-full z-45 bg-white text-slate-800 border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 focus:outline-none hover:bg-slate-100 rounded transition">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="font-bold tracking-tight">Democracia Digital</h1>
        </div>
      </header>

      {/* --- MOBILE DROPDOWN MENU --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden w-full bg-slate-50 border-b border-slate-200 text-slate-700 z-40 flex flex-col shadow-xl overflow-hidden font-sans"
          >
            <div className="px-4 py-3 space-y-1">
              {['visao_geral', 'visao_mapa', 'adesao_edital', 'emendas', 'projetos', 'editais', 'ministerios', 'partidos', 'deputados', 'areas_tematicas', 'relatorios', 'perfis', 'usuarios'].map(id => (
                <button key={id} onClick={() => { setActiveTab(id as any); setMobileMenuOpen(false); }} className="w-full text-left py-2 font-semibold">
                  {id.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DESKTOP HIGH-DENSITY HEADERS AND CONTENT WRAPPERS --- */}
      <main className="flex-grow flex flex-col min-h-screen bg-[#F9FAFB]">
        {/* Universal Desk/Header */}
        <header className="hidden md:flex h-[72px] bg-white border-b border-slate-200 px-6 items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center -ml-2">
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 0V40M0 20H40" stroke="#0F172A" strokeWidth="6" />
                  <path d="M20 0L40 20L20 40L0 20L20 0Z" stroke="#E60000" strokeWidth="6" />
                  <circle cx="20" cy="20" r="10" fill="#0EA5E9" />
                </svg>
              </div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center">
                DEMOCRACIA DIGITAL 
                <span className="text-slate-300 mx-3 font-normal text-2xl leading-none">|</span>
                <span className="text-slate-500 font-medium text-[15px]">Painel do Parlamentar</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <select className="border border-slate-200 bg-white text-slate-700 text-sm font-bold py-2.5 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-200 shadow-sm min-w-[200px]">
                <option>Carol Dartora (PT-PR)</option>
              </select>
              <div className="relative shadow-sm rounded-full">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar emendas e projetos..." 
                  className="pl-10 pr-4 py-2.5 w-72 border border-slate-200 bg-slate-50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden shrink-0">
               <User className="w-6 h-6 text-white/90" />
            </div>
          </div>
        </header>

        {/* --- MAIN INNER CONTENT WRAPPER --- */}
        <div className="flex-grow overflow-y-auto px-4 md:px-6 py-5 mx-auto w-full max-w-[1600px] relative">
          <AnimatePresence mode="wait">
          
          {/* VISÃO GERAL */}
          {activeTab === 'visao_geral' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-[10px] uppercase font-bold text-red-600 tracking-wider">VISÃO CONSOLIDADA</h3>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dep. Carol Dartora</h2>
                  <p className="text-sm text-slate-500 font-medium">Gerenciamento de emendas e projetos parlamentares - 56ª Legislatura</p>
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 bg-white shadow-sm hover:bg-slate-50">
                    <Share2 className="w-4 h-4" /> Compartilhar
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-red-700">
                    <Download className="w-4 h-4" /> Gerar PDF
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" /> FILTROS INTELIGENTES</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Calendar className="w-4 h-4 text-red-500" /> ANO <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full text-xs font-bold border border-slate-200">2026</span> <span className="text-red-600 font-bold text-xs uppercase tracking-wider">TODOS</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer">
                      <MapPin className="w-4 h-4 text-slate-400" /> Município: Todos <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer">
                      <Tags className="w-4 h-4 text-slate-400" /> Verba: Todas <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer">
                      <Layers className="w-4 h-4 text-slate-400" /> Categoria: Todas <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
                <button className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> RESETAR FILTROS
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-red-50 to-white p-5 rounded-xl border border-red-100 shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 top-0 h-full w-24 bg-red-100/50 rounded-l-full -mr-12"></div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">VERBA DESTINADA (TOTAL)</h4>
                  <div className="mt-2 text-3xl font-extrabold text-slate-800 tracking-tight">R$ 25.5M</div>
                  <div className="mt-3 text-xs font-bold text-red-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Atualizado</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">TOTAL EXECUTADO</h4>
                  <div className="mt-2 text-3xl font-extrabold text-slate-800 tracking-tight">R$ 7.0M</div>
                  <div className="mt-3 text-xs font-bold text-red-600 flex items-center gap-1"><BarChart3 className="w-3 h-3" /> 27% de execução</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">A EMPENHAR</h4>
                  <div className="mt-2 text-3xl font-extrabold text-slate-800 tracking-tight">R$ 18.6M</div>
                  <div className="mt-3 text-xs font-medium text-emerald-600 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Disponível para empenho</div>
                </div>
                <div className="bg-red-600 p-5 rounded-xl shadow-md text-white">
                  <h4 className="text-[10px] uppercase font-bold text-red-200 tracking-wider">INICIATIVAS ATIVAS</h4>
                  <div className="mt-1 text-4xl font-extrabold tracking-tight">5</div>
                  <div className="mt-2 text-xs font-medium text-white flex items-center gap-1"><Tags className="w-3 h-3" /> Meta de execução acelerada</div>
                </div>
              </div>

              {/* Charts area */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="font-bold text-slate-800">Histórico de Execução</h3>
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-yellow-400 rounded-sm"></div> Empenhado</span>
                      <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-600 rounded-sm"></div> Pago</span>
                    </div>
                  </div>
                  <div className="h-48 border-b-2 border-slate-100 flex items-end gap-2 justify-between px-2">
                    {/* Mock Bars */}
                    <div className="flex flex-col items-center gap-1 w-full"><div className="w-full bg-red-600 h-[2%]" /><div className="w-full bg-yellow-400 h-[2%]" /></div>
                    <div className="flex flex-col items-center gap-1 w-full"><div className="w-full bg-red-600 h-[4%]" /><div className="w-full bg-yellow-400 h-[10%]" /></div>
                    <div className="flex flex-col items-center gap-1 w-full"><div className="w-full bg-red-600 h-[15%]" /></div>
                    <div className="flex flex-col items-center gap-1 w-full"><div className="w-full bg-red-600 h-[5%]" /><div className="w-full bg-yellow-400 h-[2%]" /></div>
                    <div className="flex flex-col items-center gap-1 w-full"><div className="w-full bg-red-600 h-[80%]" /></div>
                    <div className="flex flex-col items-center gap-1 w-full"><div className="w-full bg-red-600 h-[2%]" /></div>
                  </div>
                  <div className="flex justify-between px-2 mt-4 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                    <span className="w-full text-center">JAN</span><span className="w-full text-center">FEV</span><span className="w-full text-center">MAR</span><span className="w-full text-center">ABR</span><span className="w-full text-center">MAI</span><span className="w-full text-center">JUN</span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative">
                  <div className="w-full flex justify-between absolute top-6 px-6">
                    <h3 className="font-bold text-slate-800 text-sm">Impacto Social</h3>
                    <h3 className="text-xs text-slate-500 font-medium">Foco por Área Temática</h3>
                  </div>
                  {/* Mock Donut */}
                  <div className="relative w-40 h-40 mt-6 rounded-full border-[16px] border-slate-100 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-[16px] border-red-600 border-t-transparent border-r-transparent transform -rotate-45"></div>
                    <div className="absolute inset-0 rounded-full border-[16px] border-blue-600 border-b-transparent border-l-transparent transform rotate-12"></div>
                    <div className="text-center">
                       <div className="text-lg font-extrabold text-slate-800">R$ 25.5M</div>
                       <div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">TOTAL</div>
                    </div>
                  </div>
                  <div className="w-full mt-10 space-y-3">
                    <div className="flex justify-between text-xs font-semibold text-slate-600"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-600"></div> Saúde</span> <span className="font-bold text-slate-800">59%</span></div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Educação</span> <span className="font-bold text-slate-800">29%</span></div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Infraestrutura</span> <span className="font-bold text-slate-800">12%</span></div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Relação de Emendas Parlamentares</h3>
                    <p className="text-xs text-slate-500 font-medium">Listagem filtrada com base nas seleções do painel</p>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Buscar por objeto, beneficiário..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-red-500 focus:outline-none w-72" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-[#F8FAFC] text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-bold border-b border-slate-200">DATA</th>
                        <th className="px-6 py-4 font-bold border-b border-slate-200">OBJETO / BENEFICIÁRIO</th>
                        <th className="px-6 py-4 font-bold border-b border-slate-200">MUNICÍPIO</th>
                        <th className="px-6 py-4 font-bold border-b border-slate-200">TIPO / CATEGORIA</th>
                        <th className="px-6 py-4 font-bold border-b border-slate-200">PROJETO VINCULADO</th>
                        <th className="px-6 py-4 font-bold border-b border-slate-200">VALOR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">27/05/2026</td>
                        <td className="px-6 py-4"><p className="font-bold text-slate-800">CONSTRUÇÃO DE ESCOLAS PÚBLICAS</p><p className="text-xs text-slate-500">Beneficiário: SEDUC</p></td>
                        <td className="px-6 py-4 font-medium text-slate-800">Campo Mourão - PR</td>
                        <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border border-slate-200 block w-max mb-1">INDIVIDUAIS (RP 6)</span><span className="text-[10px] text-slate-400 font-semibold">Sem vínculo</span></td>
                        <td className="px-6 py-4 text-xs text-slate-400 italic">Sem vínculo</td>
                        <td className="px-6 py-4 font-bold text-slate-800">R$ 5.800.000,00</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">22/04/2026</td>
                        <td className="px-6 py-4"><p className="font-bold text-slate-800">COSTRÇÃO DE UMA SUBESTAÇÃO DE ENERGIA</p><p className="text-xs text-slate-500">Beneficiário: ESCOLA ESTADUAL</p></td>
                        <td className="px-6 py-4 font-medium text-slate-800">São José dos Pinhais - PR</td>
                        <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border border-slate-200 block w-max mb-1">DE RELATOR (RP 9)</span><span className="text-[10px] text-red-500 font-semibold">Infraestrutura</span></td>
                        <td className="px-6 py-4 text-xs text-slate-400 italic">Sem vínculo</td>
                        <td className="px-6 py-4 font-bold text-slate-800">R$ 3.000.000,00</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">12/04/2026</td>
                        <td className="px-6 py-4"><p className="font-bold text-slate-800">Construção de Posto de Saúde no Bairro Conceição</p><p className="text-xs text-slate-500">Beneficiário: Prefeitura Municipal</p></td>
                        <td className="px-6 py-4 font-medium text-slate-800">Curitiba - PR</td>
                        <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border border-slate-200 block w-max mb-1">INDIVIDUAIS (RP 6)</span><span className="text-[10px] text-red-500 font-semibold">Saúde</span></td>
                        <td className="px-6 py-4 text-xs text-slate-400 italic">Sem vínculo</td>
                        <td className="px-6 py-4 font-bold text-slate-800">R$ 15.000.000,00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ADESÃO EDITAL */}
          {activeTab === 'adesao_edital' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 max-w-4xl mx-auto py-4">
              <div>
                <h3 className="text-[10px] uppercase font-bold text-red-600 tracking-wider">NOVA ADESÃO</h3>
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Adesão Edital</h2>
              </div>
              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2">SELECIONE O EDITAL</label>
                  <select className="w-full bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20">
                    <option>Selecione um edital...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2">SELECIONE O MINISTÉRIO</label>
                  <select className="w-full bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20">
                    <option>Selecione um ministério...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2">SELECIONE A AÇÃO</label>
                  <select className="w-full bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20">
                    <option>Selecione uma ação...</option>
                  </select>
                </div>
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2">A) NOME DA ENTIDADE OU ENTE PÚBLICO</label>
                  <input type="text" className="w-full bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2">B) CNPJ</label>
                  <input type="text" placeholder="00.000.000/0000-00" className="w-full bg-slate-50 text-slate-400 text-sm font-medium border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                </div>
                
                <div className="border border-slate-100 rounded-xl p-5 mt-4">
                  <h4 className="text-xs font-bold text-red-600 tracking-wider uppercase mb-4">CONTATO DA ENTIDADE</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 tracking-wider mb-1">NOME COMPLETO</label>
                      <input type="text" placeholder="Nome do responsável" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 tracking-wider mb-1">TELEFONE</label>
                      <input type="text" placeholder="(00) 00000-0000" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 tracking-wider mb-1">E-MAIL</label>
                      <input type="email" placeholder="contato@entidade.org" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2">C) NOME DO PROJETO</label>
                  <input type="text" className="w-full bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2">D) RESUMO / OBJETO DO PROJETO (NO MÁXIMO 3 LINHAS)</label>
                  <textarea rows={3} className="w-full bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20"></textarea>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2">E) DESCRIÇÃO DE COMO PRETENDE DESENVOLVER O PROJETO</label>
                  <textarea rows={5} className="w-full bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20"></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2">COMO FICOU SABENDO?</label>
                  <select className="w-full bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20">
                    <option>Selecione uma opção...</option>
                  </select>
                </div>

              </div>
            </motion.div>
          )}

          {/* EMENDAS */}
          {activeTab === 'emendas' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="flex justify-between items-end border-b border-slate-200 pb-5">
                <div>
                  <h3 className="text-[10px] uppercase font-bold text-red-600 tracking-wider">GESTÃO FINANCEIRA</h3>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Minhas Emendas</h2>
                  <p className="text-sm text-slate-500 font-medium">Acompanhamento de emendas e orçamentos destinados</p>
                </div>
                <button className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-red-700">
                  <Plus className="w-4 h-4 stroke-[3px]" /> Nova Emenda
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <div className="relative w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Buscar emendas..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 bg-slate-50" />
                  </div>
                </div>
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-[#F8FAFC] text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-5 py-4 border-b border-slate-200">DATA</th>
                      <th className="px-5 py-4 border-b border-slate-200">OBJETO</th>
                      <th className="px-5 py-4 border-b border-slate-200">MUNICÍPIO</th>
                      <th className="px-5 py-4 border-b border-slate-200">BENEFICIÁRIO</th>
                      <th className="px-5 py-4 border-b border-slate-200">AUTOR</th>
                      <th className="px-5 py-4 border-b border-slate-200">TIPO</th>
                      <th className="px-5 py-4 border-b border-slate-200">PROJETO VINCULADO</th>
                      <th className="px-5 py-4 border-b border-slate-200">VALOR</th>
                      <th className="px-5 py-4 border-b border-slate-200">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium text-xs">
                    {[
                      { date: '27/05/2026', title: 'CONSTRUÇÃO DE ESCOLAS PÚBLICAS', city: 'Campo Mourão - PR', ben: 'SEDUC', author: 'Dep. Carol Dartora', type: 'INDIVIDUAIS (RP 6)', proj: '-', val: 'R$ 5.800.000,00' },
                      { date: '11/04/2026', title: 'Construção de Centro de Assistência Psicosocial', city: 'Cafeara - PR', ben: 'Prefeitura Municipal de Rio Grande', author: 'Carol Dartora', type: 'INDIVIDUAIS (RP 6)', proj: '-', val: 'R$ 1.350.000,00' },
                      { date: '22/04/2026', title: 'COSTRÇÃO DE UMA SUBESTAÇÃO DE ENERGIA', city: 'São José dos Pinhais - PR', ben: 'ESCOLA ESTADUAL', author: 'DEP. CAROL DARTORA', type: 'DE RELATOR (RP 9)', proj: '-', val: 'R$ 3.000.000,00' },
                      { date: '12/04/2026', title: 'Construção de Posto de Saúde no Bairro Conceição', city: 'Curitiba - PR', ben: 'Prefeitura Municipal', author: 'Carol Dartora', type: 'INDIVIDUAIS (RP 6)', proj: '-', val: 'R$ 15.000.000,00' },
                      { date: '30/03/2026', title: 'Reforma e Ampliação de Escolas Municipais', city: 'Antônio Olinto - PR', ben: 'Porto Alegre - RS', author: 'DEP. CAROL DARTORA', type: 'INDIVIDUAIS (RP 6)', proj: '-', val: 'R$ 1.365.600,00' },
                      { date: '30/05/2026', title: 'REFORMAS DE ESCOLAS MUNICIPAIS', city: 'Centenário do Sul - PR', ben: 'ESCOLAS MUNICIPAIS DO ESTADO', author: 'DEP. CAROL DARTORA', type: 'DE BANCADA (RP 7)', proj: '-', val: 'R$ 350.000,00' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-5 py-4 text-[11px] font-mono text-slate-500">{row.date}</td>
                        <td className="px-5 py-4 font-bold max-w-[200px] truncate" title={row.title}>{row.title}</td>
                        <td className="px-5 py-4">{row.city}</td>
                        <td className="px-5 py-4 max-w-[150px] truncate" title={row.ben}>{row.ben}</td>
                        <td className="px-5 py-4">{row.author}</td>
                        <td className="px-5 py-4"><span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border border-slate-200">{row.type}</span></td>
                        <td className="px-5 py-4 text-slate-400">{row.proj}</td>
                        <td className="px-5 py-4 font-bold">{row.val}</td>
                        <td className="px-5 py-4 flex items-center gap-3">
                          <button className="text-slate-400 hover:text-blue-600"><RefreshCw className="w-3.5 h-3.5" /></button>
                          <button className="text-slate-400 hover:text-slate-800"><Edit className="w-3.5 h-3.5" /></button>
                          <button className="text-slate-400 hover:text-red-600"><Trash className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* USUÁRIOS */}
          {activeTab === 'usuarios' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="flex justify-between items-end border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2"><Users className="w-6 h-6 text-red-600 stroke-[2.5px]" /> CADASTRO DE USUÁRIOS</h2>
                  <p className="text-sm text-slate-500 font-medium">Gerencie os usuários do sistema e seus acessos</p>
                </div>
                <button className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-red-700">
                  <Plus className="w-4 h-4 stroke-[3px]" /> Novo Usuário
                </button>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-[#F8FAFC] text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4 border-b border-slate-200">E-mail / Usuário</th>
                      <th className="px-6 py-4 border-b border-slate-200">Perfil</th>
                      <th className="px-6 py-4 border-b border-slate-200">Deputado</th>
                      <th className="px-6 py-4 border-b border-slate-200 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium text-sm">
                    {[
                      { email: 'adv.leandroneves@gmail.com', perfil: 'Emendas', dep: 'Carol Dartora' },
                      { email: 'caroldartora13@gmail.com', perfil: 'Edital', dep: 'Carol Dartora' },
                      { email: 'carla.deputadacarol@@gmail.com', perfil: 'Padrao', dep: 'Carol Dartora' },
                      { email: 'franklin', perfil: 'Acesso Total', dep: 'Todos', admin: true },
                      { email: 'leandrobrasilia13@gmail.com', perfil: 'Emendas', dep: 'Carol Dartora' },
                      { email: 'carlosjorgeab@gmail.com', perfil: 'Administrador', dep: 'Carol Dartora' },
                      { email: 'admin', perfil: 'Acesso Total', dep: 'Todos', admin: true },
                    ].map((u, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 font-bold flex items-center gap-3">
                          {u.email} 
                          {u.admin && <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-black tracking-widest uppercase">ADMIN</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-500">{u.perfil}</td>
                        <td className="px-6 py-4 text-slate-500">{u.dep}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-3">
                            <button className="text-slate-400 hover:text-slate-800"><Edit className="w-4 h-4" /></button>
                            <button className="text-slate-400 hover:text-red-600"><Trash className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* PERFIS */}
          {activeTab === 'perfis' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="flex justify-between items-end border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2"><Shield className="w-6 h-6 text-red-600 stroke-[2.5px]" /> CADASTRO DE PERFIS</h2>
                  <p className="text-sm text-slate-500 font-medium">Gerencie os perfis de acesso e suas permissões</p>
                </div>
                <button className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-red-700">
                  <Plus className="w-4 h-4 stroke-[3px]" /> Novo Perfil
                </button>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-[#F8FAFC] text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4 border-b border-slate-200 w-48">Nome do Perfil</th>
                      <th className="px-6 py-4 border-b border-slate-200">Permissões</th>
                      <th className="px-6 py-4 border-b border-slate-200 text-right w-24">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium text-sm">
                    {[
                      { nome: 'Edital', perms: [{t: 'Visão Geral'}, {t: 'Visão Mapa'}, {t: 'Adesão Edital'}, {t: 'Cadastro de Ministérios', c:'red'}, {t: 'Cadastro de Editais', c:'red'}] },
                      { nome: 'Emendas', perms: [{t: 'Visão Geral'}, {t: 'Visão Mapa'}, {t: 'Adesão Edital'}, {t: 'Emendas', c:'red'}, {t: 'Cadastro de Editais', c:'red'}, {t: 'Cadastro de Ministérios', c:'red'}] },
                      { nome: 'Projetos', perms: [{t: 'Visão Geral'}, {t: 'Visão Mapa'}, {t: 'Adesão Edital'}, {t: 'Projetos', c:'red'}] },
                      { nome: 'Administrador', perms: [{t: 'Visão Geral'}, {t: 'Visão Mapa'}, {t: 'Adesão Edital'}, {t: 'Cadastro de Ministérios', c: 'red'}, {t: 'Projetos', c:'red'}, {t: 'Cadastro de Usuários', c:'red'}, {t: 'Configurações', c:'red'}, {t: 'Relatórios', c:'red'}, {t: 'Emendas', c:'red'}, {t: 'Cadastro de Editais', c:'red'}, {t: 'Cadastro de Perfis', c:'red'}, {t: 'Cadastro de Deputados', c:'red'}, {t: 'Cadastro de Partidos', c:'red'}, {t: 'Cadastro de Áreas Temáticas', c:'red'}] },
                      { nome: 'Padrao', perms: [{t: 'Visão Geral'}, {t: 'Visão Mapa'}, {t: 'Adesão Edital'}, {t: 'Projetos', c:'red'}, {t: 'Emendas', c:'red'}, {t: 'Cadastro de Ministérios', c:'red'}, {t: 'Cadastro de Editais', c:'red'}] },
                    ].map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 font-bold align-top">{p.nome}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                             {p.perms.map((perm, ix) => (
                               <span key={ix} className={`px-2.5 py-1 text-xs font-semibold rounded-md ${perm.c === 'red' ? 'text-red-500 bg-red-50' : 'text-slate-500 bg-slate-100'}`}>{perm.t}</span>
                             ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex justify-end gap-3 mt-1">
                            <button className="text-slate-400 hover:text-slate-800"><Edit className="w-4 h-4" /></button>
                            <button className="text-slate-400 hover:text-red-600"><Trash className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}\n          {/* CONGIGURAÇÕES TAB */}
          {activeTab === 'configuracoes' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5 max-w-4xl mx-auto w-full pb-10">
              <div className="flex justify-between items-end border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <Settings className="w-6 h-6 text-red-600 stroke-[2.5px]" /> CONFIGURAÇÕES DO SISTEMA
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">Ajuste de cores, temas, fontes e comportamento</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8 font-sans">
                {/* Visual Colors Area */}
                <div>
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-4 border-b pb-2">APARÊNCIA VISUAL - CORES</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Cor Primária (Header/Navbar Mobile)</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-16 p-1 bg-white border border-slate-200 rounded cursor-pointer shrink-0" />
                        <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full text-slate-700 text-sm font-mono border border-slate-200 rounded px-3 py-2 bg-slate-50 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Fundo Geral do App (Background)</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={appBgColor} onChange={(e) => setAppBgColor(e.target.value)} className="h-10 w-16 p-1 bg-white border border-slate-200 rounded cursor-pointer shrink-0" />
                        <input type="text" value={appBgColor} onChange={(e) => setAppBgColor(e.target.value)} className="w-full text-slate-700 text-sm font-mono border border-slate-200 rounded px-3 py-2 bg-slate-50 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Fundo dos Painéis/Cartões</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={panelBgColor} onChange={(e) => setPanelBgColor(e.target.value)} className="h-10 w-16 p-1 bg-white border border-slate-200 rounded cursor-pointer shrink-0" />
                        <input type="text" value={panelBgColor} onChange={(e) => setPanelBgColor(e.target.value)} className="w-full text-slate-700 text-sm font-mono border border-slate-200 rounded px-3 py-2 bg-slate-50 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Borders Area */}
                <div>
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-4 border-b pb-2">APARÊNCIA VISUAL - BORDAS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Cor da Borda dos Painéis</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={panelBorderColor} onChange={(e) => setPanelBorderColor(e.target.value)} className="h-10 w-16 p-1 bg-white border border-slate-200 rounded cursor-pointer shrink-0" />
                        <input type="text" value={panelBorderColor} onChange={(e) => setPanelBorderColor(e.target.value)} className="w-full text-slate-700 text-sm font-mono border border-slate-200 rounded px-3 py-2 bg-slate-50 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Espessura da Borda (px)</label>
                      <input type="range" min="0" max="5" value={panelBorderWidth} onChange={(e) => setPanelBorderWidth(parseInt(e.target.value))} className="w-full mt-2 accent-red-600" />
                      <div className="text-right text-xs text-slate-500 font-bold mt-1">{panelBorderWidth}px</div>
                    </div>
                  </div>
                </div>

                {/* Typography Area */}
                <div>
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-4 border-b pb-2">TIPOGRAFIA</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Fonte Principal do Sistema</label>
                      <select value={systemFont} onChange={(e) => setSystemFont(e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-red-500">
                        <option value="Inter">Inter (Sans-Serif - Google)</option>
                        <option value="Roboto">Roboto (Clássica - Padrão Android)</option>
                        <option value="Work Sans">Work Sans (Geral Default)</option>
                        <option value="Open Sans">Open Sans (Alta Leiturabilidade)</option>
                        <option value="Arial, sans-serif">Arial (Clássica Web)</option>
                        <option value="'JetBrains Mono', monospace">JetBrains Mono (Monoespaçada)</option>
                        <option value="'Space Grotesk', sans-serif">Space Grotesk (Moderna e Larga)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Escala de Fonte Geral</label>
                      <select value={fontSizeScale} onChange={(e) => setFontSizeScale(e.target.value as any)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-red-500">
                        <option value="small">Menor (Compacta 85%)</option>
                        <option value="normal">Normal (100% - Padrão)</option>
                        <option value="large">Grande (115% - Melhor Leitura)</option>
                        <option value="xlarge">Extra Grande (130% - Acessibilidade)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Security Section */}
                <div className="pt-2">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-4 border-b pb-2">SEGURANÇA DA SESSÃO</h3>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Timeout Automático (Minutos)</label>
                    <input type="number" min="5" max="1440" value={timeoutMinutes} onChange={(e) => setTimeoutMinutes(parseInt(e.target.value))} className="w-full max-w-[200px] border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none" />
                    <p className="text-xs text-slate-400 mt-1">O usuário será desconectado automaticamente após esta inatividade.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </main>




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
