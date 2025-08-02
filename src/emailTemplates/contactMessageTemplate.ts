export function contactMessageTemplate(
  firstName: string,
  lastName: string,
  phone: string,
  email: string,
  address: string,
  message: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
      <h2 style="color: #333; margin-bottom: 10px;">New Customer Contact Message</h2>
      <p style="margin-bottom: 20px;">You have received a message from your location's contact form:</p>

      <div style="margin-bottom: 12px;">
        <strong style="display: block; color: #555;">Full Name:</strong>
        <span style="color: #222;">${firstName} ${lastName}</span>
      </div>

      <div style="margin-bottom: 12px;">
        <strong style="display: block; color: #555;">Email:</strong>
        <span style="color: #222;">${email}</span>
      </div>

      <div style="margin-bottom: 12px;">
        <strong style="display: block; color: #555;">Phone:</strong>
        <span style="color: #222;">${phone}</span>
      </div>

      <div style="margin-bottom: 12px;">
        <strong style="display: block; color: #555;">Address:</strong>
        <span style="color: #222;">${address}</span>
      </div>

      <div style="margin-bottom: 20px;">
        <strong style="display: block; color: #555;">Message:</strong>
        <p style="color: #222; white-space: pre-line; line-height: 1.5;">${message}</p>
      </div>

      <p style="margin-top: 30px; color: #888;">Please respond to the customer as soon as possible.</p>
    </div>
  `;
}
