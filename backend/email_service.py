import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

OTP_HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#0e0b18; font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b18; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:440px; background:rgba(14,11,24,0.95); border:1px solid rgba(124,58,237,0.25); border-radius:20px; overflow:hidden;">

          <!-- Top accent line -->
          <tr>
            <td style="height:2px; background:linear-gradient(90deg, transparent, #7c3aed, transparent);"></td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 36px 36px;">

              <!-- Logo text -->
              <div style="text-align:center; margin-bottom:28px;">
                <h1 style="margin:0; font-size:22px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; background:linear-gradient(135deg,#ffffff,#a78bfa,#7c3aed); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
                  Behavior Edge
                </h1>
              </div>

              <!-- Title -->
              <p style="margin:0 0 8px; font-size:18px; font-weight:600; color:#ffffff; text-align:center;">
                Password Reset
              </p>
              <p style="margin:0 0 28px; font-size:14px; color:#9ca3af; text-align:center; line-height:1.5;">
                Use the code below to reset your password. It expires in 5 minutes.
              </p>

              <!-- OTP Code Box -->
              <div style="background:rgba(124,58,237,0.1); border:1px solid rgba(124,58,237,0.3); border-radius:14px; padding:24px; text-align:center; margin-bottom:28px;">
                <span style="font-size:36px; font-weight:700; letter-spacing:0.35em; color:#c4b5fd; font-family:'Courier New',monospace;">
                  {otp_code}
                </span>
              </div>

              <!-- Security notice -->
              <p style="margin:0 0 0; font-size:12px; color:#6b7280; text-align:center; line-height:1.5;">
                If you didn't request this, you can safely ignore this email.<br>
                Never share this code with anyone.
              </p>

            </td>
          </tr>

          <!-- Bottom accent line -->
          <tr>
            <td style="height:1px; background:linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent);"></td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 36px 20px; text-align:center;">
              <p style="margin:0; font-size:11px; color:#4b5563; letter-spacing:0.08em;">
                BEHAVIOREDGE &copy; 2026
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """Send an OTP email to the given address. Returns True on success."""
    try:
        resend.emails.send(
            {
                "from": "BehaviorEdge <noreply@behavioredge.com>",
                "to": [to_email],
                "subject": "Your Password Reset Code",
                "html": OTP_HTML_TEMPLATE.format(otp_code=otp_code),
            }
        )
        return True
    except Exception as e:
        print(f"Failed to send OTP email: {e}")
        return False
