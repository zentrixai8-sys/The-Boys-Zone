import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { readFileSync } from 'fs';

// Try to find .env file
const envPath = join(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('product_id, title, category, sub_category, sale_type, stock, variants')
    .eq('sale_type', 'Store')
    .limit(20);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log('--- Sample Products ---');
  products.forEach(p => {
    console.log(`ID: ${p.product_id}`);
    console.log(`Title: ${p.title}`);
    console.log(`Category: ${p.category}`);
    console.log(`Sub: ${p.sub_category}`);
    console.log(`Type: ${p.sale_type}`);
    console.log(`Stock: ${p.stock}`);
    console.log(`Variants: ${JSON.stringify(p.variants)}`);
    console.log('-------------------');
  });
}

checkProducts();
