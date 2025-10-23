// Test Telegram & WhatsApp API
// Using native fetch (Node.js 18+)

// Config
const TELEGRAM_BOT_TOKEN = '8464163003:AAHLj8X0p7dY2_mHH7y8GH02uXU--B8fXXM';
const TELEGRAM_CHAT_ID_1 = '5788748857';
const TELEGRAM_CHAT_ID_2 = '6478150893';
const FONNTE_TOKEN = 'hakuNNT3TBPHvGqtcF2QYLXnFaUYQt66Qsg91ndi6';

console.log('\n═══════════════════════════════════════════════');
console.log('     TESTING TELEGRAM & WHATSAPP API');
console.log('═══════════════════════════════════════════════\n');

// Test 1: Telegram Bot Info
async function testTelegramBotInfo() {
  console.log('1. Testing Telegram Bot Token...');
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      console.log('   ✅ Telegram Bot Token VALID');
      console.log(`   Bot Name: ${data.result.username}`);
      console.log(`   Bot ID: ${data.result.id}`);
    } else {
      console.log('   ❌ Telegram Bot Token INVALID');
      console.log(`   Error: ${data.description}`);
    }
  } catch (error) {
    console.log('   ❌ Telegram API Error:', error.message);
  }
  console.log('');
}

// Test 2: Send Telegram to Admin 1
async function testTelegramAdmin1() {
  console.log('2. Testing Telegram to Admin 1...');
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID_1,
        text: '🧪 TEST MESSAGE from RFS_STORE\n\nThis is a test notification to Admin 1.\n\n✅ If you receive this, integration works!',
        parse_mode: 'HTML'
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log(`   ✅ Message sent to Admin 1 (${TELEGRAM_CHAT_ID_1})`);
    } else {
      console.log(`   ❌ Failed to send to Admin 1`);
      console.log(`   Error: ${data.description}`);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  console.log('');
}

// Test 3: Send Telegram to Admin 2
async function testTelegramAdmin2() {
  console.log('3. Testing Telegram to Admin 2...');
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID_2,
        text: '🧪 TEST MESSAGE from RFS_STORE\n\nThis is a test notification to Admin 2.\n\n✅ If you receive this, integration works!',
        parse_mode: 'HTML'
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log(`   ✅ Message sent to Admin 2 (${TELEGRAM_CHAT_ID_2})`);
    } else {
      console.log(`   ❌ Failed to send to Admin 2`);
      console.log(`   Error: ${data.description}`);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  console.log('');
}

// Test 4: Fonnte WhatsApp
async function testWhatsApp() {
  console.log('4. Testing WhatsApp (Fonnte)...');
  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: '6281234567890', // Test number
        message: '🧪 TEST MESSAGE from RFS_STORE\n\nThis is a test WhatsApp notification.\n\n✅ If you receive this, integration works!',
        countryCode: '62'
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.status) {
      console.log('   ✅ WhatsApp API WORKING');
      console.log(`   Status: ${data.status}`);
    } else {
      console.log('   ❌ WhatsApp API Error');
      console.log(`   Response: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  console.log('');
}

// Run all tests
async function runTests() {
  await testTelegramBotInfo();
  await testTelegramAdmin1();
  await testTelegramAdmin2();
  await testWhatsApp();
  
  console.log('═══════════════════════════════════════════════');
  console.log('     ALL TESTS COMPLETED');
  console.log('═══════════════════════════════════════════════\n');
}

runTests();

