import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(StorageService.name);
  private readonly bucketName = 'ratevoice-assets'; 
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg',
    'application/pdf'
  ];

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase credentials not found. Storage will be disabled.');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadFile(file: any, folder: string, filename?: string): Promise<string | null> {
    if (!this.supabase) {
      this.logger.error('Storage service not initialized');
      return null;
    }

    // 1. Validate File Size
    if (file.size > this.MAX_FILE_SIZE) {
        throw new BadRequestException(`File size exceeds limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // 2. Validate MIME Type (Magic Numbers via file-type)
    const { fileTypeFromBuffer } = await import('file-type');
    const type = await fileTypeFromBuffer(file.buffer);
    
    if (!type || !this.ALLOWED_MIME_TYPES.includes(type.mime)) {
        this.logger.warn(`Blocked upload of unsafe file type: ${type?.mime || 'unknown'}`);
        throw new BadRequestException('Invalid file type detected. Only images and audio are allowed.');
    }

    // 3. Sanitize Filename
    const safeFilename = (filename || file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, '');
    const path = `${folder}/${Date.now()}-${safeFilename}`;
    
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(path, file.buffer, {
          contentType: type.mime, // Use detected mime, not client provided
          upsert: true
        });

      if (error) {
        this.logger.error(`Upload failed: ${error.message}`);
        throw error;
      }

      const { data: publicUrlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(path);

      return publicUrlData.publicUrl;
    } catch (error) {
      this.logger.error(`Failed to upload file to ${path}`, error);
      return null;
    }
  }

  async deleteFile(path: string): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file ${path}`, error);
      return false;
    }
  }
}
