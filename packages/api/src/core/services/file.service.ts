import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'node:crypto';

export class FileService {
  constructor(private s3Client: S3Client) {}

  public async upload(
    buffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string> {
    const timestamp = Date.now();
    const randomString = randomBytes(8).toString('hex');
    const extension = filename.split('.').pop();

    const key = `uploads/${timestamp}-${randomString}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    return `${process.env.AWS_S3_BASE_URL}/${key}`;
  }
}
