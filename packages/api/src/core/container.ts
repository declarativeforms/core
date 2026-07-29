import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { Db, MongoClient } from 'mongodb';
import { readGitHubConfig } from '../config';
import { GitHubGateway } from './gateways';
import {
  EmailVerificationRepository,
  SubmissionRepository,
} from './repositories';
import {
  EmailVerificationService,
  FileService,
  FormService,
  SubmissionService,
} from './services';
import {
  EmailConnectionStrategy,
  EmailVerificationValidationStrategy,
  WebhookConnectionStrategy,
} from './strategies';
import { ensureDatabaseIndexes } from './database';

export type Container = {
  db: Db;
  mongoClient: MongoClient;
  gitHubGateway: GitHubGateway;
  submissionRepository: SubmissionRepository;
  fileService: FileService;
  formService: FormService;
  emailVerificationRepository: EmailVerificationRepository;
  emailVerificationService: EmailVerificationService;
  submissionService: SubmissionService;
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  ...(process.env.AWS_ENDPOINT_URL
    ? {
        endpoint: process.env.AWS_ENDPOINT_URL,
        forcePathStyle: true,
      }
    : {}),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

let container: Container | null = null;
let containerPromise: Promise<Container> | null = null;

export async function getContainer() {
  if (container) {
    return container;
  }

  if (containerPromise) {
    return containerPromise;
  }

  containerPromise = createContainer();

  try {
    container = await containerPromise;
    return container;
  } finally {
    containerPromise = null;
  }
}

async function createContainer(): Promise<Container> {
  const mongoClient = await MongoClient.connect(
    process.env.MONGODB_CONNECTION_STRING as string,
  );
  const db = mongoClient.db(process.env.MONGODB_DATABASE_NAME as string);
  await ensureDatabaseIndexes(db);
  const gitHubGateway = new GitHubGateway();
  const emailVerificationRepository = new EmailVerificationRepository(db);
  const submissionRepository = new SubmissionRepository(db);
  const emailVerificationService = new EmailVerificationService(
    emailVerificationRepository,
  );
  const fileService = new FileService(s3Client);
  const formService = new FormService(gitHubGateway, readGitHubConfig());
  const connectionStrategies = [
    new EmailConnectionStrategy(),
    new WebhookConnectionStrategy(),
  ];

  const submissionService = new SubmissionService(
    formService,
    submissionRepository,
    [new EmailVerificationValidationStrategy()],
    connectionStrategies,
  );

  return {
    db,
    emailVerificationRepository,
    emailVerificationService,
    gitHubGateway,
    fileService,
    formService,
    mongoClient,
    submissionRepository,
    submissionService,
  };
}

export async function disposeContainer() {
  if (!container) {
    return;
  }

  await container.mongoClient.close();

  container = null;
}

export async function checkDependencies(): Promise<void> {
  const current = await getContainer();
  await Promise.all([
    current.db.command({ ping: 1 }),
    s3Client.send(
      new HeadBucketCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      }),
    ),
  ]);
}
