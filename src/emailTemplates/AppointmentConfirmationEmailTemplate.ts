export const AppointmentConfirmationEmailTemplate = ({
  customer_first_name,
  start_time,
  end_time,
  date,
}: {
  customer_first_name: string;
  start_time: string;
  end_time: string;
  date: string;
}) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #00b788;">Hello ${customer_first_name},</h2>
      
      <p>We're happy to let you know that your <strong>appointment</strong> has been successfully booked.</p>
      
      <p>
        <strong>Date:</strong> ${date}<br />
        <strong>Time:</strong> ${start_time} - ${end_time}
      </p>

      <p>Please arrive 5-10 minutes early so we can serve you on time.</p>

      <p>If you have any questions or need to reschedule, feel free to contact us.</p>

      <p style="margin-top: 24px;">Thank you,<br /><strong>JT Nail Salon</strong></p>

      <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #999;">This is an automated email confirmation. Please do not reply to this message.</p>
    </div>
  `;
};
