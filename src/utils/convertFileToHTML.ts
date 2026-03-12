import path from "node:path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export const convertFileToHtml = async (
  buffer: Buffer,
  originalname: string,
): Promise<string> => {
  const ext = path.extname(originalname).toLowerCase();

  let html = "";

  try {
    switch (ext) {
      case ".docx": {
        const result = await mammoth.convertToHtml({ buffer });
        html = result.value;
        break;
      }

      case ".pdf": {
        try {
          const parser = new PDFParse({ data: buffer });
          const data = await parser.getText();
          const paragraphs = data.text
            .split("\n")
            .map((p: unknown) => `<p>${p}</p>`)
            .join("");
          html = paragraphs;
        } catch (pdfError) {
          const errorMsg =
            pdfError instanceof Error
              ? pdfError.message
              : JSON.stringify(pdfError);
          throw new Error(`PDF parsing failed: ${errorMsg}`);
        }
        break;
      }

      case ".txt":
      case ".md": {
        const text = buffer.toString("utf-8");
        html = text
          .split("\n")
          .map((p) => `<p>${p}</p>`)
          .join("");
        break;
      }

      case ".html": {
        html = buffer.toString("utf-8");
        break;
      }

      default:
        throw new Error("File format không được hỗ trợ");
    }
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : JSON.stringify(error);
    throw new Error(`Không thể chuyển đổi tệp ${originalname}: ${errorMsg}`);
  }

  return html;
};
