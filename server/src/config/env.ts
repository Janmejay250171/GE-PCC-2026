import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always look up relative to file location
dotenv.config({ path: path.resolve(__dirname, '../../.env') });     // server/.env
if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_API_KEY.trim()) {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });   // root/.env
}
dotenv.config(); // fallback to current working directory

function resolveMongoUri(): string {
  let uri = (process.env.MONGODB_URI || process.env.MONGODB_URL || '').trim();
  const dbName = (process.env.DATABASE_NAME || 'sehatsure').trim();

  if (!uri) {
    return 'mongodb://localhost:27017/sehatsure';
  }

  // If URI has no database name specified, insert dbName
  if (uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://')) {
    const [mainPart, queryPart] = uri.split('?');
    const scheme = uri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://';
    const withoutScheme = mainPart.replace(/^mongodb(\+srv)?:\/\//, '');
    const slashIndex = withoutScheme.indexOf('/');

    if (slashIndex === -1 || slashIndex === withoutScheme.length - 1) {
      const hostPart = slashIndex === -1 ? withoutScheme : withoutScheme.slice(0, -1);
      const query = queryPart ? `?${queryPart}` : '?retryWrites=true&w=majority';
      return `${scheme}${hostPart}/${dbName}${query.startsWith('?') ? query : '?' + query}`;
    }
  }

  return uri;
}

export const config = {
  mongodbUri: resolveMongoUri(),
  geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};
