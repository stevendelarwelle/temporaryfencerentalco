module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { name, company, phone, email, message } = req.body || {};

  if (!name || !phone)
    return res.status(400).json({ error: "Name and phone are required." });

  const siteName = process.env.SITE_NAME || "Temporary Fence Rental Co";
  const siteUrl  = process.env.SITE_URL  || "https://www.temporaryfencerentalco.com";
  const resendKey = process.env.RESEND_API_KEY;

  const OWNER = "stevendelarwelle@gmail.com";
  const FROM  = process.env.RESEND_FROM || `${siteName} Leads <onboarding@resend.dev>`;

  const submitted = new Date().toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const textBody = `
NEW LEAD — ${siteName}
${"─".repeat(40)}
Name:     ${name}
Company:  ${company  || "—"}
Phone:    ${phone}
Email:    ${email    || "—"}
Project:  ${message  || "—"}
${"─".repeat(40)}
Site:     ${siteUrl}
Time:     ${submitted} CT
`.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 24px; }
    .card { background: #ffffff; border-radius: 8px; max-width: 520px; margin: 0 auto; overflow: hidden; }
    .header { background: #1a3a5c; padding: 24px 32px; }
    .header h1 { color: #fff; font-size: 22px; margin: 0; }
    .header p  { color: rgba(255,255,255,.8); font-size: 14px; margin: 4px 0 0; }
    .body { padding: 28px 32px; }
    .row { display: flex; margin-bottom: 14px; border-bottom: 1px solid #f0f0f0; padding-bottom: 14px; }
    .row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #8a9db5; width: 90px; flex-shrink: 0; padding-top: 2px; }
    .value { font-size: 15px; color: #1a1a1a; }
    .footer { background: #f4f6f9; padding: 16px 32px; font-size: 12px; color: #8a9db5; }
    a { color: #1a3a5c; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🔔 New Lead — ${siteName}</h1>
      <p>${submitted} CT</p>
    </div>
    <div class="body">
      <div class="row"><span class="label">Name</span><span class="value">${name}</span></div>
      <div class="row"><span class="label">Company</span><span class="value">${company || "—"}</span></div>
      <div class="row"><span class="label">Phone</span><span class="value"><a href="tel:${phone.replace(/\D/g,"")}">${phone}</a></span></div>
      <div class="row"><span class="label">Email</span><span class="value">${email ? `<a href="mailto:${email}">${email}</a>` : "—"}</span></div>
      <div class="row"><span class="label">Project</span><span class="value">${message || "—"}</span></div>
    </div>
    <div class="footer">Submitted via <a href="${siteUrl}">${siteUrl}</a></div>
  </div>
</body>
</html>`;

  const subject = `🔔 New Lead — ${name} — ${siteName}`;

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: OWNER,
        subject,
        text: textBody,
        html: htmlBody,
      }),
    });
    if (!resp.ok) {
      console.error("Resend error:", resp.status, await resp.text());
      return res.status(500).json({ error: "Failed to send. Please call us directly." });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Mail error:", err.message);
    return res.status(500).json({ error: "Failed to send. Please call us directly." });
  }
};
