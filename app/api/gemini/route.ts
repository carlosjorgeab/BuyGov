import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Standard safe initialization matching AI coder guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    const { action, text, tenderData, certsData, dicionario } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "A chave API do Gemini não está configurada nos segredos (Secrets)." },
        { status: 500 }
      );
    }

    if (action === "parse_tender") {
      let dicionarioContext = "";
      if (dicionario && dicionario.length > 0) {
        dicionarioContext = "\nDICIONÁRIO DE TERMOS (Contexto auxiliar para reconhecimento):\n";
        dicionario.forEach((d: any) => {
          dicionarioContext += `- Categoria: ${d.categoria} | Termo: "${d.termo}" | Sinônimos/Variações possíveis: ${d.sinonimos?.join(", ")}\n`;
        });
        dicionarioContext += "Utilize este dicionário prioritariamente para correlacionar corretamente categorias do Edital como Órgão, Modalidade, Documentos de Habilitação ou Prazos.\n\n";
      }

      const prompt = `Analise o texto extraído do Edital de Licitação abaixo e retorne um objeto JSON contendo as informações de forma estruturada. Procure por todos os termos e variações possíveis de uma licitação para encontrar as informações corretas.${dicionarioContext}
Texto do Edital:
"${text}"

Retorne RIGOROSAMENTE as seguintes chaves no formato JSON:
{
  "numero_processo": "Número ou código do processo administrativo se encontrado (ex: 23154.00012/2023-11)",
  "numero_edital": "O número de identificação do pregão/edital se aplicável (ex: 45/2023)",
  "modalidade": "Pregão Eletrônico, Concorrência, Tomada de Preços, Inexigibilidade, Dispensa, ou outro",
  "orgao": "Nome completo do órgão licitante / contratante",
  "objeto": "Título ou objeto comercial exato da licitação",
  "resumo_edital": "Resumo analítico focado e objetivo do edital (o que estão comprando, quantidades, local de entrega, se há cotas, etc)",
  "valor_estimado": 1250000.00,
  "prazo_proposta": "data e hora limite de envio de propostas no formato YYYY-MM-DD HH:mm (estime ano se faltar)",
  "prazo_abertura": "data e hora da sessão no formato YYYY-MM-DD HH:mm (estime ano se faltar)",
  "documentos_obrigatorios": ["Documento 1", "Documento 2", "Certidão X"],
  "exigencias_atestados": "Frase resumida das exigências qualitativas ou quantitativas de atestados de capacidade técnica do edital"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "Você é um especialista em licitações públicas brasileiras e formatação de dados estruturados em JSON.",
        },
      });

      const resultText = response.text || "{}";
      let cleanJson = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
      try {
        return NextResponse.json(JSON.parse(cleanJson));
      } catch (jsonErr) {
        const match = cleanJson.match(/\{[\s\S]*\}/);
        if (match) return NextResponse.json(JSON.parse(match[0]));
        throw jsonErr;
      }
    }

    if (action === "parse_certificate") {
      const prompt = `Analise o texto extraído do Atestado de Capacidade Técnica abaixo e retorne um objeto JSON contendo informações extraídas de forma estruturada, com itens linha a linha detalhados.
"${text}"

Retorne RIGOROSAMENTE as seguintes chaves no formato JSON:
{
  "nome_atestado": "Título identificador curto do atestado",
  "orgao_emissor": "Empresa ou Órgão Público que assinou o atestado",
  "data_emissao": "Data de emissão no formato YYYY-MM-DD",
  "observacoes": "Resumo rápido de relevância",
  "itens": [
    {
      "item_numero": 1,
      "descricao": "Descrição clara dos serviços executados (ex: fornecimento de x monitores)",
      "quantidade": 150.00,
      "unidade": "un, m2, h, km, etc",
      "relevancia_tecnica": "Alta, Média ou Baixa"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "Você é um especialista em análise de atestados técnicos de acervo e engenharia ou prestação de serviços com formatação JSON.",
        },
      });

      const resultText = response.text || "{}";
      let cleanJson = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
      try {
        return NextResponse.json(JSON.parse(cleanJson));
      } catch (jsonErr) {
        const match = cleanJson.match(/\{[\s\S]*\}/);
        if (match) return NextResponse.json(JSON.parse(match[0]));
        throw jsonErr;
      }
    }

    if (action === "analyze_compatibility") {
      // Analyze compatibility of tender against available company certificates
      const prompt = `Você é uma Inteligência Artificial especialista em qualificação técnica para licitações.
Faça uma análise cruzada e comparativa detalhada e profissional se a empresa tem condições de participar do edital abaixo, baseado em seus Atestados Técnicos cadastrados.

DADOS DO EDITAL:
- Órgão: ${tenderData.orgao}
- Objeto: ${tenderData.objeto}
- Valor Estimado: R$ ${tenderData.valor_estimado?.toLocaleString("pt-BR")}
- Exigências de Atestados: ${tenderData.exigencias_atestados}
- Documentos Técnicos Requeridos: ${tenderData.documentos_obrigatorios?.join(", ")}

ATESTADOS TÉCNICOS DISPONÍVEIS NA EMPRESA:
${JSON.stringify(certsData, null, 2)}

Analise se os itens executados listados nos atestados atendem quantitativamente ou qualitativamente às exigências descritas no Edital. Calcule um score matemático estimado de aderência técnica (de 0 a 100).

Retorne rigorosamente no formato JSON com os seguintes campos sem adicionar comentários:
{
  "score_aderencia": 85,
  "elegibilidade": "Escolha entre: Altamente Recomendável, Possível com Riscos, ou Não Elegível",
  "justificativa": "Texto explicativo detalhado sobre os atestados apresentados que cobrem e fundamentam a participação",
  "pontos_fortes": ["Explicar qual atestado e item comprova satisfatoriamente cada requisito"],
  "pontos_atencao": ["Quais requisitos do edital não têm comprovação exata ou representam gap de quantidade/exigência"],
  "checklist_verificação": [
    {
      "item": "Requisito X",
      "status": "Escolha entre: Atendido, Parcialmente Atendido, ou Não Atendido",
      "detalhe": "Comprovado via Atestado Y"
    }
  ],
  "recomendacao_final": "Parecer consultivo final de ação para a diretoria comercial."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "Você é um consultor sênior de licitações públicas com conhecimento analítico avançado de editais e aptidões jurídicas/técnicas.",
        },
      });

      const resultText = response.text || "{}";
      let cleanJson = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
      try {
        return NextResponse.json(JSON.parse(cleanJson));
      } catch (jsonErr) {
        const match = cleanJson.match(/\{[\s\S]*\}/);
        if (match) return NextResponse.json(JSON.parse(match[0]));
        throw jsonErr;
      }
    }

    return NextResponse.json({ error: "Ação inválida ou não especificada." }, { status: 400 });
  } catch (err: any) {
    console.error("Gemini API Error details:", err);
    return NextResponse.json(
      { error: `Erro ao processar pela Inteligência Artificial do Gemini: ${err.message}` },
      { status: 500 }
    );
  }
}
