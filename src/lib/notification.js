// Smart Notification Routing System
// Automatically choose best notification channel

import { sendTelegramMessage, sendTelegramToAllAdmins } from './telegram'
import { sendWhatsAppMessage, formatPhoneNumber } from './whatsapp'

/**
 * Send notification to customer
 * Priority: Telegram (if has telegram_id) → WhatsApp
 * 
 * @param {object} user - User object with telegram_id and phone
 * @param {string} message - Message to send
 * @param {object} options - Additional options
 * @returns {object} Result with channels used
 */
export const sendCustomerNotification = async (user, message, options = {}) => {
  const results = {
    telegram: null,
    whatsapp: null,
    success: false
  }

  // Try Telegram first if user has telegram_id
  if (user.telegram_id) {
    try {
      console.log('Sending notification via Telegram to:', user.telegram_id)
      const telegramResult = await sendTelegramMessage(message, options, user.telegram_id)
      results.telegram = { success: !!telegramResult, result: telegramResult }
      if (telegramResult) {
        results.success = true
        console.log('✅ Notification sent via Telegram')
      }
    } catch (error) {
      console.error('Telegram notification failed:', error)
      results.telegram = { success: false, error: error.message }
    }
  }

  // Always try WhatsApp as well (or fallback if Telegram failed)
  if (user.phone) {
    try {
      const phone = formatPhoneNumber(user.phone)
      console.log('Sending notification via WhatsApp to:', phone)
      
      // Convert HTML message to plain text for WhatsApp
      const plainMessage = message
        .replace(/<b>(.*?)<\/b>/g, '*$1*')
        .replace(/<code>(.*?)<\/code>/g, '`$1`')
        .replace(/<[^>]*>/g, '')
        .trim()
      
      const whatsappResult = await sendWhatsAppMessage(phone, plainMessage)
      results.whatsapp = { success: !!whatsappResult, result: whatsappResult }
      if (whatsappResult) {
        results.success = true
        console.log('✅ Notification sent via WhatsApp')
      }
    } catch (error) {
      console.error('WhatsApp notification failed:', error)
      results.whatsapp = { success: false, error: error.message }
    }
  }

  return results
}

/**
 * Send notification to admins
 * Always send to all admin Telegram chats
 * 
 * @param {string} message - Message to send
 * @param {object} options - Additional options
 * @returns {array} Results for each admin
 */
export const sendAdminNotification = async (message, options = {}) => {
  console.log('Sending notification to all admins via Telegram')
  
  try {
    const results = await sendTelegramToAllAdmins(message, options)
    console.log('✅ Admin notifications sent:', results)
    return results
  } catch (error) {
    console.error('Admin notification failed:', error)
    return []
  }
}

/**
 * Format notification message for different channels
 * 
 * @param {string} template - Message template name
 * @param {object} data - Data to fill template
 * @returns {object} Formatted messages for each channel
 */
export const formatNotificationMessage = (template, data) => {
  const templates = {
    new_order: {
      telegram: `
🆕 <b>PESANAN BARU</b>

📝 No. Pesanan: <code>${data.order_number}</code>
👤 Customer: ${data.customer_name}
📱 Phone: ${data.customer_phone}
🛍️ Layanan: ${data.service_name}

📄 Deskripsi:
${data.description}

⏰ ${data.timestamp}

Segera buat invoice!
      `.trim(),
      whatsapp: `
🆕 *PESANAN BARU*

📝 No. Pesanan: *${data.order_number}*
👤 Customer: ${data.customer_name}
📱 Phone: ${data.customer_phone}
🛍️ Layanan: ${data.service_name}

📄 Deskripsi:
${data.description}

⏰ ${data.timestamp}
      `.trim()
    },
    order_confirmation: {
      telegram: `
🎉 <b>PESANAN DITERIMA</b>

Halo ${data.customer_name},

Pesanan Anda telah diterima!

📝 No. Pesanan: <code>${data.order_number}</code>
🛍️ Layanan: ${data.service_name}
📅 ${data.timestamp}

Admin kami akan segera meninjau pesanan Anda dan membuat invoice.

Terima kasih! 🙏
      `.trim(),
      whatsapp: `
🎉 *PESANAN DITERIMA*

Halo ${data.customer_name},

Pesanan Anda telah diterima!

📝 No. Pesanan: *${data.order_number}*
🛍️ Layanan: ${data.service_name}
📅 ${data.timestamp}

Admin kami akan segera meninjau pesanan Anda dan membuat invoice.

Terima kasih! 🙏
      `.trim()
    }
  }

  return templates[template] || { telegram: data.message, whatsapp: data.message }
}

export default {
  sendCustomerNotification,
  sendAdminNotification,
  formatNotificationMessage
}

