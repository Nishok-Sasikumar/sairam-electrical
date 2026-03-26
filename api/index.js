const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const Razorpay = require("razorpay")
const crypto = require("crypto")
const axios = require("axios")
const { initializeApp } = require("firebase/app")
const { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, increment, getDoc, serverTimestamp } = require("firebase/firestore")
dotenv.config()

const app = express()

// Firebase Config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBHEifiVQdUG9Pddwd2A421qFdcK8x4w-4",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "sairam-69513.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "sairam-69513",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "sairam-69513.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "138312958922",
  appId: process.env.FIREBASE_APP_ID || "1:138312958922:web:ef764aef8d097211034533"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("FATAL ERROR: Razorpay keys are not defined in .env file.")
}

// Brevo API Helper
const sendEmail = async ({ to, subject, htmlContent }) => {
  try {
    console.log(`Sending email to ${to} via Brevo API...`);
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { email: process.env.EMAIL_USER, name: "SAI RAM Store" },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
      },
      {
        headers: {
          "api-key": process.env.EMAIL_PASS,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      }
    );
    console.log("Email sent successfully via API:", response.data.messageId);
    return { success: true };
  } catch (err) {
    const errorDetail = err.response?.data || err.message;
    console.error("Brevo API Email Error:", errorDetail);
    throw new Error(`Email delivery failed: ${JSON.stringify(errorDetail)}`);
  }
};

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5175", "http://127.0.0.1:5175", "http://localhost:5176", "http://127.0.0.1:5176", "https://con1-ten.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}))
app.use(express.json())

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is reachable!" })
})

// OTP: Send (Uses Firestore for Stateless/Serverless Storage)
app.post("/api/otp/send", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email is required" });
  
  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  try {
    // 1. Store OTP in Firestore with expiration (10 minutes)
    const expiration = Date.now() + 600000;
    await addDoc(collection(db, "otps"), {
      email,
      code,
      expires: expiration,
      createdAt: Date.now()
    });

    // 2. Send the email
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #10b981; text-align: center;">SAI RAM Verification</h2>
          <p>Hello,</p>
          <p>Your one-time password for signing up at SAI RAM Store is:</p>
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `;

    await sendEmail({
      to: email,
      subject: "Your SAI RAM Signup OTP",
      htmlContent: htmlContent
    });
    console.log(`OTP sent and stored in Firestore for: ${email}`);
    res.json({ success: true, message: "OTP sent successfully to your email." });
  } catch (err) {
    console.error("Failed to process OTP request:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP. Check server configuration." });
  }
});

// OTP: Verify (Checks Firestore)
app.post("/api/otp/verify", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ success: false, message: "Email and OTP are required" });

  try {
    // 1. Query Firestore for the most recent OTP for this email
    const otpQuery = query(
      collection(db, "otps"), 
      where("email", "==", email), 
      where("code", "==", code)
    );
    
    const querySnapshot = await getDocs(otpQuery);
    
    if (querySnapshot.empty) {
      return res.status(400).json({ success: false, message: "Invalid OTP or email. Please try again." });
    }

    // 2. Get the latest record (there should ideally be only one or we pick the first)
    const otpDoc = querySnapshot.docs[0];
    const data = otpDoc.data();

    // 3. Check expiration
    if (Date.now() > data.expires) {
      await deleteDoc(doc(db, "otps", otpDoc.id));
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    // 4. Clean up (delete the verified OTP)
    await deleteDoc(doc(db, "otps", otpDoc.id));
    
    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    console.error("Failed to verify OTP from Firestore:", err);
    res.status(500).json({ success: false, message: "Internal verification error" });
  }
});

// Submit Enquiry
app.post("/api/enquiry/submit", async (req, res) => {
  try {
    const { name, email, phone, message, userId } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Name, email, and message are required" });
    }

    const enquiryData = {
      name,
      userEmail: email,
      phone,
      message,
      userId,
      createdAt: new Date(),
      status: 'pending'
    };

    // 1. Save to Firestore
    await addDoc(collection(db, "enquiries"), enquiryData);

    // 2. Send email to Admin
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #10b981; text-align: center;">New Enquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p><strong>Message:</strong></p>
          <p style="background-color: #f8fafc; padding: 15px; border-radius: 8px;">${message}</p>
        </div>
      `;

    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: `New Customer Enquiry from ${name}`,
      htmlContent: htmlContent
    });
    
    res.json({ success: true, message: "Enquiry submitted successfully and admin notified" });
  } catch (err) {
    console.error("Enquiry submission error:", err);
    res.status(500).json({ success: false, message: "Failed to submit enquiry" });
  }
});

// Order Placement Endpoint (Handles both COD and Online)
app.post("/api/orders/place", async (req, res) => {
  try {
    const { 
      userId, 
      userName, 
      userEmail, 
      phone, 
      paymentMethod, 
      paymentStatus, 
      orderItems, 
      shippingAddress, 
      totalPrice,
      paymentId,
      orderId: razorpayOrderId
    } = req.body

    // 1. Stock Verification
    for (const item of orderItems) {
      const productRef = doc(db, "products", item.id)
      const productSnap = await getDoc(productRef)
      if (productSnap.exists()) {
        const currentStock = productSnap.data().stock || 0
        if (currentStock < item.quantity) {
          return res.status(400).json({ 
            success: false, 
            error: `Item "${item.name}" has insufficient quantity (Only ${currentStock} left).` 
          })
        }
      }
    }

    // 2. Create Firestore Order
    const orderData = {
      userId,
      userName,
      userEmail,
      phone,
      paymentMethod,
      paymentStatus: paymentStatus || (paymentMethod === 'COD' ? 'Pending' : 'Paid'),
      orderItems,
      shippingAddress,
      totalPrice,
      status: 'In Transit',
      isDelivered: false,
      createdAt: serverTimestamp(),
      paymentId: paymentId || (paymentMethod === 'COD' ? 'COD' : null),
      orderId: razorpayOrderId || null
    }

    const docRef = await addDoc(collection(db, "orders"), orderData)
    
    // 3. Update Stock
    for (const item of orderItems) {
      const productRef = doc(db, "products", item.id)
      await updateDoc(productRef, {
        stock: increment(-item.quantity)
      })
    }

    // 4. Notify Admin & Customer (Email)
    try {
      const itemsHtml = orderItems.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString()}</td>
        </tr>
      `).join('');

      // Admin Email
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #10b981;">New Order Received!</h2>
          <p><strong>Order ID:</strong> ${docRef.id}</p>
          <p><strong>Customer:</strong> ${userName} (${userEmail})</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Total Amount:</strong> ₹${totalPrice}</p>
          <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <h4 style="margin-bottom: 10px;">Shipping Address:</h4>
          <p style="color: #64748b;">
            ${shippingAddress.address},<br />
            ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.zip}
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <h4 style="margin-bottom: 10px;">Items:</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
      `;

      // Customer Email
      const customerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #10b981; margin: 0;">SAI RAM Store</h1>
            <p style="color: #64748b; margin: 5px 0;">Thank you for your order!</p>
          </div>
          
          <p>Hi ${userName},</p>
          <p>Your order has been successfully placed. We are currently processing it and will notify you once it's on its way.</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> #${docRef.id}</p>
            <p style="margin: 5px 0;"><strong>Order Status:</strong> Confirmed</p>
            <p style="margin: 5px 0;"><strong>Payment:</strong> ${paymentMethod}</p>
            <p style="margin: 5px 0;"><strong>Delivery to:</strong> ${shippingAddress.address}, ${shippingAddress.city}</p>
          </div>

          <h4 style="border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Order Summary</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 15px 10px; font-weight: bold; text-align: right;">Total Amount:</td>
                <td style="padding: 15px 10px; font-weight: bold; text-align: right; color: #10b981;">₹${totalPrice.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <p style="margin-top: 30px; font-size: 14px; color: #64748b; text-align: center;">
            If you have any questions, please reply to this email or visit our <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile" style="color: #10b981; text-decoration: none;">Help Center</a>.
          </p>
        </div>
      `;

      // Send to Admin
      await sendEmail({
        to: process.env.EMAIL_USER,
        subject: `New Order Received: #${docRef.id} (${paymentMethod})`,
        htmlContent: adminHtml
      });

      // Send to Customer
      await sendEmail({
        to: userEmail,
        subject: `Order Confirmed - SAI RAM Store`,
        htmlContent: customerHtml
      });
    } catch (notifyErr) {
      console.error("Notification failed (continuing anyway):", notifyErr)
    }

    res.json({ success: true, orderId: docRef.id })
  } catch (err) {
    console.error("Order placement error:", err)
    res.status(500).json({ success: false, error: err.message })
  }
})

const razorpay = new Razorpay({
  key_id: (process.env.RAZORPAY_KEY_ID || "").trim(),
  key_secret: (process.env.RAZORPAY_KEY_SECRET || "").trim(),
})

// Razorpay: Create Order
app.post("/api/payment/order", async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body
    
    if (!amount || !currency) {
      return res.status(400).json({ error: "Amount and currency are required" })
    }

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt,
    }

    const order = await razorpay.orders.create(options)
    res.json(order)
  } catch (err) {
    console.error("Razorpay Order Creation Error:", err)
    res.status(500).json({ 
      error: "Order creation failed", 
      details: err.message
    })
  }
})

// Razorpay: Verify Signature
app.post("/api/payment/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
  const secret = (process.env.RAZORPAY_KEY_SECRET || "").trim()
  const body = razorpay_order_id + "|" + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body.toString())
    .digest("hex")

  if (expectedSignature === razorpay_signature) {
    res.json({ success: true, message: "Payment verified" })
  } else {
    res.status(400).json({ success: false, message: "Invalid signature" })
  }
})

// Admin Notification
app.post("/api/admin/notify-order", async (req, res) => {
  try {
    const orderData = req.body
    const itemsHtml = orderData.orderItems.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString()}</td>
      </tr>
    `).join('');

    // 1. Email to Admin
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #333;">
        <h2 style="color: #10b981; text-align: center;">New Order Received!</h2>
        <p>Hi Admin,</p>
        <p>A new order has been placed by <strong>${orderData.userName}</strong>. Please review it on your dashboard.</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> #${orderData.orderId || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${orderData.userName} (${orderData.userEmail})</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${orderData.phone}</p>
          <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 15px 10px; font-weight: bold; text-align: right;">Total Amount:</td>
              <td style="padding: 15px 10px; font-weight: bold; text-align: right; color: #10b981; font-size: 18px;">₹${orderData.totalPrice.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin" style="background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">View on Dashboard</a>
        </div>
      </div>
    `;

    // 2. Email to Customer
    const customerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #10b981; margin: 0;">SAI RAM Store</h1>
          <p style="color: #64748b; margin: 5px 0;">Thank you for your order!</p>
        </div>
        
        <p>Hi ${orderData.userName},</p>
        <p>Your order has been successfully placed. We are currently processing it and will notify you once it's on its way.</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> #${orderData.orderId || 'Confirmed'}</p>
          <p style="margin: 5px 0;"><strong>Order Status:</strong> Confirmed</p>
          <p style="margin: 5px 0;"><strong>Payment:</strong> ${orderData.paymentMethod}</p>
          <p style="margin: 5px 0;"><strong>Delivery to:</strong> ${orderData.shippingAddress.address}, ${orderData.shippingAddress.city}</p>
        </div>

        <h4 style="border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Order Summary</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 15px 10px; font-weight: bold; text-align: right;">Total Paid:</td>
              <td style="padding: 15px 10px; font-weight: bold; text-align: right; color: #10b981;">₹${orderData.totalPrice.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <p style="margin-top: 30px; font-size: 14px; color: #64748b; text-align: center;">
          If you have any questions, please reply to this email or visit our <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile" style="color: #10b981; text-decoration: none;">Help Center</a>.
        </p>
      </div>
    `;

    // Send to Admin
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: `New Order Received: #${orderData.orderId || 'New'}`,
      htmlContent: adminHtml
    });

    // Send to Customer
    await sendEmail({
      to: orderData.userEmail,
      subject: `Order Confirmed - SAI RAM Store`,
      htmlContent: customerHtml
    });

    res.json({ success: true, message: "Emails sent to admin and customer" })
  } catch (err) {
    console.error("Admin notification error:", err)
    res.status(500).json({ error: "Notification failed" })
  }
})

module.exports = app
