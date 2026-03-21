import type { IDeclarativeForm } from "./form";

export type IConnection = NonNullable<IDeclarativeForm["connections"]>[number];
export type IWebhookConnection = Extract<IConnection, { type?: "webhook" }>;
export type IAirtableConnection = Extract<IConnection, { type?: "airtable" }>;
export type IEmailConnection = Extract<IConnection, { type?: "email" }>;
