export const extractTextFromPDF = async (pdfBuffer) => {
  try {
    if (!pdfBuffer) {
      throw new Error('PDF buffer is required');
    }

    // Dynamic import to avoid initialization issues
    const { default: pdfParse } = await import('pdf-parse');
    const data = await pdfParse(pdfBuffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }

    // Clean up the extracted text
    const cleanText = data.text
      .replace(/\s+/g, ' ') // Replace multiple whitespaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();

    return {
      text: cleanText,
      pages: data.numpages,
      info: data.info
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};