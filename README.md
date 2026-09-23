# story app

Top Shelf and Under the Counter — a private personal story library and writing workspace.

Stories, people, photos, and notes stay on the device. Unlock with the passcode, then write, import, or generate stories.

`index.html` sits in the repository root so GitHub Pages can open the site. The app source stays in `src/` — that folder is required, and moving those files onto the root would break the app.

## Vercel

Vercel builds from this repository root (`vercel.json` runs `npm run build`). Do not point the project at a subfolder. Story generation runs on the Vercel site.

## GitHub Pages

Publish the **main** branch from the repository root **/** (not `/docs`).

https://steveburridge73-debug.github.io/story-app/

The library works there. Full story generation needs the Vercel site, because GitHub Pages cannot run the server.

```bash
npm install
npm run dev
```
