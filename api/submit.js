const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const TO = 'mgmt@kikikafe.net';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const d = req.body;
  if (!d) return res.status(400).json({ error: 'No data' });

  const form = d._form;
  let subject, html;

  if (form === 'book-kart') {
    subject = `Kiki Kart Inquiry — ${d['First Name'] || ''} ${d['Last Name'] || ''}`.trim();
    html = kartEmail(d);
  } else if (form === 'franchise') {
    subject = `Franchise Inquiry — ${d['First Name'] || ''} ${d['Last Name'] || ''}`.trim();
    html = franchiseEmail(d);
  } else if (form === 'apply') {
    subject = `Job Application — ${d['First Name'] || ''} ${d['Last Name'] || ''}`.trim();
    html = applyEmail(d);
  } else if (form === 'contact') {
    subject = `${d['Subject'] || 'New Message'} — ${d['First Name'] || ''} ${d['Last Name'] || ''}`.trim();
    html = contactEmail(d);
  } else {
    subject = 'New Form Submission — Kiki Kafe';
    html = genericEmail(d);
  }

  const emailParams = {
    from: `Kiki Kafe <${FROM}>`,
    to: TO,
    reply_to: d['Email'] || undefined,
    subject,
    html,
  };

  if (form === 'apply' && d._resumeBase64 && d._resumeFilename) {
    emailParams.attachments = [{ filename: d._resumeFilename, content: d._resumeBase64 }];
  }

  try {
    const { data, error } = await resend.emails.send(emailParams);
    if (error) {
      console.error('Resend error:', JSON.stringify(error));
      return res.status(500).json({ error: 'Failed to send email' });
    }
    console.log('Resend success:', data?.id);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function v(d, key) {
  return (d[key] || '').toString().trim() || '—';
}

function field(label, value) {
  return `
    <tr>
      <td style="padding:0 0 18px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#999;margin-bottom:5px;">${label}</div>
        <div style="font-size:14px;color:#111;line-height:1.55;">${value}</div>
      </td>
    </tr>`;
}

function fieldPair(label1, value1, label2, value2) {
  return `
    <tr>
      <td style="padding:0 0 18px;vertical-align:top;width:50%;padding-right:16px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#999;margin-bottom:5px;">${label1}</div>
        <div style="font-size:14px;color:#111;line-height:1.55;">${value1}</div>
      </td>
      <td style="padding:0 0 18px;vertical-align:top;width:50%;">
        <div style="font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#999;margin-bottom:5px;">${label2}</div>
        <div style="font-size:14px;color:#111;line-height:1.55;">${value2}</div>
      </td>
    </tr>`;
}

function section(label, rows) {
  return `
    <tr>
      <td colspan="2" style="padding:0 0 6px;">
        <div style="font-size:9px;font-weight:700;letter-spacing:.38em;text-transform:uppercase;color:#4d8145;padding-bottom:10px;border-bottom:2px solid #f0ede8;margin-bottom:20px;">${label}</div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
        <div style="height:12px;"></div>
      </td>
    </tr>`;
}

function wrap(badge, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0ede8;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background:#fff;border-radius:4px;overflow:hidden;">

      <!-- Header -->
      <tr>
        <td align="center" style="background:#0a0a0a;padding:36px 40px;">
          <div style="font-size:20px;font-weight:400;letter-spacing:.26em;text-transform:uppercase;color:#fff;">Kiki Kafe</div>
          <div style="display:inline-block;margin-top:10px;font-size:10px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:#4d8145;">${badge}</div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${content}
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td align="center" style="background:#0a0a0a;padding:24px 40px;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,.3);line-height:1.7;">
            Kiki Kafe &middot; The Mall at Partridge Creek<br>
            17370 Hall Rd Ste 107, Clinton Township, MI 48038
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── Kart email ───────────────────────────────────────────────────────────────

function kartEmail(d) {
  return wrap('New Booking Inquiry',
    section('Contact',
      fieldPair('First Name', v(d,'First Name'), 'Last Name', v(d,'Last Name')) +
      fieldPair('Email', v(d,'Email'), 'Phone', v(d,'Phone'))
    ) +
    section('Event Details',
      fieldPair('Event Type', v(d,'Event Type'), 'Guest Count', v(d,'Guest Count')) +
      fieldPair('Event Date', v(d,'Event Date'), 'Start Time', v(d,'Start Time')) +
      field('Duration', v(d,'Duration'))
    ) +
    section('Venue',
      field('Venue Name', v(d,'Venue Name')) +
      fieldPair('City', v(d,'Venue City'), 'State', v(d,'Venue State')) +
      fieldPair('Indoor / Outdoor', v(d,'Indoor/Outdoor'), 'Power Available', v(d,'Power Available'))
    ) +
    section('Additional',
      field('How did you hear about us?', v(d,'How Heard')) +
      field('Special Requests', v(d,'Special Requests')) +
      field('Notes', v(d,'Notes'))
    )
  );
}

// ─── Franchise email ──────────────────────────────────────────────────────────

function franchiseEmail(d) {
  return wrap('New Franchise Inquiry',
    section('Contact',
      fieldPair('First Name', v(d,'First Name'), 'Last Name', v(d,'Last Name')) +
      fieldPair('Email', v(d,'Email'), 'Phone', v(d,'Phone')) +
      fieldPair('City', v(d,'City'), 'State', v(d,'State'))
    ) +
    section('Franchise Details',
      field('Target Market', v(d,'Target Market')) +
      fieldPair('Timeline', v(d,'Timeline'), 'Liquid Capital', v(d,'Liquid Capital')) +
      field('Business Experience', v(d,'Business Experience')) +
      field('F&B Experience', v(d,'F&B Experience'))
    ) +
    section('Their Message',
      field('Why Kiki Kafe?', v(d,'Why Kiki Kafe')) +
      field('Questions', v(d,'Questions'))
    )
  );
}

// ─── Apply email ──────────────────────────────────────────────────────────────

function applyEmail(d) {
  const resumeRow = d._resumeFilename
    ? field('Resume', `Attached: ${d._resumeFilename}`)
    : '';
  return wrap('New Job Application',
    section('Applicant',
      fieldPair('First Name', v(d,'First Name'), 'Last Name', v(d,'Last Name')) +
      fieldPair('Email', v(d,'Email'), 'Phone', v(d,'Phone')) +
      fieldPair('Age Eligible (18+)', v(d,'Age Eligible'), 'Available Start Date', v(d,'Start Date'))
    ) +
    section('Experience',
      field('Coffee / Barista Experience', v(d,'Coffee Experience')) +
      field('Work History', v(d,'Work History'))
    ) +
    section('Their Message',
      field('Why Kiki Kafe?', v(d,'Why Kiki Kafe')) +
      resumeRow
    )
  );
}

// ─── Contact email ────────────────────────────────────────────────────────────

function contactEmail(d) {
  return wrap('New Message',
    section('From',
      fieldPair('First Name', v(d,'First Name'), 'Last Name', v(d,'Last Name')) +
      field('Email', v(d,'Email'))
    ) +
    section('Message',
      field('Subject', v(d,'Subject')) +
      field('Message', v(d,'Message'))
    )
  );
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function genericEmail(d) {
  const rows = Object.entries(d)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, val]) => field(k, val || '—'))
    .join('');
  return wrap('New Form Submission',
    section('Submission', rows)
  );
}
