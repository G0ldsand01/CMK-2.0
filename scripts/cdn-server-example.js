/**
 * Exemple de serveur CDN simple pour upload de fichiers
 *
 * Installation:
 *   npm install express multer dotenv cors
 *
 * Usage:
 *   node scripts/cdn-server-example.js
 *
 * Variables d'environnement (.env):
 *   CDN_SECRET=your-secret-token-here
 *   CDN_PORT=3001
 *   UPLOAD_DIR=./uploads
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.CDN_PORT || 3001;
const CDN_SECRET = process.env.CDN_SECRET || 'your-secret-token';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const CDN_BASE_URL = process.env.CDN_BASE_URL || `http://localhost:${PORT}`;

// Créer le dossier d'upload s'il n'existe pas
if (!fs.existsSync(UPLOAD_DIR)) {
	fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuration de multer pour stocker les fichiers
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, UPLOAD_DIR);
	},
	filename: (req, file, cb) => {
		// Garder le nom original ou utiliser celui fourni
		const originalName = file.originalname || file.fieldname;
		cb(null, originalName);
	},
});

const upload = multer({
	storage,
	limits: {
		fileSize: 100 * 1024 * 1024, // 100MB max
	},
});

// Middleware
app.use(cors());
app.use(express.json());

// Middleware d'authentification
const authenticate = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({
			success: false,
			error: 'Missing or invalid authorization header',
		});
	}

	const token = authHeader.substring(7); // Remove "Bearer "

	if (token !== CDN_SECRET) {
		return res.status(401).json({
			success: false,
			error: 'Invalid token',
		});
	}

	next();
};

// Endpoint d'upload
app.post('/upload/', authenticate, upload.single('uploadfile'), (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				success: false,
				error: 'No file provided',
			});
		}

		// Construire l'URL du fichier
		const fileUrl = `${CDN_BASE_URL}/${req.file.filename}`;

		console.log(
			`✅ File uploaded: ${req.file.filename} (${req.file.size} bytes)`,
		);

		res.json({
			success: true,
			url: fileUrl,
			message: 'File uploaded successfully',
		});
	} catch (error) {
		console.error('❌ Upload error:', error);
		res.status(500).json({
			success: false,
			error: error.message || 'Failed to upload file',
		});
	}
});

// Servir les fichiers statiques
app.use(express.static(UPLOAD_DIR));

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Démarrer le serveur
app.listen(PORT, () => {
	console.log(`🚀 CDN Server running on http://localhost:${PORT}`);
	console.log(`📁 Upload directory: ${path.resolve(UPLOAD_DIR)}`);
	console.log(`🔐 Secret token: ${CDN_SECRET.substring(0, 10)}...`);
	console.log(`\n📝 Endpoints:`);
	console.log(`   POST ${CDN_BASE_URL}/upload/ - Upload file`);
	console.log(`   GET  ${CDN_BASE_URL}/health - Health check`);
	console.log(`   GET  ${CDN_BASE_URL}/<filename> - Access uploaded file`);
});
