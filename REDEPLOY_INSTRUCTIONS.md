# Redeploy / Re-upload Instructions (Keep Existing Database & Credentials)

Use these steps when you want to update the application code on your existing platform **without losing or overwriting your database credentials** or existing `.env` file.

---

## Where is `.env` on the VPS?

The `.env` file is in your **project root** (the same folder as `server.js` and `package.json`). On a VPS it is usually **not** under `/var` unless you put the app there.

**Typical locations:**

| Location | When it's used |
|----------|-----------------|
| `~/olp/.env` | Project in home dir, folder named `olp` |
| `~/grade10-lms/.env` | Project in home dir, folder from repo name |
| `/home/yourusername/olp/.env` | Same as above (replace `yourusername`) |
| `/var/www/olp/.env` | If you deployed the app under `/var/www` |
| `/var/www/grade10-lms/.env` | Same under `/var/www` |

**How to find it:**

1. **SSH into the VPS:**
   ```bash
   ssh yourusername@your-vps-ip
   ```

2. **Go to where the app runs from** (e.g. where you run `npm start` or where PM2 is started):
   ```bash
   cd ~/olp
   # or
   cd /var/www/olp
   # or wherever your project lives
   ```

3. **List files and confirm `.env` is there** (it may be hidden):
   ```bash
   ls -la
   ```
   You should see `.env` in the list (same folder as `server.js`, `package.json`).

4. **Open or edit `.env`:**
   ```bash
   nano .env
   ```
   Or only view it (read-only):
   ```bash
   cat .env
   ```

5. **If you're not sure where the app is**, find the process:
   ```bash
   pm2 list
   ```
   Then check the path PM2 shows for the app, or:
   ```bash
   pm2 show 0
   ```
   The "script path" or "exec cwd" is your project root; `.env` is in that folder.

**Quick one-liner to find `.env` anywhere under your home or `/var/www`:**
```bash
find ~ /var/www -name ".env" -type f 2>/dev/null
```

---

## 1. Back up your credentials (on the server/platform)

Before replacing any code:

1. **Copy your existing `.env` file** to a safe place (e.g. your PC or a backup folder):
   - On the server: the file is usually in the project root: `olp/.env` or `grade10-lms/.env`
   - Download or copy its contents somewhere safe.

2. **Do not delete** the `.env` file on the server. The app needs it to connect to your database.

---

## 2. Upload / replace the application code

- **Option A – Git (recommended)**  
  - On the server, go to your project folder and run:
    ```bash
    git fetch origin
    git pull origin main
    ```
  - Git will **not** overwrite `.env` (it is in `.gitignore`), so your credentials stay as they are.

- **Option B – Upload files manually (FTP / file manager)**  
  - Upload or overwrite only the **application files** (e.g. `server.js`, `routes/`, `public/`, `config/`, `migrations/`, `package.json`, etc.).
  - **Do not upload or overwrite** a `.env` file from your computer if you have one there. Keep using the `.env` that is **already on the server**.

- **Option C – Zip / replace folder**  
  - Replace the project folder with the new code, **except**:
    - Do **not** replace the `.env` file.
    - Before replacing: copy the server’s existing `.env` to a safe place, then after replacing the code, **put that same `.env` back** into the project root.

---

## 3. Install dependencies (if code or package.json changed)

On the server, in the project root:

```bash
npm install
```

This does not touch `.env`.

---

## 4. Restart the application

- If you use **PM2**:
  ```bash
  pm2 restart all
  ```
- If you use a **systemd** service or another process manager, restart that service.
- If you run the app manually:
  ```bash
  node server.js
  ```
  or:
  ```bash
  npm start
  ```

---

## 5. Variables your `.env` must have (do not delete these)

Your existing `.env` on the server should keep at least these. **Do not remove or overwrite them** when redeploying:

| Variable        | Purpose                          |
|----------------|-----------------------------------|
| `DB_HOST`      | Database server address           |
| `DB_PORT`      | Database port (often 5432)        |
| `DB_NAME`      | Database name (e.g. grade10_lms)  |
| `DB_USER`      | Database username                 |
| `DB_PASSWORD`  | Database password                 |
| `JWT_SECRET`   | Secret for login tokens           |
| `PORT`         | App port (e.g. 3000)              |

Optional (if you use them): `FRONTEND_URL`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `JWT_EXPIRES_IN`, `NODE_ENV`.

---

## Quick checklist

- [ ] Backed up existing `.env` from the server
- [ ] Replaced/updated only code (no overwrite of `.env` on server)
- [ ] Ran `npm install` if needed
- [ ] Restarted the app
- [ ] Confirmed `.env` is still in the project root and unchanged

If you keep your server’s `.env` and only update code + run `npm install` + restart, your database credentials and existing config will stay intact.
