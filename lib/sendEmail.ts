import nodemailer, { TransportOptions } from "nodemailer";

interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}
const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string,
  attachments?: EmailAttachment[]
) => {
  try {
    const port = Number(process.env.SMTP_PORT || 587);
    const isSecure = port === 465;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST as string,
      port,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    } as TransportOptions);

    
    const mailOptions = {
      from: `Globar ${process.env.SMTP_FROM}`,
      to,
      subject,
      text,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Error occurred while sending email");
  
    if (error instanceof Error) {
      console.error("Error Message:", error.message);
      console.error("Stack Trace:", error.stack);
  
      const errWithResponse = error as any;
      if (errWithResponse.response) {
        console.error("SMTP Error Response:", errWithResponse.response);
      }
  
      console.error("Full Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } else {
      console.error("Unknown error format:", error);
    }
    console.error("Current Working Directory:", process.cwd());
    console.error("NODE_ENV:", process.env.NODE_ENV);
    console.error("SMTP_HOST:", process.env.SMTP_HOST);
    console.error("SMTP_PORT:", process.env.SMTP_PORT);
  
    throw error;
  }
  
};
export default sendEmail;
