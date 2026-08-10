import {
  GetObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { FileService } from './file.service';

describe('FileService', () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnvironment,
      AWS_S3_BUCKET_NAME: 'forms',
      PUBLIC_BASE_URL: 'https://forms.example.com/',
    };
  });

  afterEach(() => {
    process.env = originalEnvironment;
    jest.restoreAllMocks();
  });

  it('uploads private objects and returns an API download URL', async () => {
    const send = jest.fn().mockResolvedValue({});
    const service = new FileService({ send } as unknown as S3Client);

    const url = await service.upload(
      Buffer.from('test'),
      'answer.txt',
      'text/plain',
    );

    expect(url).toMatch(
      /^https:\/\/forms\.example\.com\/api\/v1\/files\/uploads\/\d+-[a-f0-9]{16}\.txt$/,
    );
    expect(send).toHaveBeenCalledTimes(1);

    const command = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toMatchObject({
      Body: Buffer.from('test'),
      Bucket: 'forms',
      ContentType: 'text/plain',
    });
    expect(command.input.ACL).toBeUndefined();
  });

  it('downloads an object with its response metadata', async () => {
    const transformToByteArray = jest
      .fn()
      .mockResolvedValue(Uint8Array.from([1, 2, 3]));
    const send = jest.fn().mockResolvedValue({
      Body: { transformToByteArray },
      ContentType: 'application/octet-stream',
    });
    const service = new FileService({ send } as unknown as S3Client);

    const file = await service.download('uploads/file.bin');

    expect(send.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand);
    expect(send.mock.calls[0][0].input).toEqual({
      Bucket: 'forms',
      Key: 'uploads/file.bin',
    });
    expect(file).toEqual({
      body: Buffer.from([1, 2, 3]),
      contentType: 'application/octet-stream',
    });
  });

  it('returns null when the object does not exist', async () => {
    const send = jest.fn().mockRejectedValue({
      name: 'NoSuchKey',
      $metadata: { httpStatusCode: 404 },
    });
    const service = new FileService({ send } as unknown as S3Client);

    await expect(service.download('uploads/missing.bin')).resolves.toBeNull();
  });
});
