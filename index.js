const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const WHATSAPP_API_URL = `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

// Middleware
app.use(bodyParser.json());

// 🌐 Webhook Verification Endpoint
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log('Webhook verified!');
    res.status(200).send(challenge);
  } else {
    console.error('Verification failed');
    res.sendStatus(403);
  }
});

// 📬 Webhook for Receiving Messages
app.post('/webhook', async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return res.sendStatus(200);

    const from = message.from;
    const incomingText = message.text?.body?.toLowerCase().trim();

    console.log("📩 Message from:", from, "| Text:", incomingText);

    if (incomingText === 'hi' || incomingText === 'hello') {
      await sendMainMenu(from);
    } else if (message.type === "interactive") {
      const buttonId = message.interactive.button_reply.id;
      await handleButtonAction(buttonId, from);
    } else {
      await sendText(from, "🏋️‍♂️ Hello! Type 'hi' to see options or choose from the menu.");
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❗ Error:", error.response?.data || error.message);
    res.sendStatus(500);
  }
});

// 📤 Send Main Menu Buttons
async function sendMainMenu(to) {
  // First set of 3 buttons
  await axios.post(WHATSAPP_API_URL, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: "🏋️ Welcome to FitZone Gym! Choose an option:"
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "book_session",
              title: "✅ Book Slot"
            }
          },
          {
            type: "reply",
            reply: {
              id: "check_membership",
              title: "🎟️ Membership"
            }
          },
          {
            type: "reply",
            reply: {
              id: "contact_trainer",
              title: "💬 Trainer"
            }
          }
        ]
      }
    }
  }, {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  // Delay 1 second before sending next menu
  await new Promise(res => setTimeout(res, 1000));

  // Second set of 3 buttons
  await axios.post(WHATSAPP_API_URL, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: "🔽 More Options:"
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "make_payment",
              title: "💳 Payment"
            }
          },
          {
            type: "reply",
            reply: {
              id: "check_schedule",
              title: "📅 Schedule"
            }
          },
          {
            type: "reply",
            reply: {
              id: "progress_report",
              title: "📈 Progress"
            }
          }
        ]
      }
    }
  }, {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  // Optional third set
  await new Promise(res => setTimeout(res, 1000));

  await axios.post(WHATSAPP_API_URL, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: "🔁 More Services:"
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "renew_membership",
              title: "📋 Renew Membership"
            }
          }
        ]
      }
    }
  }, {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
}


// 📤 Send Text Message
async function sendText(to, text) {
  await axios.post(WHATSAPP_API_URL, {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text }
  }, {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
}

// 🧠 Handle Button Actions
async function handleButtonAction(buttonId, to) {
  switch (buttonId) {
    case "book_session":
      await sendText(to, "✅ Your workout session has been booked for *tomorrow at 7 AM*. Let us know if you'd like to change the slot.");
      break;

    case "check_membership":
      await sendText(to, "🎟️ Your current membership is *Active* and valid until *Dec 31, 2025*.");
      break;

    case "contact_trainer":
      await sendText(to, "💬 Our trainer will contact you shortly. You can also call us at 📞 +91-98765-43210.");
      break;

    case "make_payment":
      await sendText(to, "💳 You can make a payment via UPI to: *fitzone@upi* or visit our front desk for card/cash payments.");
      break;

    case "class_schedule":
      await sendText(to, "📅 Class Schedule:\n- Mon-Fri: 6 AM - 7 AM (Cardio), 7 AM - 8 AM (Strength), 6 PM - 7 PM (HIIT)\n- Sat-Sun: 8 AM - 9 AM (Yoga)");
      break;

    case "progress_report":
      await sendText(to, "📈 Progress Report:\nWeight: 72kg\nBody Fat: 18%\nWorkouts This Month: 15 sessions\nKeep it up! 💪");
      break;

    case "renew_membership":
      await sendText(to, "📋 You can renew your membership by visiting the gym or paying online via UPI: *fitzone@upi*. Monthly: ₹1500, Quarterly: ₹4000, Yearly: ₹15,000");
      break;

    default:
      await sendText(to, "❌ Invalid option. Type 'hi' to see the menu again.");
  }
}

// 🟢 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});