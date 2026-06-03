// Types and Initial Mock Data for ProProcure - Controle de Licitações

export interface Empresa {
  id: string;
  nome: string;
  chave_empresa: string;
  cnpj: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface Licitacao {
  id: string;
  chave_empresa: string;
  modalidade: string;
  objeto: string;
  orgao: string;
  valor_estimado: number;
  prazo_proposta: string; // YYYY-MM-DD HH:mm
  prazo_abertura: string; // YYYY-MM-DD HH:mm
  documentos_obrigatorios: string[];
  exigencias_atestados: string;
  status: 'Em Análise' | 'Em Preparação' | 'Submetido' | 'Ganho' | 'Descartado';
  checklist_itens: ChecklistItem[];
  created_at: string;
}

export interface AtestadoItem {
  item_numero: number;
  descricao: string;
  quantidade: number;
  unidade: string;
  relevancia_tecnica: 'Alta' | 'Média' | 'Baixa';
}

export interface AtestadoTecnico {
  id: string;
  chave_empresa: string;
  nome_atestado: string;
  orgao_emissor: string;
  data_emissao: string; // YYYY-MM-DD
  observacoes: string;
  itens: AtestadoItem[];
}

export interface DocumentoBase {
  id: string;
  nome_arquivo: string;
  tag: string;
  validade: string;
}

export interface PerfilAcesso {
  id: string;
  nome: string;
  dashboard: boolean;
  agenda: boolean;
  scanner: boolean;
  atestados: boolean;
  empresas: boolean;
  usuarios_perfis: boolean;
  ajustes: boolean;
}

export interface PerfilUsuario {
  email: string;
  nome: string;
  senha?: string;
  perfilId: string;
  chave_empresa: string;
}

export const INITIAL_PROFILES: PerfilAcesso[] = [
  {
    id: 'perfil-admin',
    nome: 'Administrador Geral',
    dashboard: true,
    agenda: true,
    scanner: true,
    atestados: true,
    empresas: true,
    usuarios_perfis: true,
    ajustes: true
  },
  {
    id: 'perfil-analista',
    nome: 'Analista de Licitações',
    dashboard: true,
    agenda: true,
    scanner: true,
    atestados: true,
    empresas: false,
    usuarios_perfis: false,
    ajustes: false
  },
  {
    id: 'perfil-diretor',
    nome: 'Diretor Comercial',
    dashboard: true,
    agenda: true,
    scanner: false,
    atestados: true,
    empresas: false,
    usuarios_perfis: false,
    ajustes: true
  }
];

export interface MatchAnalysisResult {
  score_aderencia: number;
  elegibilidade: 'Altamente Recomendável' | 'Possível com Riscos' | 'Não Elegível';
  justificativa: string;
  pontos_fortes: string[];
  pontos_atencao: string[];
  checklist_verificação: {
    item: string;
    status: 'Atendido' | 'Parcialmente Atendido' | 'Não Atendido';
    detalhe: string;
  }[];
  recomendacao_final: string;
}

export const INITIAL_COMPANIES: Empresa[] = [
  {
    id: 'd1111111-1111-1111-1111-111111111111',
    nome: 'LicitaTech Engenharia Ltda',
    chave_empresa: 'LICITATECH',
    cnpj: '12.345.678/0001-90'
  },
  {
    id: 'd2222222-2222-2222-2222-222222222222',
    nome: 'Alpha Solutions Corporativas',
    chave_empresa: 'ALPHASOL',
    cnpj: '98.765.432/0001-10'
  }
];

export const INITIAL_USER: PerfilUsuario = {
  email: 'admin',
  nome: 'Administrador Geral',
  senha: 'Cjl@j2326082110',
  perfilId: 'perfil-admin',
  chave_empresa: 'ALL'
};

export const INITIAL_USERS: PerfilUsuario[] = [
  {
    email: 'admin',
    nome: 'Administrador Geral',
    senha: 'Cjl@j2326082110',
    perfilId: 'perfil-admin',
    chave_empresa: 'ALL'
  },
  {
    email: 'carlos.mendes@empresa.com.br',
    nome: 'Carlos Mendes',
    senha: '123',
    perfilId: 'perfil-admin',
    chave_empresa: 'LICITATECH'
  },
  {
    email: 'analista.licita@empresa.com.br',
    nome: 'Ana Silva',
    senha: '123',
    perfilId: 'perfil-analista',
    chave_empresa: 'LICITATECH'
  },
  {
    email: 'diretor.licita@empresa.com.br',
    nome: 'Roberto Costa',
    senha: '123',
    perfilId: 'perfil-diretor',
    chave_empresa: 'LICITATECH'
  }
];

export const INITIAL_BIDS = [
  {
    id: 'e1111111',
    chave_empresa: 'LICITATECH',
    modalidade: 'Pregão Eletrônico',
    objeto: 'Aquisição de equipamentos de monitoramento multiparamétrico e insumos médicos para salas de UTI integrada.',
    orgao: 'Ministério da Saúde (MS)',
    valor_estimado: 2450000.00,
    prazo_proposta: '2026-06-03 14:00', // Close timing
    prazo_abertura: '2026-06-04 09:00',
    documentos_obrigatorios: ['Cartão CNPJ', 'Certidão RFB', 'Balanço Patrimonial', 'Atestado de Aptidão UTI'],
    exigencias_atestados: 'Exige atestado comprovando o fornecimento continuado de no mínimo 30 monitores cardíacos multiparamétricos de alta complexidade em UTI.',
    status: 'Em Preparação',
    checklist_itens: [
      { id: 'c1', label: 'Certidão Federal Negativa', checked: true },
      { id: 'c2', label: 'Balanço Patrimonial', checked: false }
    ],
    created_at: '2026-06-02'
  },
  {
    id: 'e2222222',
    chave_empresa: 'LICITATECH',
    modalidade: 'Concorrência',
    objeto: 'Prestação de serviços de reforma estrutural, impermeabilização de lajes e pintura de blocos administrativos.',
    orgao: 'PMSP - Sec. de Obras',
    valor_estimado: 850000.00,
    prazo_proposta: '2026-06-08 14:30',
    prazo_abertura: '2026-06-09 10:00',
    documentos_obrigatorios: ['Cartão CNPJ', 'Certidão do CREA', 'Atestado de Reforma Predial'],
    exigencias_atestados: 'Necessário comprovar execução de serviços de engenharia civil que incluam no mínimo 500m2 de impermeabilização com manta asfáltica.',
    status: 'Em Análise',
    checklist_itens: [
      { id: 'c1', label: 'Certidão CREA', checked: true }
    ],
    created_at: '2026-06-02'
  },
  {
    id: 'e3333333',
    chave_empresa: 'LICITATECH',
    modalidade: 'Tomada de Preços',
    objeto: 'Contratação de empresa para fornecimento e implantação de licenças de software de gestão pública municipal integrada.',
    orgao: 'TJSP - Tribunal de Justiça',
    valor_estimado: 120000.00,
    prazo_proposta: '2026-06-15 17:00',
    prazo_abertura: '2026-06-16 09:00',
    documentos_obrigatorios: ['Cartão CNPJ', 'Atestado de Implantação ERP Web'],
    exigencias_atestados: 'Exige atestado de homologação de sistema web para área pública em nuvem de acordo com a LGPD.',
    status: 'Em Análise',
    checklist_itens: [],
    created_at: '2026-06-02'
  },
  {
    id: 'e4444444',
    chave_empresa: 'ALPHASOL',
    modalidade: 'Pregão Eletrônico',
    objeto: 'Fornecimento de infraestrutura de rede, servidores dedicados e cabeamento estruturado óptico.',
    orgao: 'PRODESP',
    valor_estimado: 5800000.00,
    prazo_proposta: '2026-06-25 10:00',
    prazo_abertura: '2026-06-25 14:00',
    documentos_obrigatorios: ['Cartão CNPJ', 'Certidão Técnica'],
    exigencias_atestados: 'Atestar fornecimento de servidores com processador Intel Xeon e certificação de rede estruturada.',
    status: 'Em Preparação',
    checklist_itens: [],
    created_at: '2026-06-02'
  }
] as Licitacao[];

export const INITIAL_CERTIFICATES: AtestadoTecnico[] = [
  {
    id: 'a1111111',
    chave_empresa: 'LICITATECH',
    nome_atestado: 'Atestado de Capacidade Hospitalar Albert Einstein',
    orgao_emissor: 'Hospital Israelita Albert Einstein',
    data_emissao: '2025-02-15',
    observacoes: 'Atestado de alta relevância com grande quantidade de equipamentos instalados.',
    itens: [
      { item_numero: 1, descricao: 'Fornecimento e instalação de monitor multiparamétrico de UTI de alta complexidade com suporte para múltiplos traçados, ECG, SpO2.', quantidade: 45, unidade: 'un', relevancia_tecnica: 'Alta' },
      { item_numero: 2, descricao: 'Treinamento operacional complementar para enfermeiros na calibração de bombas e calibradores médicos.', quantidade: 120, unidade: 'h', relevancia_tecnica: 'Média' }
    ]
  },
  {
    id: 'a2222222',
    chave_empresa: 'LICITATECH',
    nome_atestado: 'Atestado de Obras Civis - Metrô de São Paulo',
    orgao_emissor: 'Companhia do Metropolitano de SP',
    data_emissao: '2024-08-30',
    observacoes: 'Refere-se à reforma predial física e isolamento térmico metálico.',
    itens: [
      { item_numero: 1, descricao: 'Aplicação de impermeabilização rígida e flexível com manta asfáltica polimérica de 4mm sob calor em coberturas prediais.', quantidade: 800, unidade: 'm2', relevancia_tecnica: 'Alta' },
      { item_numero: 2, descricao: 'Pintura acrílica impermeabilizante em fachadas externas expostas de concreto armado.', quantidade: 1200, unidade: 'm2', relevancia_tecnica: 'Média' }
    ]
  },
  {
    id: 'a3333333',
    chave_empresa: 'ALPHASOL',
    nome_atestado: 'Atestado Servidores Datacenter Itaú',
    orgao_emissor: 'Itaú Unibanco S/A',
    data_emissao: '2025-07-12',
    observacoes: 'Implantação completa de rede segura tolerante à falha.',
    itens: [
      { item_numero: 1, descricao: 'Montagem de hacks de alta densidade e fornecimento de 35 Servidores Xeon para processamento centralizado.', quantidade: 35, unidade: 'un', relevancia_tecnica: 'Alta' }
    ]
  }
];

export const INITIAL_DOCUMENTS: DocumentoBase[] = [
  { id: 'doc1', nome_arquivo: 'Cartao_CNPJ_Atualizado.pdf', tag: 'CNPJ', validade: '2030-12-31' },
  { id: 'doc2', nome_arquivo: 'Certidao_Negativa_Federal.pdf', tag: 'Certidão Federal', validade: '2026-06-10' },
  { id: 'doc3', nome_arquivo: 'Balanco_Patrimonial_2025.pdf', tag: 'Balanço Patrimonial', validade: '2027-04-30' }
];

export const EDITADO_TEXTS = [
  {
    title: "Edital P.E. nº 45/2023 - Ministério da Saúde",
    snippet: `MINISTÉRIO DA SAÚDE - EXTRATO DE EDITAL
PE 45/2023. Objeto: Aquisição de equipamentos hospitalares para ampliação de rede intensiva UTI integrada. Exige atestado comprovando o fornecimento continuado de no mínimo 30 monitores cardíacos multiparamétricos de alta complexidade instalado.
Valor Estimado: R$ 2.450.000,00. Prazo limite para envio de propostas: 2026-10-09 09:00. Sessão pública de abertura e lances: 2026-10-09 14:30.
Documentos requeridos para habilitação: Cartão CNPJ, Balanço de Encerramento Contábil, Regularidade com a Receita Federal e Certificado de Conformidade Técnica da Anvisa.`
  },
  {
    title: "Edital Concorrência nº 12/2023 - Prefeitura de São Paulo",
    snippet: `PREFEITURA DO MUNICÍPIO DE SÃO PAULO - SECRETARIA DE INFRAESTRUTURA
Edital de Concorrência do tipo Menor Preço nº 12/2023. Objeto: Contratação de serviços de engenharia civil para impermeabilização de laje interna, restauração física estrutural e pintura da fachada de blocos de ensino municipal.
Valor Estimado Total Máximo ACEITO: R$ 850.000,00. Data limite de acolhimento de propostas de preço: 2026-10-15 14:00.
Qualificação Técnica específica: Atestados técnicos demonstrando impermeabilização ativa com manta asfáltica de no mínimo 500 metros quadrados (500m2).
Habitação legal: Licença de conselho regional CREA, comprovante de CNPJ ativo, certidão de falências e balanço.`
  },
  {
    title: "Atestado Albert Einstein (Para Teste de Importação)",
    snippet: `DECLARAÇÃO DE CAPACIDADE TÉCNICA - HOSPITAL JOINT COMMISSION ALBERT EINSTEIN
Atestamos para os devidos fins de direito que a proponente prestou e forneceu satisfatoriamente:
- Item 1: 45 Monitores multiparamétricos para UTI médica de ponta com leitura de oximetria e curva fisiológica.
- Item 2: Fornecimento de 15 Equipamentos de Eletrocardiograma portátil integrado a nuvem.
Emissão do documento em São Paulo no dia 15 de Fevereiro de 2025. Assinado por Diretoria de suprimentos e tecnologia hospitalar Einstein.`
  }
];
