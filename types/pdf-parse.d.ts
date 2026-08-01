declare module "pdf-parse/lib/pdf-parse.js" {
  export type PdfParseResult = { text: string; numpages: number; numrender: number; info: Record<string, unknown>; metadata: unknown; version: string };
  export default function parse(data: Buffer | Uint8Array, options?: Record<string, unknown>): Promise<PdfParseResult>;
}
