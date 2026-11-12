const https = require('https');

const SUPABASE_URL = 'https://hxbqqcefvzpycwgveuet.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4YnFxY2VmdnpweWN3Z3ZldWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0MDQ4MTEsImV4cCI6MjEwOTk4MDgxMX0.KrQG0C1H-TJsHG2kwQ-Y6nQ5R5ZXFkXXRhGXUCPtlbk';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4YnFxY2VmdnpweWN3Z3ZldWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDQwNDgxMSwiZXhwIjoyMTA5OTgwODExfQ.pqjWdXXgYs3kjzY55GIOGzqq-VDykhr1fvNUdH5gw6c';

function checkTable(tableName) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'hxbqqcefvzpycwgveuet.supabase.co',
      path: `/rest/v1/${tableName}?select=*&limit=5`,
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ table: tableName, status: res.statusCode, data: json });
        } catch {
          resolve({ table: tableName, status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', err => resolve({ table: tableName, error: err.message }));
    req.end();
  });
}

async function verifyAll() {
  const tables = ['profiles', 'categories', 'products', 'customers', 'transactions', 'expenses', 'cash_handovers', 'activity_logs'];
  console.log('--- Verifying Tables on New Supabase Project ---');
  for (const t of tables) {
    const res = await checkTable(t);
    if (res.status === 200) {
      console.log(`[OK] Table "${t}" exists. Row count returned: ${Array.isArray(res.data) ? res.data.length : 'unknown'}`);
    } else {
      console.log(`[PENDING] Table "${t}" returned status ${res.status}:`, res.data ? res.data.message : res.raw);
    }
  }
}

verifyAll();

