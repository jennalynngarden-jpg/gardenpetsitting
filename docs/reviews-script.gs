// Garden Pet Sitting — Reviews script
// Lives inside the "Garden Pet Sitting — Reviews" Google Sheet (Extensions > Apps Script).
//
// What it does:
//   1. doPost  — the website's review form sends a review here. Photos are saved to a
//                Drive folder, a row is added to the sheet with Posted unticked, and
//                Georgia gets an email so she can read it and decide whether to post it.
//   2. doGet   — the website asks here for the list of posted reviews (Posted ticked).
//   3. setup   — run once by hand: writes the column headers and turns the Posted
//                column into checkboxes.

var NOTIFY_EMAIL = 'Georgiamariegarden@gmail.com';
var SUBJECT = 'New review for the Garden Pet Sitting website';
var PHOTO_FOLDER_NAME = 'Garden Pet Sitting — Review photos';
var MAX_PHOTOS = 3;

var HEADERS = ['Date', 'Name', 'Email', 'Pet', 'Service', 'Rating', 'Review',
               'Photo 1', 'Photo 2', 'Photo 3', 'Posted', 'Notes'];

// ---------- one-time setup ----------
function setup() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(7, 420);                           // Review column wider
  getPhotoFolder();                                       // creates the Drive folder if needed
  // Tidy the rows: keep only rows that have a name, pack them from row 2 down,
  // and put a checkbox in the Posted column of those rows only.
  var last = sheet.getLastRow();
  if (last > 1) {
    var data = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues().filter(function (r) { return r[1]; });
    sheet.getRange(2, 1, last - 1, HEADERS.length).clearContent().clearDataValidations();
    if (data.length) {
      sheet.getRange(2, 1, data.length, HEADERS.length).setValues(data);
      sheet.getRange(2, 11, data.length, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
    }
  }
}

// ---------- receiving a review ----------
function doPost(e) {
  var p;
  try { p = JSON.parse(e.postData.contents); } catch (err) { return ok(); }
  if (p.website) return ok();                  // honeypot: bots fill the hidden field
  if (!p.name || !p.review) return ok();

  var rating = Math.max(1, Math.min(5, parseInt(p.rating, 10) || 0));
  var photoUrls = savePhotos(p.photos || [], p.name);

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.appendRow([
    new Date(), p.name, p.email || '', p.pet || '', p.service || '', rating, p.review,
    photoUrls[0] || '', photoUrls[1] || '', photoUrls[2] || '', false, ''
  ]);
  var last = sheet.getLastRow();
  sheet.getRange(last, 11).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());

  notify(p, rating, photoUrls);
  return ok();
}

function savePhotos(photos, name) {
  var folder = getPhotoFolder();
  var urls = [];
  photos.slice(0, MAX_PHOTOS).forEach(function (ph, i) {
    try {
      var bytes = Utilities.base64Decode(ph.data);
      var blob = Utilities.newBlob(bytes, ph.type || 'image/jpeg',
        (name || 'review').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-' + Date.now() + '-' + (i + 1) + '.jpg');
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      urls.push('https://drive.google.com/thumbnail?id=' + file.getId());   // image link; the site adds &sz=w800 for the size
    } catch (err) { /* skip a bad photo, keep the review */ }
  });
  return urls;
}

function getPhotoFolder() {
  var it = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  var folder = DriveApp.createFolder(PHOTO_FOLDER_NAME);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder;
}

function notify(p, rating, photoUrls) {
  var sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  var stars = '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating);
  var text =
    p.name + ' left a review (' + rating + ' of 5).\n\n' +
    'Pet: ' + (p.pet || '') + '\nService: ' + (p.service || '') + '\n' +
    'Email: ' + (p.email || 'not given') + ' (never shown on the site)\n\n' +
    p.review + '\n\n' +
    (photoUrls.length ? 'Photos:\n' + photoUrls.join('\n') + '\n\n' : '') +
    'To publish it, open the sheet and tick the Posted box on this row. Nothing shows on the site until you do.\n' + sheetUrl;
  var html =
    '<div style="font-family:Helvetica,Arial,sans-serif;background:#F9F2E7;padding:24px">' +
    '<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">' +
    '<div style="padding:20px 32px;font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#1E1A16">Garden Pet Sitting</div>' +
    '<div style="height:4px;background:#D9952B"></div>' +
    '<div style="padding:28px 32px;color:#2E2925;font-size:16px;line-height:1.5">' +
    '<div style="font-size:12px;letter-spacing:1px;color:#8A6B4F;font-weight:bold">NEW REVIEW</div>' +
    '<h1 style="font-family:Georgia,serif;font-size:26px;margin:8px 0 12px;color:#1E1A16">' + esc(p.name) + ' left you a review</h1>' +
    '<div style="color:#D9952B;font-size:20px;letter-spacing:2px">' + stars + ' <span style="color:#8A6B4F;font-size:14px;letter-spacing:0">' + rating + ' of 5</span></div>' +
    '<table style="width:100%;margin:20px 0;background:#FDFBF6;border:1px solid #F0E4D0;border-radius:12px;padding:12px 16px;font-size:15px" cellspacing="0">' +
    '<tr><td style="color:#5E4732;font-weight:bold;width:90px;padding:4px 0">Pet</td><td>' + esc(p.pet || '') + '</td></tr>' +
    '<tr><td style="color:#5E4732;font-weight:bold;padding:4px 0">Service</td><td>' + esc(p.service || '') + '</td></tr>' +
    '<tr><td style="color:#5E4732;font-weight:bold;padding:4px 0">Email</td><td>' + esc(p.email || 'not given') + '<br><span style="color:#8A6B4F;font-size:13px">Never shown on the site</span></td></tr>' +
    '</table>' +
    '<p style="margin:0 0 20px">&ldquo;' + esc(p.review).replace(/\n/g, '<br>') + '&rdquo;</p>' +
    photoUrls.map(function (u) { return '<a href="' + u + '"><img src="' + u + '&sz=w240" width="120" height="120" style="border-radius:12px;object-fit:cover;margin:0 8px 8px 0" alt="Review photo"></a>'; }).join('') +
    '<p style="margin:24px 0 16px"><a href="' + sheetUrl + '" style="background:#D9952B;color:#1E1A16;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px;display:inline-block">Open the reviews sheet</a></p>' +
    '<p style="color:#5E4732;font-size:14px;margin:0">To publish it, tick the Posted box on this row in the sheet. Nothing shows on the site until you do. You can fix a typo in the sheet first.</p>' +
    '</div></div>' +
    '<p style="text-align:center;color:#8A6B4F;font-size:13px;margin:20px 0 0">Sent by the review form on gardenpetsitting.info</p></div>';
  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: SUBJECT + ' from ' + p.name, body: text, htmlBody: html });
}

// ---------- serving posted reviews to the website ----------
function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var rows = sheet.getDataRange().getValues().slice(1);
  var out = [];
  rows.forEach(function (r) {
    if (r[10] !== true) return;                      // Posted must be ticked
    if (!r[1] || !r[6]) return;
    out.push({
      date: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      name: String(r[1]), pet: String(r[3]), service: String(r[4]),
      rating: Number(r[5]) || 5, review: String(r[6]),
      photos: [r[7], r[8], r[9]].filter(function (u) { return u; }).map(String)
    });
  });
  out.sort(function (a, b) { return a.date < b.date ? 1 : -1; });   // newest first
  return ContentService.createTextOutput(JSON.stringify({ reviews: out }))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok() { return ContentService.createTextOutput('ok'); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
