/**
 * Отправить сообщение через Telegram Bot API.
 * Если токен не настроен — логирует в консоль и не падает.
 */
export async function sendTelegramMessage(chatId: string, text: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log(`[Telegram] Бот не настроен. Сообщение → ${chatId}: ${text}`)
    return
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      }
    )
    if (!res.ok) {
      console.error('[Telegram] Ошибка API:', await res.text())
    }
  } catch (err: any) {
    console.error('[Telegram] Ошибка отправки:', err.message)
  }
}
