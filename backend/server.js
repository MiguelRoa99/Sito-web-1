// backend/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const DATA_FILE = path.join(__dirname, 'data.json');
const PORT = process.env.PORT || 3000;

app.use(express.json({limit: '10mb'})); // permitir base64 images
app.use((req, res, next) => {
  // Simple CORS (aunque nginx proxyará, también es útil para desarrollo directo)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function readData(){
  try{
    const raw = fs.readFileSync(DATA_FILE,'utf8');
    return JSON.parse(raw || '[]');
  }catch(e){
    return [];
  }
}
function writeData(data){
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

let items = readData();

// endpoints
app.get('/api/items', (req, res) => {
  items = readData();
  res.json(items);
});

app.post('/api/items', (req, res) => {
  const { name, qty, price, desc, img } = req.body;
  const id = 'id_' + Math.random().toString(36).slice(2,9);
  const createdAt = new Date().toISOString();
  const it = { id, name, qty: Number(qty)||0, price: Number(price)||0, desc: desc||'', img: img||null, createdAt };
  items.unshift(it);
  writeData(items);
  res.status(201).json(it);
});

app.put('/api/items/:id', (req, res) => {
  const id = req.params.id;
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({error:'not found'});
  const { name, qty, price, desc, img } = req.body;
  items[idx] = { ...items[idx], name, qty: Number(qty)||0, price: Number(price)||0, desc: desc||'', img: img||null };
  writeData(items);
  res.json(items[idx]);
});

app.delete('/api/items/:id', (req, res) => {
  const id = req.params.id;
  const before = items.length;
  items = items.filter(i => i.id !== id);
  if (items.length === before) return res.status(404).json({error:'not found'});
  writeData(items);
  res.status(204).send();
});

// health
app.get('/_health', (req, res) => res.json({ok:true}));

app.listen(PORT, () => {
  console.log('API escuchando en puerto', PORT);
});
