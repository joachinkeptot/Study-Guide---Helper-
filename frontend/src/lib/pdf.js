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

/**
 * Extracts PDF outline/structure along with text content
 * @param {File|Blob} fileOrBlob
 * @returns {Promise<{text: string, outline: any[], metadata: any, structure: any}>}
 */
export async function extractPDFStructure(fileOrBlob) {
  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // Get metadata
  const metadata = await pdf.getMetadata().catch(() => null);

  // Get outline (bookmarks/table of contents)
  const outline = await pdf.getOutline().catch(() => null);

  // Extract text with page information and formatting hints
  const pages = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Analyze text items for structure (headings, etc.)
    const items = content.items
      .map((item) => {
        if ("str" in item) {
          return {
            text: item.str,
            // Font size can indicate headings
            fontSize: item.transform ? item.transform[0] : null,
            // Position can help identify structure
            x: item.transform ? item.transform[4] : null,
            y: item.transform ? item.transform[5] : null,
          };
        }
        return null;
      })
      .filter(Boolean);

    // Detect potential headings (larger font size, different positioning)
    const avgFontSize =
      items.reduce((sum, item) => sum + (item.fontSize || 0), 0) / items.length;
    const headings = items.filter(
      (item) => item.fontSize && item.fontSize > avgFontSize * 1.3
    );

    const pageText = items
      .map((item) => item.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pages.push({
      pageNum,
      text: pageText,
      headings: headings.map((h) => h.text),
      itemCount: items.length,
    });
  }

  // Combine all text
  const fullText = pages.map((p) => p.text).join("\n\n");

  // Build hierarchical structure
  const structure = {
    totalPages: pdf.numPages,
    pages,
    detectedHeadings: pages.flatMap((p) =>
      p.headings.map((h) => ({
        text: h,
        page: p.pageNum,
      }))
    ),
    hasOutline: outline !== null && outline.length > 0,
  };

  return {
    text: fullText,
    outline: outline || [],
    metadata: metadata?.info || null,
    structure,
  };
}
