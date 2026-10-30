# Questions and responses in posts

Posts contain the headings, introduction, questions, and response collection.
There are no standalone form pages or separate form management routes. Share the
post URL, including when creating a slide QR code.

1. Create a post with a title, category, audience, and Markdown content. Save it.
2. In that post's editor, open **Forms**. This lists question sets for that post.
3. Select **Create form**. Set a unique question set key, add questions, and choose
   whether responses should be anonymous. Do not add a second title or introduction;
   write those in the post's Markdown.
4. Select **Publish form**, close the editor, and select **Insert**. This adds
   `<PublishedForm slug="your-key"></PublishedForm>` at the desired position in
   the post content. Move the tag within Markdown to change its position.
5. Save the post. Its preview displays the questions with submission disabled.
6. Open **View post** to test a real submission. Use **Forms → Responses** in the
   post editor to review the latest 500 responses for a question set.

## Audience and identity

Access follows the post's audience: Public, Employees, or Selected roles. Public
posts with anonymous responses allow visitors to respond without an account.
Turning Anonymous responses off requires employee sign-in and records that
account with the response. An internal post still requires sign-in even when its
responses are anonymous.

Anonymous responses do not store an account ID or operation log. People can still
identify themselves in their answers.

Save audience changes on the post before editing question sets. Question sets
created under the previous architecture preserve their old audience restrictions
until saved into their post, so existing restrictions are not silently widened.

## Existing content and history

Existing Markdown embeds, question definitions, and response snapshots are
preserved. Previously linked question sets appear in the corresponding post's
Forms dialog. Unattached legacy question sets remain stored; if needed, insert
their existing tag into a post and save it to associate them. Question sets owned
by a different post cannot be inserted or managed here.
If an old question set is shared by multiple posts, it remains readable. Create
a new question set in the relevant post before changing it, so other posts are
not affected.

Old `/forms/slug` pages and their standalone submission endpoint have been removed.
Replace any links or QR codes pointing to those pages with the post URL.

The old title and introduction values remain in historical database snapshots but
are no longer edited or displayed. Add any text you want readers to see to the
post's Markdown.

## Publishing and closing responses

**Save draft** does not replace the published questions. **Publish form** applies
changes. Each response stores the question wording and published version used at
submission. Older browser versions must reload before submitting.

Disable **Accept responses** and publish to stop new responses. Question sets
with responses or saved post references cannot be deleted; close them instead.
Clicking outside a create/edit dialog or selecting Cancel discards unsaved edits.
