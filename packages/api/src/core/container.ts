import { S3Client } from '@aws-sdk/client-s3';
import { Db, MongoClient } from 'mongodb';
import { GitHubGateway } from './gateways';
import {
  GitHubFileRepository,
  JobRepository,
  SubmissionRepository,
} from './repositories';
import {
  FileService,
  FormService,
  JobService,
  SubmissionService,
} from './services';
import {
  EmailConnectionStrategy,
  WebhookConnectionStrategy,
  type IConnectionStrategy,
} from './strategies';

export type Container = {
  db: Db;
  mongoClient: MongoClient;
  gitHubGateway: GitHubGateway;
  gitHubFileRepository: GitHubFileRepository;
  submissionRepository: SubmissionRepository;
  jobRepository: JobRepository;
  fileService: FileService;
  formService: FormService;
  submissionService: SubmissionService;
  jobService: JobService;
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

export async function getContainer(): Promise<Container> {
  if (container) {
    return container;
  }

  const mongoClient = await MongoClient.connect(
    process.env.MONGODB_CONNECTION_STRING as string,
  );
  const db = mongoClient.db(process.env.MONGODB_DATABASE_NAME as string);
  const gitHubGateway = new GitHubGateway();
  const gitHubFileRepository = new GitHubFileRepository(db);
  const submissionRepository = new SubmissionRepository(db);
  const jobRepository = new JobRepository(db);
  const fileService = new FileService(s3Client);
  const formService = new FormService(gitHubFileRepository, gitHubGateway);
  const connectionStrategies: Array<IConnectionStrategy> = [
    new EmailConnectionStrategy(),
    new WebhookConnectionStrategy(),
  ];
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
    db,
    fileService,
    formService,
    gitHubFileRepository,
    gitHubGateway,
    jobRepository,
    jobService,
    mongoClient,
    submissionRepository,
    submissionService,
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
