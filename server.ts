import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Mentawai Fast API is running" });
  });

  // Ticket Sending Endpoint
  app.post("/api/tickets/send", async (req, res) => {
    const { booking, schedule, ship } = req.body;

    if (!booking || !booking.passengerEmail) {
      return res.status(400).json({ error: "Booking information and email are required" });
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    // Log the action for debugging/visibility in the console
    console.log(`[TICKET SYSTEM] Preparing to send ticket for booking ${booking.id} to ${booking.passengerEmail}`);

    if (!resendApiKey) {
      console.warn("[TICKET SYSTEM] RESEND_API_KEY is missing. Email skipped but logged.");
      return res.json({ 
        success: true, 
        message: "Email logged to console (RESEND_API_KEY missing)",
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
                <div style="background-color: #3b82f6; color: white; display: inline-block; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; margin-top: 16px;">
                  Selamat Perjalanan!
                </div>
              </div>
            </div>
            <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 10px; color: #94a3b8;">
              © ${new Date().getFullYear()} Mentawai Fast. Pesan tiket lebih mudah di genggaman Anda.
            </div>
          </div>
        `,
      });

      if (error) {
        // Log validation errors more gracefully to avoid confusion
        if (error.name === 'validation_error') {
          console.warn(`[TICKET SYSTEM] RESEND INFO: Ticket could not be sent to ${booking.passengerEmail} because it's not the Resend account email (restriction of onboarding@resend.dev).`);
          return res.json({ 
            success: true, 
            message: "Email simulated (Resend restriction)",
            resendNote: "To send to any email, you must verify your domain in Resend dashboard."
          });
        }

        console.error("[TICKET SYSTEM] Resend error:", error);
        return res.status(400).json({ error: "Failed to send email", details: error });
      }

      console.log(`[TICKET SYSTEM] Email sent successfully to ${booking.passengerEmail}`);
      return res.json({ success: true, data });
    } catch (err) {
      console.error("[TICKET SYSTEM] Internal error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Simulated Payment Endpoint
  // In a real app, this would be a webhook from Midtrans or Stripe
  app.post("/api/payment/simulate", (req, res) => {
    const { bookingId, amount } = req.body;
    
    if (!bookingId || !amount) {
      return res.status(400).json({ error: "Missing bookingId or amount" });
    }

    console.log(`Simulating payment for booking ${bookingId} of amount ${amount}`);
    
    // In reality, you'd verify the booking exists and update Firestore here if using Admin SDK.
    // Since we're using Client SDK for simplicity in the frontend, we'll just return success.
    // The client will handle the "auto-confirmation" logic by listening to Firestore 
    // or we could use Admin SDK if we had it set up. 
    // For this applet, I'll simulate the "automatic" part by returning a success signal.
    
    setTimeout(() => {
      res.json({ 
        status: "success", 
        transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        message: "Payment confirmed automatically" 
      });
    }, 1500);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  return app;
}

const appPromise = startServer();
export default appPromise;
