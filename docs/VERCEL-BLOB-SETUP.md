# Configuration Vercel Blob Storage pour les fichiers 3D

## Installation

Le package `@vercel/blob` a été installé. Il permet de stocker les fichiers directement sur Vercel Blob Storage.

## Configuration sur Vercel

### 1. Activer Vercel Blob Storage

1. Allez sur votre dashboard Vercel : https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Storage**
4. Cliquez sur **Create Database** ou **Add Storage**
5. Sélectionnez **Blob**
6. Créez votre store Blob

### 2. Configurer la variable d'environnement

Vercel Blob nécessite un token d'authentification. Il est automatiquement disponible dans les fonctions serverless de Vercel, mais vous pouvez aussi le configurer manuellement :

1. Dans votre projet Vercel, allez dans **Settings** → **Environment Variables**
2. Ajoutez `BLOB_READ_WRITE_TOKEN` (généralement configuré automatiquement)

### 3. Configuration locale (optionnel)

Pour tester en local, vous pouvez créer un fichier `.env.local` :

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

**Note :** Pour obtenir le token en local :
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Storage**
4. Cliquez sur votre store Blob
5. Copiez le token `BLOB_READ_WRITE_TOKEN`

## Comment ça fonctionne

1. L'utilisateur upload un fichier 3D via le formulaire
2. Le fichier est envoyé à `/api/3dprint/upload`
3. L'endpoint utilise `@vercel/blob` pour stocker le fichier
4. Une URL publique est retournée (ex: `https://xxx.public.blob.vercel-storage.com/...`)
5. Cette URL est ajoutée aux métadonnées Stripe

## Avantages

- ✅ Fonctionne nativement sur Vercel
- ✅ Pas besoin de serveur CDN externe
- ✅ Stockage persistant et scalable
- ✅ URLs publiques automatiques
- ✅ Pas de configuration complexe

## Limites

- Gratuit : 1 GB de stockage, 10 GB de bande passante/mois
- Payant : $0.15/GB stockage, $0.10/GB bande passante

## Test

Une fois configuré, testez l'upload d'un fichier 3D. Le fichier sera automatiquement stocké sur Vercel Blob et l'URL sera disponible dans les métadonnées Stripe.

