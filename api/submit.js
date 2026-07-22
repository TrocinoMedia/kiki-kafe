const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const TO = 'tony@trocino.media';

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
  } else {
    subject = 'New Form Submission — Kiki Kafe';
    html = genericEmail(d);
  }

  try {
    await resend.emails.send({
      from: `Kiki Kafe <${FROM}>`,
      to: TO,
      reply_to: d['Email'] || undefined,
      subject,
      html,
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

function wrap(badge, content) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#f0ede8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#111}
    .outer{padding:32px 16px}
    .card{max-width:580px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.08)}
    .hd{background:#0a0a0a;padding:36px 40px;text-align:center}
    .hd-name{font-size:20px;font-weight:400;letter-spacing:.26em;text-transform:uppercase;color:#fff}
    .hd-badge{display:inline-block;margin-top:10px;font-size:10px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:#4d8145}
    .body{padding:40px}
    .section{margin-bottom:32px}
    .section-label{font-size:9px;font-weight:700;letter-spacing:.38em;text-transform:uppercase;color:#4d8145;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #f0ede8}
    .row{display:flex;gap:24px;margin-bottom:16px}
    .field{margin-bottom:16px}
    .field.half{flex:1;margin-bottom:0}
    .fl{font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#999;margin-bottom:4px}
    .fv{font-size:14px;color:#111;line-height:1.55}
    .fv.large{font-size:16px;font-weight:500}
    .fv.pre{white-space:pre-wrap}
    .ft{background:#0a0a0a;padding:24px 40px;text-align:center}
    .ft p{font-size:11px;color:rgba(255,255,255,.3);line-height:1.7}
  </style></head><body><div class="outer"><div class="card">
    <div class="hd"><div class="hd-name">Kiki Kafe</div><div class="hd-badge">${badge}</div></div>
    <div class="body">${content}</div>
    <div class="ft"><p>Kiki Kafe &middot; The Mall at Partridge Creek<br>17370 Hall Rd Ste 107, Clinton Township, MI 48038</p></div>
  </div></div></body></html>`;
}

function section(label, fields) {
  const rows = fields.map(f => {
    if (Array.isArray(f)) {
      const halves = f.map(h => `<div class="field half"><div class="fl">${h[0]}</div><div class="fv${h[2] ? ' ' + h[2] : ''}">${h[1] || '—'}</div></div>`).join('');
      return `<div class="row">${halves}</div>`;
    }
    return `<div class="field"><div class="fl">${f[0]}</div><div class="fv${f[2] ? ' ' + f[2] : ''}">${f[1] || '—'}</div></div>`;
  }).join('');
  return `<div class="section"><div class="section-label">${label}</div>${rows}</div>`;
}

function val(d, key) {
  return (d[key] || '').toString().trim();
}

// ─── Kart email ───────────────────────────────────────────────────────────────

function kartEmail(d) {
  const content = [
    section('Contact', [
      [['First Name', val(d,'First Name'), 'large'], ['Last Name', val(d,'Last Name'), 'large']],
      [['Email', val(d,'Email')], ['Phone', val(d,'Phone')]],
    ]),
    section('Event Details', [
      [['Event Type', val(d,'Event Type')], ['Guest Count', val(d,'Guest Count')]],
      [['Event Date', val(d,'Event Date')], ['Start Time', val(d,'Start Time')]],
      ['Duration', val(d,'Duration')],
    ]),
    section('Venue', [
      ['Venue Name', val(d,'Venue Name')],
      [['City', val(d,'Venue City')], ['State', val(d,'Venue State')]],
      [['Indoor / Outdoor', val(d,'Indoor/Outdoor')], ['Power Available', val(d,'Power Available')]],
    ]),
    section('Additional', [
      ['How did you hear about us?', val(d,'How Heard')],
      ['Special Requests', val(d,'Special Requests')],
      ['Notes', val(d,'Notes'), 'pre'],
    ]),
  ].join('');
  return wrap('New Booking Inquiry', content);
}

// ─── Franchise email ──────────────────────────────────────────────────────────

function franchiseEmail(d) {
  const content = [
    section('Contact', [
      [['First Name', val(d,'First Name'), 'large'], ['Last Name', val(d,'Last Name'), 'large']],
      [['Email', val(d,'Email')], ['Phone', val(d,'Phone')]],
      [['City', val(d,'City')], ['State', val(d,'State')]],
    ]),
    section('Franchise Details', [
      ['Target Market', val(d,'Target Market')],
      [['Timeline', val(d,'Timeline')], ['Liquid Capital', val(d,'Liquid Capital')]],
      ['Business Experience', val(d,'Business Experience'), 'pre'],
      ['F&B Experience', val(d,'F&B Experience'), 'pre'],
    ]),
    section('Their Message', [
      ['Why Kiki Kafe?', val(d,'Why Kiki Kafe'), 'pre'],
      ['Questions', val(d,'Questions'), 'pre'],
    ]),
  ].join('');
  return wrap('New Franchise Inquiry', content);
}

// ─── Apply email ──────────────────────────────────────────────────────────────

function applyEmail(d) {
  const content = [
    section('Applicant', [
      [['First Name', val(d,'First Name'), 'large'], ['Last Name', val(d,'Last Name'), 'large']],
      [['Email', val(d,'Email')], ['Phone', val(d,'Phone')]],
      [['Age Eligible (18+)', val(d,'Age Eligible')], ['Available Start Date', val(d,'Start Date')]],
    ]),
    section('Experience', [
      ['Coffee / Barista Experience', val(d,'Coffee Experience'), 'pre'],
      ['Work History', val(d,'Work History'), 'pre'],
    ]),
    section('Their Message', [
      ['Why Kiki Kafe?', val(d,'Why Kiki Kafe'), 'pre'],
    ]),
    val(d,'Resume Link') ? section('Resume', [['Resume Link', `<a href="${val(d,'Resume Link')}" style="color:#4d8145">${val(d,'Resume Link')}</a>`]]) : '',
  ].join('');
  return wrap('New Job Application', content);
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function genericEmail(d) {
  const rows = Object.entries(d)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, v]) => `<div class="field"><div class="fl">${k}</div><div class="fv">${v || '—'}</div></div>`)
    .join('');
  return wrap('New Form Submission', `<div class="section">${rows}</div>`);
}
