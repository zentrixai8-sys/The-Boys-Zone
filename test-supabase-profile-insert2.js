const url = 'https://tufyfgsdffxgbpgvkgri.supabase.co/rest/v1/profiles';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZnlmZ3NkZmZ4Z2JwZ3ZrZ3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzM0OTksImV4cCI6MjA4NzYwOTQ5OX0.Gy48LKPenE6ncQV-pCCYfxDNsNHGWchrYYBs-kgBzIo';

async function check() {
  const payload = {
    id: '11111111-2222-3333-4444-555555555555', // random uuid
    name: 'Test Name',
    email: 'test@example.com',
    phone: '', // empty phone!
    password: 'auto_generated'
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

check();
