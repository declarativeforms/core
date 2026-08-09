import { S3Client } from '@aws-sdk/client-s3';
import { Db, MongoClient } from 'mongodb';
import { GitHubGateway } from './gateways';
import {
  EmailVerificationRepository,
  GitHubFileRepository,
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
  WebhookConnectionStrategy,
} from './strategies';

export type Container = {
  db: Db;
  mongoClient: MongoClient;
  gitHubGateway: GitHubGateway;
  gitHubFileRepository: GitHubFileRepository;
  submissionRepository: SubmissionRepository;
  fileService: FileService;
  formService: FormService;
  emailVerificationRepository: EmailVerificationRepository;
  emailVerificationService: EmailVerificationService;
  submissionService: SubmissionService;
};

const s3Client = new S3Client({
  endpoint: process.env.AWS_S3_ENDPOINT,
  forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

let container: Container | null = null;

export async function getContainer() {
  if (container) {
    return container;
  }

  const mongoClient = await MongoClient.connect(
    process.env.MONGODB_CONNECTION_STRING as string,
  );
  const db = mongoClient.db(process.env.MONGODB_DATABASE_NAME as string);
  const gitHubGateway = new GitHubGateway();
  const emailVerificationRepository = new EmailVerificationRepository(db);
  const gitHubFileRepository = new GitHubFileRepository(db);
  const submissionRepository = new SubmissionRepository(db);
  const emailVerificationService = new EmailVerificationService(
    emailVerificationRepository,
  );
  const fileService = new FileService(s3Client);
  const formService = new FormService(gitHubFileRepository, gitHubGateway);
  const connectionStrategies = [
    new EmailConnectionStrategy(),
    new WebhookConnectionStrategy(),
  ];

  const submissionService = new SubmissionService(
    formService,
    submissionRepository,
    connectionStrategies,
  );

  container = {
    db,
    emailVerificationRepository,
    emailVerificationService,
    gitHubGateway,
    gitHubFileRepository,
    fileService,
    formService,
    mongoClient,
    submissionRepository,
    submissionService,
  };

  return container;
}

export async function disposeContainer() {
  if (!container) {
    return;
  }

  await container.mongoClient.close();

  container = null;
}
