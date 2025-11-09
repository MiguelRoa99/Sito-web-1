// frontend/app.js
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'inventario_simple_v1';
  const THEME_KEY = 'theme_preference';

  const form = document.getElementById('itemForm');
  const nameInput = document.getElementById('name');
  const qtyInput = document.getElementById('qty');
  const priceInput = document.getElementById('price');
  const descInput = document.getElementById('desc');
  const imageInput = document.getElementById('imageInput');
  const preview = document.getElementById('preview');
  const itemsEl = document.getElementById('items');
  const clearBtn = document.getElementById('clearBtn');
  
  // Elementos de tema y búsqueda
  const themeToggle = document.getElementById('themeToggle');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  const modal = document.getElementById('modal');
  const e_imageInput = document.getElementById('e_imageInput');
  const e_preview = document.getElementById('e_preview');

  // Estado de filtro (item seleccionado desde búsqueda)
  let selectedItemId = null;
  const clearFilterBtn = document.getElementById('clearFilterBtn');

  let items = [];           // datos desde el servidor
  let currentImageData = null;
  let backendAvailable = true;

  // Inicializar tema
  initTheme();

  // carga inicial
  fetchItems().then(() => render());

  // --- Theme toggle ---
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem(THEME_KEY, newTheme);
    });
  }

  // --- Search functionality ---
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function performSearch(query) {
    if (!query.trim() || !searchResults) {
      if (searchResults) searchResults.classList.remove('active');
      return;
    }

    const results = items.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      (item.desc && item.desc.toLowerCase().includes(query.toLowerCase()))
    );

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-item">No se encontraron resultados</div>';
    } else {
      searchResults.innerHTML = results.map(item => `
        <div class="search-item" data-id="${item.id}">
          <div class="search-item-thumb">
            ${item.img 
              ? `<img src="${item.img}" alt="${item.name}">` 
              : '<div class="no-image">Sin imagen</div>'
            }
          </div>
          <div class="search-item-info">
            <div class="search-item-name">${item.name}</div>
            <div class="search-item-meta">
              Cantidad: ${item.qty} | Precio: ${formatCOP(item.price)}
            </div>
          </div>
        </div>
      `).join('');

      // Agregar listeners a los resultados: al hacer click, filtrar la lista principal
      searchResults.querySelectorAll('.search-item').forEach(el => {
        el.addEventListener('click', () => {
          const itemId = el.dataset.id;
          // Marcar item seleccionado para filtrar la lista
          selectedItemId = itemId;
          // Mostrar solo el item seleccionado
          render();
          // Mostrar botón para limpiar el filtro
          if (clearFilterBtn) clearFilterBtn.style.display = 'inline-flex';
          // Limpiar búsqueda
          if (searchInput) searchInput.value = '';
          if (searchResults) searchResults.classList.remove('active');
          // Llevar la vista a la lista
          if (itemsEl) itemsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }
    
    searchResults.classList.add('active');
  }

  const debouncedSearch = debounce(performSearch, 300);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim() && searchResults) {
        searchResults.classList.add('active');
      }
    });
  }

  // Cerrar resultados al hacer clic fuera
  if (searchResults) {
    document.addEventListener('click', (e) => {
      if (!searchResults.contains(e.target) && e.target !== searchInput) {
        searchResults.classList.remove('active');
      }
    });
  }
  // --- Image upload handlers ---
  imageInput.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return setPreview(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  });

  function setPreview(dataUrl) {
    currentImageData = dataUrl;
    preview.innerHTML = '';
    if (!dataUrl) {
      preview.innerHTML = '<span class="muted small">Sin imagen</span>';
      return;
    }
    const img = document.createElement('img');
    img.src = dataUrl;
    preview.appendChild(img);
  }

  // --- Form submit ---
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const priceVal = Number(priceInput.value) || 0;
    if (priceVal < 0) {
      alert('El precio debe ser un valor válido mayor o igual a 0.');
      return;
    }

    const item = {
      name: nameInput.value.trim(),
      qty: Number(qtyInput.value) || 0,
      price: priceVal,
      desc: descInput.value.trim(),
      img: currentImageData || null
    };

    try {
      const created = await addItem(item);
      // si backend responde, lo devolvemos; si no, se añadió en local fallback
      items.unshift(created);
      saveLocal(items);
      resetForm();
      render();
    } catch (err) {
      alert('No se pudo guardar en el servidor. Guardado localmente temporalmente.');
      // fallback local: genera id cliente
      const fallback = {
        id: 'local_' + Math.random().toString(36).slice(2,9),
        ...item,
        createdAt: new Date().toISOString()
      };
      items.unshift(fallback);
      saveLocal(items);
      resetForm();
      render();
    }
  });

  clearBtn.addEventListener('click', resetForm);

  function resetForm() {
    form.reset();
    currentImageData = null;
    setPreview(null);
    nameInput.focus();
  }

  function formatCOP(value) {
    const intVal = Math.round(Number(value) || 0);
    return `$${intVal.toLocaleString('es-CO')} COP`;
  }

  // --- Render items list ---
  function render() {
    itemsEl.innerHTML = '';
    const list = selectedItemId ? items.filter(i => i.id === selectedItemId) : items;

    if (!list.length) {
      itemsEl.innerHTML = '<div class="muted" style="padding:12px">No hay items. Agrega uno usando el formulario.</div>';
      return;
    }

    // Mostrar/ocultar botón limpiar filtro
    if (clearFilterBtn) {
      clearFilterBtn.style.display = selectedItemId ? 'inline-flex' : 'none';
    }

    list.forEach(it => {
      const card = document.createElement('div');
      card.className = 'item';
      card.setAttribute('data-id', it.id);

      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      if (it.img) {
        const img = document.createElement('img');
        img.src = it.img;
        thumb.appendChild(img);
      } else {
        thumb.innerHTML = '<div style="padding:6px;color:var(--muted);font-size:12px">Sin imagen</div>';
      }

  const meta = document.createElement('div');
  meta.className = 'meta';

  // título
  const h = document.createElement('h3');
  h.textContent = it.name;

  // info horizontal (cantidad + precio)
  const info = document.createElement('div');
  info.className = 'info';

  const qtyDiv = document.createElement('div');
  qtyDiv.className = 'info-item';
  qtyDiv.innerHTML = `<strong>Cantidad:</strong> ${it.qty}`;

  const priceDiv = document.createElement('div');
  priceDiv.className = 'info-item';
  priceDiv.innerHTML = `<strong>Precio:</strong> ${formatCOP(it.price || 0)}`;

  info.appendChild(qtyDiv);
  info.appendChild(priceDiv);

  // descripción como párrafo separado (permitir justificarse horizontalmente)
  const descP = document.createElement('p');
  descP.className = 'desc';
  descP.textContent = it.desc || '';

  meta.appendChild(h);
  meta.appendChild(info);
  meta.appendChild(descP);

      const actions = document.createElement('div');
      actions.className = 'actions';
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Editar';
      editBtn.className = 'ghost';
      editBtn.addEventListener('click', () => openEdit(it.id));
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Eliminar';
      delBtn.addEventListener('click', async () => {
        if (!confirm('Eliminar este item?')) return;
        try {
          await deleteItem(it.id);
          items = items.filter(x => x.id !== it.id);
          saveLocal(items);
          render();
        } catch (err) {
          alert('No se pudo eliminar en servidor. Se eliminó localmente.');
          items = items.filter(x => x.id !== it.id);
          saveLocal(items);
          render();
        }
      });
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      card.appendChild(thumb);
      card.appendChild(meta);
      card.appendChild(actions);
      itemsEl.appendChild(card);
    });
  }

  // Botón para limpiar el filtro y volver a la lista completa
  if (clearFilterBtn) {
    clearFilterBtn.addEventListener('click', () => {
      selectedItemId = null;
      if (clearFilterBtn) clearFilterBtn.style.display = 'none';
      render();
      // enfocar campo búsqueda opcional
      if (searchInput) searchInput.focus();
    });
  }

  // --- Edit modal ---
  let e_currentId = null;
  let e_currentImage = null;

  function openEdit(id) {
    const it = items.find(x => x.id === id);
    if (!it) return;
    const eName = document.getElementById('e_name');
    const eQty = document.getElementById('e_qty');
    const ePrice = document.getElementById('e_price');
    const eDesc = document.getElementById('e_desc');
    if (eName) eName.value = it.name;
    if (eQty) eQty.value = it.qty;
    if (ePrice) ePrice.value = it.price;
    if (eDesc) eDesc.value = it.desc;

    e_currentId = it.id;
    setEditPreview(it.img);
    if (modal) {
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  function setEditPreview(url) {
    e_currentImage = url;
    if (!e_preview) return;
    e_preview.innerHTML = '';
    if (!url) {
      e_preview.innerHTML = '<span class="muted small">Sin imagen</span>';
      return;
    }
    const i = document.createElement('img');
    i.src = url;
    e_preview.appendChild(i);
  }

  if (e_imageInput) {
    e_imageInput.addEventListener('change', e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return setEditPreview(null);
      const r = new FileReader();
      r.onload = () => setEditPreview(r.result);
      r.readAsDataURL(f);
    });
  }

  const closeModalBtn = document.getElementById('closeModal');
  if (closeModalBtn) closeModalBtn.addEventListener('click', () => {
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
    e_currentId = null;
  });

  const saveEditBtn = document.getElementById('saveEdit');
  if (saveEditBtn) saveEditBtn.addEventListener('click', async () => {
    const idx = items.findIndex(x => x.id === e_currentId);
    if (idx === -1) return;
    const eName = document.getElementById('e_name');
    const eQty = document.getElementById('e_qty');
    const ePrice = document.getElementById('e_price');
    const eDesc = document.getElementById('e_desc');

    const updated = {
      ...items[idx],
      name: eName ? eName.value.trim() : items[idx].name,
      qty: eQty ? Number(eQty.value) || 0 : items[idx].qty,
      price: ePrice ? Number(ePrice.value) || 0 : items[idx].price,
      desc: eDesc ? eDesc.value.trim() : items[idx].desc,
      img: e_currentImage || null
    };

    try {
      const res = await updateItem(e_currentId, updated);
      items[idx] = res;
      saveLocal(items);
      render();
    } catch (err) {
      alert('No se pudo actualizar en servidor. Se actualizó localmente.');
      items[idx] = updated;
      saveLocal(items);
      render();
    }

    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
    e_currentId = null;
  });

  // --- Storage helpers & API calls ---

  function saveLocal(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  async function fetchItems() {
    try {
      const res = await fetch('/api/items');
      if (!res.ok) throw new Error('bad resp');
      const json = await res.json();
      items = json.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      backendAvailable = true;
      // merge with local fallback items (those with id starting 'local_')
      const local = loadLocal().filter(i => (i.id || '').startsWith('local_'));
      if (local.length) {
        // POST them to server
        for (const l of local) {
          try {
            const posted = await addItem({
              name: l.name, qty: l.qty, price: l.price, desc: l.desc, img: l.img
            });
            items.unshift(posted);
          } catch(e){ /* ignore */ }
        }
        // clear local fallback
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      backendAvailable = false;
      // si servidor no responde, cargar copia local si existe
      items = loadLocal();
    }
  }

  async function addItem(item) {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('no add');
    return await res.json();
  }

  async function updateItem(id, item) {
    const res = await fetch('/api/items/' + encodeURIComponent(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('no update');
    return await res.json();
  }

  async function deleteItem(id) {
    const res = await fetch('/api/items/' + encodeURIComponent(id), {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('no delete');
    return;
  }
});
