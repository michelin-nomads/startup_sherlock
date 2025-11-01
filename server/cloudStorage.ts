/**
 * Google Cloud Storage Service
 * 
 * Handles document file storage and retrieval from Google Cloud Storage
 */

import { Storage, Bucket } from '@google-cloud/storage';
import { randomUUID } from 'crypto';
import path from 'path';

export interface CloudStorageConfig {
  projectId: string;
  bucketName: string;
  keyFilename?: string; // Path to service account key (optional if using ADC)
}

export interface UploadResult {
  bucket: string;
  path: string;
  publicUrl: string;
  signedUrl?: string;
}

export class CloudStorageService {
  private storage: Storage;
  private bucket: Bucket;
  private bucketName: string;

  constructor(config: CloudStorageConfig) {
    this.bucketName = config.bucketName;

    // Initialize Cloud Storage client
    const storageOptions: any = {
      projectId: config.projectId,
    };

    // Use service account key if provided, otherwise use Application Default Credentials
    if (config.keyFilename) {
      storageOptions.keyFilename = config.keyFilename;
    }

    this.storage = new Storage(storageOptions);
    this.bucket = this.storage.bucket(this.bucketName);
  }

  /**
   * Initialize bucket if it doesn't exist
   */
  async initializeBucket(): Promise<void> {
    try {
      const [exists] = await this.bucket.exists();
      
      if (!exists) {
        console.log(`📦 Creating bucket: ${this.bucketName}`);
        await this.storage.createBucket(this.bucketName, {
          location: 'US',
          storageClass: 'STANDARD',
          uniformBucketLevelAccess: { enabled: true },
        });
        console.log(`✅ Bucket created: ${this.bucketName}`);
      } else {
        console.log(`✅ Bucket exists: ${this.bucketName}`);
      }
    } catch (error) {
      console.error('❌ Error initializing bucket:', error);
      throw error;
    }
  }

  /**
   * Upload a file to Cloud Storage
   * @param file - File buffer or path
   * @param options - Upload options
   */
  async uploadFile(
    file: Buffer | string,
    options: {
      fileName: string;
      startupId: string;
      contentType?: string;
      makePublic?: boolean;
    }
  ): Promise<UploadResult> {
    try {
      // Generate unique file path
      const fileId = randomUUID();
      const extension = path.extname(options.fileName);
      const safeName = path.basename(options.fileName, extension).replace(/[^a-zA-Z0-9-_]/g, '_');
      const gcsPath = `startups/${options.startupId}/documents/${fileId}_${safeName}${extension}`;

      console.log(`📤 Uploading file to: gs://${this.bucketName}/${gcsPath}`);

      // Upload file
      const blob = this.bucket.file(gcsPath);
      
      const uploadOptions: any = {
        metadata: {
          contentType: options.contentType || 'application/octet-stream',
          metadata: {
            startupId: options.startupId,
            originalName: options.fileName,
            uploadedAt: new Date().toISOString(),
          },
        },
      };

      if (typeof file === 'string') {
        // File is a path
        await blob.save(file, uploadOptions);
      } else {
        // File is a buffer
        await blob.save(file, uploadOptions);
      }

      // Make public if requested
      if (options.makePublic) {
        await blob.makePublic();
      }

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${gcsPath}`;

      // Generate signed URL (valid for 1 hour) for private access
      const signedUrl = await this.getSignedUrl(gcsPath, 60);

      console.log(`✅ File uploaded successfully`);

      return {
        bucket: this.bucketName,
        path: gcsPath,
        publicUrl,
        signedUrl,
      };
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Download a file from Cloud Storage
   */
  async downloadFile(gcsPath: string): Promise<Buffer> {
    try {
      console.log(`📥 Downloading file from: gs://${this.bucketName}/${gcsPath}`);
      
      const file = this.bucket.file(gcsPath);
      const [buffer] = await file.download();
      
      console.log(`✅ File downloaded successfully`);
      return buffer;
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Delete a file from Cloud Storage
   */
  async deleteFile(gcsPath: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting file: gs://${this.bucketName}/${gcsPath}`);
      
      const file = this.bucket.file(gcsPath);
      await file.delete();
      
      console.log(`✅ File deleted successfully`);
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(gcsPath: string): Promise<boolean> {
    try {
      const file = this.bucket.file(gcsPath);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error('❌ Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Get a signed URL for temporary access to a private file
   * @param gcsPath - Path to file in bucket
   * @param expirationMinutes - URL expiration time in minutes
   */
  async getSignedUrl(gcsPath: string, expirationMinutes: number = 60): Promise<string> {
    try {
      const file = this.bucket.file(gcsPath);
      
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expirationMinutes * 60 * 1000,
      });
      
      return url;
    } catch (error) {
      console.error('❌ Error generating signed URL:', error);
      throw error;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(prefix: string): Promise<string[]> {
    try {
      const [files] = await this.bucket.getFiles({ prefix });
      return files.map(file => file.name);
    } catch (error) {
      console.error('❌ Error listing files:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(gcsPath: string): Promise<any> {
    try {
      const file = this.bucket.file(gcsPath);
      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      console.error('❌ Error getting file metadata:', error);
      throw error;
    }
  }

  /**
   * Move file to different path (copy + delete)
   */
  async moveFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      console.log(`📦 Moving file from ${sourcePath} to ${destPath}`);
      
      const sourceFile = this.bucket.file(sourcePath);
      await sourceFile.copy(this.bucket.file(destPath));
      await sourceFile.delete();
      
      console.log(`✅ File moved successfully`);
    } catch (error) {
      console.error('❌ Error moving file:', error);
      throw error;
    }
  }

  /**
   * Archive old files (move to archive folder)
   */
  async archiveFile(gcsPath: string): Promise<string> {
    const archivePath = `archive/${gcsPath}`;
    await this.moveFile(gcsPath, archivePath);
    return archivePath;
  }
}

// Singleton instance
let cloudStorageInstance: CloudStorageService | null = null;

/**
 * Initialize Cloud Storage service
 */
export function initCloudStorage(config: CloudStorageConfig): CloudStorageService {
  if (!cloudStorageInstance) {
    cloudStorageInstance = new CloudStorageService(config);
  }
  return cloudStorageInstance;
}

/**
 * Get Cloud Storage service instance
 */
export function getCloudStorage(): CloudStorageService {
  if (!cloudStorageInstance) {
    throw new Error('Cloud Storage not initialized. Call initCloudStorage() first.');
  }
  return cloudStorageInstance;
}

// Export for testing
export { CloudStorageService as _CloudStorageService };

