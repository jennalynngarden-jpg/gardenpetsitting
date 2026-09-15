# Reviews: how it works and how to look after it

Clients leave reviews on gardenpetsitting.info. Each one goes to a Google Sheet and
an email to Georgia. Nothing shows on the site until Georgia ticks the **Posted** box.

## The pieces

- **Google Sheet:** "Garden Pet Sitting — Reviews" (in Jenna's Drive, shared with Georgia).
  Columns: Date, Name, Email, Pet, Service, Rating, Review, Photo 1, Photo 2, Photo 3, Posted, Notes.
- **Drive folder:** "Garden Pet Sitting — Review photos". Photos people upload land here.
  The folder is set to "anyone with the link can view" so the site can show them.
- **Google script:** lives inside the Sheet (Extensions > Apps Script), project name
  "Garden Pet Sitting reviews". A copy of the code is in `docs/reviews-script.gs`.
  It is deployed as a web app; its URL is the `REVIEWS_ENDPOINT` at the top of `js/reviews.js`.
- **Website:** `js/reviews.js` loads posted reviews and powers the Reviews page
  (`reviews.html`), the homepage carousel, the review form, and the full-review modal.

## Georgia's routine

1. An email arrives: "New review for the Garden Pet Sitting website from ...".
2. Open the sheet (button in the email). Read the row. Fix a typo in the Review cell if needed.
3. Tick **Posted**. Within about 10 minutes the review is on the site (visitors who already
   had the site open may need to reload).
4. To take a review down, untick Posted. To keep private notes, use the Notes column.

## Rules built into the site

- The homepage "What clients say" section and the **Reviews** link in the menu only appear
  once **3 or more** reviews are posted. The Reviews page itself always exists, so Georgia can
  send early clients this link to leave a review:
  `https://gardenpetsitting.info/reviews.html#leave-a-review`
- Reviews show newest first. The homepage carousel shows up to 6; the Reviews page shows all.
- Photos: up to 3 per review, shrunk in the browser to 1200px before upload.
- Email addresses are stored in the sheet for Georgia only and never shown on the site.

## If something needs changing in the script

Open the Sheet > Extensions > Apps Script, edit the code, save, then
**Deploy > Manage deployments > pencil icon > Version: New version > Deploy**.
The web app URL stays the same, so the website does not need to change.
