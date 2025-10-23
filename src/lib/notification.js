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

  console.log('📱 Sending customer notification to:', {
    telegram_id: user.telegram_id,
    phone: user.phone
  })

  // Convert HTML message to plain text for WhatsApp
  const plainMessage = message
    .replace(/<b>(.*?)<\/b>/g, '*$1*')
    .replace(/<code>(.*?)<\/code>/g, '`$1`')
    .replace(/<[^>]*>/g, '')
    .trim()

  // Send to both Telegram AND WhatsApp in parallel
  const promises = []

  // Telegram (if user has telegram_id)
  if (user.telegram_id) {
    promises.push(
      sendTelegramMessage(message, options, user.telegram_id)
        .then(result => {
          results.telegram = { success: !!result, result }
          if (result) {
            results.success = true
            console.log('✅ Telegram sent to:', user.telegram_id)
          }
          return result
        })
        .catch(error => {
          console.error('❌ Telegram failed:', error)
          results.telegram = { success: false, error: error.message }
        })
    )
  }

  // WhatsApp (ALWAYS send if phone exists)
  if (user.phone) {
    const phone = formatPhoneNumber(user.phone)
    promises.push(
      sendWhatsAppMessage(phone, plainMessage)
        .then(result => {
          results.whatsapp = { success: !!result, result }
          if (result) {
            results.success = true
            console.log('✅ WhatsApp sent to:', phone)
          }
          return result
        })
        .catch(error => {
          console.error('❌ WhatsApp failed:', error)
          results.whatsapp = { success: false, error: error.message }
        })
    )
  }

  // Wait for all notifications to complete
  await Promise.allSettled(promises)

  console.log('📊 Notification results:', results)
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
  console.log('📱 Sending notification to all admins (Telegram + WhatsApp)')
  
  const results = []

  try {
    // Send to admin Telegrams
    const telegramResults = await sendTelegramToAllAdmins(message, options)
    results.push(...telegramResults.map(r => ({ ...r, channel: 'telegram' })))
    console.log('✅ Admin Telegram notifications sent:', telegramResults)
  } catch (error) {
    console.error('❌ Admin Telegram failed:', error)
  }

  try {
    // Send to admin WhatsApps
    const { ADMIN_WHATSAPP } = await import('./whatsapp')
    
    // Convert HTML to plain text
    const plainMessage = message
      .replace(/<b>(.*?)<\/b>/g, '*$1*')
      .replace(/<code>(.*?)<\/code>/g, '`$1`')
      .replace(/<[^>]*>/g, '')
      .trim()

    const { sendWhatsAppMessage } = await import('./whatsapp')
    
    for (const [key, phone] of Object.entries(ADMIN_WHATSAPP)) {
      try {
        const result = await sendWhatsAppMessage(phone, plainMessage)
        results.push({ 
          admin: key, 
          phone, 
          channel: 'whatsapp',
          success: !!result 
        })
        console.log(`✅ WhatsApp sent to ${key}:`, phone)
      } catch (error) {
        results.push({ 
          admin: key, 
          phone, 
          channel: 'whatsapp',
          success: false, 
          error: error.message 
        })
        console.error(`❌ WhatsApp failed to ${key}:`, error)
      }
    }
  } catch (error) {
    console.error('❌ Admin WhatsApp failed:', error)
  }

  console.log('📊 Admin notification results:', results)
  return results
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

