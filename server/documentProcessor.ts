import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { extractTextFromDocument } from './gemini';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

export interface ProcessedDocument {
  originalName: string;
  filePath: string;
  mimeType: string;
  size: number;
  extractedText: string;
}

export class DocumentProcessor {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      // Directory already exists or other error
    }
  }

  async processUploadedFile(file: any): Promise<ProcessedDocument> {
    // Sanitize filename to prevent path traversal attacks
    const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
    const safeFileName = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(this.uploadDir, safeFileName);
    
    // Save file to disk
    await writeFile(filePath, file.buffer);

    let extractedText = '';

    try {
      // Extract text based on file type
      if (file.mimetype === 'application/pdf') {
        // Use Gemini for PDF text extraction
        extractedText = await extractTextFromDocument(filePath, file.mimetype);
      } else if (file.mimetype.startsWith('text/')) {
        extractedText = await this.extractTextFile(filePath);
      } else if (file.mimetype.startsWith('image/')) {
        extractedText = await extractTextFromDocument(filePath, file.mimetype);
      } else {
        extractedText = 'Unsupported file type for text extraction';
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      extractedText = `Error extracting text: ${error}`;
    }

    return {
      originalName: file.originalname,
      filePath,
      mimeType: file.mimetype,
      size: file.size,
      extractedText
    };
  }


  private async extractTextFile(filePath: string): Promise<string> {
    try {
      return await readFile(filePath, 'utf-8');
    } catch (error) {
      console.error('Text file reading error:', error);
      return 'Error reading text file';
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}