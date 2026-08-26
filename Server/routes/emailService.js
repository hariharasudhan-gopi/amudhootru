const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendInvoiceEmail(order) {

  const productRows = order.products.map(product => `
    <tr>
      <td style="padding:10px; border-bottom:1px solid #ddd;">
        ${product.name}
      </td>
      <td style="padding:10px; border-bottom:1px solid #ddd; text-align:center;">
        ${product.quantity}
      </td>
      <td style="padding:10px; border-bottom:1px solid #ddd; text-align:right;">
        ₹${product.price}
      </td>
      <td style="padding:10px; border-bottom:1px solid #ddd; text-align:right;">
        ₹${product.quantity * product.price}
      </td>
    </tr>
  `).join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width:700px; margin:auto;">

      <h2 style="color:#333;">
        ${"Amudhootru"}
      </h2>

      <p>Dear ${order.customerName},</p>

      <p>
        Thank you for your order with Amudhootru.
        Your order has been successfully processed.
      </p>

      <div style="
        background:#f5f5f5;
        padding:15px;
        margin:20px 0;
      ">
        <p><strong>Invoice Number:</strong> ${order.invoiceNumber}</p>
        <p><strong>Order Date:</strong> ${order.orderDate}</p>
        <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
      </div>

      <h3>Order Details</h3>

      <table style="
        width:100%;
        border-collapse:collapse;
      ">

        <thead>
          <tr style="background:#f2f2f2;">
            <th style="padding:10px; text-align:left;">Product</th>
            <th style="padding:10px;">Quantity</th>
            <th style="padding:10px; text-align:right;">Unit Price</th>
            <th style="padding:10px; text-align:right;">Total</th>
          </tr>
        </thead>

        <tbody>
          ${productRows}
        </tbody>

      </table>

      <div style="
        margin-top:20px;
        text-align:right;
      ">
        <p>Subtotal: ₹${order.subtotal}</p>
        <p>Tax: ₹${order.tax}</p>
        <p>Shipping: ₹${order.shipping}</p>

        <h3>
          Grand Total: ₹${order.grandTotal}
        </h3>
      </div>

      <p>
        Please find the invoice attached to this email
        for your reference.
      </p>

      <p>
        If you have any questions regarding your order,
        please contact us at ${order.supportEmail}.
      </p>

      <p>
        Thank you for choosing Amudhootru.
      </p>

      <p>
        Best regards,<br>
        Amudhootru
      </p>

    </div>
  `;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: order.customerEmail,
    subject: `Invoice for Your Order #${order.invoiceNumber}`,
    html: html
  };

  return await transporter.sendMail(mailOptions);
}

async function sendDeliveryEmail({ customerName, customerEmail, invoiceNumber, supportEmail }) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#333;">
      <div style="background:linear-gradient(160deg,#185e87 0%,#1d8ab5 100%);padding:32px 28px;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:1.5rem;">Amudhootru</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Your order has been delivered!</p>
      </div>
      <div style="background:#f9fdff;padding:28px;border:1px solid #d4edf7;border-top:none;border-radius:0 0 12px 12px;">
        <p>Dear <strong>${customerName}</strong>,</p>
        <p>Great news! Your order <strong>#${invoiceNumber}</strong> has been successfully delivered. We hope everything arrived in perfect condition.</p>
        <div style="background:#e8f5fb;border-left:4px solid #185e87;padding:14px 18px;border-radius:6px;margin:20px 0;">
          <p style="margin:0;"><strong>Order:</strong> ${invoiceNumber}</p>
          <p style="margin:6px 0 0;"><strong>Status:</strong> <span style="color:#1a7a4a;font-weight:700;">Delivered ✓</span></p>
        </div>
        <p>We'd love to have you back! Explore our latest collection and enjoy fresh, quality products delivered right to your doorstep.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="https://amudhootru.com" style="background:#185e87;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.95rem;">Shop Again</a>
        </div>
        <p>If you have any concerns about your delivery, please reach out to us at <a href="mailto:${supportEmail}" style="color:#185e87;">${supportEmail}</a>.</p>
        <p style="margin-top:24px;">Warm regards,<br><strong>The Amudhootru Team</strong></p>
      </div>
    </div>
  `;

  return await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: customerEmail,
    subject: `Your order #${invoiceNumber} has been delivered 🎉`,
    html
  });
}

module.exports = {
  sendInvoiceEmail,
  sendDeliveryEmail
};
