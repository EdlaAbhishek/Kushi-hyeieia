const url = "https://jkidsjmbdidryxzwwlld.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWRzam1iZGlkcnl4end3bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjE0MzYsImV4cCI6MjA4NzMzNzQzNn0.eUSBh9yf7lf3OQQlcebhSsmz046lcsO6QcTrl6IVUJc";

fetch(url)
  .then(r => r.json())
  .then(data => {
    if (data.definitions) {
      console.log("Tables/Views:");
      Object.entries(data.definitions).forEach(([name, def]) => {
         console.log(`- ${name}: ${Object.keys(def.properties || {}).join(', ')}`);
      });
    } else {
      console.log('No definitions found:', data);
    }
  })
  .catch(err => console.error("Error fetching:", err));
