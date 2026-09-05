import { Resend } from 'resend';

export class EmailGateway {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  public isConfigured(): boolean {
    return !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM_EMAIL;
  }

  public async sendVerificationCode(
    emailAddress: string,
    code: string,
  ): Promise<boolean> {
    const response = await this.resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL as string,
      html: `<p>Your Declarative Forms verification code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:0.2em">${code}</p><p>This code expires in 10 minutes.</p>`,
      subject: 'Verify your email address',
      to: emailAddress,
    });

    return response.error === null;
  }
}
