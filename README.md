# Disha Shamwani Portfolio

Static fashion/model portfolio website with four public pages and one private admin URL.

## Pages

- Home: `index.html`
- About: `about.html`
- Gallery: `gallery.html`
- Contact: `contact.html`
- Admin panel: `admin.html`

The admin page is intentionally not linked anywhere on the public website. Share the direct URL only with the admin.

## Start The Project

This is a normal static HTML project. The simplest way to run it is:

1. Open the project folder.
2. Double-click `index.html`.

Or open the file directly in a browser:

```text
C:\Users\DELL\Downloads\Porfolio\index.html
```

## Optional Local Server

If you want the site to behave closer to real hosting, or if a browser blocks local admin uploads/storage, run a small local server.

Open PowerShell in this folder:

```powershell
cd C:\Users\DELL\Downloads\Porfolio
python -m http.server 8080 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8080/index.html
```

Admin direct URL:

```text
http://127.0.0.1:8080/admin.html
```

## Admin Login

Password:

```text
disha2026
```

The password is currently stored in `script.js` as `ADMIN_PASSWORD`.

## Admin Features

- Drag and drop images or reels from the device.
- Click the upload area to choose files.
- Replace an existing image/reel by dragging a file onto that item's preview.
- Replace an existing image/reel by clicking the item's `Replace` button.
- Add media manually by path or URL.
- Toggle media visibility for Gallery, Home, and Hero.
- Reorder media with Up/Down.
- Delete media from the displayed list.
- Reset media back to defaults.

Uploaded files are saved in the browser using IndexedDB, and media settings are saved using `localStorage`. This works for local/static use, but it is browser-specific.

## Developer Notes

- Shared styling: `styles.css`
- Shared behavior/admin logic: `script.js`
- Default media list is in `script.js` inside `defaultMedia`.
- Assets are stored in:
  - `assets/images`
  - `assets/videos`
  - `assets/logo`

For a production admin where uploads and changes are shared across all users/devices, replace browser storage with a backend database and file storage.
