import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const randomString = randomBytes(8).toString('hex');
  const extension = originalFilename.split('.').pop();

  return `uploads/${timestamp}-${randomString}.${extension}`;
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const key = generateUniqueFilename(filename);

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME as string,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  });

  await s3Client.send(command);

  return `${process.env.AWS_S3_BASE_URL}/${key}`;
}
