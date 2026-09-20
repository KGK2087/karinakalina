// Приёмщик заявок. Форма на сайте отправляет данные сюда,
// а этот код уже пересылает их в телеграм.
// Токен и chat id сюда НЕ вписываются — они берутся из настроек Vercel.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;

  if (!token || !chatId) {
    console.error('BOT_TOKEN или CHAT_ID не заданы в настройках Vercel');
    return res.status(500).json({ ok: false, error: 'Server not configured' });
  }

  // Берём всё, что прислала форма, какие бы поля в ней ни были.
  const data = req.body || {};

  const lines = Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `<b>${escapeHtml(key)}:</b> ${escapeHtml(String(value))}`);

  if (lines.length === 0) {
    return res.status(400).json({ ok: false, error: 'Empty form' });
  }

  const text = ['🔔 <b>Новая заявка с сайта</b>', '', ...lines].join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Telegram error:', result);
      return res.status(502).json({ ok: false, error: 'Telegram rejected the message' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Send failed:', error);
    return res.status(500).json({ ok: false, error: 'Send failed' });
  }
};

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
