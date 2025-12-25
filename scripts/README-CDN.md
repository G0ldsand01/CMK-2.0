# Configuration du serveur CDN

Votre application Astro envoie les fichiers vers un serveur CDN externe via l'endpoint `/upload/`. Vous devez configurer ce serveur CDN.

## Options

### Option 1 : Utiliser un service CDN existant

Si vous utilisez un service CDN comme :
- Cloudflare R2
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

Vous devrez créer un endpoint proxy qui accepte les uploads et les redirige vers votre service.

### Option 2 : Créer votre propre serveur CDN

Deux exemples sont fournis :

#### A. Serveur Node.js/Express

**Fichier:** `scripts/cdn-server-example.js`

**Installation:**
```bash
cd scripts
npm install express multer dotenv cors
```

**Configuration (.env):**
```env
CDN_SECRET=your-secret-token-here
CDN_PORT=3001
UPLOAD_DIR=./uploads
CDN_BASE_URL=http://localhost:3001
```

**Démarrer:**
```bash
node cdn-server-example.js
```

#### B. Serveur Python/Flask

**Fichier:** `scripts/cdn-server-python-example.py`

**Installation:**
```bash
pip install flask flask-cors python-dotenv
```

**Configuration (.env):**
```env
CDN_SECRET=your-secret-token-here
CDN_PORT=3001
UPLOAD_DIR=./uploads
CDN_BASE_URL=http://localhost:3001
```

**Démarrer:**
```bash
python cdn-server-python-example.py
```

## Configuration dans Astro

Une fois votre serveur CDN démarré, configurez les variables d'environnement dans votre projet Astro :

```env
CDN_URL=http://localhost:3001
CDN_SECRET=your-secret-token-here
```

## Spécifications de l'endpoint `/upload/`

Votre serveur CDN doit implémenter :

### Requête
- **Méthode:** `POST`
- **URL:** `${CDN_URL}/upload/`
- **Headers:**
  - `Authorization: Bearer ${CDN_SECRET}`
  - `Content-Type: multipart/form-data`
- **Body:** FormData avec le champ `uploadfile`

### Réponse (succès)
```json
{
  "success": true,
  "url": "http://cdn.example.com/filename.stl",
  "message": "File uploaded successfully"
}
```

### Réponse (erreur)
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Test de l'endpoint

Vous pouvez tester l'endpoint avec curl :

```bash
curl -X POST http://localhost:3001/upload/ \
  -H "Authorization: Bearer your-secret-token-here" \
  -F "uploadfile=@test.stl"
```

## Production

Pour la production, vous devriez :
1. Utiliser HTTPS
2. Configurer un reverse proxy (nginx, Caddy)
3. Mettre en place un stockage persistant (S3, etc.)
4. Ajouter des limites de taux (rate limiting)
5. Configurer CORS correctement
6. Ajouter des logs et monitoring

