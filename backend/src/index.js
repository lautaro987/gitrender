// backend/src/index.js


const UPLOADS = path.join(__dirname, '..', 'uploads');
const SITES = path.join(__dirname, '..', 'sites');
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });
if (!fs.existsSync(SITES)) fs.mkdirSync(SITES, { recursive: true });


// Simple DB (SQLite) — tabla sites
const db = new sqlite3(path.join(__dirname, '..', 'data', 'gitrender.db'));
db.prepare(`CREATE TABLE IF NOT EXISTS sites (
id TEXT PRIMARY KEY,
name TEXT,
owner TEXT,
created_at TEXT,
folder TEXT
)`).run();


const upload = multer({ dest: UPLOADS, limits: { fileSize: 200 * 1024 * 1024 } });
const app = express();
app.use(express.json());


// Upload ZIP endpoint
app.post('/api/upload', upload.single('repo'), async (req, res) => {
try {
const file = req.file;
if (!file) return res.status(400).json({ error: 'No file' });
// generate site id
const id = uuidv4().slice(0, 8);
const siteFolder = path.join(SITES, id);
fs.mkdirSync(siteFolder, { recursive: true });


// Try to unzip
const stream = fs.createReadStream(file.path)
.pipe(unzipper.Extract({ path: siteFolder }));


stream.on('close', () => {
// record in DB
const stmt = db.prepare('INSERT INTO sites (id,name,owner,created_at,folder) VALUES (?,?,?,?,?)');
stmt.run(id, req.body.name || `site-${id}`, req.body.owner || 'anonymous', new Date().toISOString(), siteFolder);


return res.json({ id, url: `/s/${id}/`, subdomain: `${id}.your-domain.example` });
});


stream.on('error', (err) => {
console.error(err);
return res.status(500).json({ error: 'unzip failed' });
});
} catch (err) {
console.error(err);
res.status(500).json({ error: 'upload failed' });
}
});


// List sites
app.get('/api/sites', (req, res) => {
const rows = db.prepare('SELECT id,name,owner,created_at FROM sites ORDER BY created_at DESC').all();
res.json(rows);
});


// Serve static sites under /s/:id/
app.use('/s/:siteId', (req, res, next) => {
const siteId = req.params.siteId;
const row = db.prepare('SELECT folder FROM sites WHERE id = ?').get(siteId);
if (!row) return res.status(404).send('Site not found');
express.static(row.folder) (req, res, next);
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`))
