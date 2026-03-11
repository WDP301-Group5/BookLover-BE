import path from "node:path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export const convertFileToHtml = async (
  buffer: Buffer,
  originalname: string,
): Promise<string> => {
  const ext = path.extname(originalname).toLowerCase();

  let html = "";

  switch (ext) {
    case ".docx": {
      const result = await mammoth.convertToHtml({ buffer });
      html = result.value;
      break;
    }

    case ".pdf": {
      const parser = new PDFParse({ data: buffer })
      const data = await parser.getText();
      const paragraphs = data.text
        .split("\n")
        .map((p: unknown) => `<p>${p}</p>`)
        .join("");
      html = paragraphs;
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

  return html;
};
