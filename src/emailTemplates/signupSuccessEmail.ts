export function signupSuccessEmailTemplate(firstName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome, ${firstName}!</h2>
        <p>🎉 Your signup was successful. We're thrilled to have you on board!</p>
        <p>You can now log in to your account and start exploring.</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>Juliet Nails</strong></p>
      </div>
    `;
  }
  