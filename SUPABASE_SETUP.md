# Supabase and GitHub Pages setup

GitHub Pages serves only static files. Supabase replaces the server features the old deployment needed: email identity, the database, authorization checks, and image storage.

## 1. Create the backend

1. Create a Supabase project at <https://supabase.com/dashboard>.
2. Open **SQL Editor**, paste `supabase/migrations/0001_github_pages_backend.sql`, and run it once.
3. In **Project Settings → API**, copy:
   - the Project URL;
   - the publishable key (`sb_publishable_...`). Do not use the service-role or secret key.

The migration creates a private image bucket with short-lived public viewing links, editor-only write policies, expiring email invitations, upload consent records, and an audit log.

## 2. Configure email sign-in

In **Authentication → URL Configuration**:

- Set **Site URL** to the final Pages URL, for example `https://YOUR_GITHUB_NAME.github.io/YOUR_REPOSITORY/`.
- Add the same URL and `http://127.0.0.1:8000/` to **Redirect URLs**.

Email authentication is enabled by default. For production, configure custom SMTP under **Authentication → Email**; Supabase’s trial email service is intentionally rate limited.

## 3. Create the owner safely

1. Open the site and request a sign-in link for the owner’s email.
2. Use the link once so the user exists in Supabase Auth.
3. In SQL Editor, run this with the same address:

```sql
select public.bootstrap_gallery_owner('owner@example.com');
```

This bootstrap function cannot be called from the public website. It can be used only before an owner exists. Afterward, the owner manages collaborators from **Manage gallery → Collaborators**.
Reload the gallery after running the bootstrap statement.

## 4. Configure GitHub

1. Create a GitHub repository and push this folder to its `main` branch.
2. Open **Settings → Secrets and variables → Actions → Variables** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. Re-run the **Deploy Project Gallery to GitHub Pages** workflow, or push another commit.

These values are repository variables rather than secrets because both are shipped to the browser by design. RLS is the security boundary. Never add the Supabase service-role/secret key.

## 5. Invite collaborators

The owner enters a collaborator’s email in the gallery. The collaborator then opens the public site and requests an email sign-in link using that exact address. The invitation is accepted automatically and expires after 30 days if unused.

## Existing Sites content

The current Sites deployment and its D1/R2 data are not modified by this setup. Keep it online until the GitHub/Supabase version is verified. Existing photos require a one-time export and upload because GitHub Pages cannot directly reuse private R2 objects.
