# Contact form setup (Google Sheet + email notification)

Every message sent through the website lands as a new row in a Google Sheet, and Georgia gets an email each time. This takes about ten minutes and costs nothing.

## 1. Create the Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet. Name it something like **Garden Pet Sitting — Inquiries**.
2. In row 1, type these headers in columns A to G: `Date`, `Name`, `Email`, `Phone`, `Service`, `Message`, `Source page`.
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

## Getting a phone buzz for new inquiries (Gmail filter)

Georgia's email is busy, so make new website messages stand out and buzz her phone
like a text. This is done inside her Gmail account, on a computer first, then on her phone.

### Part 1: label the emails (on a computer)

1. Open gmail.com and sign in as Georgia.
2. Click the search box at the top, then the sliders icon on its right to open the advanced search.
3. In the "Subject" field type: `Garden Pet Sitting website`
4. Click "Create filter" at the bottom.
5. Tick these boxes:
   - Star it
   - Apply the label: choose "New label" and name it `Pet sitting inquiries`
   - Always mark it as important
   - Never send it to Spam
6. Click "Create filter".

### Part 2: make her phone buzz only for that label (Gmail app on iPhone)

1. Open the Gmail app, tap the menu (three lines), scroll down and tap Settings.
2. Tap her email address, then "Email notifications".
3. Choose "Label settings" (or "Manage labels" on some versions).
4. Tap "Pet sitting inquiries" and turn on "Notify for every message" or "Sync messages: last 30 days" then enable notifications.
5. Optional: set "Email notifications" for the inbox overall to "None" or "High priority only"
   so only the pet-sitting label makes noise.

Android is the same idea: Settings > her address > Manage notifications > Manage labels.

Tip: send a test from the website afterwards and confirm the phone buzzes.
