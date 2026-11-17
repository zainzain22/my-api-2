import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';

@Injectable()
export class FileStorageService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'payment-proofs');

  async savePaymentProof(file: Express.Multer.File): Promise<string> {
    await mkdir(this.uploadDir, { recursive: true });
    const extension = extname(file.originalname).toLowerCase() || this.extFromMime(file.mimetype);
    const fileName = `${randomUUID()}${extension}`;
    const absolutePath = join(this.uploadDir, fileName);
    await writeFile(absolutePath, file.buffer);
    return `uploads/payment-proofs/${fileName}`;
  }

  private extFromMime(mimetype: string) {
    if (mimetype === 'image/jpeg') return '.jpg';
    if (mimetype === 'image/png') return '.png';
    if (mimetype === 'image/webp') return '.webp';
    if (mimetype === 'application/pdf') return '.pdf';
    return '';
  }
}
