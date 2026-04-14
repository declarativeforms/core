import { S3Client } from '@aws-sdk/client-s3';
import { Db, MongoClient } from 'mongodb';
import { GitHubGateway } from './gateways';
import {
  GitHubFileRepository,
  StudioFormRepository,
  StudioMagicLinkRepository,
  SubmissionRepository,
} from './repositories';
import {
  AuthService,
  FileService,
  FormService,
  StudioFormService,
  StudioMagicLinkService,
  SubmissionService,
} from './services';
import {
  EmailConnectionStrategy,
  type IValidationStrategy,
  WebhookConnectionStrategy,
} from './strategies';

export type Container = {
  db: Db;
  mongoClient: MongoClient;
  gitHubGateway: GitHubGateway;
  gitHubFileRepository: GitHubFileRepository;
  submissionRepository: SubmissionRepository;
  authService: AuthService;
  fileService: FileService;
  formService: FormService;
  studioFormRepository: StudioFormRepository;
  studioFormService: StudioFormService;
  studioMagicLinkRepository: StudioMagicLinkRepository;
  studioMagicLinkService: StudioMagicLinkService;
  submissionService: SubmissionService;
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
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
  const gitHubFileRepository = new GitHubFileRepository(db);
  const studioFormRepository = new StudioFormRepository(db);
  const studioMagicLinkRepository = new StudioMagicLinkRepository(db);
  const submissionRepository = new SubmissionRepository(db);
  const authService = new AuthService();
  const fileService = new FileService(s3Client);
  const formService = new FormService(
    gitHubFileRepository,
    studioFormRepository,
    gitHubGateway,
  );
  const studioFormService = new StudioFormService(studioFormRepository);
  const studioMagicLinkService = new StudioMagicLinkService(
    studioMagicLinkRepository,
  );
  const connectionStrategies = [
    new EmailConnectionStrategy(),
    new WebhookConnectionStrategy(),
  ];

  const submissionService = new SubmissionService(
    formService,
    submissionRepository,
    [],
    connectionStrategies,
  );

  container = {
    db,
    gitHubGateway,
    gitHubFileRepository,
    authService,
    fileService,
    formService,
    mongoClient,
    studioFormRepository,
    studioFormService,
    studioMagicLinkRepository,
    studioMagicLinkService,
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
