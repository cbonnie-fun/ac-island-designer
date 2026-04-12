const fetch = require("node:fetch");
fetch("http://localhost:3000/api/design", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    image: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
    keywords: ["fairycore", "pink"]
  })
}).then(r => r.json()).then(console.log).catch(console.error);
