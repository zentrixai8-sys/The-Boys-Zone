import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tufyfgsdffxgbpgvkgri.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZnlmZ3NkZmZ4Z2JwZ3ZrZ3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzM0OTksImV4cCI6MjA4NzYwOTQ5OX0.Gy48LKPenE6ncQV-pCCYfxDNsNHGWchrYYBs-kgBzIo'
);

async function check() {
  const { data, error } = await supabase.from('products').select('*').eq('product_id', 'e3f81a69-dfed-4e34-b0cc-6ad391797e74').single();
  if (error) console.error(error);
  console.log("product.images:", typeof data.images, data.images);
  console.log("product.variants:", typeof data.variants, JSON.stringify(data.variants, null, 2));
}

check();
