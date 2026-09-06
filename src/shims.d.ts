declare module "mammoth" {
  interface MammothInput { arrayBuffer: ArrayBuffer }
  interface MammothResult { value: string; messages: unknown[] }
  export function convertToHtml(input: MammothInput): Promise<MammothResult>;
  export function extractRawText(input: MammothInput): Promise<MammothResult>;
  const mammoth: {
    convertToHtml: typeof convertToHtml;
    extractRawText: typeof extractRawText;
  };
  export default mammoth;
}

/* Vite `?url` asset imports resolve to a string path */
declare module "pdfjs-dist/build/pdf.worker.min.mjs?url" {
  const src: string;
  export default src;
}
