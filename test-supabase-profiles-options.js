const url = 'https://tufyfgsdffxgbpgvkgri.supabase.co/rest/v1/profiles?limit=1';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZnlmZ3NkZmZ4Z2JwZ3ZrZ3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzM0OTksImV4cCI6MjA4NzYwOTQ5OX0.Gy48LKPenE6ncQV-pCCYfxDNsNHGWchrYYBs-kgBzIo';

async function check() {
  const res = await fetch(url, {
    method: 'OPTIONS',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const text = await res.text();
  console.log(text);
}

check();
