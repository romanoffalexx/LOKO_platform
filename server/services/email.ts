import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: (Number(process.env.SMTP_PORT) || 465) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * Отправить email-уведомление.
 * Если SMTP не настроен — логирует в консоль и не падает.
 */
export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_HOST) {
    console.log(`[Email] SMTP не настроен. Письмо → ${to}: ${subject}`)
    return
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    })
  } catch (err: any) {
    console.error('[Email] Ошибка отправки:', err.message)
  }
}
