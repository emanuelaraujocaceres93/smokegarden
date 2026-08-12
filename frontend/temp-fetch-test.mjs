const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdod2NtZGZ5Zm5jZnBjc2d1YXF6Iiwicm9zZSI6ImFub24iLCJpYXQiOjE3NzkyMjc4MDYsImV4cCI6MjA5NDgwMzgwNn0.tsxfz_-lClevfByZHeJxiFeOn2CpgFgKek7YOInMqBo';
const url = 'https://ghwcmdfyfncfpcsguaqz.supabase.co/rest/v1/products?select=id&limit=1';

fetch(url, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`
  }
})
  .then(async (res) => {
    console.log('status', res.status);
    console.log('text', await res.text());
  })
  .catch((err) => console.error(err));
