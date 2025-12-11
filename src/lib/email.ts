import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Listing Leads <noreply@listingleads.com>',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw new Error(error.message)
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

export function generatePublishNotificationEmail(
  userName: string,
  pageName: string,
  pageUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Your Page is Live!</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Hi ${userName},</p>

        <p>Great news! Your listing page <strong>"${pageName}"</strong> has been successfully published.</p>

        <div style="margin: 30px 0;">
          <a href="${pageUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            View Your Page
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          You can edit your page anytime from your dashboard.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #9ca3af; font-size: 12px;">
          This email was sent by Listing Leads. If you didn't create this page, please contact support.
        </p>
      </div>
    </body>
    </html>
  `
}

export function generateWelcomeEmail(userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Listing Leads!</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Hi ${userName},</p>

        <p>Welcome to Listing Leads! We're excited to have you on board.</p>

        <p>With Listing Leads, you can:</p>

        <ul style="color: #4b5563;">
          <li>Choose from professional real estate templates</li>
          <li>Customize your listing pages with your own content</li>
          <li>Publish and share your pages instantly</li>
        </ul>

        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/templates" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Browse Templates
          </a>
        </div>

        <p>If you have any questions, feel free to reach out to our support team.</p>

        <p>Best regards,<br>The Listing Leads Team</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #9ca3af; font-size: 12px;">
          You're receiving this email because you signed up for Listing Leads.
        </p>
      </div>
    </body>
    </html>
  `
}
