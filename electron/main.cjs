// Electron shell that turns the built web app (dist/) into a desktop app.
//
// The page is served from a private `app://` scheme instead of file:// so that fetch()
// (used for the sticker sounds), video playback with seeking, and localStorage (the
// checklist is saved there) all behave exactly like on a normal web origin.
const { app, BrowserWindow, Menu, net, protocol, shell } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { Readable } = require('node:stream')
const { pathToFileURL } = require('node:url')

const DIST = path.join(__dirname, '..', 'dist')
const ORIGIN = 'app://anoko'

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
])

const MIME = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
}

/** Serves files from dist/, with HTTP Range support so <video> can stream and seek. */
async function serve(request) {
  const { pathname } = new URL(request.url)
  const file = path.normalize(path.join(DIST, decodeURIComponent(pathname)))
  if (!file.startsWith(DIST + path.sep)) return new Response('Forbidden', { status: 403 })

  const target = pathname === '/' ? path.join(DIST, 'index.html') : file
  let stat
  try {
    stat = fs.statSync(target)
  } catch {
    return new Response('Not found', { status: 404 })
  }

  const type = MIME[path.extname(target)]
  const range = request.headers.get('range')
  if (type && range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range)
    const start = m && m[1] ? Number(m[1]) : 0
    const end = m && m[2] ? Math.min(Number(m[2]), stat.size - 1) : stat.size - 1
    const body = Readable.toWeb(fs.createReadStream(target, { start, end }))
    return new Response(body, {
      status: 206,
      headers: {
        'Content-Type': type,
        'Content-Length': String(end - start + 1),
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
      },
    })
  }
  if (type) {
    return new Response(Readable.toWeb(fs.createReadStream(target)), {
      headers: { 'Content-Type': type, 'Content-Length': String(stat.size), 'Accept-Ranges': 'bytes' },
    })
  }
  return net.fetch(pathToFileURL(target).toString())
}

function createWindow() {
  const win = new BrowserWindow({
    width: 860,
    height: 980,
    minWidth: 380,
    minHeight: 560,
    title: 'Anoko Checklist',
    backgroundColor: '#f7f2e8',
    // Paper all the way to the top; the traffic lights float over it.
    titleBarStyle: 'hiddenInset',
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true },
  })
  win.once('ready-to-show', () => win.show())
  win.loadURL(`${ORIGIN}/index.html`)

  // Never navigate away from the app; open any external link in the browser.
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(ORIGIN)) {
      e.preventDefault()
      void shell.openExternal(url)
    }
  })
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    protocol.handle('app', serve)
    if (process.platform === 'darwin') Menu.setApplicationMenu(Menu.buildFromTemplate(macMenu()))
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}

function macMenu() {
  return [
    { role: 'appMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [{ role: 'reload' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }],
    },
    { role: 'windowMenu' },
  ]
}
