import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmailOtp = async (to, otp) => {
  // If SMTP is not configured, just log it (useful for local testing)
  if (!process.env.SMTP_HOST) {
    console.log(`[LOCAL DEV] OTP for ${to} is: ${otp}`);
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Arth Mala" <noreply@arthmala.com>`,
    to,
    subject: 'Your Arth Mala Login Code',
    text: `Your login code is: ${otp}. It will expire in 5 minutes.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Login to Arth Mala</h2>
        <p>Your one-time login code is:</p>
        <h1 style="color: #c3592b; letter-spacing: 4px;">${otp}</h1>
        <p>This code will expire in 5 minutes. Do not share this with anyone.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendWhatsAppOtp = async (phone, otp) => {
  // Placeholder for WhatsApp API integration
  console.log(`[WHATSAPP DEV] OTP for ${phone} is: ${otp}`);
  // TODO: Implement actual WhatsApp API call here (e.g. Meta Cloud API, Twilio)
};
