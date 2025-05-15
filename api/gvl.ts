import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    // Lade die GVL aus der lokalen Datei im /src/services Verzeichnis
    const filePath = path.resolve(process.cwd(), 'src/services/global-vendor-list.json');
    
    if (!fs.existsSync(filePath)) {
      console.error(`GVL file not found at path: ${filePath}`);
      return response.status(404).json({
        error: 'GVL file not found'
      });
    }

    const data = fs.readFileSync(filePath, 'utf8');
    const gvl = JSON.parse(data);

    // Stelle sicher, dass die CORS-Header gesetzt sind
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Cache-Control', 'public, max-age=3600'); // Cache für eine Stunde

    return response.status(200).json(gvl);
  } catch (error) {
    console.error('Error serving GVL:', error);
    return response.status(500).json({
      error: 'Failed to serve GVL file',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 