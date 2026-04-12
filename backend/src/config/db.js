import mongoose from 'mongoose';

const DEFAULT_RETRY_MS = Number(process.env.DB_RETRY_MS || 7000);
const DEFAULT_MAX_RETRIES = Number(process.env.DB_MAX_RETRIES || 0); // 0 = infinite

let lastError = '';

function redactMongoUri(uri = '') {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/i, '$1$2:***@');
}

function toHelpfulError(err, uri) {
  const message = err?.message || 'Unknown DB error';

  if (message.includes('querySrv ENOTFOUND')) {
    return [
      message,
      'Hint: your MongoDB Atlas hostname in MONGO_URI is likely incorrect or DNS cannot resolve it.',
      `Current URI (redacted): ${redactMongoUri(uri)}`,
      'Verify the Atlas cluster host from Atlas -> Connect -> Drivers and update Render env vars.'
    ].join(' | ');
  }

  return message;
}

export function getDBStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    readyState: mongoose.connection.readyState,
    state: states[mongoose.connection.readyState] || 'unknown',
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
    lastError: lastError || null
  };
}

export async function connectDB(uri, { retryMs = DEFAULT_RETRY_MS, maxRetries = DEFAULT_MAX_RETRIES } = {}) {
  if (!uri) {
    lastError = 'MONGO_URI is missing.';
    console.error('[DB] MONGO_URI is missing. Set it in your environment variables.');
    return false;
  }

  let attempt = 0;

  while (maxRetries === 0 || attempt < maxRetries) {
    attempt += 1;
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 12000,
        family: 4
      });

      lastError = '';
      console.log(`[DB] MongoDB connected: ${mongoose.connection.host}`);
      return true;
    } catch (err) {
      lastError = toHelpfulError(err, uri);
      console.error(`[DB] Connection failed (attempt ${attempt}): ${lastError}`);
      console.error(`[DB] Retrying in ${retryMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryMs));
    }
  }

  return false;
}
