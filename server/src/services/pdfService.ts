import pdfParse from 'pdf-parse';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('[PDF Service] Error parsing PDF text:', error);
    throw new Error('Failed to extract text from PDF file.');
  }
}
