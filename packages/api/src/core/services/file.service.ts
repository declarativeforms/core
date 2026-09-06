import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { IUploadedFile } from '@declarativeforms/engine';
import { randomBytes } from 'node:crypto';
import type { IDownloadedFile } from '../types';

const UPLOAD_KEY_PREFIX = 'uploads/';

export class FileService {
  constructor(private s3Client: S3Client) {}

  public async upload(
    buffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<IUploadedFile> {
    const key = `uploads/${Date.now()}-${randomBytes(8).toString('hex')}.${filename.split('.').pop()}`;

    const command = new PutObjectCommand({
      Body: buffer,
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      ContentType: contentType,
      Key: key,
    });

    await this.s3Client.send(command);

    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    const publicBaseUrl = process.env.PUBLIC_BASE_URL?.replace(/\/$/, '') || '';

    return {
      url: `${publicBaseUrl}/api/v1/files/${encodedKey}`,
      name: filename,
      size: buffer.length,
      type: contentType,
    };
  }

  public async download(key: string): Promise<IDownloadedFile | null> {
    if (!key.startsWith(UPLOAD_KEY_PREFIX) || key.includes('..')) {
      return null;
    }

    try {
      const result = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME as string,
          Key: key,
        }),
      );

      if (!result.Body) {
        return null;
      }

      return {
        body: Buffer.from(await result.Body.transformToByteArray()),
        contentType: result.ContentType,
      };
    } catch (error: any) {
      if (
        error?.name === 'NoSuchKey' ||
        error?.$metadata?.httpStatusCode === 404
      ) {
        return null;
      }

      throw error;
    }
  }
}
