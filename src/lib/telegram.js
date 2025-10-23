// Telegram Bot Integration for RFS_STORE

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8464163003:AAHLj8X0p7dY2_mHH7y8GH02uXU--B8fXXM'
// Support multiple admin chat IDs (comma-separated)
const TELEGRAM_ADMIN_CHAT_IDS = (import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID || '5788748857,6478150893').split(',').filter(Boolean)
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

// Admin WhatsApp numbers (for reference/fallback)
export const ADMIN_WHATSAPP = {
  admin1: import.meta.env.VITE_ADMIN_WHATSAPP_1 || '6282181183590',
  admin2: import.meta.env.VITE_ADMIN_WHATSAPP_2 || '6282176466707'
}

console.log('Telegram Config:', {
  tokenExists: !!TELEGRAM_BOT_TOKEN,
  adminChatIds: TELEGRAM_ADMIN_CHAT_IDS,
  apiUrl: TELEGRAM_API_URL.substring(0, 50) + '...'
})

/**
 * Send message to Telegram (single chat)
 * @param {string} chatId - Chat ID to send to
 * @param {string} message - Message to send
 * @param {object} options - Additional options (parse_mode, reply_markup, etc.)
 */
export const sendTelegramMessage = async (message, options = {}, chatId = null) => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('Telegram bot token not configured')
    return null
  }

  try {
    const targetChatId = chatId || TELEGRAM_ADMIN_CHAT_IDS[0]
    
    console.log('Sending Telegram message to:', targetChatId)
    
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message,
        parse_mode: 'HTML',
        ...options
      })
    })

    const data = await response.json()
    
    if (!data.ok) {
      console.error('Telegram API error:', data)
      throw new Error(data.description || 'Failed to send Telegram message')
    }

    console.log('Telegram message sent successfully to:', targetChatId)
    return data
  } catch (error) {
    console.error('Telegram send error:', error)
    // Don't throw - allow operation to continue
    return null
  }
}

/**
 * Send message to all admins
 * @param {string} message - Message to send
 * @param {object} options - Additional options (parse_mode, reply_markup, etc.)
 */
export const sendTelegramToAllAdmins = async (message, options = {}) => {
  const results = []
  
  for (const chatId of TELEGRAM_ADMIN_CHAT_IDS) {
    try {
      const result = await sendTelegramMessage(message, options, chatId)
      results.push({ chatId, success: true, result })
    } catch (error) {
      console.error(`Failed to send to ${chatId}:`, error)
      results.push({ chatId, success: false, error: error.message })
    }
  }
  
  return results
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

  // Send to all admins
  return sendTelegramToAllAdmins(message, { reply_markup: keyboard })
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

  // Send to all admins
  return sendTelegramToAllAdmins(message, { reply_markup: keyboard })
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

  // Send to all admins
  return sendTelegramToAllAdmins(message, { reply_markup: keyboard })
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

  // Send to all admins
  return sendTelegramToAllAdmins(message)
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

  // Send to all admins
  return sendTelegramToAllAdmins(message)
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

