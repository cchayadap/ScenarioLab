import { PDFParse } from "pdf-parse";
import JSZip from "jszip";

const XML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

function decodeXmlEntities(text: string): string {
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&apos;/g, (m) => XML_ENTITIES[m]);
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function parsePptx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml/)![1], 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml/)![1], 10);
      return na - nb;
    });

  const slideTexts: string[] = [];
  for (const name of slideFiles) {
    const xml = await zip.files[name].async("text");
    const runs = Array.from(xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)).map((m) =>
      decodeXmlEntities(m[1])
    );
    if (runs.length > 0) slideTexts.push(runs.join(" "));
  }

  return slideTexts.map((text, i) => `Slide ${i + 1}: ${text}`).join("\n\n");
}

export interface ParsedFile {
  text: string;
}

// Demo scope: plain text, PDF, and PPTX only — legacy .ppt/.doc binary formats
// and scanned/image-only PDFs aren't supported (see design doc, "Lesson selection page").
export async function parseUploadedFile(filename: string, buffer: Buffer): Promise<ParsedFile> {
  const ext = filename.toLowerCase().split(".").pop() || "";

  let text: string;
  if (ext === "pdf") {
    text = await parsePdf(buffer);
  } else if (ext === "pptx") {
    text = await parsePptx(buffer);
  } else if (ext === "txt" || ext === "md") {
    text = buffer.toString("utf-8");
  } else if (ext === "ppt" || ext === "doc") {
    throw new Error(
      `.${ext} isn't supported — please save it as .${ext === "ppt" ? "pptx" : "docx"} (or paste the text directly) and try again.`
    );
  } else {
    throw new Error(`Unsupported file type ".${ext}" — upload a .pdf, .pptx, .txt, or .md file.`);
  }

  if (!text || text.trim().length === 0) {
    throw new Error(
      "Couldn't find any readable text in that file — it may be scanned/image-only. Try pasting the text directly instead."
    );
  }

  return { text: text.trim() };
}
