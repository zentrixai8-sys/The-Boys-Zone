const url = 'https://tufyfgsdffxgbpgvkgri.supabase.co/rest/v1/';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZnlmZ3NkZmZ4Z2JwZ3ZrZ3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzM0OTksImV4cCI6MjA4NzYwOTQ5OX0.Gy48LKPenE6ncQV-pCCYfxDNsNHGWchrYYBs-kgBzIo';

async function check() {
  // We can fetch one order and use the Prefer header to get the exact schema back on insert
  const payload = {
    user_id: 'b718086f-2e3b-4460-9dd8-33367d30aa2f', // Valid UUID
    products: JSON.stringify([{ product_id: '123', quantity: 1 }]),
    total_amount: 100,
    payment_id: 'pay_test456',
    payment_status: 'Paid',
    order_status: 'Processing',
    address: '',
    date: new Date().toISOString()
  };

  const res = await fetch('https://tufyfgsdffxgbpgvkgri.supabase.co/rest/v1/orders', {
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
  console.log(data);
}

check();
