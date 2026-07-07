export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export interface TransactionalEmailProvider {
  send(message: EmailMessage): Promise<void>;
}

export class LoggingEmailProvider implements TransactionalEmailProvider {
  async send(message: EmailMessage): Promise<void> {
    if (process.env.APP_ENV !== "production") {
      console.info(
        JSON.stringify({
          level: "info",
          message: "Transactional email placeholder",
          to: message.to,
          subject: message.subject
        })
      );
    }
  }
}
