import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

export const OFFICIAL_SENDER_EMAIL = 'bikkinavijay0@gmail.com';
export const OFFICIAL_SENDER_NAME = 'AeroSpace Ground Control';
export const DEFAULT_SENDER = `"${OFFICIAL_SENDER_NAME}" <${OFFICIAL_SENDER_EMAIL}>`;

let transporter = null;
let etherealAccount = null;

// Initialize Transporter
async function getTransporter() {
  const isProduction = process.env.NODE_ENV === 'production';
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER || OFFICIAL_SENDER_EMAIL;
  const pass = process.env.SMTP_PASS;
  const cleanPass = pass ? pass.replace(/\s+/g, '') : '';
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const service = process.env.SMTP_SERVICE || (host === 'smtp.gmail.com' || user.endsWith('@gmail.com') ? 'gmail' : undefined);
  const senderFrom = process.env.SMTP_FROM || DEFAULT_SENDER;

  // 1. Live Gmail/SMTP with App Password credentials
  if (user && cleanPass && cleanPass.length >= 8 && cleanPass !== 'your_16_character_app_password') {
    if (!transporter) {
      if (service === 'gmail' || host === 'smtp.gmail.com' || user.endsWith('@gmail.com')) {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user, pass: cleanPass },
          connectionTimeout: 5000,
          greetingTimeout: 5000,
          socketTimeout: 8000
        });
        if (!isProduction) {
          console.log(`📡 [MAILER] Initialized Real Gmail SMTP Transport for: ${user}`);
        }
      } else {
        transporter = nodemailer.createTransport({
          host: host,
          port: port,
          secure: secure,
          auth: { user, pass: cleanPass },
          connectionTimeout: 5000,
          greetingTimeout: 5000,
          socketTimeout: 8000
        });
        if (!isProduction) {
          console.log(`📡 [MAILER] Initialized Custom SMTP Transport: ${host}:${port} (${user})`);
        }
      }
    }
    return { transport: transporter, mode: 'LIVE_SMTP', sender: senderFrom };
  }

  // 2. In Production: MUST NOT fall back to Ethereal, JSON simulation, or dev codes!
  if (isProduction) {
    throw new Error('SMTP credentials (SMTP_USER / SMTP_PASS) are not configured for production.');
  }

  // 3. Otherwise create / reuse Ethereal Test Account (DEVELOPMENT ONLY)
  if (!etherealAccount) {
    try {
      etherealAccount = await nodemailer.createTestAccount();
      console.log(`\n📮 [MAILER] Test Mailbox Active for Sender: ${OFFICIAL_SENDER_EMAIL}`);
      console.log(`💡 [TIP] To send to real Gmail inboxes, add your Google App Password to SMTP_PASS in .env\n`);
    } catch (err) {
      console.warn('⚠️ [MAILER] Could not initialize Ethereal test account:', err.message);
    }
  }

  if (etherealAccount) {
    const testTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass
      }
    });
    return { transport: testTransporter, mode: 'ETHEREAL_TEST', sender: DEFAULT_SENDER };
  }

  // 4. Fallback dummy transporter (JSON transport) (DEVELOPMENT ONLY)
  const jsonTransporter = nodemailer.createTransport({
    jsonTransport: true
  });
  return { transport: jsonTransporter, mode: 'CONSOLE_SIMULATION', sender: DEFAULT_SENDER };
}

/**
 * Generate AeroSpace Branded HTML Email Template
 */
function buildOtpEmailHtml({ email, otp, type, name }) {
  const isSignup = type === 'SIGNUP';
  const isPayment = type === 'PAYMENT_CONFIRMATION';
  const isPasswordReset = type === 'PASSWORD_RESET';
  const title = isSignup 
    ? 'Verify Your New AeroSpace Account' 
    : isPayment
    ? 'AeroSpace Payment Authorization Code'
    : isPasswordReset
    ? 'AeroSpace Password Reset Authorization'
    : 'AeroSpace 2FA Security Authorization Code';
  const subtitle = isSignup 
    ? 'Welcome to AeroSpace telemetry platform. Enter this 6-digit code to complete registration.' 
    : isPayment
    ? 'A subscription payment authorization was initiated for your account. Enter this 6-digit code to complete 2FA payment verification.'
    : isPasswordReset
    ? 'A password reset authorization was requested for your account. Enter this 6-digit code to verify your identity and set a new password.'
    : 'A login request was initiated for your account. Enter this 6-digit code to complete 2FA authentication.';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#050811; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#ffedd6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#050811; padding: 40px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 580px; background: #0c1222; border: 1px solid rgba(0, 245, 255, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
            
            <!-- Header Glow Bar -->
            <tr>
              <td style="background: linear-gradient(90deg, #00f5ff, #f59e0b, #00f5ff); height: 4px; padding: 0;"></td>
            </tr>

            <!-- Brand Header -->
            <tr>
              <td style="padding: 36px 40px 20px; text-align: center;">
                <div style="font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #ffffff; text-transform: uppercase;">
                  AERO<span style="color: #00f5ff;">SPACE</span>
                </div>
                <div style="font-size: 11px; letter-spacing: 2px; color: #8c857b; text-transform: uppercase; margin-top: 4px;">
                  SaaS Fleet Telemetry & Ground Control
                </div>
                <div style="display: inline-block; margin-top: 8px; font-size: 10px; background: rgba(0, 245, 255, 0.1); border: 1px solid rgba(0, 245, 255, 0.3); border-radius: 12px; padding: 3px 10px; color: #00f5ff;">
                  Official Dispatch Gateway: ${OFFICIAL_SENDER_EMAIL}
                </div>
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td style="padding: 10px 40px 30px; text-align: center;">
                <div style="display: inline-block; background: rgba(0, 245, 255, 0.08); border: 1px solid rgba(0, 245, 255, 0.3); border-radius: 20px; padding: 6px 16px; font-size: 12px; font-weight: 600; color: #00f5ff; letter-spacing: 1px; margin-bottom: 20px;">
                  🛡️ TWO-FACTOR SECURITY VERIFICATION
                </div>

                <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 12px;">
                  ${title}
                </h2>

                <p style="font-size: 14px; line-height: 1.6; color: #b4aa9d; margin: 0 0 28px;">
                  ${subtitle}
                </p>

                <!-- 6-Digit OTP Box -->
                <div style="background: #060b16; border: 2px dashed #00f5ff; border-radius: 12px; padding: 24px; margin: 0 auto 28px; max-width: 380px;">
                  <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #8c857b; margin-bottom: 8px;">
                    Your One-Time Security Code
                  </div>
                  <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #00f5ff; font-family: 'Courier New', Courier, monospace; text-shadow: 0 0 20px rgba(0, 245, 255, 0.5);">
                    ${otp}
                  </div>
                  <div style="font-size: 12px; color: #f59e0b; margin-top: 10px;">
                    ⏱️ Code expires in <strong>10 minutes</strong>
                  </div>
                </div>

                <!-- Advisory Box -->
                <div style="background: rgba(255, 237, 214, 0.03); border: 1px solid rgba(255, 237, 214, 0.08); border-radius: 8px; padding: 14px 18px; text-align: left; font-size: 12px; line-height: 1.5; color: #8c857b;">
                  <strong style="color: #ffedd6;">Security Advisory:</strong> If you did not request this authorization code, someone may be attempting to access your AeroSpace account (<span style="color: #00f5ff;">${email}</span>). Please disregard this message or alert system administration.
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 40px; background: #070c18; border-top: 1px solid rgba(255, 237, 214, 0.05); text-align: center; font-size: 11px; color: #6e675d;">
                <div>AeroSpace Fleet Systems & Telemetry Command Center</div>
                <div style="margin-top: 4px;">Sent by: <span style="color: #00f5ff;">${OFFICIAL_SENDER_EMAIL}</span></div>
                <div style="margin-top: 4px;">Automated Security Dispatch • Do Not Reply directly to this email</div>
                <div style="margin-top: 6px; color: #4e4942;">Timestamp: ${new Date().toUTCString()}</div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * Generate User Notification Email HTML
 */
function buildUserNotificationEmailHtml({ name, title, message, actionDetails = {} }) {
  const detailsRows = Object.entries(actionDetails).map(([key, val]) => `
    <tr>
      <td style="padding: 8px 12px; font-size: 12px; color: #8c857b; font-family: 'Courier New', monospace; text-transform: uppercase; width: 140px; border-bottom: 1px solid rgba(255,255,255,0.05);">${key}</td>
      <td style="padding: 8px 12px; font-size: 13px; color: #ffedd6; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05);">${val}</td>
    </tr>
  `).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#050811; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#ffedd6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#050811; padding: 40px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 580px; background: #0c1222; border: 1px solid rgba(0, 245, 255, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
            
            <tr>
              <td style="background: linear-gradient(90deg, #00f5ff, #10b981, #00f5ff); height: 4px; padding: 0;"></td>
            </tr>

            <tr>
              <td style="padding: 32px 40px 16px; text-align: center;">
                <div style="font-size: 26px; font-weight: 800; letter-spacing: 4px; color: #ffffff; text-transform: uppercase;">
                  AERO<span style="color: #00f5ff;">SPACE</span>
                </div>
                <div style="font-size: 11px; letter-spacing: 2px; color: #8c857b; text-transform: uppercase; margin-top: 4px;">
                  SaaS Fleet Telemetry & Ground Control
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding: 10px 40px 30px;">
                <div style="display: inline-block; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; padding: 6px 14px; font-size: 11px; font-weight: 600; color: #34d399; letter-spacing: 1px; margin-bottom: 16px;">
                  ✓ ACCOUNT ACTIVITY NOTIFICATION
                </div>

                <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 12px;">
                  ${title}
                </h2>

                <p style="font-size: 14px; line-height: 1.6; color: #b4aa9d; margin: 0 0 20px;">
                  Hello <strong>${name || 'Flight Operator'}</strong>,<br/>
                  ${message}
                </p>

                ${detailsRows ? `
                <div style="background: #060b16; border: 1px solid rgba(0, 245, 255, 0.2); border-radius: 10px; padding: 8px 12px; margin-bottom: 24px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    ${detailsRows}
                  </table>
                </div>` : ''}

                <div style="background: rgba(255, 237, 214, 0.03); border: 1px solid rgba(255, 237, 214, 0.08); border-radius: 8px; padding: 12px 16px; text-align: left; font-size: 12px; line-height: 1.5; color: #8c857b;">
                  <strong style="color: #ffedd6;">Security Notice:</strong> If you did not authorize this change, please immediately secure your AeroSpace account or contact support.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding: 20px 40px; background: #070c18; border-top: 1px solid rgba(255, 237, 214, 0.05); text-align: center; font-size: 11px; color: #6e675d;">
                <div>AeroSpace Fleet Systems & Telemetry Command Center</div>
                <div style="margin-top: 4px;">Automated Account Dispatch • Do not reply directly to this notification</div>
                <div style="margin-top: 4px; color: #4e4942;">Timestamp: ${new Date().toUTCString()}</div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * Generate Contact Us Admin Notification Email HTML
 */
function buildContactEmailHtml({ name, email, subject, message, priority, organization, band, id, timestamp }) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AeroSpec Mission Dispatch</title>
  </head>
  <body style="margin:0; padding:0; background-color:#050811; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#ffedd6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#050811; padding: 30px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 620px; background: #0c1222; border: 1px solid rgba(0, 245, 255, 0.3); border-radius: 14px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.8);">
            
            <tr>
              <td style="background: linear-gradient(90deg, #f59e0b, #00f5ff, #10b981); height: 4px; padding: 0;"></td>
            </tr>

            <tr>
              <td style="padding: 24px 30px 16px; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 2px;">
                  AERO<span style="color: #00f5ff;">SPACE</span> // MISSION DISPATCH
                </div>
                <div style="font-size: 11px; color: #8c857b; margin-top: 2px;">
                  Ground Operations Inbound Inquiry (Cape Alpha Station)
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding: 24px 30px;">
                <div style="background: #060b16; border: 1px solid rgba(0, 245, 255, 0.2); border-radius: 8px; padding: 14px; margin-bottom: 20px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                      <td style="padding: 6px 8px; color: #8c857b; font-family: monospace; width: 130px;">DISPATCH ID:</td>
                      <td style="padding: 6px 8px; color: #00f5ff; font-weight: 700; font-family: monospace;">${id || 'TX-GEN-AERO'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 8px; color: #8c857b; font-family: monospace;">OPERATOR NAME:</td>
                      <td style="padding: 6px 8px; color: #ffedd6; font-weight: 600;">${name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 8px; color: #8c857b; font-family: monospace;">SENDER EMAIL:</td>
                      <td style="padding: 6px 8px; color: #38bdf8; font-weight: 600;">
                        <a href="mailto:${email}" style="color: #38bdf8; text-decoration: underline;">${email}</a>
                        <span style="color: #8c857b; font-size: 11px; margin-left: 6px;">(Reply-To active)</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 8px; color: #8c857b; font-family: monospace;">ORGANIZATION:</td>
                      <td style="padding: 6px 8px; color: #ffedd6;">${organization || 'Independent'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 8px; color: #8c857b; font-family: monospace;">PRIORITY:</td>
                      <td style="padding: 6px 8px; color: #f59e0b; font-weight: 700;">${priority || 'Routine Inquiry'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 8px; color: #8c857b; font-family: monospace;">FREQUENCY BAND:</td>
                      <td style="padding: 6px 8px; color: #10b981;">${band || 'S-Band'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 8px; color: #8c857b; font-family: monospace;">TIMESTAMP:</td>
                      <td style="padding: 6px 8px; color: #8c857b;">${timestamp || new Date().toUTCString()}</td>
                    </tr>
                  </table>
                </div>

                <div style="font-size: 12px; color: #8c857b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                  INQUIRY MESSAGE CONTENT:
                </div>
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 16px; color: #ffedd6; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${message}
                </div>

                <div style="margin-top: 24px; text-align: center;">
                  <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject || 'AeroSpec Flight Operations Inquiry')}" style="display: inline-block; background: #00f5ff; color: #050811; padding: 12px 28px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 13px; letter-spacing: 0.5px;">
                    Reply to Operator (${email}) →
                  </a>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding: 16px 30px; background: #070c18; text-align: center; font-size: 11px; color: #6e675d; border-top: 1px solid rgba(255,255,255,0.05);">
                AeroSpace Ground Control Dispatch Gateway // Target Desk: bikkinavijay0@gmail.com
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * Send Real Email via Brevo REST API over HTTPS (Port 443)
 * Operates over standard HTTPS REST - completely immune to Render/cloud SMTP port blocking.
 */
async function sendViaBrevo({ to, subject, html, text, name, replyTo }) {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured.');
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || OFFICIAL_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || OFFICIAL_SENDER_NAME;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to, name: name || 'Operator' }],
    subject: subject,
    htmlContent: html,
    textContent: text
  };

  if (replyTo) {
    if (typeof replyTo === 'object' && replyTo.email) {
      payload.replyTo = { email: replyTo.email, name: replyTo.name || replyTo.email };
    } else if (typeof replyTo === 'string' && replyTo.includes('@')) {
      payload.replyTo = { email: replyTo, name: name || replyTo };
    }
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Brevo API Error (${response.status}): ${data.message || JSON.stringify(data)}`);
    }

    return {
      success: true,
      sender: `"${senderName}" <${senderEmail}>`,
      mode: 'BREVO_REST_HTTPS',
      messageId: data.messageId,
      recipient: to
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Brevo HTTPS request timed out after 12 seconds.');
    }
    throw err;
  }
}

/**
 * Send Real Email via Resend REST API over HTTPS (Port 443)
 * Alternative HTTPS email provider.
 */
async function sendViaResend({ to, subject, html, text, name, replyTo }) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const senderEmail = process.env.RESEND_SENDER_EMAIL || process.env.SMTP_FROM || `"${OFFICIAL_SENDER_NAME}" <${OFFICIAL_SENDER_EMAIL}>`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const payload = {
    from: senderEmail,
    to: [to],
    subject: subject,
    html: html,
    text: text
  };

  if (replyTo) {
    payload.reply_to = typeof replyTo === 'object' ? replyTo.email : replyTo;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Resend API Error (${response.status}): ${data.message || JSON.stringify(data)}`);
    }

    return {
      success: true,
      sender: senderEmail,
      mode: 'RESEND_REST_HTTPS',
      messageId: data.id,
      recipient: to
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Resend HTTPS request timed out after 12 seconds.');
    }
    throw err;
  }
}

/**
 * Send Real OTP Email
 * Dispatches via HTTPS REST API (Brevo / Resend) in cloud environments where SMTP is blocked,
 * or falls back to local Nodemailer SMTP / test account.
 */
export async function sendOTPEmail({ to, otp, type = 'LOGIN', name = 'Operator' }) {
  const isProduction = process.env.NODE_ENV === 'production';
  const recipient = (to || '').trim();

  if (!recipient || !recipient.includes('@')) {
    return {
      success: false,
      sender: process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || OFFICIAL_SENDER_EMAIL,
      error: 'Valid recipient email address is required.',
      mode: 'FAILED',
      recipient
    };
  }

  const subject = `[${otp}] Your AeroSpace 2FA Verification Code`;
  const html = buildOtpEmailHtml({ email: recipient, otp, type, name });
  const text = `AeroSpace 2FA Security Code: ${otp}. Valid for 10 minutes. Sent from ${process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || OFFICIAL_SENDER_EMAIL}. If you did not request this, please ignore.`;

  // ── PRIORITY 1: Brevo REST API over HTTPS (Port 443) ──
  // Recommended for Render Free Web Services where outbound SMTP (ports 25, 465, 587) is blocked
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim() !== '') {
    try {
      const result = await sendViaBrevo({ to: recipient, subject, html, text, name });
      if (!isProduction) {
        console.log(`\n══════════════════════════════════════════════════════`);
        console.log(`🚀 [BREVO HTTPS DISPATCH SUCCESS]`);
        console.log(` Sender:     ${result.sender}`);
        console.log(` Mode:       BREVO_REST_HTTPS (Port 443)`);
        console.log(` Recipient:  ${recipient}`);
        console.log(` OTP Code:   [ ${otp} ]`);
        console.log(` Message ID: ${result.messageId}`);
        console.log(`══════════════════════════════════════════════════════\n`);
      } else {
        console.log(`[MAILER] OTP email dispatched via Brevo HTTPS to ${recipient} (Message ID: ${result.messageId || 'N/A'})`);
      }
      return result;
    } catch (brevoErr) {
      console.error(`❌ [BREVO ERROR] Failed to send via Brevo HTTPS:`, brevoErr.message);
      if (isProduction) {
        return {
          success: false,
          sender: process.env.BREVO_SENDER_EMAIL || OFFICIAL_SENDER_EMAIL,
          error: 'Unable to send OTP email via Brevo. Please check your Brevo configuration.',
          mode: 'FAILED',
          recipient
        };
      }
    }
  }

  // ── PRIORITY 2: Resend REST API over HTTPS (Port 443) ──
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '') {
    try {
      const result = await sendViaResend({ to: recipient, subject, html, text, name });
      if (!isProduction) {
        console.log(`🚀 [RESEND HTTPS DISPATCH SUCCESS] to ${recipient}, OTP: [ ${otp} ]`);
      } else {
        console.log(`[MAILER] OTP email dispatched via Resend HTTPS to ${recipient} (Message ID: ${result.messageId || 'N/A'})`);
      }
      return result;
    } catch (resendErr) {
      console.error(`❌ [RESEND ERROR] Failed to send via Resend HTTPS:`, resendErr.message);
      if (isProduction) {
        return {
          success: false,
          sender: process.env.RESEND_SENDER_EMAIL || OFFICIAL_SENDER_EMAIL,
          error: 'Unable to send OTP email via Resend.',
          mode: 'FAILED',
          recipient
        };
      }
    }
  }

  // ── PRIORITY 3: Nodemailer SMTP / Local Development Fallback ──
  try {
    const { transport, mode, sender } = await getTransporter();

    if (isProduction && mode !== 'LIVE_SMTP') {
      throw new Error('Production email dispatch requires BREVO_API_KEY (or RESEND_API_KEY) in Render environment variables.');
    }

    const mailOptions = {
      from: sender || process.env.SMTP_FROM || DEFAULT_SENDER,
      to: recipient,
      subject: subject,
      text: text,
      html: html
    };

    const info = await transport.sendMail(mailOptions);
    const previewUrl = !isProduction ? nodemailer.getTestMessageUrl(info) : null;

    if (!isProduction) {
      console.log(`\n══════════════════════════════════════════════════════`);
      console.log(`🚀 [DEV EMAIL DISPATCH SUCCESS]`);
      console.log(` Sender:      ${mailOptions.from}`);
      console.log(` Mode:        ${mode}`);
      console.log(` Recipient:   ${recipient}`);
      console.log(` OTP Code:    [ ${otp} ]`);
      console.log(` Message ID:  ${info.messageId || 'N/A'}`);
      if (previewUrl) {
        console.log(` 🌐 Live Web Inbox Preview: ${previewUrl}`);
      }
      console.log(`══════════════════════════════════════════════════════\n`);
    } else {
      console.log(`[MAILER] OTP email dispatched via SMTP to ${recipient} (Message ID: ${info.messageId || 'N/A'})`);
    }

    return {
      success: true,
      sender: mailOptions.from,
      mode: mode,
      messageId: info.messageId,
      previewUrl: previewUrl || null,
      recipient: recipient
    };
  } catch (err) {
    if (!isProduction) {
      console.error('❌ [MAILER ERROR] Failed to send email:', err);
    } else {
      console.error(`❌ [MAILER ERROR] Failed to send OTP email to ${recipient}:`, err.message);
    }
    return {
      success: false,
      sender: process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || OFFICIAL_SENDER_EMAIL,
      error: isProduction ? 'Unable to send OTP email. Please try again.' : err.message,
      mode: 'FAILED',
      recipient: recipient
    };
  }
}

/**
 * Send User Notification Confirmation Email
 * Sent directly to the affected user's registered email via Brevo HTTPS REST API
 */
export async function sendUserNotificationEmail({ to, subject, title, message, actionDetails = {}, name = 'Flight Operator' }) {
  const isProduction = process.env.NODE_ENV === 'production';
  const recipient = (to || '').trim();

  if (!recipient || !recipient.includes('@')) {
    return {
      success: false,
      sender: process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || OFFICIAL_SENDER_EMAIL,
      error: 'Valid recipient email address is required.',
      mode: 'FAILED',
      recipient
    };
  }

  const emailSubject = subject || `[AeroSpec] ${title || 'Account Notification'}`;
  const html = buildUserNotificationEmailHtml({ name, title, message, actionDetails });
  const text = `AeroSpec Ground Control Notification: ${title}. ${message} Sent to ${recipient}. If you did not authorize this, alert system administration immediately.`;

  // 1. Brevo REST API over HTTPS (Port 443)
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim() !== '') {
    try {
      const result = await sendViaBrevo({ to: recipient, subject: emailSubject, html, text, name });
      if (!isProduction) {
        console.log(`📡 [USER NOTIFICATION DISPATCHED VIA BREVO] to ${recipient}: "${emailSubject}"`);
      } else {
        console.log(`[MAILER] User notification dispatched via Brevo HTTPS to ${recipient}`);
      }
      return result;
    } catch (brevoErr) {
      console.error(`❌ [BREVO ERROR] Failed user notification:`, brevoErr.message);
      if (isProduction) {
        return { success: false, error: brevoErr.message, mode: 'FAILED', recipient };
      }
    }
  }

  // 2. Resend REST API over HTTPS (Port 443)
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '') {
    try {
      const result = await sendViaResend({ to: recipient, subject: emailSubject, html, text, name });
      console.log(`📡 [USER NOTIFICATION DISPATCHED VIA RESEND] to ${recipient}: "${emailSubject}"`);
      return result;
    } catch (resendErr) {
      console.error(`❌ [RESEND ERROR] Failed user notification:`, resendErr.message);
      if (isProduction) {
        return { success: false, error: resendErr.message, mode: 'FAILED', recipient };
      }
    }
  }

  // 3. Nodemailer SMTP / Development Fallback
  try {
    const { transport, mode, sender } = await getTransporter();
    const mailOptions = {
      from: sender || process.env.SMTP_FROM || DEFAULT_SENDER,
      to: recipient,
      subject: emailSubject,
      text: text,
      html: html
    };

    const info = await transport.sendMail(mailOptions);
    const previewUrl = !isProduction ? nodemailer.getTestMessageUrl(info) : null;
    if (!isProduction) {
      console.log(`📡 [USER NOTIFICATION DISPATCHED VIA ${mode}] to ${recipient}: "${emailSubject}"`);
      if (previewUrl) console.log(` 🌐 Preview URL: ${previewUrl}`);
    }
    return {
      success: true,
      sender: mailOptions.from,
      mode: mode,
      messageId: info.messageId,
      previewUrl,
      recipient
    };
  } catch (err) {
    console.error(`❌ [MAILER ERROR] Could not dispatch user notification to ${recipient}:`, err.message);
    return {
      success: false,
      error: err.message,
      mode: 'FAILED',
      recipient
    };
  }
}

/**
 * Send Contact Us Inquiry Email to Administrator
 * Destination MUST be: bikkinavijay0@gmail.com
 * Reply-To MUST be: the user's submitted email
 */
export async function sendContactEmail({ name, email, subject, message, priority, organization, band, id, timestamp }) {
  const isProduction = process.env.NODE_ENV === 'production';
  const adminRecipient = 'bikkinavijay0@gmail.com';
  const operatorName = (name || 'Anonymous Operator').trim();
  const operatorEmail = (email || '').trim();

  if (!operatorEmail || !operatorEmail.includes('@')) {
    return {
      success: false,
      error: 'Valid sender email address is required.',
      mode: 'FAILED',
      recipient: adminRecipient
    };
  }

  const emailSubject = `[AeroSpec Inbound] ${subject || priority || 'Flight Operations Inquiry'} - From ${operatorName}`;
  const html = buildContactEmailHtml({
    name: operatorName,
    email: operatorEmail,
    subject,
    message,
    priority,
    organization,
    band,
    id,
    timestamp: timestamp || new Date().toUTCString()
  });
  const text = `AeroSpec Flight Operations Inbound Inquiry\nID: ${id || 'TX-AERO'}\nFrom: ${operatorName} (${operatorEmail})\nOrg: ${organization || 'N/A'}\nPriority: ${priority || 'Routine'}\nBand: ${band || 'S-Band'}\nMessage:\n${message}\n\n(Reply-To: ${operatorEmail})`;

  const replyTo = { email: operatorEmail, name: operatorName };

  // 1. Brevo REST API over HTTPS (Port 443)
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim() !== '') {
    try {
      const result = await sendViaBrevo({
        to: adminRecipient,
        subject: emailSubject,
        html,
        text,
        name: 'AeroSpace Mission Desk',
        replyTo
      });
      if (!isProduction) {
        console.log(`\n══════════════════════════════════════════════════════`);
        console.log(`🚀 [CONTACT FORM DISPATCHED VIA BREVO HTTPS]`);
        console.log(` Recipient:  ${adminRecipient}`);
        console.log(` Reply-To:   ${operatorEmail} (${operatorName})`);
        console.log(` Subject:    ${emailSubject}`);
        console.log(`══════════════════════════════════════════════════════\n`);
      } else {
        console.log(`[MAILER] Contact form message dispatched to ${adminRecipient} with Reply-To: ${operatorEmail}`);
      }
      return result;
    } catch (brevoErr) {
      console.error(`❌ [BREVO ERROR] Failed contact form email:`, brevoErr.message);
      if (isProduction) {
        return { success: false, error: brevoErr.message, mode: 'FAILED', recipient: adminRecipient };
      }
    }
  }

  // 2. Resend REST API over HTTPS (Port 443)
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '') {
    try {
      const result = await sendViaResend({
        to: adminRecipient,
        subject: emailSubject,
        html,
        text,
        name: 'AeroSpace Mission Desk',
        replyTo
      });
      console.log(`🚀 [CONTACT FORM DISPATCHED VIA RESEND] to ${adminRecipient}, Reply-To: ${operatorEmail}`);
      return result;
    } catch (resendErr) {
      console.error(`❌ [RESEND ERROR] Failed contact form email:`, resendErr.message);
      if (isProduction) {
        return { success: false, error: resendErr.message, mode: 'FAILED', recipient: adminRecipient };
      }
    }
  }

  // 3. Nodemailer SMTP / Development Fallback
  try {
    const { transport, mode, sender } = await getTransporter();
    const mailOptions = {
      from: sender || process.env.SMTP_FROM || DEFAULT_SENDER,
      to: adminRecipient,
      replyTo: `"${operatorName}" <${operatorEmail}>`,
      subject: emailSubject,
      text: text,
      html: html
    };

    const info = await transport.sendMail(mailOptions);
    const previewUrl = !isProduction ? nodemailer.getTestMessageUrl(info) : null;
    if (!isProduction) {
      console.log(`\n══════════════════════════════════════════════════════`);
      console.log(`🚀 [CONTACT FORM DISPATCHED VIA ${mode}]`);
      console.log(` Recipient:  ${adminRecipient}`);
      console.log(` Reply-To:   ${operatorEmail} (${operatorName})`);
      console.log(` Subject:    ${emailSubject}`);
      if (previewUrl) console.log(` 🌐 Live Web Inbox Preview: ${previewUrl}`);
      console.log(`══════════════════════════════════════════════════════\n`);
    } else {
      console.log(`[MAILER] Contact form message dispatched via SMTP to ${adminRecipient}`);
    }
    return {
      success: true,
      sender: mailOptions.from,
      mode: mode,
      messageId: info.messageId,
      previewUrl,
      recipient: adminRecipient
    };
  } catch (err) {
    console.error(`❌ [MAILER ERROR] Could not dispatch contact form email to ${adminRecipient}:`, err.message);
    return {
      success: false,
      error: err.message,
      mode: 'FAILED',
      recipient: adminRecipient
    };
  }
}

export default {
  sendOTPEmail,
  sendUserNotificationEmail,
  sendContactEmail,
  OFFICIAL_SENDER_EMAIL
};
