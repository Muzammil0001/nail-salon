export function generateEmailTemplate(heading: string, custom_html: string, featureList: string[]) {
  // Generate the feature list HTML dynamically
  const featureItems = featureList.map((feature, index) => `
    <div class="feature-item">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td width="20">
            <img src="https://ectbnvl.stripocdn.email/content/guids/CABINET_e1140c52f54c5a9b35cefceda417fc0109bb2c92e078612de952c609430f6fd4/images/2851617878322771_BgF.png" alt="Feature Icon" class="feature-icon">
          </td>
          <td>
            <p>${feature}</p>
          </td>
        </tr>
      </table>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Template</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f6f6f6;
          color: #333;
        }
        .container {
          background-color: #fff;
          width: 90%;
          max-width: 600px;
          margin: 0 auto;
          padding: 5% 10%;
          border-radius: 8px;
        }
        .logo {
          display: block;
          margin: 0 auto;
          width: 150px;
          height: 31px;
        }
        .hero-image {
          width: 90%;
          max-width: 500px;
          display: block;
          margin: 0 auto;
        }
        .heading {
          text-align: center;
          font-weight: bold;
          font-size: 24px;
          margin-top: 20px;
        }
        .content {
          margin-top: 20px;
          line-height: 1.6;
        }
        .feature-image {
          width: 50%;
          display: block;
          margin: 0 auto;
        }
        .feature-list {
          margin-top: 20px;
        }
        .feature-item {
          width: 100%;
          margin-bottom: 2%;
        }
        .feature-item table {
          width: 100%;
         border-spacing: 20px 0px ;
        }
        .feature-item td {
          vertical-align: middle;
        }
        .feature-icon {
          width: 20px;
          height: 20px;
        }
        .footer {
          margin-top: 5%;
          text-align: left;
        }
        .footer p {
          margin: 0;
          font-size: 16px;
          line-height: 24px;
          color: #2F1A31;
        }
        .footer h2 {
          margin: 0;
          font-size: 28px;
          font-family: Oswald, sans-serif;
          color: #2F1A31;
        }
      </style>
    </head>
    <body>

      <div class="container">
        <!-- Logo -->
        <div class="flex justify-center">
          <img src="https://ectbnvl.stripocdn.email/content/guids/CABINET_e1140c52f54c5a9b35cefceda417fc0109bb2c92e078612de952c609430f6fd4/images/log.png" alt="Logo" class="logo">
        </div>

        <!-- Hero Image -->
        <div class="flex justify-center">
          <img src="https://ectbnvl.stripocdn.email/content/guids/CABINET_e1140c52f54c5a9b35cefceda417fc0109bb2c92e078612de952c609430f6fd4/images/group1_1.png" alt="Hero Image" class="hero-image">
        </div>

        <!-- Heading -->
        <h1 class="heading">${heading}</h1>

        <!-- Custom HTML Content -->
        <div class="content">
          ${custom_html}
        </div>

        <!-- Feature List -->
        <div class="flex justify-center">
          <img src="https://ectbnvl.stripocdn.email/content/guids/CABINET_e1140c52f54c5a9b35cefceda417fc0109bb2c92e078612de952c609430f6fd4/images/illustration_20.png" alt="Feature Icon" class="feature-image">
        </div>

        <div class="feature-list">
          ${featureItems}
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Best regards,</p>
          <h2>OrbyPOS</h2>
        </div>
      </div>

    </body>
    </html>
  `;
}
