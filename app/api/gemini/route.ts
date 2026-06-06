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
"${text}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              numero_processo: { type: Type.STRING, description: "Número ou código do processo administrativo se encontrado" },
              numero_edital: { type: Type.STRING, description: "O número de identificação do pregão/edital se aplicável" },
              modalidade: { type: Type.STRING, description: "Pregão Eletrônico, Concorrência, Tomada de Preços, Inexigibilidade, Dispensa, ou outro" },
              orgao: { type: Type.STRING, description: "Nome completo do órgão licitante / contratante" },
              objeto: { type: Type.STRING, description: "Título ou objeto comercial exato da licitação" },
              resumo_edital: { type: Type.STRING, description: "Resumo analítico focado e objetivo do edital" },
              valor_estimado: { type: Type.NUMBER, description: "Valor numérico estimado ou teto" },
              prazo_proposta: { type: Type.STRING, description: "data e hora limite de envio de propostas no formato YYYY-MM-DD HH:mm" },
              prazo_abertura: { type: Type.STRING, description: "data e hora da sessão no formato YYYY-MM-DD HH:mm" },
              documentos_obrigatorios: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de documentos de habilitação requeridos" },
              exigencias_atestados: { type: Type.STRING, description: "Frase resumida das exigências qualitativas ou quantitativas de atestados" }
            },
            required: [
              "numero_processo", "numero_edital", "modalidade", "orgao", "objeto", 
              "resumo_edital", "valor_estimado", "prazo_proposta", "prazo_abertura", 
              "documentos_obrigatorios", "exigencias_atestados"
            ]
          },
          systemInstruction: "Você é um especialista em licitações públicas brasileiras e formatação de dados estruturados em JSON.",
        },
      });

      const resultText = response.text || "{}";
      return NextResponse.json(JSON.parse(resultText));
    }

    if (action === "parse_certificate") {
      const prompt = `Analise o texto extraído do Atestado de Capacidade Técnica abaixo e retorne um objeto JSON contendo informações extraídas de forma estruturada, com itens linha a linha detalhados.
"${text}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nome_atestado: { type: Type.STRING },
              orgao_emissor: { type: Type.STRING },
              data_emissao: { type: Type.STRING, description: "Formato YYYY-MM-DD" },
              observacoes: { type: Type.STRING },
              itens: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item_numero: { type: Type.NUMBER },
                    descricao: { type: Type.STRING },
                    quantidade: { type: Type.NUMBER },
                    unidade: { type: Type.STRING },
                    relevancia_tecnica: { type: Type.STRING }
                  },
                  required: ["item_numero", "descricao", "quantidade", "unidade", "relevancia_tecnica"]
                }
              }
            },
            required: ["nome_atestado", "orgao_emissor", "data_emissao", "observacoes", "itens"]
          },
          systemInstruction: "Você é um especialista em análise de atestados técnicos de acervo e engenharia ou prestação de serviços com formatação JSON.",
        },
      });

      const resultText = response.text || "{}";
      return NextResponse.json(JSON.parse(resultText));
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

Analise se os itens executados listados nos atestados atendem quantitativamente ou qualitativamente às exigências descritas no Edital. Calcule um score matemático estimado de aderência técnica (de 0 a 100).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score_aderencia: { type: Type.NUMBER },
              elegibilidade: { type: Type.STRING },
              justificativa: { type: Type.STRING },
              pontos_fortes: { type: Type.ARRAY, items: { type: Type.STRING } },
              pontos_atencao: { type: Type.ARRAY, items: { type: Type.STRING } },
              checklist_verificação: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    status: { type: Type.STRING },
                    detalhe: { type: Type.STRING }
                  },
                  required: ["item", "status", "detalhe"]
                }
              },
              recomendacao_final: { type: Type.STRING }
            },
            required: [
              "score_aderencia", "elegibilidade", "justificativa", "pontos_fortes", 
              "pontos_atencao", "checklist_verificação", "recomendacao_final"
            ]
          },
          systemInstruction: "Você é um consultor sênior de licitações públicas com conhecimento analítico avançado de editais e aptidões jurídicas/técnicas.",
        },
      });

      const resultText = response.text || "{}";
      return NextResponse.json(JSON.parse(resultText));
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
