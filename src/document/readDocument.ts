import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export type ReadProgress = (message: string, percent?: number) => void;

async function readPdf(file: File, onProgress: ReadProgress) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await task.promise;
  const pages: string[] = [];
  try {
    for (let index = 1; index <= pdf.numPages; index += 1) {
      onProgress(`Reading text layer ${index} of ${pdf.numPages}`, Math.round((index / pdf.numPages) * 100));
      const page = await pdf.getPage(index);
      const content = await page.getTextContent();
      pages.push(content.items.flatMap((item) => "str" in item ? [item.str] : []).join(" "));
    }
  } finally {
    await task.destroy();
  }
  return pages.join("\n").trim();
}

async function readImage(file: File, onProgress: ReadProgress) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: ({ status, progress }) => {
      if (status === "recognizing text") onProgress("Running local OCR", Math.round(progress * 100));
    },
  });
  try {
    const result = await worker.recognize(file);
    return result.data.text.trim();
  } finally {
    await worker.terminate();
  }
}

export async function readDocument(file: File, onProgress: ReadProgress = () => {}) {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return readPdf(file, onProgress);
  if (file.type.startsWith("image/")) return readImage(file, onProgress);
  if (file.type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) return file.text();
  throw new Error("Use a text file, PDF, PNG, JPEG, or WebP image.");
}

