import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "overnight", "latest.json");
    const payload = JSON.parse(await readFile(filePath, "utf8"));
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json({ ok:false, updatedAt:new Date().toISOString(), markets:[], error:err instanceof Error ? err.message : "Unknown overnight snapshot error" }, { status:500, headers:{ "Cache-Control":"no-store" } });
  }
}
