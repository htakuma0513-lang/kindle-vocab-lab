# GitHub Pages Deployment

This app is a static site. It can be hosted on GitHub Pages without a build step.

## First-time setup

1. Create a new GitHub repository.
2. Push this folder to the repository's `main` branch.
3. Push to `main`, or run `Deploy GitHub Pages` manually from the `Actions` tab.
4. The workflow publishes the static app to the `gh-pages` branch.
5. GitHub Pages serves the app from the `gh-pages` branch.

Example commands after creating an empty GitHub repository:

```powershell
git add .
git commit -m "Prepare GitHub Pages deployment"
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

If you use GitHub CLI:

```powershell
gh repo create <your-user>/<your-repo> --public --source . --remote origin --push
```

The workflow publishes only these files:

- `index.html`
- `app.js`
- `styles.css`
- `manifest.webmanifest`
- `service-worker.js`
- `icons/`
- `.nojekyll`

## Android / PWA

The app includes a web app manifest, PNG icons, and a service worker. On Android Chrome, open the GitHub Pages URL and choose `Install app` or `Add to Home screen`.

The service worker caches the app shell, so the app can start after it has been loaded once. Dictionary API calls still need a network connection.

## Important privacy notes

- Merriam-Webster API keys are not stored in this repository.
- API keys are saved only in each browser's LocalStorage after a user enters them in the app.
- Vocabulary data is also saved in LocalStorage, per browser and per domain.
- Data saved on `http://127.0.0.1:5173` will not automatically appear on the GitHub Pages URL because browser storage is domain-specific.

Use the app's export feature to move vocabulary data between browsers or domains.

## Local validation

Before pushing, run:

```powershell
node --check app.js
python -m http.server 5173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:5173`.
