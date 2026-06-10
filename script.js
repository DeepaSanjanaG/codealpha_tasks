function renderProducts(list) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `<p class="no-results">No products found.</p>`;
    return;
  }

  grid.innerHTML = list.map(p => `
    <div class="product-card" onclick="goToProduct(${p.id})">
      <div class="card-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <span class="category-tag">${p.category}</span>
      </div>
      <div class="card-body">
        <h3>${p.name}</h3>
        <p class="card-desc">${p.description.substring(0, 70)}...</p>
        <div class="card-footer">
          <span class="price">$${p.price.toFixed(2)}</span>
          <button class="add-btn" onclick="event.stopPropagation(); addToCart(${p.id})">Add to Cart</button>
        </div>
      </div>
    </div>
  `).join("");

  updateCartCount();
}

function filterProducts() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const filtered = products.filter(p => {
    const matchName = p.name.toLowerCase().includes(query);
    const matchCat = category === "all" || p.category === category;
    return matchName && matchCat;
  });
  renderProducts(filtered);
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  showToast();
  updateCartCount();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll("#cartCount").forEach(b => b.textContent = total);
}

function goToProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

function showToast() {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
});