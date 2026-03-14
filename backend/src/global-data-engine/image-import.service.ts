import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageImportService {
  private readonly logger = new Logger(ImageImportService.name);

  constructor(private storageService: StorageService) {}

  async processImages(businessId: string, imageUrls: string[]) {
    const uploadedImages: string[] = [];
    
    for (const url of imageUrls) {
      try {
        if (!url) continue;

        this.logger.debug(`Downloading image: ${url}`);
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        
        const file = {
          buffer: buffer,
          size: buffer.length,
          originalname: `import-${uuidv4()}.jpg`,
          mimetype: 'image/jpeg' 
        };

        const publicUrl = await this.storageService.uploadFile(
          file,
          `businesses/${businessId}`
        );

        if (publicUrl) {
            uploadedImages.push(publicUrl);
        }
      } catch (e) {
        this.logger.error(`Failed to process image ${url}: ${e.message}`);
      }
    }

    return uploadedImages;
  }
}
