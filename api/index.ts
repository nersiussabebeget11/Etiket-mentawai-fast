import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Mentawai Fast API is running" });
});

app.post("/api/tickets/send", async (req, res) => {
  const { booking, schedule, ship } = req.body;

  if (!booking || !booking.passengerEmail) {
    return res.status(400).json({ error: "Booking information and email are required" });
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return res.json({ 
      success: true, 
      message: "Email logged (RESEND_API_KEY missing)",
      simulated: true 
    });
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: booking.passengerEmail,
      subject: `E-Tiket Mentawai Fast - ${booking.id.slice(0, 8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">Mentawai Fast</h1>
            <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8; letter-spacing: 0.1em;">KONFIRMASI E-TIKET</p>
          </div>
          <div style="padding: 32px; background-color: white;">
            <p>Halo <strong>${booking.passengerName}</strong>,</p>
            <p>Terima kasih telah melakukan pembayaran. Berikut adalah detail tiket perjalanan Anda:</p>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-size: 10px; color: #64748b; text-transform: uppercase;">Kode Booking</td>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: bold; text-align: right;">MF-${booking.id.slice(0, 8).toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 10px; color: #64748b; text-transform: uppercase;">Kapal</td>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: bold; text-align: right;">${ship?.name || 'Kapal Cepat'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 10px; color: #64748b; text-transform: uppercase;">Rute</td>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: bold; text-align: right;">${schedule?.origin} → ${schedule?.destination}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 10px; color: #64748b; text-transform: uppercase;">Tanggal</td>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: bold; text-align: right;">${schedule?.date} (${schedule?.time})</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin-top: 32px;">
              <p style="font-size: 12px; color: #64748b;">Silakan tunjukkan email ini atau download tiket melalui aplikasi saat check-in.</p>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 10px; color: #94a3b8;">
            © ${new Date().getFullYear()} Mentawai Fast. Pesan tiket lebih mudah di genggaman Anda.
          </div>
        </div>
      `,
    });

    if (error) return res.status(400).json({ error: "Failed to send email", details: error });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/payment/simulate", (req, res) => {
  const { bookingId, amount } = req.body;
  res.json({ status: "success", transactionId: "TXN-VERCEL", message: "Payment confirmed" });
});

export default app;
