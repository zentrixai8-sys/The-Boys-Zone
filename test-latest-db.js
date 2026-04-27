const urlProfiles = 'https://tufyfgsdffxgbpgvkgri.supabase.co/rest/v1/profiles?order=created_at.desc';
const urlOrders = 'https://tufyfgsdffxgbpgvkgri.supabase.co/rest/v1/orders?order=date.desc';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZnlmZ3NkZmZ4Z2JwZ3ZrZ3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzM0OTksImV4cCI6MjA4NzYwOTQ5OX0.Gy48LKPenE6ncQV-pCCYfxDNsNHGWchrYYBs-kgBzIo';

async function check() {
  const pRes = await fetch(urlProfiles, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }});
  const pData = await pRes.json();
  console.log('--- PROFILES ---');
  console.log(pData.slice(0, 5));

  const oRes = await fetch(urlOrders, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }});
  const oData = await oRes.json();
  console.log('--- ORDERS ---');
  console.log(oData.slice(0, 5));
}

check();
