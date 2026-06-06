import { NextRequest, NextResponse } from "next/server";

function extractPrintableAscii(buffer: Buffer): string {
  try {
    let result = "";
    for (let i = 0; i < buffer.length; i++) {
      const char = buffer[i];
      // ASCII printable characters (32 to 126) plus line breaks
      if ((char >= 32 && char <= 126) || char === 10 || char === 13) {
        result += String.fromCharCode(char);
      }
    }
    // Sanitize from binary brackets and return cleaned string
    return result
      .replace(/[^a-zA-Z0-9\sÁÉÍÓÚáéíóúâêîôûÂÊÎÔÛãõÃÕçÇ.,/:\-()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch (err) {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    let parsedText = "";
    
    try {
      // Dynamic import to bypass static Next.js ESM default export resolution check
      const pdfModule = await import("pdf-parse");
      const anyPdfModule = pdfModule as any;
      
      let parsedData;
      // CommonJS modules might resolve directly, under .default, or as the module object itself
      if (typeof anyPdfModule === "function") {
        parsedData = await anyPdfModule(buffer);
      } else if (anyPdfModule && typeof anyPdfModule.default === "function") {
        parsedData = await anyPdfModule.default(buffer);
      } else if (anyPdfModule && anyPdfModule.default && typeof anyPdfModule.default.default === "function") {
        parsedData = await anyPdfModule.default.default(buffer);
      } else {
        parsedData = await anyPdfModule(buffer);
      }
      
      parsedText = parsedData?.text || "";
    } catch (importError: any) {
      // Fallback if pdf-parse fails or has runtime issues
      console.warn("pdf-parse failed or not loaded. Using printable characters extractor fallback:", importError);
      parsedText = extractPrintableAscii(buffer);
    }
    
    // If parsed text is extremely short, supplement with name-based metadata fallback
    if (!parsedText || parsedText.trim().length < 20) {
      parsedText = extractPrintableAscii(buffer);
    }
    
    return NextResponse.json({ text: parsedText });
  } catch (error: any) {
    console.error("PDF Parsing error:", error);
    return NextResponse.json({ error: error.message || "Unknown error during PDF processing" }, { status: 500 });
  }
}
