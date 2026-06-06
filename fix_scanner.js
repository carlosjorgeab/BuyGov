const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const regex = /setScannerError\("Aviso: O texto extraído do arquivo.*?setEditableScannerResult\(\{ \.\.\.parsedJSON \}\);/s;

const replacement = `setScannerError("Aviso: O texto extraído do arquivo PDF estava vazio ou ilegível (pode ser um documento digitalizado de imagem). Preparamos uma sugestão editável com base no nome do arquivo para você complementar!");
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
        body: JSON.stringify({ action, text: docText })
      });

      if (!response.ok) {
        throw new Error("Erro na comunicação com a API de extração");
      }

      parsedJSON = await response.json();

      setScannerResult({ ...parsedJSON, isCertificate: isAtestadoTemplate });
      setEditableScannerResult({ ...parsedJSON });`;

if(code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('app/page.tsx', code, 'utf8');
  console.log("Fixed page.tsx");
} else {
  console.log("Could not find match in page.tsx");
}
