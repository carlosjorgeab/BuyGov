-- Migration SQL for Supabase (PostgreSQL) - Controle de Licitações ProProcure
-- Date: 2026-06-02
-- This script contains table definitions, constraints, indices, and self-contained seed/bootstrap data.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Empresas (Multi-Enterprise Structure)
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    chave_empresa VARCHAR(50) UNIQUE NOT NULL,
    cnpj VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on enterprise key for fast filter queries
CREATE INDEX IF NOT EXISTS idx_empresas_chave ON public.empresas(chave_empresa);


-- 3. Usuarios (Profiles and Authentication Support)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    perfil VARCHAR(50) DEFAULT 'Analista' CHECK (perfil IN ('Administrador', 'Analista', 'Diretor')),
    chave_empresa VARCHAR(50) REFERENCES public.empresas(chave_empresa) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 4. Licitações (Tenders / Tenders Catalog)
CREATE TABLE IF NOT EXISTS public.licitacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave_empresa VARCHAR(50) REFERENCES public.empresas(chave_empresa) ON DELETE CASCADE NOT NULL,
    modalidade VARCHAR(100) NOT NULL, -- e.g. 'Pregão Eletrônico', 'Concorrência', 'Tomada de Preços'
    objeto TEXT NOT NULL,
    orgao VARCHAR(255) NOT NULL,
    valor_estimado NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    prazo_proposta TIMESTAMP WITH TIME ZONE NOT NULL,
    prazo_abertura TIMESTAMP WITH TIME ZONE NOT NULL,
    documentos_obrigatorios TEXT[] DEFAULT '{}'::TEXT[],
    exigencias_atestados TEXT DEFAULT '',
    status VARCHAR(50) DEFAULT 'Em Análise' CHECK (status IN ('Em Análise', 'Em Preparação', 'Submetido', 'Ganho', 'Descartado')),
    checklist_itens JSONB DEFAULT '[]'::JSONB, -- e.g. [{"id": "1", "label": "CND Federal", "checked": true}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_licitacoes_chave_empresa ON public.licitacoes(chave_empresa);
CREATE INDEX IF NOT EXISTS idx_licitacoes_status ON public.licitacoes(status);


-- 5. Atestados Técnicos (Company Technical Certificates)
CREATE TABLE IF NOT EXISTS public.atestados_tecnicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave_empresa VARCHAR(50) REFERENCES public.empresas(chave_empresa) ON DELETE CASCADE NOT NULL,
    nome_atestado VARCHAR(255) NOT NULL,
    orgao_emissor VARCHAR(255) NOT NULL,
    data_emissao DATE NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_atestados_chave_empresa ON public.atestados_tecnicos(chave_empresa);


-- 6. Itens de Atestados Técnicos (CRUD line by line capability)
CREATE TABLE IF NOT EXISTS public.atestados_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    atestado_id UUID REFERENCES public.atestados_tecnicos(id) ON DELETE CASCADE NOT NULL,
    item_numero INT NOT NULL,
    descricao TEXT NOT NULL,
    quantidade NUMERIC(12, 3) NOT NULL,
    unidade VARCHAR(50) NOT NULL, -- e.g. 'un', 'm2', 'h', 'km'
    relevancia_tecnica VARCHAR(50) DEFAULT 'Média' CHECK (relevancia_tecnica IN ('Alta', 'Média', 'Baixa')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 7. Documentos Base / Repositório
CREATE TABLE IF NOT EXISTS public.documentos_repositorio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave_empresa VARCHAR(50) REFERENCES public.empresas(chave_empresa) ON DELETE CASCADE NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    tag VARCHAR(100) NOT NULL, -- e.g. 'CNPJ', 'Certidão Federal', 'Balanço Patrimonial'
    validade DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 8. Configurações da Empresa
CREATE TABLE IF NOT EXISTS public.configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave_empresa VARCHAR(50) REFERENCES public.empresas(chave_empresa) ON DELETE CASCADE UNIQUE NOT NULL,
    system_timeout_minutes INT DEFAULT 15 NOT NULL,
    primary_color VARCHAR(10) DEFAULT '#091426' NOT NULL, -- Customize hex colors
    secondary_color VARCHAR(10) DEFAULT '#bc0000' NOT NULL,
    alertas_email BOOLEAN DEFAULT REAL NOT NULL,
    alertas_novos_editais BOOLEAN DEFAULT REAL NOT NULL,
    alertas_status_change BOOLEAN DEFAULT REAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- =======================================================
-- BOOTSTRAP / SEED DATA
-- =======================================================

-- Active Demo Companies
INSERT INTO public.empresas (id, nome, chave_empresa, cnpj)
VALUES 
('d1111111-1111-1111-1111-111111111111', 'LicitaTech Engenharia Ltda', 'LICITATECH', '12.345.678/0001-90'),
('d2222222-2222-2222-2222-222222222222', 'Alpha Solutions Corporativas', 'ALPHASOL', '98.765.432/0001-10')
ON CONFLICT (chave_empresa) DO NOTHING;

-- Initial Demo Users
INSERT INTO public.usuarios (email, nome, perfil, chave_empresa)
VALUES 
('carlos.mendes@empresa.com.br', 'Carlos Mendes', 'Administrador', 'LICITATECH'),
('analista.licita@empresa.com.br', 'Ana Silva', 'Analista', 'LICITATECH'),
('diretor.licita@empresa.com.br', 'Roberto Costa', 'Diretor', 'LICITATECH')
ON CONFLICT (email) DO NOTHING;

-- Base Documents
INSERT INTO public.documentos_repositorio (chave_empresa, nome_arquivo, tag, validade)
VALUES
('LICITATECH', 'Cartao_CNPJ_Atualizado.pdf', 'CNPJ', '2030-12-31'),
('LICITATECH', 'Certidado_Negativa_Federal.pdf', 'Certidão Federal', '2026-06-10'),
('LICITATECH', 'Balanco_Patrimonial_2025.pdf', 'Balanço Patrimonial', '2027-04-30')
ON CONFLICT DO NOTHING;

-- Initial Demo Configs
INSERT INTO public.configuracoes (chave_empresa, system_timeout_minutes, primary_color, secondary_color, alertas_email, alertas_novos_editais, alertas_status_change)
VALUES 
('LICITATECH', 15, '#091426', '#bc0000', true, true, false),
('ALPHASOL', 20, '#1E293B', '#D80000', true, false, true)
ON CONFLICT (chave_empresa) DO NOTHING;

-- Basic Demo Tenders
INSERT INTO public.licitacoes (id, chave_empresa, modalidade, objeto, orgao, valor_estimado, prazo_proposta, prazo_abertura, documentos_obrigatorios, exigencias_atestados, status, checklist_itens)
VALUES 
(
    'e1111111-1111-1111-1111-111111111111', 
    'LICITATECH', 
    'Pregão Eletrônico', 
    'Aquisição de equipamentos de monitoramento multiparamétrico e insumos médicos para salas de UTI integrada.', 
    'Ministério da Saúde (MS)', 
    2450000.00, 
    now() + interval '4 hours', -- Urgent proposal
    now() + interval '1 day',
    ARRAY['CNPJ', 'Certidão de Falência', 'Balanço Patrimonial', 'Atestado de Capacidade Técnica de Equipamentos Médicos'],
    'Exige atestado comprovando o fornecimento continuado de no mínimo 30 monitores cardíacos multiparamétricos de alta complexidade em ambiente de terapia intensiva.',
    'Em Preparação',
    '[{"id": "c1", "label": "Certidão Federal Negativa", "checked": true}, {"id": "c2", "label": "Balanço Patrimonial", "checked": false}]'::JSONB
),
(
    'e2222222-2222-2222-2222-222222222222', 
    'LICITATECH', 
    'Concorrência', 
    'Prestação de serviços de reforma estrutural, impermeabilização de lajes e pintura de blocos administrativos.', 
    'PMSP - Sec. de Obras', 
    850000.00, 
    now() + interval '2 days',
    now() + interval '3 days',
    ARRAY['CNPJ', 'Certidão do CREA', 'Atestado de Reforma Predial'],
    'Necessário comprovar execução de serviços de engenharia civil que incluam no mínimo 500m2 de impermeabilização de laje ou coberturas prediais com manta asfáltica.',
    'Em Análise',
    '[]'::JSONB
),
(
    'e3333333-3333-3333-3333-333333333333', 
    'LICITATECH', 
    'Tomada de Preços', 
    'Contratação de empresa para fornecimento e implantação de licenças de software de gestão pública municipal integrada.', 
    'TJSP', 
    120000.00, 
    now() + interval '12 days',
    now() + interval '13 days',
    ARRAY['CNPJ', 'Certidão de Diretrizes Técnicas', 'Atestado de Implantação de ERP'],
    'Exige atestado de homologação de sistema web voltado para área pública operado em nuvem com conformidade de banco de dados SQL e segurança LGPD.',
    'Em Análise',
    '[]'::JSONB
)
ON CONFLICT DO NOTHING;

-- Initial Demo Technical Certificates
INSERT INTO public.atestados_tecnicos (id, chave_empresa, nome_atestado, orgao_emissor, data_emissao, observacoes)
VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    'LICITATECH',
    'Atestado de Capacidade Hospitalar Albert Einstein',
    'Hospital Israelita Albert Einstein',
    '2025-02-15',
    'Atestado de alta relevância com grande quantidade de equipamentos e tecnologia médica de ponta fornecida.'
),
(
    'a2222222-2222-2222-2222-222222222222',
    'LICITATECH',
    'Atestado de Obras Civis - Metrô de São Paulo',
    'Companhia do Metropolitano de São Paulo - Metrô',
    '2024-08-30',
    'Refere-se à reforma predial e impermeabilização das lajes de blocos de ventilação de estações.'
)
ON CONFLICT DO NOTHING;

-- Technical Certificate Items (CRUD line-by-line)
INSERT INTO public.atestados_itens (atestado_id, item_numero, descricao, quantidade, unidade, relevancia_tecnica)
VALUES
('a1111111-1111-1111-1111-111111111111', 1, 'Fornecimento e instalação de monitor multiparamétrico de sinais vitais de UTI com ECG, SpO2 e Pressão Não-Invasiva.', 45.000, 'un', 'Alta'),
('a1111111-1111-1111-1111-111111111111', 2, 'Serviço de treinamento operacional complementar para enfermeiros e equipe médica intensivista na calibração de bombas de infusão.', 120.000, 'h', 'Média'),
('a2222222-2222-2222-2222-222222222222', 1, 'Aplicação de impermeabilização rígida e flexível com manta asfáltica polimérica de 4mm sob calor em coberturas industriais expostas.', 800.000, 'm2', 'Alta'),
('a2222222-2222-2222-2222-222222222222', 2, 'Pintura acrílica de alta resistência física para fachadas de concreto armado e blocos prediais de engenharia civil.', 1200.000, 'm2', 'Média')
ON CONFLICT DO NOTHING;
