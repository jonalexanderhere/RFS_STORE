// WhatsApp Gateway Integration for RFS_STORE
// Using Fonnte API (you can replace with other providers like Wablas, Twilio, etc.)

const FONNTE_API_URL = 'https://api.fonnte.com/send'
const FONNTE_TOKEN = import.meta.env.VITE_FONNTE_TOKEN || 'hakuNNT3TBPHvGqtcF2QYLXnFaUYQt66Qsg91ndi6'

console.log('WhatsApp Config:', {
  tokenExists: !!FONNTE_TOKEN,
  apiUrl: FONNTE_API_URL
})

/**
 * Send WhatsApp message via Fonnte API
 * @param {string} phoneNumber - Recipient phone number (format: 628xxx)
 * @param {string} message - Message to send
 */
export const sendWhatsAppMessage = async (phoneNumber, message) => {
  if (!FONNTE_TOKEN) {
    console.warn('Fonnte token not configured, skipping WhatsApp notification')
    return null
  }

  try {
    console.log('Sending WhatsApp to:', phoneNumber)
    
    const response = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: phoneNumber,
        message: message,
        countryCode: '62'
      })
    })

    const data = await response.json()
    
    if (!response.ok || !data.status) {
      console.error('WhatsApp API error:', data)
      throw new Error(data.reason || `Fonnte API error: ${response.status}`)
    }

    console.log('WhatsApp sent successfully to:', phoneNumber)
    return data
  } catch (error) {
    console.error('WhatsApp send error:', error)
    // Don't throw - just log and continue (notifications are non-critical)
    return null
  }
}

/**
 * Format phone number to WhatsApp format (62xxx)
 * @param {string} phone - Phone number
 */
export const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  
  // Convert to 62 format
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1)
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned
  }
  
  return cleaned
}

/**
 * Send new order notification to customer
 * @param {object} order - Order object
 */
export const sendOrderConfirmation = async (order) => {
  if (!order.user?.phone) return

  const phone = formatPhoneNumber(order.user.phone)
  
  const message = `
🎉 *PESANAN DITERIMA*

Halo ${order.user.full_name},

Pesanan Anda telah diterima!

📝 No. Pesanan: *${order.order_number}*
🛍️ Layanan: *${order.service?.name}*
📅 Tanggal: ${new Date(order.created_at).toLocaleString('id-ID')}

Admin kami akan segera meninjau pesanan Anda dan membuat invoice. Invoice akan dikirimkan melalui WhatsApp dan Telegram.

Terima kasih telah menggunakan layanan RFS_STORE! 🚀

---
RFS_STORE x InspiraProject
  `.trim()

  return sendWhatsAppMessage(phone, message)
}

/**
 * Send invoice to customer via WhatsApp
 * @param {object} invoice - Invoice object
 */
export const sendInvoiceViaWhatsApp = async (invoice) => {
  if (!invoice.user?.whatsapp && !invoice.user?.phone) return

  const phone = formatPhoneNumber(invoice.user.whatsapp || invoice.user.phone)
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const message = `
🧾 *INVOICE BARU*

Halo ${invoice.user.full_name},

Invoice untuk pesanan Anda telah dibuat:

📄 No. Invoice: *${invoice.invoice_number}*
🛍️ Layanan: *${invoice.service_type}*
💰 Total Pembayaran: *${formatCurrency(invoice.total_amount)}*
💳 Metode: ${invoice.payment_method?.toUpperCase() || 'Transfer Bank'}

📝 Deskripsi:
${invoice.description}

📱 Silakan lakukan pembayaran dan upload bukti transfer Anda melalui link berikut:
${window.location.origin}/invoice/${invoice.id}

Terima kasih! 🙏

---
RFS_STORE x InspiraProject
  `.trim()

  return sendWhatsAppMessage(phone, message)
}

/**
 * Send payment reminder to customer
 * @param {object} invoice - Invoice object
 */
export const sendPaymentReminder = async (invoice) => {
  if (!invoice.user?.whatsapp && !invoice.user?.phone) return

  const phone = formatPhoneNumber(invoice.user.whatsapp || invoice.user.phone)
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const message = `
⏰ *PENGINGAT PEMBAYARAN*

Halo ${invoice.user.full_name},

Kami ingin mengingatkan bahwa invoice berikut masih menunggu pembayaran:

📄 No. Invoice: *${invoice.invoice_number}*
💰 Total: *${formatCurrency(invoice.total_amount)}*

Jika Anda sudah melakukan pembayaran, silakan upload bukti transfer melalui:
${window.location.origin}/invoice/${invoice.id}

Jika ada pertanyaan, silakan hubungi kami.

Terima kasih! 🙏

---
RFS_STORE x InspiraProject
  `.trim()

  return sendWhatsAppMessage(phone, message)
}

/**
 * Send payment verification status to customer
 * @param {object} invoice - Invoice object
 * @param {boolean} verified - Whether payment is verified
 */
export const sendPaymentVerificationStatus = async (invoice, verified) => {
  if (!invoice.user?.whatsapp && !invoice.user?.phone) return

  const phone = formatPhoneNumber(invoice.user.whatsapp || invoice.user.phone)
  
  const message = verified
    ? `
✅ *PEMBAYARAN DIKONFIRMASI*

Halo ${invoice.user.full_name},

Pembayaran Anda telah diverifikasi! ✅

📄 No. Invoice: *${invoice.invoice_number}*
✅ Status: *LUNAS*
📅 Tanggal Verifikasi: ${new Date().toLocaleString('id-ID')}

Pesanan Anda akan segera diproses. Kami akan memberikan update secara berkala.

Terima kasih telah menggunakan layanan RFS_STORE! 🎉

---
RFS_STORE x InspiraProject
    `.trim()
    : `
❌ *PEMBAYARAN DITOLAK*

Halo ${invoice.user.full_name},

Maaf, bukti pembayaran Anda tidak dapat diverifikasi.

📄 No. Invoice: *${invoice.invoice_number}*

${invoice.admin_notes ? `📝 Catatan: ${invoice.admin_notes}` : ''}

Silakan upload ulang bukti pembayaran yang valid melalui:
${window.location.origin}/invoice/${invoice.id}

Jika ada pertanyaan, silakan hubungi kami.

---
RFS_STORE x InspiraProject
    `.trim()

  return sendWhatsAppMessage(phone, message)
}

/**
 * Send order completion notification
 * @param {object} order - Order object
 */
export const sendOrderCompletionNotification = async (order) => {
  if (!order.user?.whatsapp && !order.user?.phone) return

  const phone = formatPhoneNumber(order.user.whatsapp || order.user.phone)
  
  const message = `
✅ *PESANAN SELESAI*

Halo ${order.user.full_name},

Pesanan Anda telah selesai dikerjakan! 🎉

📝 No. Pesanan: *${order.order_number}*
🛍️ Layanan: *${order.service?.name}*
✅ Status: *COMPLETED*

${order.admin_notes ? `📝 Catatan: ${order.admin_notes}` : ''}

Terima kasih telah mempercayai RFS_STORE untuk kebutuhan Anda!

Kami sangat menghargai feedback Anda. Jangan ragu untuk menghubungi kami jika ada yang bisa kami bantu.

Sampai jumpa di order berikutnya! 🚀

---
RFS_STORE x InspiraProject
  `.trim()

  return sendWhatsAppMessage(phone, message)
}

/**
 * Send order status update to customer
 * @param {object} order - Order object
 */
export const sendOrderStatusUpdate = async (order) => {
  if (!order.user?.whatsapp && !order.user?.phone) return

  const phone = formatPhoneNumber(order.user.whatsapp || order.user.phone)
  
  const statusText = {
    pending: '⏳ Menunggu',
    processing: '🔄 Sedang Diproses',
    completed: '✅ Selesai',
    cancelled: '❌ Dibatalkan'
  }

  const message = `
📊 *UPDATE STATUS PESANAN*

Halo ${order.user.full_name},

Status pesanan Anda telah diupdate:

📝 No. Pesanan: *${order.order_number}*
📊 Status: *${statusText[order.status]}*

${order.admin_notes ? `📝 Catatan: ${order.admin_notes}` : ''}

📅 Update: ${new Date().toLocaleString('id-ID')}

Terima kasih! 🙏

---
RFS_STORE x InspiraProject
  `.trim()

  return sendWhatsAppMessage(phone, message)
}

/**
 * Send direct message to admin
 * @param {string} message - Message to send
 */
export const sendAdminWhatsAppNotification = async (message) => {
  const adminPhone = import.meta.env.VITE_FONNTE_SENDER || '6281234567890'
  return sendWhatsAppMessage(adminPhone, message)
}

