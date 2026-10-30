# Forms in posts

1. Open **Post → New**, or edit an existing post.
2. Choose the category and audience. Category organizes content; audience controls
   access. HR and Feedback default to Employees on new posts. An explicit audience
   selection is preserved when changing category. Existing posts remain public.
3. Select **Forms → Create form**. Set the title, slug, audience, questions, and
   anonymous setting. Supported questions are text, email, paragraph, choice,
   checkbox, and a 1–5 rating.
4. **Save draft** preserves the current published version. **Publish form** makes
   the changes available. Slugs cannot change after creation.
5. Close the editor and select **Insert** beside the published form. Save the post.
   The Markdown contains `<PublishedForm slug="your-slug"></PublishedForm>`.
6. Open **View post** and test submission. Editor previews cannot submit responses.
   The post preview displays the embedded form's published questions. Publish
   changes in Forms to update what appears in the post preview.
7. In Forms, select **Responses** to see the latest 500 submissions.

Posts use `/posts/year/month/day/slug`, regardless of category. Existing `/news/`
links remain supported. Changing the date or slug changes the URL. Place the full
production post URL in a slide QR code, or link directly to `/forms/your-slug`.

## Audience and identity

Public content permits visitors without accounts. Employees requires an active
employee account; Selected roles also requires membership in at least one selected
role. Identified forms require sign-in even when their audience is Public.
For a form anyone can complete without an account, choose Public and enable
Anonymous responses. Turning that setting off requires an employee account; it
does not collect a visitor's name or email automatically.

Clicking outside the create/edit dialog or selecting Cancel dismisses it and
discards unsaved edits. Outside dismissal is disabled while saving.

Post and form audiences are independent. An embedded form enforces both. A direct
form link enforces the form's audience, so choose Employees on the form itself if
it must never be publicly accessible.

Anonymous submissions do not store an account ID or operation log. People can
still identify themselves in their answers. Identified submissions store the
account ID and show the employee's username in Responses.

## Editing and closing forms

Each response stores the submitted questions and published version, so later edits
do not change historical answers. Someone submitting an older version is asked to
reload. Disable **Accept responses** and publish to close a form. Forms attached
to posts or containing responses cannot be deleted; close them instead.

Forms are managed through the existing post permissions. The shared FormRenderer
and PublishedForm components can also be used outside posts.
