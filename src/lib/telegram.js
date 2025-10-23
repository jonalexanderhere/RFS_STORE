// Telegram Bot Integration for RFS_STORE

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID || import.meta.env.VITE_TELEGRAM_CHAT_ID
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

/**
 * Send message to Telegram
 * @param {string} message - Message to send
 * @param {object} options - Additional options (parse_mode, reply_markup, etc.)
 */
export const sendTelegramMessage = async (message, options = {}) => {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        ...options
      })
    })

    const data = await response.json()
    
    if (!data.ok) {
      throw new Error(data.description || 'Failed to send Telegram message')
    }

    return data
  } catch (error) {
    console.error('Telegram send error:', error)
    throw error
  }
}

/**
 * Send notification about new order
 * @param {object} order - Order object
 */
export const notifyNewOrder = async (order) => {
  const message = `
🆕 <b>PESANAN BARU</b>

📝 No. Pesanan: <code>${order.order_number}</code>
👤 Pelanggan: ${order.user?.full_name || 'N/A'}
📱 Telepon: ${order.user?.phone || 'N/A'}
🛍️ Layanan: ${order.service?.name || 'N/A'}

📄 Deskripsi:
${order.description}

⏰ Waktu: ${new Date(order.created_at).toLocaleString('id-ID')}

Segera buat invoice untuk pesanan ini!
  `.trim()

  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Buat Invoice', callback_data: `create_invoice_${order.id}` },
        { text: '👁️ Lihat Detail', url: `${window.location.origin}/admin/orders` }
      ]
    ]
  }

  return sendTelegramMessage(message, { reply_markup: keyboard })
}

/**
 * Send notification about new invoice
 * @param {object} invoice - Invoice object
 */
export const notifyNewInvoice = async (invoice) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const message = `
📄 <b>INVOICE BARU DIBUAT</b>

🧾 No. Invoice: <code>${invoice.invoice_number}</code>
👤 Pelanggan: ${invoice.user?.full_name || 'N/A'}
🛍️ Layanan: ${invoice.service_type}

💰 Total: <b>${formatCurrency(invoice.total_amount)}</b>
💳 Metode: ${invoice.payment_method?.toUpperCase() || 'N/A'}

📄 Deskripsi:
${invoice.description}

⏰ Waktu: ${new Date(invoice.created_at).toLocaleString('id-ID')}

Invoice telah dikirim ke pelanggan via WhatsApp & Telegram.
  `.trim()

  const keyboard = {
    inline_keyboard: [
      [
        { text: '👁️ Lihat Invoice', url: `${window.location.origin}/invoice/${invoice.id}` }
      ]
    ]
  }

  return sendTelegramMessage(message, { reply_markup: keyboard })
}

/**
 * Send notification about payment proof upload
 * @param {object} invoice - Invoice object with payment proof
 */
export const notifyPaymentProof = async (invoice) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const message = `
💸 <b>BUKTI PEMBAYARAN DITERIMA</b>

🧾 No. Invoice: <code>${invoice.invoice_number}</code>
👤 Pelanggan: ${invoice.user?.full_name || 'N/A'}
💰 Total: <b>${formatCurrency(invoice.total_amount)}</b>

📎 Bukti pembayaran telah diupload!
⏰ Waktu Upload: ${new Date().toLocaleString('id-ID')}

Segera verifikasi pembayaran ini!
  `.trim()

  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Verifikasi', callback_data: `verify_payment_${invoice.id}` },
        { text: '❌ Tolak', callback_data: `reject_payment_${invoice.id}` }
      ],
      [
        { text: '👁️ Lihat Bukti', url: invoice.proof_url || '#' }
      ]
    ]
  }

  return sendTelegramMessage(message, { reply_markup: keyboard })
}

/**
 * Send notification about payment verification
 * @param {object} invoice - Invoice object
 * @param {boolean} verified - Whether payment is verified or rejected
 */
export const notifyPaymentStatus = async (invoice, verified) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const message = verified
    ? `
✅ <b>PEMBAYARAN DIVERIFIKASI</b>

🧾 No. Invoice: <code>${invoice.invoice_number}</code>
👤 Pelanggan: ${invoice.user?.full_name || 'N/A'}
💰 Total: <b>${formatCurrency(invoice.total_amount)}</b>

Status: <b>PAID</b> ✅
⏰ Waktu Verifikasi: ${new Date().toLocaleString('id-ID')}

Pelanggan telah menerima notifikasi konfirmasi.
    `.trim()
    : `
❌ <b>PEMBAYARAN DITOLAK</b>

🧾 No. Invoice: <code>${invoice.invoice_number}</code>
👤 Pelanggan: ${invoice.user?.full_name || 'N/A'}
💰 Total: <b>${formatCurrency(invoice.total_amount)}</b>

Status: <b>UNPAID</b> ❌
⏰ Waktu: ${new Date().toLocaleString('id-ID')}

Pelanggan diminta untuk mengupload ulang bukti pembayaran yang valid.
    `.trim()

  return sendTelegramMessage(message)
}

/**
 * Send notification about order status update
 * @param {object} order - Order object
 */
export const notifyOrderStatus = async (order) => {
  const statusEmoji = {
    pending: '⏳',
    processing: '🔄',
    completed: '✅',
    cancelled: '❌'
  }

  const message = `
${statusEmoji[order.status]} <b>STATUS PESANAN DIUPDATE</b>

📝 No. Pesanan: <code>${order.order_number}</code>
👤 Pelanggan: ${order.user?.full_name || 'N/A'}
🛍️ Layanan: ${order.service?.name || 'N/A'}

📊 Status Baru: <b>${order.status.toUpperCase()}</b>

${order.admin_notes ? `📝 Catatan Admin:\n${order.admin_notes}` : ''}

⏰ Waktu Update: ${new Date().toLocaleString('id-ID')}
  `.trim()

  return sendTelegramMessage(message)
}

/**
 * Send message to specific user (requires user's telegram_id in database)
 * @param {string} chatId - User's Telegram chat ID
 * @param {string} message - Message to send
 */
export const sendUserMessage = async (chatId, message, options = {}) => {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        ...options
      })
    })

    const data = await response.json()
    
    if (!data.ok) {
      throw new Error(data.description || 'Failed to send message to user')
    }

    return data
  } catch (error) {
    console.error('Telegram user message error:', error)
    throw error
  }
}

/**
 * Send invoice to customer via Telegram
 * @param {object} invoice - Invoice object
 * @param {string} telegramId - Customer's Telegram ID
 */
export const sendInvoiceToCustomer = async (invoice, telegramId) => {
  if (!telegramId) return

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const message = `
🧾 <b>INVOICE BARU</b>

Halo ${invoice.user?.full_name},

Invoice untuk pesanan Anda telah dibuat:

📄 No. Invoice: <code>${invoice.invoice_number}</code>
🛍️ Layanan: ${invoice.service_type}
💰 Total Pembayaran: <b>${formatCurrency(invoice.total_amount)}</b>
💳 Metode: ${invoice.payment_method?.toUpperCase() || 'N/A'}

📝 Deskripsi:
${invoice.description}

Silakan lakukan pembayaran dan upload bukti pembayaran Anda.
  `.trim()

  const keyboard = {
    inline_keyboard: [
      [
        { text: '💳 Lihat Invoice & Bayar', url: `${window.location.origin}/invoice/${invoice.id}` }
      ]
    ]
  }

  return sendUserMessage(telegramId, message, { reply_markup: keyboard })
}

/**
 * Send payment confirmation to customer
 * @param {object} invoice - Invoice object
 * @param {string} telegramId - Customer's Telegram ID
 */
export const sendPaymentConfirmation = async (invoice, telegramId) => {
  if (!telegramId) return

  const message = `
✅ <b>PEMBAYARAN DIKONFIRMASI</b>

Terima kasih ${invoice.user?.full_name}!

Pembayaran Anda untuk invoice <code>${invoice.invoice_number}</code> telah diverifikasi.

Pesanan Anda akan segera diproses.

Terima kasih telah menggunakan layanan RFS_STORE! 🎉
  `.trim()

  return sendUserMessage(telegramId, message)
}

