import { NextRequest, NextResponse } from "next/server";
import { parseUploadedFile } from "@/lib/parseFile";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    const filename = "name" in file ? (file as File).name : "upload";
    const buffer = Buffer.from(await file.arrayBuffer());

    const { text } = await parseUploadedFile(filename, buffer);

    return NextResponse.json({ text });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to read that file" },
      { status: 400 }
    );
  }
}
