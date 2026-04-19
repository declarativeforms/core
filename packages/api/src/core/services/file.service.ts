import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'node:crypto';

export class FileService {
  constructor(private s3Client: S3Client) {}

  public async upload(
    buffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string> {
    const key = `uploads/${Date.now()}-${randomBytes(8).toString('hex')}.${filename.split('.').pop()}`;

    const command = new PutObjectCommand({
      ACL: 'public-read',
      Body: buffer,
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      ContentType: contentType,
      Key: key,
    });

    await this.s3Client.send(command);

    return `${process.env.AWS_S3_BASE_URL}/${key}`;
  }
}
