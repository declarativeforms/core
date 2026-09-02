import { S3Client } from '@aws-sdk/client-s3';
import { FORM_JSON_SCHEMA } from '@declarativeforms/engine';
import Ajv from 'ajv';
import { Db, MongoClient } from 'mongodb';
import { GitHubGateway, GitHubOAuthGateway, OpenAiGateway } from './gateways';
import {
  AuthCodeRepository,
  FormMessageRepository,
  FormRepository,
  GitHubFileRepository,
  JobRepository,
  OrganizationRepository,
  SubmissionRepository,
} from './repositories';
import {
  AuthenticationService,
  FileService,
  FormMessageService,
  FormService,
  InternalFormService,
  JobService,
  OrganizationService,
  SubmissionService,
  TokenService,
} from './services';
import {
  EmailConnectionStrategy,
  GitHubOAuthStrategy,
  WebhookConnectionStrategy,
  type IConnectionStrategy,
  type IOAuthProviderStrategy,
} from './strategies';

export type Container = {
  db: Db;
  mongoClient: MongoClient;
  gitHubGateway: GitHubGateway;
  gitHubOAuthGateway: GitHubOAuthGateway;
  openAiGateway: OpenAiGateway;
  authCodeRepository: AuthCodeRepository;
  formMessageRepository: FormMessageRepository;
  formRepository: FormRepository;
  gitHubFileRepository: GitHubFileRepository;
  organizationRepository: OrganizationRepository;
  submissionRepository: SubmissionRepository;
  jobRepository: JobRepository;
  tokenService: TokenService;
  fileService: FileService;
  organizationService: OrganizationService;
  internalFormService: InternalFormService;
  formService: FormService;
  formMessageService: FormMessageService;
  authenticationService: AuthenticationService;
  submissionService: SubmissionService;
  jobService: JobService;
};

const formDefinitionValidator = new Ajv({
  allErrors: true,
  logger: false,
  strict: false,
}).compile(FORM_JSON_SCHEMA);

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

export async function getContainer(): Promise<Container> {
  if (container) {
    return container;
  }

  const mongoClient = await MongoClient.connect(
    process.env.MONGODB_CONNECTION_STRING as string,
  );
  const db = mongoClient.db(process.env.MONGODB_DATABASE_NAME as string);
  const gitHubGateway = new GitHubGateway();
  const gitHubOAuthGateway = new GitHubOAuthGateway();
  const openAiGateway = new OpenAiGateway();
  const authCodeRepository = new AuthCodeRepository(db);
  const formMessageRepository = new FormMessageRepository(db);
  const formRepository = new FormRepository(db);
  const gitHubFileRepository = new GitHubFileRepository(db);
  const organizationRepository = new OrganizationRepository(db);
  const submissionRepository = new SubmissionRepository(db);
  const jobRepository = new JobRepository(db);
  const tokenService = new TokenService(process.env.AUTH_STATE_SECRET || '');
  const fileService = new FileService(s3Client);
  const organizationService = new OrganizationService(organizationRepository);
  const internalFormService = new InternalFormService(
    formRepository,
    formMessageRepository,
    formDefinitionValidator,
  );
  const formService = new FormService(
    gitHubFileRepository,
    gitHubGateway,
    internalFormService,
  );
  const formMessageService = new FormMessageService(
    formMessageRepository,
    internalFormService,
    openAiGateway,
  );
  const connectionStrategies: Array<IConnectionStrategy> = [
    new EmailConnectionStrategy(),
    new WebhookConnectionStrategy(),
  ];
  const oauthProviderStrategies: Array<IOAuthProviderStrategy> = [
    new GitHubOAuthStrategy(gitHubOAuthGateway),
  ];
  const authenticationService = new AuthenticationService(
    authCodeRepository,
    tokenService,
    oauthProviderStrategies,
  );
  const jobService = new JobService(jobRepository, {
    submission: async (data) => {
      const { connection, form, submission } = data as any;
      const strategy = connectionStrategies.find(
        (entry) => entry.type === connection.type,
      );

      if (!strategy) {
        return;
      }

      await strategy.handle(connection, submission, form);
    },
  });
  const submissionService = new SubmissionService(
    formService,
    submissionRepository,
    jobService,
  );

  container = {
    authCodeRepository,
    authenticationService,
    db,
    fileService,
    formMessageRepository,
    formMessageService,
    formRepository,
    formService,
    gitHubFileRepository,
    gitHubGateway,
    gitHubOAuthGateway,
    internalFormService,
    jobRepository,
    jobService,
    mongoClient,
    openAiGateway,
    organizationRepository,
    organizationService,
    submissionRepository,
    submissionService,
    tokenService,
  };

  return container;
}

export async function disposeContainer(): Promise<void> {
  if (!container) {
    return;
  }

  await container.mongoClient.close();
  container = null;
}
