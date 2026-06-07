-- SQL MIGRATIONS FOR PROPROCURE SYSTEM
-- COMPREHENSIVE SCHEMA UPDATE (Aligning Supabase with App Types)
-- This file matches exactly what the React application expects (TEXT IDs to support 'c_', 'e_', and 'a_' prefixed strings).
-- If you have already executed a previous mismatched version of this script, please run the "RECONSTRUTOR" section below first.

-- ==========================================
-- RECONSTRUTOR DE BASE (Para limpar tabelas antigas, Descomente abaixo se necessário)
-- ==========================================
-- DROP TABLE IF EXISTS public.documentos_repositorio CASCADE;
-- DROP TABLE IF EXISTS public.atestados_itens CASCADE;
-- DROP TABLE IF EXISTS public.atestados_tecnicos CASCADE;
-- DROP TABLE IF EXISTS public.dicionario_parse_edital CASCADE;
-- DROP TABLE IF EXISTS public.licitacoes CASCADE;
-- DROP TABLE IF EXISTS public.usuarios CASCADE;
-- DROP TABLE IF EXISTS public.perfis_acesso CASCADE;
-- DROP TABLE IF EXISTS public.empresas CASCADE;
-- DROP TABLE IF EXISTS public.configuracoes CASCADE;

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
    chave_empresa VARCHAR(50) REFERENCES public.empresas(chave_empresa) ON DELETE CASCADE,
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

-- 5. Tabela de Atestados Técnicos (Company Technical Certificates)
CREATE TABLE IF NOT EXISTS public.atestados_tecnicos (
    id TEXT PRIMARY KEY,
    chave_empresa VARCHAR(50) REFERENCES public.empresas(chave_empresa) ON DELETE CASCADE,
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

-- 8. SEED DATA (Amostras básicas de homologação)
INSERT INTO public.empresas (id, nome, chave_empresa, cnpj)
VALUES 
  ('d1111111-1111-1111-1111-111111111111', 'LicitaTech Engenharia Ltda', 'LICITATECH', '12.345.678/0001-90'),
  ('d2222222-2222-2222-2222-222222222222', 'Alpha Solutions Corporativas', 'ALPHASOL', '98.765.432/0001-10')
ON CONFLICT (chave_empresa) DO UPDATE SET
  nome = EXCLUDED.nome,
  cnpj = EXCLUDED.cnpj;

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
