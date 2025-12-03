// @ts-nocheck
// Lightweight PDF text extraction using pdfjs-dist in the browser
// This avoids treating PDFs as plain text, which produces garbage.

import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extracts concatenated text from a PDF File or Blob using pdfjs-dist
 * @param {File|Blob} fileOrBlob
 * @returns {Promise<string>} Full text content of the PDF
 */
export async function extractTextFromPDF(fileOrBlob) {
  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map((item) =>
      "str" in item ? item.str : ""
    );
    const pageText = strings.join(" ").replace(/\s+/g, " ").trim();
    if (pageText) {
      fullText += (fullText ? "\n\n" : "") + pageText;
    }
  }

  return fullText;
}
