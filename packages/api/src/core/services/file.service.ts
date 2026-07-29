import {
  GetObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomBytes } from 'node:crypto';

export type StoredFile = {
  body: Buffer;
  contentType: string;
};

export class FileService {
  constructor(private s3Client: S3Client) {}

  public async download(key: string): Promise<StoredFile | null> {
    if (!key.startsWith('uploads/') || key.includes('..')) {
      return null;
    }

    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME as string,
          Key: key,
        }),
      );

      if (!response.Body) {
        return null;
      }

      return {
        body: Buffer.from(await response.Body.transformToByteArray()),
        contentType: response.ContentType || 'application/octet-stream',
      };
    } catch (error) {
      if (
        error instanceof NoSuchKey ||
        (error as { name?: string }).name === 'NoSuchKey'
      ) {
        return null;
      }

      throw error;
    }
  }

  public async upload(
    formId: string,
    buffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string> {
    const extension =
      filename
        .split('.')
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, '') || 'bin';
    const safeFormId = formId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeFormId || safeFormId !== formId) {
      throw new Error('Invalid form ID for upload.');
    }
    const key = `uploads/${safeFormId}/${Date.now()}-${randomBytes(16).toString('hex')}.${extension}`;

    const command = new PutObjectCommand({
      Body: buffer,
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      ContentType: contentType,
      Key: key,
    });

    await this.s3Client.send(command);

    return `${(process.env.AWS_S3_BASE_URL || '/api/v1/files').replace(/\/$/, '')}/${key}`;
  }

  public async deleteForForm(formId: string): Promise<void> {
    const prefix = `uploads/${formId}/`;
    let continuationToken: string | undefined;

    do {
      const page = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: process.env.AWS_S3_BUCKET_NAME as string,
          ContinuationToken: continuationToken,
          Prefix: prefix,
        }),
      );
      const objects = (page.Contents ?? []).flatMap((object) =>
        object.Key ? [{ Key: object.Key }] : [],
      );
      if (objects.length > 0) {
        await this.s3Client.send(
          new DeleteObjectsCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME as string,
            Delete: { Objects: objects },
          }),
        );
      }
      continuationToken = page.NextContinuationToken;
    } while (continuationToken);
  }
}
