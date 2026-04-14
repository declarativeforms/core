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
  // Gateways
  gitHubGateway: GitHubGateway;
  // Repositories
  gitHubFileRepository: GitHubFileRepository;
  studioFormRepository: StudioFormRepository;
  studioMagicLinkRepository: StudioMagicLinkRepository;
  submissionRepository: SubmissionRepository;
  // Services
  authService: AuthService;
  fileService: FileService;
  formService: FormService;
  studioFormService: StudioFormService;
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

  // Gateways
  const gitHubGateway = new GitHubGateway();

  // Repositories
  const gitHubFileRepository = new GitHubFileRepository(db);
  const studioFormRepository = new StudioFormRepository(db);
  const studioMagicLinkRepository = new StudioMagicLinkRepository(db);
  const submissionRepository = new SubmissionRepository(db);

  // Services
  const authService = new AuthService();
  const fileService = new FileService(s3Client);
  const formService = new FormService(
    gitHubFileRepository,
    studioFormRepository,
    gitHubGateway,
  );
  const studioFormService = new StudioFormService(
    studioFormRepository,
    formService,
  );
  const studioMagicLinkService = new StudioMagicLinkService(
    studioMagicLinkRepository,
  );

  const connectionStrategies = [
    new EmailConnectionStrategy(),
    new WebhookConnectionStrategy(),
  ];

  const validationStrategies: IValidationStrategy[] = [];

  const submissionService = new SubmissionService(
    formService,
    gitHubFileRepository,
    submissionRepository,
    gitHubGateway,
    validationStrategies,
    connectionStrategies,
  );

  container = {
    db,
    mongoClient,
    gitHubGateway,
    gitHubFileRepository,
    studioFormRepository,
    studioMagicLinkRepository,
    submissionRepository,
    authService,
    fileService,
    formService,
    studioFormService,
    studioMagicLinkService,
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
