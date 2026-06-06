'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, supabaseUrl as configUrl, supabaseKey as configKey } from '@/lib/supabase';
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
  MatchAnalysisResult, DicionarioTermo
} from '@/lib/mock_data';

const SQL_MIGRATION_SCRIPT = `-- SQL MIGRATIONS FOR PROPROCURE SYSTEM
-- COMPREHENSIVE SCHEMA UPDATE

-- 1. Tabela de Empresas
CREATE TABLE IF NOT EXISTS public.empresas (
    id TEXT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    chave_empresa VARCHAR(50) UNIQUE NOT NULL,
    cnpj VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Perfis de Acesso
CREATE TABLE IF NOT EXISTS public.perfis_acesso (
    id TEXT PRIMARY KEY,
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
    email TEXT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil_id TEXT REFERENCES public.perfis_acesso(id) ON DELETE SET NULL,
    chave_empresa VARCHAR(50), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabela de Licitações (Tenders)
CREATE TABLE IF NOT EXISTS public.licitacoes (
    id TEXT PRIMARY KEY,
    chave_empresa VARCHAR(50) REFERENCES empresas(chave_empresa) ON DELETE CASCADE,
    modalidade VARCHAR(100),
    objeto TEXT,
    orgao VARCHAR(255),
    valor_estimado NUMERIC(15,2),
    prazo_proposta TEXT,
    prazo_abertura TEXT,
    documentos_obrigatorios JSONB DEFAULT '[]',
    exigencias_atestados TEXT,
    status VARCHAR(50),
    checklist_itens JSONB DEFAULT '[]',
    numero_edital VARCHAR(100),
    numero_processo VARCHAR(100),
    resumo_edital TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Tabela de Atestados Técnicos
CREATE TABLE IF NOT EXISTS public.atestados_tecnicos (
    id TEXT PRIMARY KEY,
    chave_empresa VARCHAR(50) REFERENCES empresas(chave_empresa) ON DELETE CASCADE,
    nome_atestado VARCHAR(255) NOT NULL,
    orgao_emissor VARCHAR(255) NOT NULL,
    data_emissao TEXT,
    observacoes TEXT,
    itens JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Tabela de Dicionário de Termos
CREATE TABLE IF NOT EXISTS public.dicionario_parse_edital (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave_empresa VARCHAR(50),
    termo TEXT NOT NULL,
    categoria VARCHAR(100),
    sinonimos JSONB DEFAULT '[]',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Tabela de Documentos Repositório
CREATE TABLE IF NOT EXISTS public.documentos_repositorio (
    id TEXT PRIMARY KEY,
    nome_arquivo TEXT NOT NULL,
    tag VARCHAR(100),
    validade TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Seed Data
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
  chave_empresa = EXCLUDED.chave_empresa;
`;

// Pure external ID helper to avoid render side-effects and satisfy React purity parameters
function generateGuid(prefix = '') {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return prefix + window.crypto.randomUUID();
  }
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
  const [dicionario, setDicionario] = useState<DicionarioTermo[]>([]);
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agenda' | 'scanner' | 'atestados' | 'empresas' | 'usuarios' | 'dicionario' | 'ajustes'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Supabase connection setting state
  const [supabaseUrl, setSupabaseUrl] = useState(configUrl);
  const [supabaseKey, setSupabaseKey] = useState(configKey);
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
  const [editableScannerResult, setEditableScannerResult] = useState<any>(null);
  const [uploadProgressStage, setUploadProgressStage] = useState<string>('');
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
  const [newBidNumeroEdital, setNewBidNumeroEdital] = useState('');
  const [newBidNumeroProcesso, setNewBidNumeroProcesso] = useState('');
  const [selectedBidDetail, setSelectedBidDetail] = useState<Licitacao | null>(null);
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

  const [editingTermo, setEditingTermo] = useState<DicionarioTermo | null>(null);
  const [isAddingTermo, setIsAddingTermo] = useState(false);

  // Mock document uploading to Base Repository
  const [repoFileUploaded, setRepoFileUploaded] = useState(false);

  // Copy success alerts
  const [copySuccess, setCopySuccess] = useState(false);

  // Dynamic state loaded indicator
  const [stateLoaded, setStateLoaded] = useState(false);
  const [migrationSql, setMigrationSql] = useState('');
  useEffect(() => {
     fetch('/api/migration').then(r=>r.json()).then(d=>setMigrationSql(d.sql || '')).catch(console.error);
  }, []);


  // --- SUPABASE INITIAL LOAD & SYNCS ---
  const getSupabaseClient = useCallback(() => {
    const { getSupabase } = require('@/lib/supabase');
    return getSupabase(supabaseUrl, supabaseKey);
  }, [supabaseUrl, supabaseKey]);

  const loadSupabaseData = useCallback(async (clientOverride?: any) => {
    const client = clientOverride || getSupabaseClient();
    if (!client) {
      // Load offline seed collections if no database is available
      setUsuarios(INITIAL_USERS);
      setEmpresas(INITIAL_COMPANIES);
      setLicitacoes(INITIAL_BIDS);
      setAtestados(INITIAL_CERTIFICATES);
      setDocumentos(INITIAL_DOCUMENTS);
      setPerfis(INITIAL_PROFILES);
      setStateLoaded(true);
      return;
    }

    try {
      setIsSyncing(true);
      const [
        { data: dbUsuarios, error: errU },
        { data: dbEmpresas, error: errE },
        { data: dbLicitacoes, error: errL },
        { data: dbAtestados, error: errA },
        { data: dbDocumentos, error: errD },
        { data: dbDicionario, error: errDic },
        { data: dbPerfis, error: errP }
      ] = await Promise.all([
        client.from('usuarios').select('*'),
        client.from('empresas').select('*'),
        client.from('licitacoes').select('*'),
        client.from('atestados_tecnicos').select('*'),
        client.from('documentos_repositorio').select('*'),
        client.from('dicionario_parse_edital').select('*'),
        client.from('perfis_acesso').select('*')
      ]);

      if (errU) console.error('Erro usuários:', errU);
      if (errE) console.error('Erro empresas:', errE);
      if (errL) console.error('Erro licitações:', errL);
      if (errA) console.error('Erro atestados:', errA);
      if (errDic) console.error('Erro dicionário:', errDic);
      if (errP) console.error('Erro perfis:', errP);

      if (dbUsuarios) setUsuarios(dbUsuarios);
      if (dbEmpresas) setEmpresas(dbEmpresas as any);
      if (dbLicitacoes) setLicitacoes(dbLicitacoes as any);
      if (dbAtestados) setAtestados(dbAtestados as any);
      if (dbDocumentos) setDocumentos(dbDocumentos as any);
      if (dbDicionario) setDicionario(dbDicionario as any);
      if (dbPerfis && dbPerfis.length > 0) setPerfis(dbPerfis as any);
      else setPerfis(INITIAL_PROFILES);

      setStateLoaded(true);
    } catch (e) {
      console.error('Falha crítica ao carregar do Supabase:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [getSupabaseClient]);

  useEffect(() => {
    const token = generateGuid();
    localStorage.setItem('proprocure_session_token', token);

    const checkAuth = async () => {
      setSessionToken(token);
      let activeClient = null;
      let isConfigured = false;

      try {
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const configData = await configRes.json();
          if (configData.supabaseUrl && configData.supabaseKey && configData.supabaseUrl.startsWith('https://')) {
            const { getSupabase } = await import('@/lib/supabase');
            const client = getSupabase(configData.supabaseUrl, configData.supabaseKey);
            if (client) {
              setSupabaseUrl(configData.supabaseUrl);
              setSupabaseKey(configData.supabaseKey);
              activeClient = client;
              isConfigured = true;
            }
          }
        }
      } catch (err) {
        console.error("Falha ao obter credenciais do Supabase no servidor:", err);
      }

      const activeMode = isConfigured ? 'connected' : 'offline';
      setSupabaseMode(activeMode);

      await loadSupabaseData(activeClient);
      
      // Look for persisted login
      const savedUser = localStorage.getItem('proprocure_logged_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.email) {
            setCurrentUser(parsed);
            setIsLoggedIn(true);
            setSecondsRemaining(timeoutMinutes * 60);
          }
        } catch(e) {}
      }
    };

    checkAuth();
  }, [loadSupabaseData, timeoutMinutes, supabaseUrl, supabaseKey]);

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
      case 'dicionario': return !!userProfile.ajustes;
      default: return false;
    }
  };

  // --- MOCK SUPABASE REMOTE SYNC SIMULATOR ---
  const handleSupabaseSync = async () => {
    setIsSyncing(true);
    setSyncLogs(prev => ["Sincronizando com o banco de dados Supabase...", ...prev]);

    try {
      let isConfigured = false;
      let activeClient = null;

      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.supabaseUrl && configData.supabaseKey && configData.supabaseUrl.startsWith('https://')) {
          const { getSupabase } = await import('@/lib/supabase');
          activeClient = getSupabase(configData.supabaseUrl, configData.supabaseKey);
          if (activeClient) {
            setSupabaseUrl(configData.supabaseUrl);
            setSupabaseKey(configData.supabaseKey);
            isConfigured = true;
          }
        }
      }

      if (!isConfigured || !activeClient) {
        alert("O sistema está rodando em modo Offline de demonstração. Para sincronizar as tabelas com o Supabase de forma integrada, certifique-se de configurar as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no servidor.");
        setIsSyncing(false);
        return;
      }

      await loadSupabaseData(activeClient);
      setSupabaseMode('connected');
      setSyncLogs(prev => [
        `Sincronização concluída com sucesso! Banco unificado e atualizado.`,
        `Status 200 OK - Carregados usuários, empresas, editais e atestados.`,
        ...prev
      ]);
    } catch (e: any) {
      console.error(e);
      setSyncLogs(prev => [`Falha ao sincronizar: ${e?.message || e}.`, ...prev]);
    }
    
    setIsSyncing(false);
  };

  // Switch to simulate multi-session disconnect
  const triggerAlternativeSessionLogin = () => {
    const newToken = 'ALT_SESSION_' + generateGuid();
    localStorage.setItem('proprocure_session_token', newToken);
    setSessionToken(newToken);
    setMultiSessionAlert(true);
    setIsLoggedIn(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const login = (formData.get('login') as string || '').trim();
    const password = (formData.get('password') as string || '').trim();
    
    // Admin override
    if (login.toLowerCase() === 'admin' && password === 'Cjl@j2326082110') {
      const adminUser: PerfilUsuario = {
        email: 'admin',
        nome: 'Administrador Geral',
        senha: '',
        perfilId: 'perfil-admin',
        chave_empresa: 'ALL'
      };
      finishLogin(adminUser);
      return;
    }

    let foundUser: PerfilUsuario | undefined;

    // Supabase native check
    const client = getSupabaseClient();
    if (client && supabaseMode === 'connected') {
      const { data, error } = await client
        .from('usuarios')
        .select('*')
        .or(`email.ilike.${login},nome.ilike.${login}`)
        .eq('senha', password)
        .single();
        
      if (data && !error) {
        // Map database fields to application state interface
        foundUser = {
          ...data,
          perfilId: (data as any).perfil_id || (data as any).perfilId
        } as PerfilUsuario;
      }
    } else {
      // Offline / state fallback check
      const userMatch = usuarios.find(u => 
        ((u.email && u.email.toLowerCase().trim() === login.toLowerCase()) || 
         (u.nome && u.nome.toLowerCase().trim() === login.toLowerCase())) &&
        u.senha === password
      );
      if (userMatch) foundUser = userMatch;
    }

    if (!foundUser) {
      alert('Usuário não encontrado ou senha incorreta.');
      return;
    }

    finishLogin(foundUser);
  };

  const finishLogin = (user: PerfilUsuario) => {
    setCurrentUser(user);
    localStorage.setItem('proprocure_logged_user', JSON.stringify(user));
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
        else if (profile.agenda) setActiveTab('agenda');
        else if (profile.scanner) setActiveTab('scanner');
        else if (profile.atestados) setActiveTab('atestados');
        else if (profile.empresas) setActiveTab('empresas');
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
    localStorage.removeItem('proprocure_logged_user');
  };

  const handleAddUser = async () => {
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

    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('usuarios').insert([{ email: newUserEmail.trim(), nome: newUserName, senha: newUserPassword, perfil_id: newUserProfileId, chave_empresa: newUserCompanyKey || 'LICITATECH' }]);
      if (error) {
        alert("Erro ao salvar usuário no banco: " + error.message);
        return;
      }
    } else if (supabaseMode === 'connected') {
      alert("Erro: Banco de dados não conectado.");
      return;
    }

    setUsuarios(nextList);
    setNewUserEmail('');
    setNewUserName('');
    setNewUserPassword('123');
    setNewUserProfileId('perfil-analista');
    setNewUserCompanyKey(newUserCompanyKey || 'LICITATECH');
    setIsAddingUser(false);
  };

  const handleSaveEditUser = async (updatedUser: PerfilUsuario) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('usuarios').update({ nome: updatedUser.nome, chave_empresa: updatedUser.chave_empresa, perfil_id: updatedUser.perfilId }).eq('email', updatedUser.email.trim());
      if (error) {
        alert("Erro ao atualizar usuário: " + error.message);
        return;
      }
    }
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
  const handleAddCompany = async () => {
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
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('empresas').insert([{ ...fresh, created_at: undefined }]);
      if (error) {
        alert("Erro ao salvar empresa: " + error.message);
        return;
      }
    }
    setEmpresas([...empresas, fresh]);
    setNewCompanyName('');
    setNewCompanyKey('');
    setNewCompanyCnpj('');
    setIsAddingCompany(false);
    setActiveCompanyKey(fresh.chave_empresa);
  };

  const handleSaveEditCompany = async (updatedCompany: Empresa) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('empresas').update(updatedCompany).eq('id', updatedCompany.id);
      if (error) {
        alert("Erro ao salvar empresa: " + error.message);
        return;
      }
    }
    setEmpresas(empresas.map(e => e.id === updatedCompany.id ? updatedCompany : e));
    setEditingCompany(null);
  };

  const handleAddBid = async () => {
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
      created_at: new Date().toISOString().split('T')[0],
      numero_edital: newBidNumeroEdital,
      numero_processo: newBidNumeroProcesso
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('licitacoes').insert([{ ...freshLicitacao, created_at: undefined }]);
      if (error) {
        alert("Erro ao salvar licitação: " + error.message);
        return;
      }
    }

    setLicitacoes([freshLicitacao, ...licitacoes]);
    setIsAddingBid(false);
    setNewBidObjeto('');
    setNewBidOrgao('');
    setNewBidValor(50000);
    setNewBidNumeroEdital('');
    setNewBidNumeroProcesso('');
  };

  const handleSaveEditBid = async (updatedBid: Licitacao) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('licitacoes').update({ ...updatedBid, created_at: undefined }).eq('id', updatedBid.id);
      if (error) {
        alert("Erro ao atualizar licitação: " + error.message);
        return;
      }
    }
    setLicitacoes(licitacoes.map(b => b.id === updatedBid.id ? updatedBid : b));
    setEditingBid(null);
  };

  const handleDeleteBid = async (id: string) => {
    if (confirm("Confirmar exclusão deste edital?")) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('licitacoes').delete().eq('id', id);
        if (error) {
          alert("Erro ao excluir: " + error.message);
          return;
        }
      }
      setLicitacoes(licitacoes.filter(b => b.id !== id));
    }
  };

  const handleToggleChecklistItem = async (bidId: string, itemId: string) => {
    const originalBids = [...licitacoes];
    const updated = licitacoes.map(b => {
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
    });
    
    // Optimistic update
    setLicitacoes(updated);
    
    const updatedBid = updated.find(b => b.id === bidId);
    if (updatedBid) {
       const supabase = getSupabaseClient();
       if (supabase) {
         const { error } = await supabase.from('licitacoes').update({ checklist_itens: updatedBid.checklist_itens }).eq('id', bidId);
         if (error) {
           alert("Erro ao atualizar checklist: " + error.message);
           setLicitacoes(originalBids);
         }
       }
    }
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

  const handleSaveCertificate = async () => {
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

    const supabase = getSupabaseClient();
    if (supabase) {
      const { itens, ...certData } = freshCert;
      const { error } = await supabase.from('atestados_tecnicos').insert([{ ...certData, created_at: undefined }]);
      if (error) {
        alert("Erro ao salvar atestado: " + error.message);
        return;
      }
    }

    setAtestados([...atestados, freshCert]);
    setIsAddingCert(false);
    setNewCertName('');
    setNewCertEmissor('');
    setNewCertObs('');
    setNewCertItems([
      { item_numero: 1, descricao: 'Fornecimento continuado de material', quantidade: 50, unidade: 'un', relevancia_tecnica: 'Média' }
    ]);
  };

  const handleSaveEditCert = async (updatedCert: AtestadoTecnico) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { itens, ...certData } = updatedCert;
      const { error } = await supabase.from('atestados_tecnicos').update({ ...certData, created_at: undefined }).eq('id', updatedCert.id);
      if (error) {
        alert("Erro ao atualizar atestado: " + error.message);
        return;
      }
    }
    setAtestados(atestados.map(c => c.id === updatedCert.id ? updatedCert : c));
    setEditingCert(null);
  };

  const handleDeleteCert = async (id: string) => {
    if (confirm("Deseja mesmo excluir este atestado técnico?")) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('atestados_tecnicos').delete().eq('id', id);
        if (error) {
          alert("Erro ao excluir atestado: " + error.message);
          return;
        }
      }
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
  const handleTriggerTenderScanner = async (presetTextIndex: number | null, customText?: string, customFileName?: string) => {
    setScannerIsProcessing(true);
    setScannerError('');
    setScannerResult(null);
    setEditableScannerResult(null);

    let docText = customText !== undefined ? customText : rawScannerText;
    let fileName = customFileName || uploadedFileName || "Texto_Manual.pdf";

    if (presetTextIndex !== null) {
      const selected = EDITADO_TEXTS[presetTextIndex];
      docText = selected.snippet;
      fileName = selected.title;
      setUploadedFileName(selected.title);
      setRawScannerText(selected.snippet);
    }

    const extractFallbackDataFromFileName = (fName: string) => {
      const cleanName = fName.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/-/g, " ");
      
      let modalidade = "Pregão Eletrônico";
      if (cleanName.toLowerCase().includes("concorrencia") || cleanName.toLowerCase().includes("concorrência")) {
        modalidade = "Concorrência";
      } else if (cleanName.toLowerCase().includes("tomada")) {
        modalidade = "Tomada de Preços";
      } else if (cleanName.toLowerCase().includes("dispensa")) {
        modalidade = "Dispensa de Licitação";
      } else if (cleanName.toLowerCase().includes("inexigibilidade")) {
        modalidade = "Inexigibilidade";
      } else if (cleanName.toLowerCase().includes("convite")) {
        modalidade = "Convite";
      }

      let orgao = "Órgão Licitante (Não extraído do PDF)";
      const parts = cleanName.split(/\s+/);
      const keywords = ["prefeitura", "tribunal", "ministerio", "ministério", "secretaria", "governo", "camara", "câmara", "conselho", "saude", "saúde", "educacao", "educação"];
      let foundKeywordIndex = -1;
      for (let i = 0; i < parts.length; i++) {
        if (keywords.includes(parts[i].toLowerCase())) {
          foundKeywordIndex = i;
          break;
        }
      }
      if (foundKeywordIndex !== -1) {
        orgao = parts.slice(foundKeywordIndex).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
      } else if (parts.length > 0) {
        orgao = "Prefeitura de " + parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
      }

      const objeto = `Contratação de produtos/serviços descritos no edital de licitação para ${cleanName}.`;

      return {
        modalidade,
        orgao,
        valor_estimado: 450000,
        objeto,
        prazo_proposta: "2026-06-25 09:00",
        prazo_abertura: "2026-06-25 11:30",
        exigencias_atestados: "Atestado de capacidade técnica comprovando execução continuada de serviços similares ao objeto.",
        documentos_obrigatorios: ["Cartão CNPJ", "Regularidade Fiscal", "Balanço Patrimonial", "Certidão Negativa Trabalhista"]
      };
    };

    // If text is empty or very short, fallback gracefully rather than returning error
    if (!docText || !docText.trim() || docText.trim().length < 15) {
      setUploadProgressStage("Analisando nome do arquivo e gerando sugestões...");
      await new Promise(r => setTimeout(r, 600));

      const isAtestadoTemplate = presetTextIndex === 2 || fileName.toLowerCase().includes('atestado');
      let parsedJSON: any = {};
      if (!isAtestadoTemplate) {
        parsedJSON = extractFallbackDataFromFileName(fileName);
      } else {
        parsedJSON = {
          nome_atestado: "Atestado de Capacidade Técnica",
          orgao_emissor: "Emissor Identificado (Preencher)",
          data_emissao: new Date().toISOString().split('T')[0],
          observacoes: "Documento digitalizado - verifique o objeto no PDF",
          itens: [
            { descricao: "Execução de serviços/fornecimento compatível", quantidade: 1, unidade: "un" }
          ]
        };
      }

      setScannerResult({ ...parsedJSON, isCertificate: isAtestadoTemplate });
      setEditableScannerResult({ ...parsedJSON });
      setScannerError("Aviso: O texto extraído do arquivo PDF estava vazio ou ilegível (pode ser um documento digitalizado de imagem). Preparamos uma sugestão editável com base no nome do arquivo para você complementar!");
      setScannerIsProcessing(false);
      setUploadProgressStage("");
      return;
    }

    try {
      setUploadProgressStage("Analisando dados via Inteligência Artificial...");
      
      const isAtestadoTemplate = presetTextIndex === 2 || fileName.toLowerCase().includes('atestado');
      const action = isAtestadoTemplate ? 'parse_certificate' : 'parse_tender';

      let parsedJSON: any = {};
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text: docText, dicionario })
      }).catch((err) => {
        throw new Error("Failed to fetch (Falha de conexão com a API)");
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - Sem resposta da API de IA`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const rawText = await response.text();
        if (rawText.includes("<!doctype") || rawText.includes("<!DOCTYPE") || rawText.includes("<html")) {
          throw new Error("Unexpected token '<', \"<!doctype \"... is not valid JSON (Resposta HTML de erro)");
        }
        throw new Error("O servidor de IA retornou uma resposta não-JSON inválida.");
      }

      parsedJSON = await response.json();

      setScannerResult({ ...parsedJSON, isCertificate: isAtestadoTemplate });
      setEditableScannerResult({ ...parsedJSON });

      // Save scanned history to satisfying 4.c scanner grade organization block
      if (!isAtestadoTemplate) {
        const freshHistoryItem = {
          id: generateGuid('h_'),
          fileName: fileName,
          modalidade: parsedJSON.modalidade || "Pregão Eletrônico",
          orgao: parsedJSON.orgao || "Órgão Não Identificado",
          valorEstimado: parsedJSON.valor_estimado || 0,
          objeto: parsedJSON.objeto || "Objeto não extraído",
          prazoProposta: parsedJSON.prazo_proposta || "2026-06-15 09:00",
          exigencias_atestados: parsedJSON.exigencias_atestados || "Não identificados",
          documentos_obrigatorios: parsedJSON.documentos_obrigatorios || [],
          timestamp: new Date().toLocaleString(),
          status: 'Pendente de Importação',
          numeroEdital: parsedJSON.numero_edital || "",
          numeroProcesso: parsedJSON.numero_processo || "",
          resumo_edital: parsedJSON.resumo_edital || ""
        };
        const updatedHistory = [freshHistoryItem, ...lastScannedTenders];
        setLastScannedTenders(updatedHistory);
        localStorage.setItem('proprocure_scanned_history', JSON.stringify(updatedHistory));
      } else {
        // Scanned certificate -> let's map directly to CERTIFICATES database!
        const parsedCert: AtestadoTecnico = {
          id: generateGuid('a_'),
          chave_empresa: activeCompanyKey,
          nome_atestado: parsedJSON.nome_atestado || "Atestado Extraído Localmente",
          orgao_emissor: parsedJSON.orgao_emissor || "Emissor não identificado",
          data_emissao: parsedJSON.data_emissao || "2026-06-02",
          observacoes: parsedJSON.observacoes || "Processado via Scanner Inteligente",
          itens: parsedJSON.itens || []
        };
        setAtestados(prev => [parsedCert, ...prev]);
        alert(`Atestado "${parsedCert.nome_atestado}" foi lido com sucesso e importado linha a linha para sua base de atestados!`);
      }
    } catch (err: any) {
      console.error("AI analysis failed, executing fallback parsing:", err);
      
      const isAtestadoTemplate = presetTextIndex === 2 || fileName.toLowerCase().includes('atestado');
      let fallbackJSON: any = {};
      
      if (!isAtestadoTemplate) {
        fallbackJSON = extractFallbackDataFromFileName(fileName);
      } else {
        fallbackJSON = {
          nome_atestado: "Atestado de Capacidade Técnica (Rascunho)",
          orgao_emissor: "Emissor não identificado",
          data_emissao: new Date().toISOString().split('T')[0],
          observacoes: "Erro ao parsear documento PDF",
          itens: [
            { descricao: "Execução de serviços/fornecimento compatível", quantidade: 1, unidade: "un" }
          ]
        };
      }

      setScannerResult({ ...fallbackJSON, isCertificate: isAtestadoTemplate });
      setEditableScannerResult({ ...fallbackJSON });

      let errorFriendly = err.message || "";
      if (errorFriendly.includes("Unexpected token '<'") || errorFriendly.includes("doctype")) {
        errorFriendly = "Unexpected token '<', \"<!doctype \"... is not valid JSON";
      } else if (errorFriendly.includes("fetch") || errorFriendly.includes("Failed to fetch")) {
        errorFriendly = "Failed to fetch (Sem conexão com o servidor)";
      }

      setScannerError(`Aviso: Ocorreu uma instabilidade na análise inteligente do edital (${errorFriendly}). Mapeamos um rascunho com base no nome do arquivo para você continuar sem perder seu progresso!`);
    } finally {
      setScannerIsProcessing(false);
      setUploadProgressStage('');
    }
  };

  // Helper template inserter
  const applyImportedScannerToBids = async () => {
    const dataToSave = editableScannerResult || scannerResult;
    if (!dataToSave) return;

    // Safety parse of valor_estimado
    let parsedValue = 0;
    if (typeof dataToSave.valor_estimado === 'number') {
      parsedValue = dataToSave.valor_estimado;
    } else if (dataToSave.valor_estimado) {
      const cleaned = String(dataToSave.valor_estimado).replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
      parsedValue = parseFloat(cleaned) || 0;
    }

    const freshLicitacao: Licitacao = {
      id: generateGuid('e_'),
      chave_empresa: activeCompanyKey,
      modalidade: dataToSave.modalidade || "Pregão Eletrônico",
      objeto: dataToSave.objeto || "Objeto não mapeado",
      orgao: dataToSave.orgao || "Órgão Indefinido",
      valor_estimado: parsedValue,
      prazo_proposta: dataToSave.prazo_proposta || "2026-06-10 09:00",
      prazo_abertura: dataToSave.prazo_abertura || dataToSave.prazo_proposta || "2026-06-11 09:00",
      documentos_obrigatorios: dataToSave.documentos_obrigatorios || [],
      exigencias_atestados: dataToSave.exigencias_atestados || "",
      status: 'Em Análise',
      checklist_itens: (dataToSave.documentos_obrigatorios || []).map((doc: string, idx: number) => ({
        id: `sc-${idx}`,
        label: doc,
        checked: false
      })),
      created_at: new Date().toISOString().split('T')[0],
      numero_edital: dataToSave.numero_edital || "",
      numero_processo: dataToSave.numero_processo || "",
      resumo_edital: dataToSave.resumo_edital || ""
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('licitacoes').insert([{ ...freshLicitacao, created_at: undefined }]);
      if (error) {
        alert("Erro ao salvar licitação: " + error.message);
        return;
      }
    }

    setLicitacoes([freshLicitacao, ...licitacoes]);

    // Update status in the tracking log of scanned editais
    const updatedHistory = lastScannedTenders.map(item => {
      if (item.fileName === uploadedFileName || item.objeto === dataToSave.objeto) {
        return { ...item, status: 'Importado' };
      }
      return item;
    });
    setLastScannedTenders(updatedHistory);
    localStorage.setItem('proprocure_scanned_history', JSON.stringify(updatedHistory));

    alert("O edital analisado foi importado com sucesso na sua base de Licitações!");
    setScannerResult(null);
    setEditableScannerResult(null);
    setActiveTab('dashboard');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    
    if (file.name.toLowerCase().endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        setRawScannerText(text);
        await handleTriggerTenderScanner(null, text, file.name);
      };
      reader.readAsText(file);
    } else if (file.name.toLowerCase().endsWith('.pdf')) {
      setScannerIsProcessing(true);
      setUploadProgressStage("Carregando arquivo PDF...");
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/parse-pdf", {
          method: "POST",
          body: formData,
        }).catch((err) => {
          throw new Error("Failed to fetch (Falha de conexão com o servidor)");
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} - Sem resposta do leitor de PDF`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const rawText = await response.text();
          if (rawText.includes("<!doctype") || rawText.includes("<!DOCTYPE") || rawText.includes("<html")) {
            throw new Error("Unexpected token '<', \"<!doctype \"... is not valid JSON (Erro 500 do servidor PDF)");
          }
          throw new Error("O servidor retornou uma resposta inválida não-JSON.");
        }

        const data = await response.json();
        const text = data.text;
        setRawScannerText(text || "");
        
        // Pass text directly to Gemini
        await handleTriggerTenderScanner(null, text || "", file.name);
      } catch (error: any) {
        console.error("PDF parsing failure caught:", error);
        let errorFriendly = error.message || "";
        if (errorFriendly.includes("Unexpected token '<'") || errorFriendly.includes("doctype")) {
          errorFriendly = "Unexpected token '<', \"<!doctype \"... is not valid JSON (Resposta HTML de erro)";
        } else if (errorFriendly.includes("fetch") || errorFriendly.includes("Failed to fetch")) {
          errorFriendly = "Failed to fetch (Sem conexão com o servidor de PDF)";
        }

        // Trigger fallback with empty text to auto-fill based on file name
        setRawScannerText("");
        await handleTriggerTenderScanner(null, "", file.name);
        
        // Set custom helpful message detailing the error and how we bypassed it
        setScannerError(`Aviso: Ocorreu uma instabilidade ao ler o arquivo PDF (${errorFriendly}). Contornamos o problema gerando uma sugestão editável e preenchida automaticamente a partir do nome do arquivo ("${file.name}") para que você continue trabalhando sem interrupções!`);
      } finally {
        setUploadProgressStage("");
      }
    } else {
      setScannerError("Formato de arquivo não suportado. Use .pdf ou .txt.");
    }
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
        <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-2xl animate-fade-in" suppressHydrationWarning>
          <div className="flex justify-center mb-6" suppressHydrationWarning>
            <div className="w-16 h-16 relative flex items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Landmark className="w-8 h-8" />
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

          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4" suppressHydrationWarning>
            <div suppressHydrationWarning>
              <label className="block text-xs font-semibold text-emerald-800 uppercase tracking-tight">E-mail ou Login</label>
              <input
                type="text"
                name="login"
                required
                className="w-full mt-1 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-950 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="exemplo@empresa.com.br ou 'admin'"
                defaultValue={currentUser?.email || ''}
                suppressHydrationWarning
              />
            </div>

            <div suppressHydrationWarning>
              <label className="block text-xs font-semibold text-emerald-800 uppercase tracking-tight">Senha</label>
              <input
                type="password"
                name="password"
                required
                placeholder="Sua senha corporativa"
                className="w-full mt-1 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-950 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                suppressHydrationWarning
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
          <div className="w-16 h-16 relative mb-3 bg-white rounded-xl shadow p-2 flex items-center justify-center text-emerald-800">
            <Landmark className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">BuyGov</h2>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mt-1">{currentCompany?.nome || activeCompanyKey}</p>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'agenda', label: 'Agenda & Prazos', icon: Calendar },
            { id: 'scanner', label: 'Edital', icon: Search },
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
            <div className="pt-6 pb-2 space-y-2">
              <button 
               onClick={() => setActiveTab('dicionario' as any)} 
               className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'dicionario' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                <Database className="w-4 h-4 shrink-0 stroke-2" />
                <span>Dicionário de Termos IA</span>
              </button>
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
            <motion.div key="dashboard" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-800">Visão Geral</h2>
                  <p className="text-sm text-slate-500 font-medium">Painel estratégico e funil de oportunidades comerciais</p>
                </div>
                {currentUser?.email === 'admin' && (
                  <button onClick={() => setIsAddingBid(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-bold shadow-sm transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primaryColor }}>
                    <Plus className="w-4 h-4" /> Novo Certame
                  </button>
                )}
              </div>

              {/* Funnel of Opportunities */}
              <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: panelBorderColor }}>
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Funil de Oportunidades (Banco de Dados Ativo)</h3>
                <div className="flex flex-col md:flex-row gap-2 h-auto md:h-24">
                   {[
                     { label: 'Cadastrados', count: companyBids.length, color: 'bg-slate-100 text-slate-700 border-slate-200' },
                     { label: 'Em Análise', count: companyBids.filter(b => b.status === 'Em Análise').length, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                     { label: 'Em Preparação', count: companyBids.filter(b => b.status === 'Em Preparação').length, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                     { label: 'Submetidos', count: companyBids.filter(b => b.status === 'Submetido').length, color: 'bg-purple-50 text-purple-700 border-purple-200' },
                     { label: 'Ganhos', count: companyBids.filter(b => b.status === 'Ganho').length, color: 'bg-emerald-500 text-white border-emerald-600' },
                     { label: 'Descartados', count: companyBids.filter(b => b.status === 'Descartado').length, color: 'bg-red-50 text-red-700 border-red-200' }
                   ].map((stage, i) => (
                     <div key={i} className={`flex-1 rounded-lg border flex flex-col justify-center items-center p-3 ${stage.color} relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer`}>
                       <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 text-center mb-1">{stage.label}</span>
                       <span className="text-2xl font-black">{stage.count}</span>
                       {i < 5 && <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 z-10" />}
                     </div>
                   ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Mini KPI Cards */}
                 <div className="space-y-4 col-span-1">
                   <div className="bg-white p-5 rounded-xl border shadow-sm" style={{ borderColor: panelBorderColor }}>
                     <p className="text-xs font-bold text-slate-500 uppercase">Estimativa Global do Funil</p>
                     <h3 className="text-2xl font-extrabold text-slate-800 mt-2 tracking-tight">R$ {(companyBids.reduce((a,b)=>a+Number(b.valor_estimado), 0)/1000000).toFixed(1)}M</h3>
                   </div>
                   <div className="bg-white p-5 rounded-xl border shadow-sm" style={{ borderColor: panelBorderColor }}>
                     <p className="text-xs font-bold text-slate-500 uppercase">Taxa de Conversão</p>
                     <h3 className="text-2xl font-extrabold text-emerald-600 mt-2 tracking-tight">
                       {companyBids.length > 0 
                         ? `${Math.round((companyBids.filter(b => b.status === 'Ganho').length / companyBids.length) * 100)}%`
                         : '0%'}
                     </h3>
                   </div>
                 </div>

                 {/* Recent Bids Table */}
                 <div className="col-span-2 bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: panelBorderColor }}>
                   <h3 className="text-sm font-bold text-slate-800 mb-4">Lista Mestra de Editais Ativos (Clique para ver o Registro do Banco de Dados)</h3>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm whitespace-nowrap">
                       <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                         <tr>
                           <th className="px-4 py-3 border-b">Órgão</th>
                           <th className="px-4 py-3 border-b">Objeto</th>
                           <th className="px-4 py-3 border-b">Fase</th>
                           <th className="px-4 py-3 border-b">Valor Estimado</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {companyBids.slice(0, 10).map((bid, i) => (
                            <tr key={bid.id} onClick={() => setSelectedBidDetail(bid)} className="hover:bg-slate-50/50 cursor-pointer transition-colors text-xs" title="Clique para ver o registro do banco de dados">
                              <td className="px-4 py-3 font-semibold font-mono text-slate-800">
                                <div>{bid.numero_edital || 'Não definido'}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{bid.numero_processo || 'Não definido'}</div>
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-700">{bid.orgao}</td>
                              <td className="px-4 py-3 truncate max-w-[200px] text-slate-600" title={bid.objeto}>{bid.objeto}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold ${
                                  bid.status === 'Em Análise' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  bid.status === 'Em Preparação' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  bid.status === 'Submetido' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                  bid.status === 'Ganho' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>
                                  {bid.status || 'Em Análise'}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono font-semibold text-slate-600">R$ {Number(bid.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                          {companyBids.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-6 text-slate-400 text-sm">Nenhum edital cadastrado.</td></tr>
                          )}
                        </tbody>
                     </table>
                   </div>
                 </div>
              </div>
            </motion.div>
          )}

          {/* AGENDA E PRAZOS */}
          {activeTab === 'agenda' && (
            <motion.div key="agenda" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex justify-between items-end border-b pb-4" style={{ borderColor: panelBorderColor }}>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2"><Calendar className="text-emerald-600" /> Agenda de Prazos Críticos</h2>
                  <p className="text-sm text-slate-500 font-medium">Gestão simultânea de prazos de propostas, sessões públicas e documentos</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
                  <Filter className="w-4 h-4" /> Filtrar Prazos
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                 {/* Mini Calendar View Sidebar */}
                 <div className="col-span-1 space-y-4">
                   <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: panelBorderColor }}>
                      <div className="flex justify-between items-center mb-4">
                         <button className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
                         <h4 className="font-bold text-slate-800 text-sm">{new Date().toLocaleString('pt-BR', {month: 'long', year: 'numeric'}).toUpperCase()}</h4>
                         <button className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['D','S','T','Q','Q','S','S'].map((d,i) => <div key={i} className="text-[10px] font-bold text-slate-400">{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {/* Live Database Days */}
                        {Array.from({length: 31}).map((_, i) => {
                          const today = new Date().getDate();
                          const isToday = i+1 === today;
                          
                          // Check if any bid has a proposal or opening deadline on this day
                          const bidOnDay = companyBids.find(b => {
                            if (!b.prazo_proposta) return false;
                            const d = new Date(b.prazo_proposta.replace(' ', 'T'));
                            return d.getDate() === (i + 1);
                          });

                          let cellStyle = "text-slate-700 hover:bg-slate-100";
                          if (isToday) {
                            cellStyle = "bg-emerald-600 text-white font-bold h-7 w-7 flex items-center justify-center m-auto rounded-full";
                          } else if (bidOnDay) {
                            if (bidOnDay.status === 'Ganho') {
                              cellStyle = "bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 h-7 w-7 flex items-center justify-center m-auto rounded-full";
                            } else if (bidOnDay.status === 'Submetido') {
                              cellStyle = "bg-purple-100 text-purple-800 font-bold border border-purple-300 h-7 w-7 flex items-center justify-center m-auto rounded-full";
                            } else if (bidOnDay.status === 'Descartado') {
                              cellStyle = "bg-red-50 text-red-500 line-through border border-red-200 h-7 w-7 flex items-center justify-center m-auto rounded-full";
                            } else {
                              cellStyle = "bg-amber-100 text-amber-800 font-bold border border-amber-300 h-7 w-7 flex items-center justify-center m-auto rounded-full";
                            }
                          }

                          return (
                            <div key={i} className="aspect-square flex items-center justify-center text-xs rounded-full font-medium cursor-pointer transition-colors" title={bidOnDay ? `${bidOnDay.orgao}: ${bidOnDay.objeto}` : undefined}>
                              <span className={cellStyle}>
                                {i+1}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                   
                   <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: panelBorderColor }}>
                     <h4 className="text-xs uppercase font-bold text-slate-500 mb-3 tracking-wider">Legenda de Alertas</h4>
                     <div className="space-y-2 text-sm">
                       <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> <span className="font-medium text-slate-700">Prazo Urgente (&lt; 48h)</span></div>
                       <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> <span className="font-medium text-slate-700">Atenção (2 a 5 dias)</span></div>
                       <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> <span className="font-medium text-slate-700">No Prazo (&gt; 5 dias)</span></div>
                     </div>
                   </div>
                 </div>

                 {/* Detailed Events List */}
                 <div className="col-span-3 bg-white rounded-xl border p-6 shadow-sm min-h-[400px]" style={{ borderColor: panelBorderColor }}>
                    <h3 className="text-sm font-bold text-slate-800 mb-5">Eventos e Prazos Recentes</h3>
                    {companyBids.length === 0 ? (
                      <div className="text-center text-slate-400 py-10">Nenhum evento agendado.</div>
                    ) : (
                      <div className="space-y-4">
                        {companyBids.map((bid, index) => {
                          const urgency = index === 0 ? 'danger' : index === 1 ? 'warning' : 'safe';
                          return (
                            <div key={bid.id} className={`flex gap-4 p-4 border rounded-lg transition-colors hover:shadow-sm ${urgency === 'danger' ? 'border-red-200 bg-red-50/30' : urgency === 'warning' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}`}>
                              <div className={`w-1.5 rounded-full shrink-0 ${urgency === 'danger' ? 'bg-red-500' : urgency === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">{bid.orgao} <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase">{bid.modalidade}</span></h4>
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{bid.objeto}</p>
                                  </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                   <div className="flex flex-col bg-white p-2 rounded border border-slate-100">
                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Upload className="w-3 h-3" /> Fim das Propostas</span>
                                     <span className="text-sm font-semibold text-slate-700 mt-0.5">{bid.prazo_proposta} 09:00</span>
                                   </div>
                                   <div className="flex flex-col bg-white p-2 rounded border border-slate-100">
                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Gavel className="w-3 h-3" /> Sessão Pública</span>
                                     <span className="text-sm font-semibold text-slate-700 mt-0.5">{bid.prazo_proposta} 09:30</span>
                                   </div>
                                   <div className="flex flex-col bg-white p-2 rounded border border-slate-100">
                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><FolderOpen className="w-3 h-3" /> Diligência / Docs</span>
                                     <span className="text-sm font-semibold text-slate-500 mt-0.5 italic">Nenhuma pendente</span>
                                   </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'scanner' && (
            <motion.div key="scanner" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex justify-between items-end border-b pb-4" style={{ borderColor: panelBorderColor }}>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2"><Search className="text-emerald-600 w-6 h-6" /> Módulo do Edital</h2>
                  <p className="text-sm text-slate-500 font-medium">Extração de dados automática, acompanhamento e cadastro de novos editais do computador</p>
                </div>
                <button onClick={() => { setScannerResult(null); setEditableScannerResult(null); setRawScannerText(''); document.getElementById('edital-file-upload')?.click(); }} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-bold shadow-sm transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primaryColor }}>
                  <Plus className="w-4 h-4" /> Novo Edital (PDF)
                </button>
              </div>

              {/* Hidden file selector */}
              <input 
                type="file" 
                id="edital-file-upload" 
                accept=".pdf,.txt,.doc,.docx" 
                className="hidden" 
                onChange={handleFileUpload} 
              />

              {scannerIsProcessing ? (
                <div className="bg-white rounded-xl border p-12 shadow-sm text-center flex flex-col items-center justify-center space-y-4" style={{ borderColor: panelBorderColor }}>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Processando e Extraindo Dados do Edital</h3>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-sm font-semibold max-w-lg animate-pulse">
                    {uploadProgressStage || "Extraindo estrutura do arquivo local..."}
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Isso pode demorar alguns segundos enquanto nosso sistema mapeia o órgão, objeto, prazos e os documentos de habilitação requeridos.
                  </p>
                </div>
              ) : !scannerResult ? (
                <div className="space-y-8">
                  {scannerError && (
                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm font-semibold shadow-xs flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold">Aviso do Extrator</p>
                        <p className="text-xs font-medium text-amber-800/95 mt-1">{scannerError}</p>
                      </div>
                      <button onClick={() => setScannerError('')} className="text-amber-500 hover:text-amber-700 font-medium text-lg leading-none">&times;</button>
                    </div>
                  )}

                  {/* Real File Upload Drag & Drop Box */}
                  <div 
                    onClick={() => document.getElementById('edital-file-upload')?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const customEvent = { target: { files: [file] } } as any;
                        handleFileUpload(customEvent);
                      }
                    }}
                    className="bg-white rounded-xl border border-dashed border-slate-300 p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-emerald-500 transition-colors cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Selecionar ou Arrastar Edital (PDF)</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                      Arraste e solte o arquivo PDF/TXT do edital aqui ou clique para selecionar do computador. O extrator local lerá o documento e deixará os dados prontos para edição.
                    </p>
                    <button 
                      type="button"
                      className="mt-6 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-sm flex items-center gap-2 shadow-sm transition-colors"
                    >
                      <Search className="w-4 h-4" /> Procurar Arquivo no Computador
                    </button>
                  </div>

                  {/* Predefined templates cards */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ou mimetize instantaneamente com modelos de edital:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {EDITADO_TEXTS.map((tpl, i) => (
                        <div 
                          key={i} 
                          onClick={() => {
                            setUploadedFileName(tpl.title);
                            handleTriggerTenderScanner(i);
                          }}
                          className="p-4 bg-white border rounded-lg hover:border-emerald-500 shadow-xs cursor-pointer transition-colors flex flex-col justify-between"
                          style={{ borderColor: panelBorderColor }}
                        >
                          <div>
                            <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm mb-2"># {i + 1}</div>
                            <h5 className="font-bold text-slate-800 text-xs line-clamp-1">{tpl.title}</h5>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-3 leading-relaxed">{tpl.snippet}</p>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-4 block">Testar Modelo ID &rarr;</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grade de Acompanhamento Multidocumento (Tracking grid) */}
                  <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4" style={{ borderColor: panelBorderColor }}>
                    <div className="flex justify-between items-center border-b pb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Database className="w-4 h-4 text-emerald-600" /> Acompanhamento de Status de Editais</h3>
                        <p className="text-xs text-slate-400">Total de {lastScannedTenders.length || 0} edital(is) analisado(s)</p>
                      </div>
                      <span className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full">Grade de Tracking Ativa</span>
                    </div>

                    {lastScannedTenders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              <th className="py-2">Edital / Arquivo</th>
                              <th className="py-2">Órgão Licitante</th>
                              <th className="py-2">Modalidade</th>
                              <th className="py-2">Valor Estimado</th>
                              <th className="py-2">Data da Leitura</th>
                              <th className="py-2">Status</th>
                              <th className="py-2 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {lastScannedTenders.map((tender, index) => (
                              <tr key={tender.id || index} className="hover:bg-slate-50/50">
                                <td className="py-3 font-semibold text-slate-800 flex items-center gap-2 max-w-[180px] truncate">
                                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate" title={tender.fileName}>{tender.fileName}</span>
                                </td>
                                <td className="py-3 text-slate-600 truncate max-w-[150px]" title={tender.orgao}>{tender.orgao}</td>
                                <td className="py-3 text-slate-500">{tender.modalidade}</td>
                                <td className="py-3 font-mono text-slate-800 font-semibold">
                                  {tender.valorEstimado ? `R$ ${Number(tender.valorEstimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não definido'}
                                </td>
                                <td className="py-3 text-slate-400">{tender.timestamp?.split(' ')[0] || tender.timestamp}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    tender.status === 'Importado' || tender.status === 'Salvo'
                                      ? 'bg-emerald-150 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {tender.status || 'Analisado'}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button 
                                      onClick={() => {
                                        setUploadedFileName(tender.fileName);
                                        setScannerResult({
                                          orgao: tender.orgao,
                                          objeto: tender.objeto,
                                          modalidade: tender.modalidade,
                                          valor_estimado: tender.valorEstimado,
                                          prazo_proposta: tender.prazoProposta,
                                          prazo_abertura: tender.prazoProposta,
                                          exigencias_atestados: tender.exigencias_atestados,
                                          documentos_obrigatorios: tender.documentos_obrigatorios,
                                          numero_edital: (tender as any).numeroEdital || "",
                                          numero_processo: (tender as any).numeroProcesso || ""
                                        });
                                        setEditableScannerResult({
                                          orgao: tender.orgao,
                                          objeto: tender.objeto,
                                          modalidade: tender.modalidade,
                                          valor_estimado: tender.valorEstimado,
                                          prazo_proposta: tender.prazoProposta,
                                          prazo_abertura: tender.prazoProposta,
                                          exigencias_atestados: tender.exigencias_atestados,
                                          documentos_obrigatorios: tender.documentos_obrigatorios,
                                          numero_edital: (tender as any).numeroEdital || "",
                                          numero_processo: (tender as any).numeroProcesso || ""
                                        });
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 text-xs font-bold"
                                    >
                                      Revisar
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const filtered = lastScannedTenders.filter((_, idx) => idx !== index);
                                        setLastScannedTenders(filtered);
                                        localStorage.setItem('proprocure_scanned_history', JSON.stringify(filtered));
                                      }}
                                      className="text-red-500 hover:text-red-700 font-bold"
                                      title="Descartar"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        Nenhum edital rastreado na grade até o momento. Faça upload para começar a acompanhar.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                  {/* Resumo do Edital Fields - STATE BOUND AND EDITABLE */}
                  <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: panelBorderColor }}>
                     {scannerError && (
                       <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs font-semibold flex items-start gap-2">
                         <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                         <span className="flex-1 leading-relaxed">
                           <strong>Aviso:</strong> {scannerError}
                         </span>
                       </div>
                     )}
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><CheckSquare className="w-4 h-4 text-emerald-600" /> Resumo do Edital Estruturado (Editável)</h3>
                        <button 
                          onClick={() => { setScannerResult(null); setEditableScannerResult(null); }} 
                          className="text-xs font-bold text-slate-500 hover:text-slate-800"
                        >
                          Cancelar
                        </button>
                     </div>
                     <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Número do Edital</label>
                           <input 
                             type="text" 
                             value={editableScannerResult?.numero_edital || ''} 
                             onChange={(e) => setEditableScannerResult({ ...editableScannerResult, numero_edital: e.target.value })}
                             className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
                             placeholder="Ex: 45/2023"
                           />
                         </div>
                         <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Número do Processo</label>
                           <input 
                             type="text" 
                             value={editableScannerResult?.numero_processo || ''} 
                             onChange={(e) => setEditableScannerResult({ ...editableScannerResult, numero_processo: e.target.value })}
                             className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
                             placeholder="Ex: MS-10492/2023"
                           />
                         </div>
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Órgão Licitante</label>
                         <input 
                           type="text" 
                           value={editableScannerResult?.orgao || ''} 
                           onChange={(e) => setEditableScannerResult({ ...editableScannerResult, orgao: e.target.value })}
                           className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Objeto do Edital</label>
                         <textarea 
                           rows={3} 
                           value={editableScannerResult?.objeto || ''} 
                           onChange={(e) => setEditableScannerResult({ ...editableScannerResult, objeto: e.target.value })}
                           className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Resumo Executivo do Edital (AI)</label>
                         <textarea 
                           rows={4} 
                           value={editableScannerResult?.resumo_edital || ''} 
                           onChange={(e) => setEditableScannerResult({ ...editableScannerResult, resumo_edital: e.target.value })}
                           className="w-full border border-emerald-200 rounded px-3 py-2 text-sm bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                           placeholder="Resumo das informações chaves extraídas pela inteligência artificial..."
                         />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Modalidade</label>
                           <input 
                             type="text" 
                             value={editableScannerResult?.modalidade || ''} 
                             onChange={(e) => setEditableScannerResult({ ...editableScannerResult, modalidade: e.target.value })}
                             className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                           />
                         </div>
                         <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Valor Estimado</label>
                           <input 
                             type="text" 
                             value={editableScannerResult?.valor_estimado || ''} 
                             onChange={(e) => setEditableScannerResult({ ...editableScannerResult, valor_estimado: e.target.value })}
                             className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" 
                           />
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Prazo de Proposta</label>
                           <input 
                             type="text" 
                             value={editableScannerResult?.prazo_proposta || ''} 
                             onChange={(e) => setEditableScannerResult({ ...editableScannerResult, prazo_proposta: e.target.value })}
                             className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" 
                             placeholder="Ex: 2026-06-15 09:00"
                           />
                         </div>
                         <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sessão / Abertura</label>
                           <input 
                             type="text" 
                             value={editableScannerResult?.prazo_abertura || editableScannerResult?.prazo_proposta || ''} 
                             onChange={(e) => setEditableScannerResult({ ...editableScannerResult, prazo_abertura: e.target.value })}
                             className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" 
                             placeholder="Ex: 2026-06-16 11:00"
                           />
                         </div>
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Exigências específicas de Atestados</label>
                         <textarea 
                           rows={2} 
                           value={editableScannerResult?.exigencias_atestados || ''} 
                           onChange={(e) => setEditableScannerResult({ ...editableScannerResult, exigencias_atestados: e.target.value })}
                           className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                         />
                       </div>
                     </div>
                     <button onClick={applyImportedScannerToBids} className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                       <Check className="w-4 h-4" /> Salvar Edital no Banco de Dados
                     </button>
                  </div>

                  {/* Requirements and Matching Grade */}
                  <div className="bg-white rounded-xl border p-6 shadow-sm flex flex-col" style={{ borderColor: panelBorderColor }}>
                     <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500" /> Análise de Exigências de Habilitação</h3>
                     
                     <div className="flex-1 space-y-6">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Documentos Obrigatórios Requeridos</h4>
                            <span className="text-[10px] text-slate-400">Clique para remover</span>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            {(editableScannerResult?.documentos_obrigatorios || []).map((doc: string, i: number) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded">
                                 <div className="flex items-center gap-3">
                                   <input type="checkbox" defaultChecked className="accent-emerald-600 w-4 h-4" />
                                   <span className="text-xs font-medium text-slate-700">{doc}</span>
                                 </div>
                                 <button 
                                   onClick={() => {
                                     const cp = [...(editableScannerResult.documentos_obrigatorios || [])];
                                     cp.splice(i, 1);
                                     setEditableScannerResult({ ...editableScannerResult, documentos_obrigatorios: cp });
                                   }}
                                   className="text-red-500 hover:text-red-700 text-xs font-bold"
                                 >
                                   &times;
                                 </button>
                              </div>
                            ))}
                          </div>

                          <div className="flex mt-3 gap-2">
                            <input 
                              type="text" 
                              id="custom-req-document" 
                              placeholder="Adicionar certidão ou documento de habilitação..." 
                              className="flex-1 text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none" 
                            />
                            <button 
                              onClick={() => {
                                const input = document.getElementById('custom-req-document') as HTMLInputElement;
                                if (input && input.value.trim()) {
                                  const cp = [...(editableScannerResult?.documentos_obrigatorios || [])];
                                  cp.push(input.value.trim());
                                  setEditableScannerResult({ ...editableScannerResult, documentos_obrigatorios: cp });
                                  input.value = "";
                                }
                              }}
                              className="px-3 bg-slate-800 text-white rounded text-xs font-bold hover:bg-slate-900"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">Atestados de Capacidade vs. Requisitos do Edital</h4>
                          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-3">
                             <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                               Exigência Técnica Mapada: <strong>&quot;{editableScannerResult?.exigencias_atestados || "Comprovação de fornecimento compatível com o objeto."}&quot;</strong>
                             </p>
                             
                             <div className="mt-4 pt-4 border-t border-indigo-200/50">
                               <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-2">Acervo da Empresa Disponível (CRUD Atestados)</p>
                               {companyCerts.length > 0 ? (
                                 <div className="p-3 bg-white border border-emerald-200 rounded-md shadow-sm">
                                   <div className="flex items-start justify-between">
                                      <div>
                                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> {companyCerts[0].nome_atestado}</p>
                                        <p className="text-[10px] text-slate-500">Emitido por {companyCerts[0].orgao_emissor}</p>
                                        <span className="inline-block mt-2 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase">Compatibilidade de Processamento Estimada</span>
                                      </div>
                                      <button onClick={() => setActiveTab('atestados')} className="text-indigo-600 text-[10px] font-bold hover:underline">Ver Prontos</button>
                                   </div>
                                 </div>
                               ) : (
                                 <div className="p-3 bg-red-50 border border-red-100 rounded-md text-xs text-red-700 font-medium flex items-center gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Nenhum atestado no CRUD atende a este requisito de capacidade.
                                 </div>
                               )}
                             </div>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ATESTADOS */}
          {activeTab === 'atestados' && (
            <motion.div key="atestados" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex justify-between items-end border-b pb-4" style={{ borderColor: panelBorderColor }}>
                 <div>
                   <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2"><Shield className="text-emerald-600" /> Controle de Atestados Técnicos (Acervo)</h2>
                   <p className="text-sm text-slate-500 font-medium">CRUD estruturado para servir de base no cruzamento técnico de editais</p>
                 </div>
                 <button onClick={() => setIsAddingCert(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-bold shadow-sm transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primaryColor }}>
                    <Plus className="w-4 h-4" /> Novo Atestado (PDF)
                 </button>
              </div>
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: panelBorderColor }}>
                 <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                   <div className="relative">
                     <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input type="text" placeholder="Buscar atestado ou item..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 bg-white focus:outline-none" />
                   </div>
                 </div>
                 <table className="w-full text-left text-sm">
                    <thead className="bg-[#F8FAFC] border-b text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                       <tr>
                          <th className="px-6 py-4 w-6"></th>
                          <th className="px-6 py-4">Atestado / Emissor</th>
                          <th className="px-6 py-4">Data Emissão</th>
                          <th className="px-6 py-4">Total Itens (Linhas)</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {companyCerts.map((cert) => (
                          <React.Fragment key={cert.id}>
                            <tr className="hover:bg-slate-50/50 cursor-pointer group">
                              <td className="px-6 py-4 text-slate-400 group-hover:text-emerald-600">
                                <ChevronRight className="w-4 h-4" />
                              </td>
                              <td className="px-6 py-4">
                                 <p className="font-bold text-slate-800">{cert.nome_atestado}</p>
                                 <p className="text-slate-500 text-xs mt-0.5">{cert.orgao_emissor}</p>
                              </td>
                              <td className="px-6 py-4 font-mono text-slate-600 text-xs font-semibold">{cert.data_emissao}</td>
                              <td className="px-6 py-4">
                                 <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">{cert.itens?.length || 0} Itens Cadastrados</span>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex justify-end gap-3">
                                   <button className="text-slate-400 hover:text-emerald-600" title="Ver Itens"><Layers className="w-4 h-4" /></button>
                                   <button disabled className="text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                                   <button onClick={() => handleDeleteCert(cert.id)} className="text-slate-400 hover:text-red-600"><Trash className="w-4 h-4" /></button>
                                 </div>
                              </td>
                            </tr>
                            {/* Line-by-line item preview (dummy expansion for UX context) */}
                            <tr className="bg-slate-50 border-t-0 hidden group-hover:table-row transition-all">
                              <td></td>
                              <td colSpan={4} className="p-0 border-t border-slate-100">
                                <div className="p-4 pl-0">
                                  <table className="w-full text-xs bg-white rounded border border-slate-200 shadow-sm">
                                    <thead className="bg-slate-100 text-slate-500">
                                      <tr><th className="p-2">Item Técnico (Linha do PDF)</th><th className="p-2 w-32">Qtd/Valor</th><th className="p-2 w-20">Ações</th></tr>
                                    </thead>
                                    <tbody>
                                      {cert.itens?.map((it:any, idx:number) => (
                                        <tr key={idx} className="border-t border-slate-100">
                                          <td className="p-2 text-slate-700 font-medium">{it.descricao || 'Item genérico'}</td>
                                          <td className="p-2 font-mono text-slate-500">{it.quantidade || '1'} unid.</td>
                                          <td className="p-2 text-right"><button className="text-slate-400 hover:text-emerald-600"><Edit className="w-3 h-3 inline" /></button></td>
                                        </tr>
                                      )) || (
                                        <tr><td colSpan={3} className="p-3 text-center text-slate-400">Nenhum item discriminado</td></tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                       ))}
                       {companyCerts.length === 0 && (
                         <tr><td colSpan={5} className="text-center py-8 text-slate-400">Nenhum atestado cadastrado na base. A análise não terá parâmetros de capacidade técnica.</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
            </motion.div>
          )}
          {/* EMPRESAS */}
          {activeTab === 'empresas' && (
            <motion.div key="empresas" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
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
            <motion.div key="usuarios" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
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

          {/* DICIONARIO */}
          {activeTab === 'dicionario' && (
            <motion.div key="ajustes" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex justify-between items-end border-b pb-4" style={{ borderColor: panelBorderColor }}>
                 <div>
                   <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2"><Database className="text-emerald-600" /> Dicionário Base de IA</h2>
                   <p className="text-sm text-slate-500 font-medium">Cadastre variações de termos e documentos para refinar ativamente a extração inteligente da IA nos próximos editais</p>
                 </div>
                 <button onClick={() => setIsAddingTermo(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-bold shadow-sm transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primaryColor }}>
                    <Plus className="w-4 h-4" /> Cadastrar Novo Termo
                 </button>
              </div>

              <div className="bg-white rounded-xl border p-6 shadow-sm overflow-hidden" style={{ borderColor: panelBorderColor }}>
                 <table className="w-full text-left border-collapse text-sm">
                   <thead>
                     <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                       <th className="pb-3 px-2">Categoria</th>
                       <th className="pb-3 px-2">Termo Oficial</th>
                       <th className="pb-3 px-2">Sinônimos / Variações de Leitura</th>
                       <th className="pb-3 px-2">Ação</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {dicionario.map((term, i) => (
                       <tr key={term.id || i} className="hover:bg-slate-50/50">
                         <td className="py-4 px-2">
                            <span className="px-2 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full font-sans uppercase">
                               {term.categoria}
                            </span>
                         </td>
                         <td className="py-4 px-2 font-bold text-slate-700">{term.termo}</td>
                         <td className="py-4 px-2 text-slate-500 font-medium">{term.sinonimos?.join(", ") || "Nenhum cadastrado"}</td>
                         <td className="py-4 px-2 text-right text-xs">
                            <button className="text-emerald-600 font-bold hover:text-emerald-800" onClick={() => setEditingTermo(term)}>Editar</button>
                         </td>
                       </tr>
                     ))}
                     {dicionario.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400 font-medium text-sm">Nenhum termo inteligente definido na base.</td>
                        </tr>
                     )}
                   </tbody>
                 </table>
              </div>
            </motion.div>
          )}

          {/* AJUSTES */}
          {activeTab === 'ajustes' && (
            <motion.div key="dicionario" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
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
                    <h3 className="text-sm font-bold text-slate-800 mb-2 mt-6 flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-600 animate-pulse" /> Integração Nativa Supabase
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 max-w-xl">
                      A conexão com a base de dados do Supabase agora é realizada de forma interna a partir das chaves em variáveis de ambiente <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-700 font-mono text-[10px]">NEXT_PUBLIC_SUPABASE_URL</code> e <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-700 font-mono text-[10px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Inputs manuais foram descontinuados para segurança empresarial robusta.
                    </p>
                    
                    <div className="p-4 bg-slate-50 border rounded-lg max-w-xl space-y-3" style={{ borderColor: panelBorderColor }}>
                       <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-600">Status do Banco de Dados:</span>
                         {supabaseMode === 'connected' ? (
                           <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Conectado & Sincronizado (Interno)
                           </span>
                         ) : (
                           <span className="px-2.5 py-1 bg-slate-150 text-slate-600 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-sans font-bold">
                             <span className="w-1.5 h-1.5 rounded-full bg-slate-400 font-bold"></span> Modo de Demonstração (Local)
                           </span>
                         )}
                       </div>

                       {supabaseMode === 'connected' && (
                         <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t font-mono">
                           <div><strong className="text-slate-600">Provedor Integrado:</strong> Supabase Cloud Server-to-Client</div>
                           <div><strong className="text-slate-600">Host URL:</strong> {supabaseUrl ? `${supabaseUrl.substring(0, 35)}...` : 'Processado Seguro'}</div>
                         </div>
                       )}
                    </div>
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-2 mt-6 flex items-center gap-2"><Database className="w-4 h-4 text-indigo-600" /> Histórico de Migrations SQL do Banco</h3>
                    <div className="bg-slate-900 rounded border border-slate-700 p-4 overflow-x-auto" style={{ maxHeight: '300px' }}>
                       <pre className="text-[10px] sm:text-xs font-mono text-emerald-400">
                          {migrationSql || "Carregando SQL do banco de dados..."}
                       </pre>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}



          {/* CRUD Modals Wrapper */}
          {Object.values([isAddingCompany, isAddingUser, isAddingCert, isAddingBid, !!selectedBidDetail, !!editingTermo, isAddingTermo]).some(Boolean) && (
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
                           <select value={it.relevancia_tecnica} onChange={(e) => { const cp = [...newCertItems]; cp[idx].relevancia_tecnica = e.target.value as "Alta"| "Média" | "Baixa"; setNewCertItems(cp); }} className="w-24 border p-1.5 rounded text-sm text-slate-600">
                             <option value="Alta">Alta</option>
                             <option value="Média">Média</option>
                             <option value="Baixa">Baixa</option>
                           </select>
                           <button onClick={() => { const cp = [...newCertItems]; cp.splice(idx, 1); setNewCertItems(cp); }} className="text-red-500 p-1"><Trash className="w-4 h-4"/></button>
                         </div>
                       ))}
                       <button onClick={() => setNewCertItems([...newCertItems, { item_numero: newCertItems.length + 1, descricao: '', quantidade: 1, unidade: 'un', relevancia_tecnica: 'Média' }])} className="text-xs font-bold text-emerald-600 mt-2">+ Adicionar Linha</button>
                    </div>
                    <button onClick={handleSaveCertificate} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded mt-2">Salvar Atestado Completo</button>
                  </div>
                </div>
              )}

              {/* Database Bid Detail Modal */}
              {selectedBidDetail && (
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl m-auto animate-in fade-in zoom-in-95 duration-200 border-t-4 border-emerald-650 max-h-[90vh] overflow-y-auto z-50 text-left">
                  <div className="flex justify-between items-start mb-4 pb-2 border-b">
                    <div>
                      <span className="px-2 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full uppercase tracking-wider font-mono">DADOS DO BANCO DE DADOS OFICIAL</span>
                      <h3 className="text-lg font-bold text-slate-800 mt-1">Detalhes Completos do Certame Salvo</h3>
                    </div>
                    <button onClick={() => setSelectedBidDetail(null)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Número do Edital</span>
                        <span className="font-mono text-sm font-bold text-slate-800">{selectedBidDetail.numero_edital || "Não fornecido/extraído"}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Número do Processo</span>
                        <span className="font-mono text-sm font-bold text-slate-800">{selectedBidDetail.numero_processo || "Não fornecido/extraído"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Órgão Contratante</span>
                        <span className="text-sm font-semibold text-slate-800">{selectedBidDetail.orgao}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modalidade</span>
                        <span className="text-sm font-semibold text-slate-800">{selectedBidDetail.modalidade}</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Objeto da Contratação</span>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border leading-relaxed whitespace-pre-wrap">{selectedBidDetail.objeto}</p>
                    </div>

                    {selectedBidDetail.resumo_edital && (
                      <div>
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Resumo do Edital (Gerado por Inteligência Artificial)</span>
                        <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded border border-emerald-100 leading-relaxed whitespace-pre-wrap font-medium">{selectedBidDetail.resumo_edital}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor Estimado</span>
                        <span className="font-mono text-sm font-black text-emerald-600">R$ {Number(selectedBidDetail.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prazo Proposta</span>
                        <span className="font-mono text-xs text-slate-605">{selectedBidDetail.prazo_proposta?.split('T')[0] || selectedBidDetail.prazo_proposta}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sessão / Abertura</span>
                        <span className="font-mono text-xs text-slate-605">{selectedBidDetail.prazo_abertura?.split('T')[0] || selectedBidDetail.prazo_abertura || selectedBidDetail.prazo_proposta?.split('T')[0]}</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-sans">Exigências Técnicas / Atestados</span>
                      <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedBidDetail.exigencias_atestados || "Nenhuma exigência específica apontada ou identificada."}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Checklist de Documentos de Habilitação</span>
                      {selectedBidDetail.documentos_obrigatorios && selectedBidDetail.documentos_obrigatorios.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {selectedBidDetail.documentos_obrigatorios.map((doc, idx) => (
                            <div key={idx} className="flex gap-2 items-start p-2 bg-slate-50 border rounded text-xs text-slate-700">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span>{doc}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Dispensado ou nenhum documento listado no extrato do edital.</p>
                      )}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button onClick={() => setSelectedBidDetail(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs shadow-sm transition-colors">
                        Fechar Registro
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Dicionario Modal */}
              {(isAddingTermo || !!editingTermo) && (
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md m-auto animate-in fade-in zoom-in-95 duration-200 text-left">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">{isAddingTermo ? 'Novo Termo IA' : 'Editar Termo IA'}</h3>
                    <button onClick={() => { setIsAddingTermo(false); setEditingTermo(null); }} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Categoria do Termo</label>
                      <select 
                        defaultValue={editingTermo?.categoria || 'Modalidade'}
                        id="termoCategoria"
                        className="w-full border p-2 rounded focus:outline-none text-sm bg-white"
                      >
                        <option value="Modalidade">Modalidade</option>
                        <option value="Órgão">Órgão Público</option>
                        <option value="Atestado">Exigência Técnica / Atestado</option>
                        <option value="Documento">Documento de Habilitação</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Termo Principal (Oficial)</label>
                      <input id="termoNome" type="text" defaultValue={editingTermo?.termo || ''} className="w-full border p-2 rounded focus:outline-none text-sm" placeholder="Ex: Balanço Patrimonial" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Sinônimos e Variações (Separados por vírgula)</label>
                      <textarea id="termoSinonimos" defaultValue={editingTermo?.sinonimos?.join(", ") || ''} className="w-full border p-2 rounded focus:outline-none text-sm h-20" placeholder="Ex: Balanço Financeiro, Demonstração Contábil"></textarea>
                    </div>
                    <button 
                      onClick={async () => {
                        const categoria = (document.getElementById('termoCategoria') as HTMLSelectElement).value;
                        const termo = (document.getElementById('termoNome') as HTMLInputElement).value;
                        const sinonimosRaw = (document.getElementById('termoSinonimos') as HTMLTextAreaElement).value;
                        const sinonimos = sinonimosRaw.split(',').map(s => s.trim()).filter(Boolean);

                        if (!termo) return alert("Informe o termo.");

                        const updatedOrNewData = {
                          categoria,
                          termo,
                          sinonimos,
                          chave_empresa: 'LICITATECH' // hardcoded mock scope for user
                        };

                        const supabase = getSupabaseClient();

                        if (isAddingTermo) {
                          const freshTermo = { id: crypto.randomUUID(), ...updatedOrNewData, ativo: true };
                          if (supabase) {
                            const { error } = await supabase.from('dicionario_parse_edital').insert([{ ...freshTermo, created_at: undefined }]);
                            if (error) {
                              alert("Erro ao salvar termo: " + error.message);
                              return;
                            }
                          }
                          setDicionario([freshTermo, ...dicionario]);
                        } else if (editingTermo) {
                          const updatedTerm = { ...editingTermo, ...updatedOrNewData };
                          if (supabase) {
                            const { error } = await supabase.from('dicionario_parse_edital').update({ ...updatedOrNewData }).eq('id', editingTermo.id);
                            if (error) {
                              alert("Erro ao atualizar termo: " + error.message);
                              return;
                            }
                          }
                          setDicionario(dicionario.map(t => t.id === editingTermo.id ? updatedTerm : t));
                        }

                        setIsAddingTermo(false);
                        setEditingTermo(null);
                      }} 
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded mt-4">
                      {isAddingTermo ? 'Cadastrar Termo' : 'Salvar Alterações'}
                    </button>
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
                        <label className="block text-xs font-bold text-slate-500 mb-1">Número do Edital</label>
                        <input type="text" value={newBidNumeroEdital} onChange={e=>setNewBidNumeroEdital(e.target.value)} className="w-full border p-2 rounded focus:outline-none text-sm font-mono" placeholder="Ex: 45/2023" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Número do Processo</label>
                        <input type="text" value={newBidNumeroProcesso} onChange={e=>setNewBidNumeroProcesso(e.target.value)} className="w-full border p-2 rounded focus:outline-none text-sm font-mono" placeholder="Ex: MS-10492/2023" />
                      </div>
                    </div>
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
