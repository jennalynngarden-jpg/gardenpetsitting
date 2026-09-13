# Contact form setup (Google Sheet + email notification)

Every message sent through the website lands as a new row in a Google Sheet, and Georgia gets an email each time. This takes about ten minutes and costs nothing.

## 1. Create the Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet. Name it something like **Garden Pet Sitting — Inquiries**.
2. In row 1, type these headers in columns A to G: `Date`, `Name`, `Email`, `Phone`, `Service`, `Message`, `Page`.
3. Share the sheet with Georgia (Share button → her email → Editor).

## 2. Add the script

1. In the sheet, open **Extensions → Apps Script**.
2. Delete whatever is in the editor and paste in the script below.
3. Change `NOTIFY_EMAIL` to Georgia's email address.
4. Click the save icon.

```javascript
// Receives the website's contact form, saves it to this sheet, and emails Georgia.
const NOTIFY_EMAIL = 'georgia@example.com';   // <- change this
const SUBJECT = 'New message from the Garden Pet Sitting website';

function doPost(e) {
  const p = e.parameter;
  if (p.website) return ok();                 // honeypot filled in = a bot; ignore silently

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.appendRow([new Date(), p.name || '', p.email || '', p.phone || '', p.service || '', p.message || '', p.page || '']);

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: p.email || NOTIFY_EMAIL,
    subject: SUBJECT + (p.name ? ' from ' + p.name : ''),
    body:
      'Name: ' + (p.name || '') + '\n' +
      'Email: ' + (p.email || '') + '\n' +
      'Phone: ' + (p.phone || 'not given') + '\n' +
      'Service: ' + (p.service || 'not chosen') + '\n\n' +
      (p.message || '') + '\n\n' +
      '— Sent from the website contact form. Reply to this email to answer them.'
  });
  return ok();
}

function ok() {
  return ContentService.createTextOutput('ok');
}
```

## 3. Publish it

1. Click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**. (This lets the website send to it. The script only ever appends rows and sends email, so nothing sensitive is exposed.)
4. Click **Deploy**, approve the permissions prompt (Google will warn that the app isn't verified — that's normal for your own scripts; click Advanced → Go to project), and copy the **Web app URL**.

## 4. Connect the website

Open `js/main.js` and paste the URL between the quotes:

```javascript
const FORM_ENDPOINT = 'https://script.google.com/macros/s/.../exec';
```

Commit and push. Submit a test message from the live site: a row should appear in the sheet and Georgia should get an email within a minute.

## Notes

- Emails are sent from the Google account that owns the script (whoever created the sheet). If you'd rather they come from Georgia's own account, have her create the sheet and do steps 2 and 3 while signed in as herself.
- The hidden "website" field in the form is a spam trap. Real people never see it; bots fill it in and get ignored.
- If you ever change the script, use **Deploy → Manage deployments → Edit → New version** so the same URL keeps working.
