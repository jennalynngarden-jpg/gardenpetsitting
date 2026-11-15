// Garden Pet Sitting — contact form script
// Receives the website's contact form, saves it to this sheet, and emails Georgia.
var NOTIFY_EMAIL = 'Georgiamariegarden@gmail.com';
var SUBJECT = 'New message from the Garden Pet Sitting website';
var LOGO = 'https://gardenpetsitting.info/images/logo.png';

function doPost(e) {
  var p = e.parameter;
  if (p.website) return ok();                 // honeypot filled in = a bot; ignore silently

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.appendRow([new Date(), p.name || '', p.email || '', p.phone || '', p.service || '', p.message || '', p.page || '']);

  notify(p);
  return ok();
}

// The email Georgia gets. Plain-text version for old mail apps, HTML version for everything else.
function notify(p) {
  var name = (p.name || 'Someone').trim();
  var service = (p.service || '').trim();
  var phone = (p.phone || '').trim();
  var email = (p.email || '').trim();
  var message = (p.message || '').trim();

  // Headline: depends on which service they picked (see the edge-case table in Figma)
  var headline;
  if (service === 'In-home visits') headline = name + ' is asking about in-home visits';
  else if (service === 'Dog daycare') headline = name + ' is asking about dog daycare';
  else if (service === 'Foster dog inquiry') headline = name + ' is asking about a foster dog';
  else if (service === 'Not sure yet') headline = name + ' is asking about pet care';
  else headline = name + ' sent a message';

  var digits = phone.replace(/[^0-9+]/g, '');
  var firstName = name.split(' ')[0];

  var text =
    headline + '\n\n' +
    'Service: ' + (service || 'Not chosen') + '\n' +
    'Email: ' + (email || 'Not given') + '\n' +
    'Phone: ' + (phone || 'Not given') + '\n\n' +
    message + '\n\n' +
    (digits ? 'Text ' + firstName + ': ' + phone + '\n' : '') +
    (email ? 'Or reply to this email to answer by email.' : '');

  var row = function (k, v) {
    return '<tr><td style="padding:6px 0;color:#5E4732;font-weight:bold;width:90px;vertical-align:top;font-family:Helvetica,Arial,sans-serif;font-size:15px">' + k + '</td>' +
           '<td style="padding:6px 0;color:#1E1A16;font-family:Helvetica,Arial,sans-serif;font-size:15px;word-break:break-word">' + v + '</td></tr>';
  };
  var button = digits
    ? '<a href="sms:' + digits + '" style="display:inline-block;background:#D9952B;color:#1E1A16;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 24px;border-radius:999px;font-family:Helvetica,Arial,sans-serif">Text ' + esc(firstName) + '</a>' +
      (email ? '<div style="margin-top:10px"><a href="mailto:' + esc(email) + '" style="color:#B37A1E;font-weight:bold;font-size:14px;text-decoration:none;font-family:Helvetica,Arial,sans-serif">or reply by email</a></div>' : '')
    : '<a href="mailto:' + esc(email) + '" style="display:inline-block;background:#D9952B;color:#1E1A16;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 24px;border-radius:999px;font-family:Helvetica,Arial,sans-serif">Reply by email</a>';

  var html =
    '<div style="margin:0;padding:24px 12px;background:#F9F2E7;font-family:Helvetica,Arial,sans-serif">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden">' +
    '<tr><td style="padding:20px 24px">' +
      '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
      '<td style="vertical-align:middle;padding-right:12px"><img src="' + LOGO + '" width="44" height="44" alt="" style="display:block;border-radius:8px"></td>' +
      '<td style="vertical-align:middle;font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#1E1A16">Garden Pet Sitting</td>' +
      '</tr></table>' +
    '</td></tr>' +
    '<tr><td style="height:4px;background:#D9952B;font-size:0;line-height:0">&nbsp;</td></tr>' +
    '<tr><td style="padding:24px 24px 28px">' +
      '<div style="font-size:12px;letter-spacing:1px;color:#8A6B4F;font-weight:bold">NEW INQUIRY</div>' +
      '<h1 style="font-family:Georgia,serif;font-size:24px;line-height:30px;margin:8px 0 16px;color:#1E1A16;font-weight:bold">' + esc(headline).replace('in-home', 'in&#8209;home') + '</h1>' +
      '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#FDFBF6;border:1px solid #F0E4D0;border-radius:12px;padding:10px 16px;margin:0 0 20px">' +
        row('Service', esc(service || 'Not chosen')) +
        row('Email', email ? '<a href="mailto:' + esc(email) + '" style="color:#1E1A16;text-decoration:none">' + esc(email) + '</a>' : 'Not given') +
        row('Phone', phone ? '<a href="tel:' + digits + '" style="color:#1E1A16;text-decoration:none">' + esc(phone) + '</a>' : 'Not given') +
      '</table>' +
      '<div style="font-weight:bold;color:#5E4732;font-size:15px;margin-bottom:6px">Message</div>' +
      '<p style="margin:0 0 24px;font-size:16px;line-height:25px;color:#2E2925;white-space:pre-line">' + esc(message) + '</p>' +
      button +
    '</td></tr>' +
    '</table></div>';

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: email || NOTIFY_EMAIL,
    subject: SUBJECT + (p.name ? ' from ' + name : ''),
    body: text,
    htmlBody: html
  });
}

function ok() { return ContentService.createTextOutput('ok'); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
