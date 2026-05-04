const url = "https://tufyfgsdffxgbpgvkgri.supabase.co/rest/v1/categories?category_name=eq.DEBUG_HANDLER_CRASH&select=*";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZnlmZ3NkZmZ4Z2JwZ3ZrZ3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzM0OTksImV4cCI6MjA4NzYwOTQ5OX0.Gy48LKPenE6ncQV-pCCYfxDNsNHGWchrYYBs-kgBzIo";

fetch(url, {
  headers: {
    "apikey": key,
    "Authorization": `Bearer ${key}`
  }
})
.then(res => res.json())
.then(console.log);
