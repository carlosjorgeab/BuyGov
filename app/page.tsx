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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agenda' | 'scanner' | 'atestados' | 'empresas' | 'usuarios' | 'ajustes'>('dashboard');
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
      setActiveTab('dashboard');
    } else if (user.chave_empresa) {
      // For general users, automatically load their company and lock it
      setActiveCompanyKey(user.chave_empresa);
      
      // Determine their first permitted tab
      const profile = perfis.find(p => p.id === user.perfilId);
      if (profile) {
        if (profile.dashboard) setActiveTab('dashboard');
        else if (profile.agenda) setActiveTab('dashboard');
        else if (profile.scanner) setActiveTab('dashboard');
        else if (profile.atestados) setActiveTab('dashboard');
        else if (profile.empresas) setActiveTab('dashboard');
        else if (profile.usuarios_perfis) setActiveTab('usuarios');
        else if (profile.ajustes) setActiveTab('ajustes');
      } else {
        // Fallback default
        setActiveTab('dashboard');
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
      <aside className="hidden md:flex min-w-[260px] max-w-[260px] flex-col relative z-40 border-r shadow-sm transition-colors" style={{ backgroundColor: panelBgColor === '#FFFFFF' ? '#0F172A' : panelBgColor, borderColor: panelBorderColor }}>
        {/* Profile Card */}
        <div className="flex flex-col items-center pt-8 pb-6 border-b border-white/10">
          <div className="w-16 h-16 relative mb-3 bg-white rounded-xl shadow p-2 flex items-center justify-center">
            <div className="w-full h-full relative"><Image src="/buygov_logo.png" alt="BuyGov" fill className="object-contain" /></div>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">BuyGov Corp</h2>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mt-1">{currentCompany?.nome || activeCompanyKey}</p>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'agenda', label: 'Agenda & Prazos', icon: Calendar },
            { id: 'scanner', label: 'Scanner Inteligente', icon: Search },
            { id: 'atestados', label: 'Atestados Técnicos', icon: Shield },
            { id: 'empresas', label: 'Empresas & Filiais', icon: Building },
            { id: 'usuarios', label: 'Usuários & Permissões', icon: Users },
          ].map(item => {
            if (!hasTabPermission(item.id)) return null;
            return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === item.id 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0 stroke-2" />
              <span>{item.label}</span>
            </button>
          )})}

          {hasTabPermission('ajustes') && (
            <div className="pt-6 pb-2">
              <button 
               onClick={() => setActiveTab('ajustes')} 
               className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'ajustes' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                <Settings className="w-4 h-4 shrink-0 stroke-2" />
                <span>Configurações</span>
              </button>
            </div>
          )}
        </nav>

        {/* Action Buttons & Bottom section */}
        <div className="p-4 flex flex-col gap-2 mt-auto pb-6">
          <button onClick={handleSupabaseSync} disabled={isSyncing} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-md flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50">
            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />} {isSyncing ? 'Sincronizando...' : 'Sincronizar Dados'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full mt-4 py-2 text-slate-400 hover:text-white text-sm font-semibold flex items-center justify-start px-2 gap-2 transition"
          >
            <LogOut className="w-4 h-4" /> Finalizar Sessão
          </button>
        </div>
      </aside>

      {/* --- DESKTOP HIGH-DENSITY HEADERS AND CONTENT WRAPPERS --- */}
      <main className="flex-grow flex flex-col min-h-screen bg-[#F8FAFC] transition-colors">
        {/* Universal Desk/Header */}
        <header className="hidden md:flex h-[72px] bg-white border-b px-6 items-center justify-between shrink-0 sticky top-0 z-30 transition-colors" style={{ backgroundColor: panelBgColor, borderColor: panelBorderColor }}>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: primaryColor }}>
              <Building className="w-5 h-5" /> 
              Plataforma de Compras Licitatech
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <select value={activeCompanyKey} onChange={(e) => setActiveCompanyKey(e.target.value)} disabled={currentUser?.email !== 'admin' && currentUser?.chave_empresa !== 'ALL'} className="border bg-slate-50 text-slate-700 text-sm font-bold py-2 px-3 rounded-full focus:outline-none disabled:opacity-60" style={{ borderColor: panelBorderColor }}>
                <option value="ALL" disabled>-- Multi-Tenancy --</option>
                {empresas.map(e => (
                  <option key={e.chave_empresa} value={e.chave_empresa}>{e.nome}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{currentUser?.nome}</p>
                <p className="text-xs font-semibold text-emerald-600">{perfis.find(p => p.id === currentUser?.perfilId)?.nome}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: primaryColor }}>
                 {currentUser?.nome?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* --- MAIN INNER CONTENT WRAPPER --- */}
        <div className="flex-grow overflow-y-auto px-4 md:px-8 py-6 w-full max-w-[1400px] mx-auto relative">
          <AnimatePresence mode="wait">
          
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-800">Visão Geral</h2>
                  <p className="text-sm text-slate-500 font-medium">Acompanhamento consolidado de {currentCompany?.nome}</p>
                </div>
                {currentUser?.email === 'admin' && (
                  <button onClick={() => setIsAddingBid(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-bold shadow-sm transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primaryColor }}>
                    <Plus className="w-4 h-4" /> Novo Certame
                  </button>
                )}
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="bg-white p-5 rounded-xl border shadow-sm" style={{ borderColor: panelBorderColor }}>
                   <p className="text-xs font-bold text-slate-500 uppercase">Licitações Analisadas</p>
                   <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{companyBids.length}</h3>
                 </div>
                 <div className="bg-white p-5 rounded-xl border shadow-sm" style={{ borderColor: panelBorderColor }}>
                   <p className="text-xs font-bold text-slate-500 uppercase">Atestados Mapeados</p>
                   <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{companyCerts.length}</h3>
                 </div>
                 <div className="bg-white p-5 rounded-xl border shadow-sm" style={{ borderColor: panelBorderColor }}>
                   <p className="text-xs font-bold text-slate-500 uppercase">Estimativa Global</p>
                   <h3 className="text-2xl font-extrabold text-emerald-600 mt-2 tracking-tight">R$ {(companyBids.reduce((a,b)=>a+Number(b.valor_estimado), 0)/1000000).toFixed(1)}M</h3>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm mt-6" style={{ borderColor: panelBorderColor }}>
                <h3 className="text-sm font-bold text-slate-800 mb-4">Certames Recentes</h3>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold">
                    <tr>
                      <th className="px-4 py-3 border-b">Órgão</th>
                      <th className="px-4 py-3 border-b">Objeto</th>
                      <th className="px-4 py-3 border-b">Data</th>
                      <th className="px-4 py-3 border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyBids.slice(0, 5).map(bid => (
                      <tr key={bid.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-800">{bid.orgao}</td>
                        <td className="px-4 py-3 truncate max-w-[200px] text-slate-600" title={bid.objeto}>{bid.objeto}</td>
                        <td className="px-4 py-3 text-slate-500">{bid.created_at}</td>
                        <td className="px-4 py-3 text-emerald-600 font-bold">{bid.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* AGENDA E PRAZOS */}
          {activeTab === 'agenda' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex justify-between items-end border-b pb-4" style={{ borderColor: panelBorderColor }}>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2"><Calendar className="text-emerald-600" /> Agenda e Prazos</h2>
                  <p className="text-sm text-slate-500 font-medium">Controle de vencimentos de propostas e aberturas</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-6 shadow-sm min-h-[400px]" style={{ borderColor: panelBorderColor }}>
                 {companyBids.length === 0 ? (
                   <div className="text-center text-slate-400 py-10">Nenhum evento agendado.</div>
                 ) : (
                   <div className="space-y-4">
                     {companyBids.map(bid => (
                       <div key={bid.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-lg hover:border-emerald-200 transition-colors">
                         <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-lg flex flex-col items-center justify-center shrink-0">
                           <span className="text-xs font-bold uppercase">{new Date(bid.prazo_proposta).toLocaleString('pt-BR', { month: 'short' })}</span>
                           <span className="text-xl font-extrabold">{new Date(bid.prazo_proposta).getDate()}</span>
                         </div>
                         <div>
                           <h4 className="font-bold text-slate-800">{bid.orgao} - {bid.modalidade}</h4>
                           <p className="text-sm text-slate-500 mt-1 line-clamp-1">{bid.objeto}</p>
                           <p className="text-xs font-semibold text-red-500 mt-2">Fechamento Proposta: {bid.prazo_proposta}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </motion.div>
          )}

          {/* SCANNER INTELIGENTE E ATESTADOS */}
          {activeTab === 'scanner' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex justify-between items-end border-b pb-4" style={{ borderColor: panelBorderColor }}>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2"><Search className="text-emerald-600" /> Scanner Inteligente de Editais</h2>
                  <p className="text-sm text-slate-500 font-medium">Extraia dados e valide requisitos com Inteligência Artificial</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: panelBorderColor }}>
                   <h3 className="text-sm font-bold text-slate-800 mb-4">Novo Processamento</h3>
                   <textarea rows={10} value={rawScannerText} onChange={(e) => setRawScannerText(e.target.value)} placeholder="Cole o texto do edital aqui..." className="w-full p-4 border text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" style={{ borderColor: panelBorderColor }}></textarea>
                   <div className="mt-4 flex gap-3">
                     <button onClick={() => handleTriggerTenderScanner(null)} disabled={scannerIsProcessing} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
                       {scannerIsProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Executar Scanner IA
                     </button>
                   </div>
                </div>
                <div className="space-y-6">
                  {scannerResult && (
                    <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: panelBorderColor }}>
                      <h3 className="text-sm font-bold text-emerald-700 mb-4 flex items-center gap-2"><Check className="w-5 h-5" /> Resultados do Mapeamento</h3>
                      <div className="space-y-3 text-sm">
                        <p><strong className="text-slate-700">Modalidade:</strong> {scannerResult.modalidade}</p>
                        <p><strong className="text-slate-700">Valor Estimado:</strong> R$ {scannerResult.valor_estimado}</p>
                        <p><strong className="text-slate-700">Órgão:</strong> {scannerResult.orgao}</p>
                        <p><strong className="text-slate-700">Documentos:</strong> {scannerResult.documentos_obrigatorios?.join(', ')}</p>
                      </div>
                      {!scannerResult.isCertificate && (
                        <button onClick={applyImportedScannerToBids} className="w-full mt-6 py-2 border border-emerald-500 text-emerald-600 font-bold rounded-md hover:bg-emerald-50 transition-colors">
                          Importar para Gestão
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ATESTADOS */}
          {activeTab === 'atestados' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex justify-between items-end border-b pb-4" style={{ borderColor: panelBorderColor }}>
                 <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2"><Shield className="text-emerald-600" /> Acervo Técnico de Atestados</h2>
                 <button onClick={() => setIsAddingCert(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-bold shadow-sm transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primaryColor }}>
                    <Plus className="w-4 h-4" /> Cadastrar Atestado
                 </button>
              </div>
              <div className="bg-white rounded-xl border p-6 shadow-sm overflow-x-auto" style={{ borderColor: panelBorderColor }}>
                 <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                       <tr>
                          <th className="px-4 py-3 border-b">Atestado / Emissor</th>
                          <th className="px-4 py-3 border-b">Data</th>
                          <th className="px-4 py-3 border-b">Itens Técnicos</th>
                          <th className="px-4 py-3 border-b">Ações</th>
                       </tr>
                    </thead>
                    <tbody>
                       {companyCerts.map((cert) => (
                          <tr key={cert.id} className="border-b last:border-0 hover:bg-slate-50">
                            <td className="px-4 py-4">
                               <p className="font-bold text-slate-800">{cert.nome_atestado}</p>
                               <p className="text-slate-500 text-xs">{cert.orgao_emissor}</p>
                            </td>
                            <td className="px-4 py-4 font-mono text-slate-500 text-xs">{cert.data_emissao}</td>
                            <td className="px-4 py-4">
                               <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{cert.itens.length} itens averbados</span>
                            </td>
                            <td className="px-4 py-4 flex gap-2">
                               <button disabled className="text-slate-400 hover:text-emerald-600"><Edit className="w-4 h-4" /></button>
                               <button onClick={() => handleDeleteCert(cert.id)} className="text-slate-400 hover:text-red-600"><Trash className="w-4 h-4" /></button>
                            </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </motion.div>
          )}

          {/* EMPRESAS */}
          {activeTab === 'empresas' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex justify-between items-end border-b pb-4" style={{ borderColor: panelBorderColor }}>
                 <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2"><Building className="text-emerald-600" /> Gestão de Empresas e Filiais</h2>
                 <button onClick={() => setIsAddingCompany(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-bold shadow-sm transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primaryColor }}>
                    <Plus className="w-4 h-4" /> Nova Empresa
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {empresas.map((emp) => (
                    <div key={emp.id} className="bg-white rounded-xl border p-5 shadow-sm hover:border-emerald-500 transition-colors cursor-pointer" style={{ borderColor: panelBorderColor }}>
                       <h3 className="font-bold text-lg text-slate-800">{emp.nome}</h3>
                       <p className="text-sm text-slate-500 font-mono mt-1">CNPJ: {emp.cnpj}</p>
                       <p className="text-xs font-bold text-emerald-600 mt-4 uppercase tracking-wider">{emp.chave_empresa}</p>
                    </div>
                 ))}
              </div>
            </motion.div>
          )}

          {/* USUÁRIOS */}
          {activeTab === 'usuarios' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex justify-between items-end border-b pb-4" style={{ borderColor: panelBorderColor }}>
                 <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2"><Users className="text-emerald-600" /> Cadastro de Usuários</h2>
                 <button onClick={() => setIsAddingUser(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-bold shadow-sm transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primaryColor }}>
                    <Plus className="w-4 h-4" /> Novo Usuário
                 </button>
              </div>
              <div className="bg-white rounded-xl border p-0 shadow-sm overflow-hidden" style={{ borderColor: panelBorderColor }}>
                 <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                       <tr>
                          <th className="px-6 py-4 border-b">Usuário</th>
                          <th className="px-6 py-4 border-b">Perfil</th>
                          <th className="px-6 py-4 border-b">Empresa Restrita</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {usuarios.map((u, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                             <td className="px-6 py-4">
                               <p className="font-bold text-slate-800">{u.nome}</p>
                               <p className="text-slate-500 text-xs">{u.email}</p>
                             </td>
                             <td className="px-6 py-4 font-semibold text-slate-700">{perfis.find(p=>p.id === u.perfilId)?.nome}</td>
                             <td className="px-6 py-4 font-mono text-emerald-600">{u.chave_empresa}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </motion.div>
          )}

          {/* AJUSTES */}
          {activeTab === 'ajustes' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex justify-between items-end border-b pb-4" style={{ borderColor: panelBorderColor }}>
                 <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2"><Settings className="text-emerald-600" /> Ajustes de Sistema</h2>
              </div>
              <div className="bg-white rounded-xl border p-6 shadow-sm space-y-6" style={{ borderColor: panelBorderColor }}>
                 <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-2">Tema e Cores</h3>
                    <div className="flex gap-4">
                       <div>
                         <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Cor Primária</label>
                         <input type="color" value={primaryColor} onChange={e=>setPrimaryColor(e.target.value)} className="w-16 h-10 border rounded bg-white p-1" />
                       </div>
                       <div>
                         <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Fundo da Aplicação</label>
                         <input type="color" value={appBgColor} onChange={e=>setAppBgColor(e.target.value)} className="w-16 h-10 border rounded bg-white p-1" />
                       </div>
                       <div>
                         <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Fundo dos Painéis</label>
                         <input type="color" value={panelBgColor} onChange={e=>setPanelBgColor(e.target.value)} className="w-16 h-10 border rounded bg-white p-1" />
                       </div>
                    </div>
                 </div>
                 
                 <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-2 mt-6">Tipografia (Fonte)</h3>
                    <select value={systemFont} onChange={e=>setSystemFont(e.target.value)} className="w-full max-w-sm p-2 border rounded text-sm focus:outline-none" style={{ borderColor: panelBorderColor }}>
                      <option value="Inter">Inter (Sans-serif, Moderna)</option>
                      <option value="Space Grotesk">Space Grotesk (Técnica)</option>
                      <option value="Fira Code">Fira Code (Monoespaçada)</option>
                      <option value="Georgia">Georgia (Editorial)</option>
                      <option value="Work Sans">Work Sans (Padrão)</option>
                    </select>
                 </div>

                 <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-2 mt-6">Supabase Sync</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <input type="text" placeholder="URL do Supabase" value={supabaseUrl} onChange={e=>setSupabaseUrl(e.target.value)} className="w-full p-2 border rounded text-sm focus:outline-none" style={{ borderColor: panelBorderColor }} />
                       <input type="password" placeholder="Chave Anônima" value={supabaseKey} onChange={e=>setSupabaseKey(e.target.value)} className="w-full p-2 border rounded text-sm focus:outline-none" style={{ borderColor: panelBorderColor }} />
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
