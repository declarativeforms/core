import { S3Client } from '@aws-sdk/client-s3';
import { Db, MongoClient } from 'mongodb';
import { GitHubGateway } from './gateways';
import {
  EmailVerificationRepository,
  FormRepository,
  GitHubFileRepository,
  SubmissionRepository,
} from './repositories';
import {
  EmailVerificationService,
  FileService,
  FormService,
  ManagedFormService,
  SubmissionService,
} from './services';
import {
  EmailConnectionStrategy,
  EmailVerificationValidationStrategy,
  WebhookConnectionStrategy,
} from './strategies';

export type Container = {
  db: Db;
  mongoClient: MongoClient;
  gitHubGateway: GitHubGateway;
  gitHubFileRepository: GitHubFileRepository;
  submissionRepository: SubmissionRepository;
  fileService: FileService;
  formRepository: FormRepository;
  formService: FormService;
  managedFormService: ManagedFormService;
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
  const formRepository = new FormRepository(db);
  const gitHubFileRepository = new GitHubFileRepository(db);
  const submissionRepository = new SubmissionRepository(db);
  const emailVerificationService = new EmailVerificationService(
    emailVerificationRepository,
  );
  const fileService = new FileService(s3Client);
  const formService = new FormService(
    gitHubFileRepository,
    formRepository,
    gitHubGateway,
  );
  const managedFormService = new ManagedFormService(formRepository);
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

  container = {
    db,
    emailVerificationRepository,
    emailVerificationService,
    gitHubGateway,
    gitHubFileRepository,
    fileService,
    formRepository,
    formService,
    managedFormService,
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
