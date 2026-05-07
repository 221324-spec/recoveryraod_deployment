const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    try {
      console.log('📧 Creating Gmail transporter...');
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
    } catch (error) {
      console.log('❌ Gmail transporter creation failed:', error.message);
      return null; // Fall back to dev mode
    }
  }

  if (process.env.EMAIL_SERVICE === 'smtp') {
    try {
      console.log('📧 Creating SMTP transporter for Gmail...');
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        // Gmail specific settings
        tls: {
          ciphers: 'SSLv3'
        }
      });
    } catch (error) {
      console.log('❌ SMTP transporter creation failed:', error.message);
      return null; // Fall back to dev mode
    }
  }

  // Dev mode (no transporter): log to console
  console.log('📧 Running in dev mode - emails will be logged to console');
  return null;
};

const wrap = (inner) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background:#f8fafc;">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #22c55e 100%); padding: 28px; border-radius: 12px 12px 0 0; text-align:center;">
      <h1 style="color:white; margin:0; font-size:28px;">Recovery Road</h1>
      <p style="color: rgba(255,255,255,0.9); margin:8px 0 0 0;">Account Security</p>
    </div>
    <div style="background:white; padding: 28px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
      ${inner}
    </div>
    <div style="text-align:center; padding: 16px; color:#64748b; font-size:12px;">
      <p>© 2025 Recovery Road</p>
      <p>If you didn’t request this, you can ignore it.</p>
    </div>
  </div>
`;

const sendEmail = async (to, subject, html) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('\n📧 EMAIL (Dev Mode - Check Console)');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html.substring(0, 200) + '...');
    console.log('—\n');
    return { success: true, mode: 'dev-console' };
  }

  try {
    console.log(`📧 Attempting to send email to ${to}...`);
    const info = await transporter.sendMail({
      from: `"Recovery Road" <${process.env.EMAIL_USER || process.env.SMTP_USER || 'noreply@recoveryroad.local'}>`,
      to,
      subject,
      html
    });

    console.log(`✅ Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.log(`❌ Email sending failed to ${to}:`, error.message);
    console.log('Full error:', error);

    // Fall back to dev mode logging
    console.log('\n📧 EMAIL (Fallback - Dev Mode)');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html.substring(0, 200) + '...');
    console.log('—\n');

    return { success: true, mode: 'dev-console-fallback', error: error.message };
  }
};

const sendVerificationOTPEmail = async (user, otp) => {
  const html = wrap(`
    <h2 style="margin:0 0 12px 0; color:#0f172a;">Verify your email</h2>
    <p style="color:#334155; font-size:15px;">Hi <strong>${user.name}</strong>,</p>
    <p style="color:#334155; font-size:15px;">
      Use the OTP below to verify your Recovery Road account:
    </p>
    <div style="margin:18px 0; text-align:center; padding:18px; border:2px dashed #3b82f6; border-radius:12px; background:#eff6ff;">
      <div style="font-size:40px; letter-spacing:10px; font-family: 'Courier New', monospace; font-weight:bold; color:#1e3a8a;">
        ${otp}
      </div>
      <div style="color:#64748b; font-size:13px; margin-top:8px;">Expires in 10 minutes</div>
    </div>
  `);

  return sendEmail(user.email, 'Your Recovery Road verification code', html);
};

const sendPasswordResetLinkEmail = async (user, resetLink) => {
  const html = wrap(`
    <h2 style="margin:0 0 12px 0; color:#0f172a;">Reset your password</h2>
    <p style="color:#334155; font-size:15px;">Hi <strong>${user.name}</strong>,</p>
    <p style="color:#334155; font-size:15px;">
      Click the button below to set a new password:
    </p>
    <div style="margin:18px 0; text-align:center;">
      <a href="${resetLink}" style="display:inline-block; background:#3b82f6; color:white; padding:12px 18px; border-radius:10px; text-decoration:none; font-weight:600;">
        Reset Password
      </a>
    </div>
    <p style="color:#64748b; font-size:13px;">
      Or paste this link into your browser:<br/>
      <a href="${resetLink}" style="color:#3b82f6; word-break:break-all;">${resetLink}</a>
    </p>
    <p style="color:#64748b; font-size:13px;">This link expires in 1 hour.</p>
  `);

  return sendEmail(user.email, 'Reset your Recovery Road password', html);
};

const sendWelcomeEmail = async (user) => {
  const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
  const html = wrap(`
    <h2 style="margin:0 0 12px 0; color:#0f172a;">Welcome to Recovery Road</h2>
    <p style="color:#334155; font-size:15px;">Hi <strong>${user.name}</strong>,</p>
    <p style="color:#334155; font-size:15px;">
      Your email has been verified — you can now sign in and choose your dashboard.
    </p>
    <div style="margin:18px 0; text-align:center;">
      <a href="${dashboardLink}" style="display:inline-block; background:#22c55e; color:white; padding:12px 18px; border-radius:10px; text-decoration:none; font-weight:600;">
        Go to Sign In
      </a>
    </div>
  `);

  return sendEmail(user.email, 'Welcome to Recovery Road', html);
};

module.exports = {
  sendVerificationOTPEmail,
  sendPasswordResetLinkEmail,
  sendWelcomeEmail
};
