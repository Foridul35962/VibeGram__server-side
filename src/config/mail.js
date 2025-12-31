import axios from "axios";

export const sendBrevoMail = async (to, subject, html) => {
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          email: process.env.SENDER_EMAIL,
          name: "VibeGram",
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );
  } catch (error) {
    console.error(
      "Brevo Mail Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};


export const generateVerificationMail = (otp) => {
  return {
    subject: 'Verify Your Vibe Gram Account ✅',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea, #764ba2); padding: 40px;">
        <div style="max-width: 520px; margin: auto; background: #ffffff; border-radius: 14px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">

          <h1 style="text-align: center; color: #5a4bda; margin-bottom: 10px;">
            Welcome to Vibe Gram 🎉
          </h1>

          <p style="text-align: center; color: #777; font-size: 15px;">
            Secure • Fast • Social Media Platform
          </p>

          <p style="font-size: 16px; color: #333; margin-top: 30px;">
            Hello 👋,<br><br>
            Thanks for signing up! To activate your account, please use the verification code below:
          </p>

          <div style="text-align: center; margin: 35px 0;">
            <div style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-size: 26px; font-weight: bold; padding: 14px 35px; border-radius: 10px; letter-spacing: 3px;">
              ${otp}
            </div>
          </div>

          <p style="font-size: 15px; color: #555;">
            ⏰ This code will expire in <strong>5 minutes</strong>.<br>
            🔒 Please do not share it with anyone.
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

          <p style="font-size: 13px; color: #aaa; text-align: center;">
            © ${new Date().getFullYear()} VibeGram. All rights reserved.
          </p>
        </div>
      </div>
    `
  }
}



export const generatePasswordResetMail = (otp) => {
  return {
    subject: 'Reset Your Password 🔐',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #ff512f, #dd2476); padding: 40px;">
        <div style="max-width: 520px; margin: auto; background: #ffffff; border-radius: 14px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">

          <h1 style="text-align: center; color: #dd2476; margin-bottom: 10px;">
            Password Reset 🔒
          </h1>

          <p style="text-align: center; color: #777; font-size: 15px;">
            Secure Account Recovery System
          </p>

          <p style="font-size: 16px; color: #333; margin-top: 30px;">
            Hello 👋,<br><br>
            We received a request to reset your password. Please use the OTP below to continue:
          </p>

          <div style="text-align: center; margin: 35px 0;">
            <div style="display: inline-block; background: linear-gradient(135deg, #ff512f, #dd2476); color: #fff; font-size: 26px; font-weight: bold; padding: 14px 35px; border-radius: 10px; letter-spacing: 3px;">
              ${otp}
            </div>
          </div>

          <p style="font-size: 15px; color: #555;">
            ⏰ OTP expires in <strong>5 minutes</strong>.<br>
            ❗If you didn’t request a reset, please ignore this email.
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

          <p style="font-size: 13px; color: #aaa; text-align: center;">
            © ${new Date().getFullYear()} VibeGram. All rights reserved.
          </p>

        </div>
      </div>
    `
  }
}