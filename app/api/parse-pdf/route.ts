import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
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
    
    return NextResponse.json({ text: parsedData?.text || "" });
  } catch (error: any) {
    console.error("PDF Parsing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
