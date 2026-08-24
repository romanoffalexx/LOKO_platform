import { fetch, ProxyAgent } from 'undici'

/**
 * Отправить сообщение через Telegram Bot API.
 * Если токен не настроен — логирует в консоль и не падает.
 * Если задан TELEGRAM_PROXY_URL — запросы идут через прокси.
 */
export async function sendTelegramMessage(chatId: string, text: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log(`[Telegram] Бот не настроен. Сообщение → ${chatId}: ${text}`)
    return
  }

  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`
  const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })

  try {
    const opts: RequestInit & { dispatcher?: any } = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }

    // Подключаем прокси, если задан
    if (process.env.TELEGRAM_PROXY_URL) {
      opts.dispatcher = new ProxyAgent(process.env.TELEGRAM_PROXY_URL)
    }

    const res = await fetch(url, opts)

    if (!res.ok) {
      console.error('[Telegram] Ошибка API:', await res.text())
    }
  } catch (err: any) {
    console.error('[Telegram] Ошибка отправки:', err.message)
  }
}
