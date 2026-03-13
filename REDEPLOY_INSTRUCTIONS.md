# Redeploy / Re-upload Instructions (Keep Existing Database & Credentials)

Use these steps when you want to update the application code on your existing platform **without losing or overwriting your database credentials** or existing `.env` file.

---

## Pull from repository URL at `/var/www/olp` (no login required)

Use this when your app is at **`/var/www/olp`** and you want to **get new code from a public repository URL** and **keep your database setup** (`.env` and existing DB).

**Use a public repository HTTPS URL** — e.g. `https://github.com/username/olp.git`. No GitHub login or password is needed for public repos.

---

### Option A: Already a Git repo (recommended)

Run these on the VPS. Use your **public repo URL**. Replace `main` with `master` if your default branch is `master`.

```bash
# 1. SSH in, then go to the app
cd /var/www/olp

# 2. Back up .env (in case anything goes wrong)
cp .env /tmp/olp.env.backup

# 3. Stop the app (if you use PM2)
pm2 stop all

# 4. (Optional) Set the remote URL you pull from (public repo — no login required)
#    Only if you need to point at a different repo or fix the URL:
#    git remote set-url origin https://github.com/username/repo.git

# 5. Get latest code from the repository (replaces tracked files; .env is not tracked so it stays)
git fetch origin
git reset --hard origin/main
git pull origin main

# 6. Restore .env if it was removed (normally it is not)
if [ ! -f .env ]; then cp /tmp/olp.env.backup .env; fi

# 7. Install dependencies
npm install

# 8. Restart the app
pm2 start all
# or: pm2 restart all
# If you only want to restart the OLP app (e.g. you have "olp" and "olp-app" in pm2 list):
# pm2 stop olp && pm2 restart olp
```

Your `.env` (database credentials) is **not** in Git, so it is not replaced. Only application code is updated.

---

### Option B: Delete folder and clone again (full fresh copy)

Use this if the folder is not a Git repo or you want a clean clone. **Use your public repository HTTPS URL** — no login required.

```bash
# 1. SSH in
cd /var/www

# 2. Back up .env from current app
cp olp/.env /tmp/olp.env.backup

# 3. Stop the app (if you use PM2)
pm2 stop all

# 4. Remove current code (folder and all)
sudo rm -rf olp

# 5. Clone from public repository URL (no login required)
#    Paste your public HTTPS URL, e.g. https://github.com/username/olp.git
sudo git clone https://github.com/aluvanze/olp.git

# 6. Put your database setup back (required)
sudo cp /tmp/olp.env.backup olp/.env
sudo chown $(whoami):$(whoami) olp/.env
# If you need correct ownership for the whole folder:
# sudo chown -R $(whoami):$(whoami) olp

# 7. Go in and install, then start
cd olp
npm install
pm2 start server.js --name olp
# or: node server.js
```

Replace `https://github.com/username/olp.git` with your actual public repo URL. No GitHub account or token needed.

---

### If clone asks for password: "Password authentication is not supported"

GitHub no longer accepts your account password for Git. You will see **"Password authentication is not supported for Git operations"** or **"Authentication failed"**.

**Option 1 – No login (easiest): make the repo public**

1. On GitHub: open the repo → **Settings** → **General**.
2. Scroll to **Danger zone** → **Change repository visibility** → **Make public**.
3. On the VPS, clone again with the same HTTPS URL. You will **not** be prompted for username or password:
   ```bash
   sudo git clone https://github.com/aluvanze/olp.git olp
   ```

**Option 2 – Keep repo private: use a Personal Access Token (PAT)**

1. On GitHub: **Profile (top right)** → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token**.
2. Give it a name, tick **repo**, then generate and **copy the token** (you won't see it again).
3. On the VPS, clone using the token instead of a password (replace `YOUR_TOKEN` with the token you copied):
   ```bash
   sudo git clone https://YOUR_TOKEN@github.com/aluvanze/olp.git olp
   ```
   Example (fake token): `sudo git clone https://ghp_xxxxxxxxxxxx@github.com/aluvanze/olp.git olp`

Use **Option 1** if you don't mind the repo being public. Use **Option 2** if the repo must stay private.

---

### Run new migrations (if any)

After pulling new code, run any new migration files on your database:

```bash
psql -U your_db_user -d olp -f migrations/011_add_student_guardian_grade.sql
```

This adds guardian phone fields and grade to learner profiles for the headteacher Add Student flow.

---

### Checklist for `/var/www/olp`

- [ ] Backed up `.env` (e.g. to `/tmp/olp.env.backup`)
- [ ] Stopped the app (e.g. `pm2 stop all`)
- [ ] Pulled or cloned new code
- [ ] `.env` is back in `/var/www/olp/` and not overwritten
- [ ] Ran `npm install`
- [ ] Restarted the app (e.g. `pm2 restart olp` or `pm2 start all`)

**PM2:** If your app is named `olp` in `pm2 list`, use `pm2 stop olp` and `pm2 restart olp` so you don’t affect other processes. To remove a stopped duplicate (e.g. `olp-app`): `pm2 delete olp-app`.
