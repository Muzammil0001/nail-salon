export function otpEmailTemplate(name: string, otp: string) {
    return `
      <div style="font-family: Arial, sans-serif;">
        <h2>Hello ${name},</h2>
        <p>Your OTP code is:</p>
        <h1 style="color: #4CAF50;">${otp}</h1>
        <p>This code is valid for the next 10 minutes. Do not share it with anyone.</p>
        <p>Thank you!</p>
      </div>
    `;
  }
  