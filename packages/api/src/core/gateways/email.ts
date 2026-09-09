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
      html: `<!doctype html><html><body style="background:#f5f5f4;color:#171716;font-family:Arial,sans-serif;margin:0;padding:32px 16px"><div style="background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;margin:0 auto;max-width:520px;padding:32px"><p style="font-size:14px;font-weight:700;letter-spacing:.08em;margin:0 0 24px;text-transform:uppercase">Declarative Forms</p><h1 style="font-size:24px;margin:0 0 16px">Verify your email address</h1><p style="line-height:1.5;margin:0 0 24px">Enter this verification code to continue:</p><p style="background:#f5f5f4;border-radius:8px;font-family:monospace;font-size:32px;font-weight:700;letter-spacing:.2em;margin:0 0 24px;padding:20px;text-align:center">${code}</p><p style="line-height:1.5;margin:0 0 12px">This code expires in 10 minutes.</p><p style="color:#6b6b68;font-size:14px;line-height:1.5;margin:0">If you did not request this code, you can safely ignore this email.</p></div></body></html>`,
      subject: 'Your Declarative Forms verification code',
      text: `Your Declarative Forms verification code is ${code}. It expires in 10 minutes. If you did not request this code, you can safely ignore this email.`,
      to: emailAddress,
    });

    return response.error === null;
  }
}
