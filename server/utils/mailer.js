// Lightweight mailer that gracefully no-ops when SMTP isn't configured.
// Inquiries are still saved to the DB — email is a best-effort notification.

let transporterPromise = null;

async function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  if (!transporterPromise) {
    transporterPromise = import('nodemailer').then(({ default: nodemailer }) =>
      nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    );
  }
  return transporterPromise;
}

function renderItemsHtml(items = []) {
  if (!items.length) return '<p><em>No specific items — open inquiry.</em></p>';
  const rows = items
    .map(
      (i) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">
        ${i.image ? `<img src="${i.image}" alt="" style="height:60px;width:60px;object-fit:cover;border-radius:6px;">` : ''}
      </td>
      <td style="padding:8px;border-bottom:1px solid #eee;">
        <strong>${escapeHtml(i.title || '')}</strong><br/>
        <span style="color:#666;font-size:13px;">${escapeHtml(i.category || '')}</span>
        ${i.note ? `<div style="color:#444;font-size:13px;margin-top:4px;">“${escapeHtml(i.note)}”</div>` : ''}
      </td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">
        Qty: ${Number(i.quantity) || 1}<br/>
        ${i.price ? `₹${i.price}` : ''}
      </td>
    </tr>`
    )
    .join('');
  return `<table style="width:100%;border-collapse:collapse;margin-top:12px;">${rows}</table>`;
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendInquiryEmail(inquiry) {
  const transporter = await getTransporter();
  const to = process.env.DESIGNER_EMAIL;
  if (!transporter || !to) {
    console.log('[mailer] skipped — SMTP or DESIGNER_EMAIL not configured. Inquiry saved to DB.');
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const html = `
    <div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;color:#1f1a17;">
      <h2 style="color:#c3592b;margin-bottom:4px;">New Inquiry — अर्थ Mala</h2>
      <p style="color:#666;margin-top:0;">${new Date(inquiry.createdAt).toLocaleString('en-IN')}</p>

      <table style="margin-top:12px;">
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Name</td><td><strong>${escapeHtml(inquiry.name)}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Email</td><td>${escapeHtml(inquiry.email)}</td></tr>
        ${inquiry.phone ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">Phone</td><td>${escapeHtml(inquiry.phone)}</td></tr>` : ''}
        ${inquiry.whatsapp ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">WhatsApp</td><td>${escapeHtml(inquiry.whatsapp)}</td></tr>` : ''}
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Prefers</td><td>${escapeHtml(inquiry.preferredContact || 'any')}</td></tr>
        ${inquiry.budget ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">Budget</td><td>${escapeHtml(inquiry.budget)}</td></tr>` : ''}
        ${inquiry.timeline ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">Timeline</td><td>${escapeHtml(inquiry.timeline)}</td></tr>` : ''}
      </table>

      ${inquiry.message ? `<blockquote style="border-left:3px solid #c3592b;margin:16px 0;padding:8px 16px;color:#333;background:#faf6f0;">${escapeHtml(inquiry.message)}</blockquote>` : ''}

      <h3 style="margin-top:20px;">Interested items</h3>
      ${renderItemsHtml(inquiry.items)}

      <p style="margin-top:24px;color:#888;font-size:12px;">Reply to ${escapeHtml(inquiry.email)} to reach the customer directly.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    replyTo: inquiry.email,
    subject: `New inquiry from ${inquiry.name}${inquiry.items?.length ? ` — ${inquiry.items.length} item(s)` : ''}`,
    html,
  });
}

// Quote email — sent to the customer when the studio marks an inquiry "quoted".
export async function sendQuoteEmail(inquiry) {
  const transporter = await getTransporter();
  if (!transporter || !inquiry?.email) {
    console.log('[mailer] quote skipped — SMTP not configured or missing email.');
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const designerEmail = process.env.DESIGNER_EMAIL || from;
  const firstName = String(inquiry.name || '').trim().split(/\s+/)[0] || 'friend';

  const price = Number(inquiry.quotedPrice);
  const priceStr = Number.isFinite(price)
    ? '₹' + price.toLocaleString('en-IN')
    : '';

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1f1a17;background:#faf6f0;padding:32px 24px;">
      <div style="text-align:center;">
        <div style="font-size:32px;color:#c3592b;opacity:0.7;margin-bottom:4px;">❁</div>
        <h1 style="font-weight:300;font-size:26px;color:#c3592b;margin:0 0 4px 0;">
          <span style="font-weight:400;">अर्थ</span>
          <em style="font-size:18px;color:#c3592b;opacity:0.85;">Mala</em>
        </h1>
        <p style="font-style:italic;color:#6b655c;letter-spacing:2px;font-size:13px;margin:4px 0 0 0;">
          A proposal for you
        </p>
      </div>

      <hr style="border:none;border-top:1px solid rgba(195,89,43,0.2);margin:28px 0;" />

      <p style="font-size:16px;line-height:1.75;color:#3c3731;margin:0 0 16px 0;">
        Dear ${escapeHtml(firstName)},
      </p>

      <p style="font-size:16px;line-height:1.85;color:#3c3731;margin:0 0 20px 0;">
        Thank you for your patience. We've thought through your inquiry and prepared a proposal.
      </p>

      ${priceStr ? `
      <div style="text-align:center;margin:28px 0;padding:20px;background:#fff;border:1px solid rgba(195,89,43,0.2);border-radius:8px;">
        <p style="font-size:12px;color:#6b655c;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px 0;">Proposed total</p>
        <p style="font-size:32px;color:#c3592b;margin:0;font-weight:300;letter-spacing:-0.5px;">${escapeHtml(priceStr)}</p>
        <p style="font-size:12px;color:#9b8e7a;font-style:italic;margin:8px 0 0 0;">Made to order · ships in 7–14 days</p>
      </div>` : ''}

      ${inquiry.quotedMessage ? `
      <p style="font-size:14px;color:#6b655c;margin:24px 0 8px 0;font-style:italic;letter-spacing:3px;text-transform:uppercase;">A note from the studio</p>
      <blockquote style="border-left:3px solid #c3592b;margin:0 0 24px 0;padding:12px 18px;color:#3c3731;background:#fff;line-height:1.7;white-space:pre-wrap;">
${escapeHtml(inquiry.quotedMessage)}</blockquote>` : ''}

      ${inquiry.items?.length ? `
      <p style="font-size:14px;color:#6b655c;margin:24px 0 8px 0;font-style:italic;letter-spacing:3px;text-transform:uppercase;">The pieces</p>
      ${renderItemsHtml(inquiry.items)}
      ` : ''}

      <p style="font-size:15px;line-height:1.85;color:#3c3731;margin:28px 0 8px 0;">
        If this feels right to you, simply reply — we'll begin making your piece.
        If you'd like to adjust anything (size, palette, timeline),
        reply and tell us, and we'll send a revised proposal.
      </p>

      <p style="font-size:14px;color:#6b655c;margin:16px 0 0 0;font-style:italic;">
        Reach the studio any time at
        <a href="mailto:${escapeHtml(designerEmail)}" style="color:#c3592b;">${escapeHtml(designerEmail)}</a>.
      </p>

      <hr style="border:none;border-top:1px solid rgba(195,89,43,0.2);margin:28px 0 16px 0;" />
      <p style="text-align:center;color:#9b8e7a;font-size:12px;font-style:italic;letter-spacing:2px;margin:0;">
        <span style="color:#c3592b;">अर्थ</span>&nbsp;Mala · Handcrafted in India
      </p>
    </div>
  `;

  const text = [
    `Dear ${firstName},`,
    '',
    "Thank you for your patience. We've thought through your inquiry and prepared a proposal.",
    '',
    priceStr ? `Proposed total: ${priceStr}` : '',
    priceStr ? 'Made to order · ships in 7–14 days' : '',
    '',
    inquiry.quotedMessage ? `A note from the studio:\n${inquiry.quotedMessage}\n` : '',
    'If this feels right to you, simply reply — we will begin making your piece.',
    "If you'd like to adjust anything, reply and tell us and we'll send a revised proposal.",
    '',
    `Reach the studio any time at ${designerEmail}.`,
    '',
    '— अर्थ Mala · Handcrafted in India',
  ]
    .filter(Boolean)
    .join('\n');

  await transporter.sendMail({
    from,
    to: inquiry.email,
    replyTo: designerEmail,
    subject: `A proposal for your inquiry · अर्थ Mala`,
    html,
    text,
  });
}

// Customer-facing confirmation — warm, brief, matches the site voice.
export async function sendInquiryConfirmation(inquiry) {
  const transporter = await getTransporter();
  if (!transporter || !inquiry?.email) {
    console.log('[mailer] confirmation skipped — SMTP not configured or missing email.');
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const designerEmail = process.env.DESIGNER_EMAIL || from;
  const firstName = String(inquiry.name || '').trim().split(/\s+/)[0] || 'friend';

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1f1a17;background:#faf6f0;padding:32px 24px;">
      <div style="text-align:center;">
        <div style="font-size:40px;color:#c3592b;opacity:0.7;margin-bottom:4px;">❁</div>
        <h1 style="font-weight:300;font-size:28px;color:#c3592b;margin:0 0 4px 0;">
          <span style="font-weight:400;">अर्थ</span>
          <em style="font-size:20px;color:#c3592b;opacity:0.85;">Mala</em>
        </h1>
        <p style="font-style:italic;color:#6b655c;letter-spacing:2px;font-size:14px;margin:4px 0 0 0;">
          Art that Heals · Patterns that Speak
        </p>
      </div>

      <hr style="border:none;border-top:1px solid rgba(195,89,43,0.2);margin:28px 0;" />

      <p style="font-size:16px;line-height:1.75;color:#3c3731;margin:0 0 16px 0;">
        Dear ${escapeHtml(firstName)},
      </p>

      <p style="font-size:16px;line-height:1.85;color:#3c3731;margin:0 0 16px 0;">
        Your inquiry has arrived safely at our studio. Thank you for your patience — we read
        each message slowly, and we'll be in touch within 24 hours.
      </p>

      ${inquiry.message ? `
      <p style="font-size:14px;color:#6b655c;margin:24px 0 6px 0;font-style:italic;letter-spacing:3px;text-transform:uppercase;">Your message</p>
      <blockquote style="border-left:3px solid #c3592b;margin:0 0 24px 0;padding:10px 16px;color:#3c3731;background:#fff;font-style:italic;line-height:1.7;">
        ${escapeHtml(inquiry.message)}
      </blockquote>` : ''}

      ${inquiry.items?.length ? `
      <p style="font-size:14px;color:#6b655c;margin:24px 0 8px 0;font-style:italic;letter-spacing:3px;text-transform:uppercase;">Pieces you mentioned</p>
      ${renderItemsHtml(inquiry.items)}
      ` : ''}

      <p style="font-size:15px;line-height:1.8;color:#3c3731;margin:28px 0 8px 0;">
        A few words on what happens next —
      </p>
      <ol style="color:#3c3731;line-height:1.85;font-size:14px;padding-left:20px;margin:0 0 24px 0;">
        <li>An artisan reviews your inquiry and sketches a response.</li>
        <li>We reply with a proposal, timeline, and quote.</li>
        <li>Once you approve, your piece is made by hand — seven to fourteen days.</li>
        <li>It arrives at your door, wrapped in cotton with a handwritten note.</li>
      </ol>

      <p style="font-size:15px;line-height:1.8;color:#3c3731;margin:0 0 8px 0;">
        If something feels urgent, you can always reply to this email
        or reach us at
        <a href="mailto:${escapeHtml(designerEmail)}" style="color:#c3592b;">${escapeHtml(designerEmail)}</a>.
      </p>

      <hr style="border:none;border-top:1px solid rgba(195,89,43,0.2);margin:28px 0 16px 0;" />
      <p style="text-align:center;color:#9b8e7a;font-size:12px;font-style:italic;letter-spacing:2px;margin:0;">
        <span style="color:#c3592b;">अर्थ</span>&nbsp;Mala · Handcrafted in India
      </p>
    </div>
  `;

  const text = [
    `Dear ${firstName},`,
    '',
    'Your inquiry has arrived safely at our studio. Thank you for your patience —',
    "we read each message slowly, and we'll be in touch within 24 hours.",
    '',
    inquiry.message ? `Your message:\n${inquiry.message}\n` : '',
    'What happens next:',
    '  1. An artisan reviews your inquiry and sketches a response.',
    '  2. We reply with a proposal, timeline, and quote.',
    '  3. Once you approve, your piece is made by hand — seven to fourteen days.',
    '  4. It arrives at your door, wrapped in cotton with a handwritten note.',
    '',
    `If anything feels urgent, reply to this email or reach us at ${designerEmail}.`,
    '',
    '— अर्थ Mala · Handcrafted in India',
  ]
    .filter(Boolean)
    .join('\n');

  await transporter.sendMail({
    from,
    to: inquiry.email,
    replyTo: designerEmail,
    subject: `We received your inquiry · अर्थ Mala`,
    html,
    text,
  });
}
