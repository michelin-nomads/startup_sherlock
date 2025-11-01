import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { extractTextFromDocument } from './gemini';
import { Storage } from '@google-cloud/storage';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

export interface ProcessedDocument {
  originalName: string;
  filePath: string;
  gcsUrl?: string; // NEW: GCS URL
  mimeType: string;
  size: number;
  extractedText: string;
}

export class DocumentProcessor {
  private uploadDir: string;
  private storage: Storage | null = null;
  private bucketName: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.bucketName = process.env.GCS_BUCKET || 'startup-sherlock-documents';
    this.ensureUploadDir();
    this.initializeGCS();
  }

  private async ensureUploadDir() {
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      // Directory already exists or other error
    }
  }

  private initializeGCS() {
    try {
      // Check if credentials exist
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (credentialsPath && fs.existsSync(credentialsPath)) {
        this.storage = new Storage({
          projectId: process.env.GCS_PROJECT_ID || 'startup-sherlock',
          keyFilename: credentialsPath,
        });
        console.log('✅ Google Cloud Storage initialized');
      } else {
        console.log('⚠️  GCS credentials not found - files will only be stored locally');
      }
    } catch (error) {
      console.error('Failed to initialize GCS:', error);
      this.storage = null;
    }
  }

  async processUploadedFile(file: any): Promise<ProcessedDocument> {
    // Sanitize filename to prevent path traversal attacks
    const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
    const safeFileName = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(this.uploadDir, safeFileName);
    
    // Save file to disk temporarily
    await writeFile(filePath, file.buffer);

    let gcsUrl: string | undefined;

    // Upload to Google Cloud Storage if available
    if (this.storage) {
      try {
        const bucket = this.storage.bucket(this.bucketName);
        const gcsFileName = `documents/${safeFileName}`;
        const gcsFile = bucket.file(gcsFileName);

        await gcsFile.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
            metadata: {
              originalName: file.originalname,
            },
          },
        });

        gcsUrl = `gs://${this.bucketName}/${gcsFileName}`;
        console.log(`☁️  Uploaded to GCS: ${gcsUrl}`);
      } catch (error) {
        console.error('Failed to upload to GCS:', error);
      }
    }

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
      gcsUrl,
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