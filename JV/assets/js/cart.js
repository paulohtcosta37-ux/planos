// JV Malhas Compressivas - Shopping Cart Manager
const CART_STORAGE_KEY = "jv_cart_items";

// Recupera os itens salvos no carrinho
export function getCartItems() {
  const itemsJson = localStorage.getItem(CART_STORAGE_KEY);
  return itemsJson ? JSON.parse(itemsJson) : [];
}

// Salva a lista de itens no LocalStorage
function saveCartItems(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  // Dispara evento global para atualizar as badges do carrinho nos outros componentes
  window.dispatchEvent(new Event("cartUpdated"));
}

// Adiciona um produto ao carrinho
export function addToCart(product, quantity = 1, size = "M", customMeasures = null) {
  const items = getCartItems();
  
  // Cria um hash de comparação para diferenciar itens com tamanhos ou medidas customizadas diferentes
  const isCustom = size === "Customizado" && customMeasures;
  const customKey = isCustom 
    ? `${customMeasures.busto || 0}-${customMeasures.cintura || 0}-${customMeasures.quadril || 0}`
    : "standard";
    
  // Tenta encontrar um item existente no carrinho com o mesmo ID, tamanho e medidas
  const existingIndex = items.findIndex(item => 
    item.id === product.id && 
    item.size === size && 
    (!isCustom || (item.customKey === customKey))
  );

  if (existingIndex > -1) {
    items[existingIndex].quantity += quantity;
  } else {
    items.push({
      id: product.id,
      code: product.code,
      name: product.name,
      price: product.price,
      quantity: quantity,
      size: size,
      customMeasures: customMeasures,
      customKey: customKey,
      image: product.images[0] || ""
    });
  }

  saveCartItems(items);
}

// Remove um item do carrinho
export function removeFromCart(productId, size, customKey = "standard") {
  let items = getCartItems();
  items = items.filter(item => 
    !(item.id === productId && item.size === size && item.customKey === customKey)
  );
  saveCartItems(items);
}

// Altera a quantidade de um item específico
export function updateCartItemQuantity(productId, size, customKey, quantity) {
  const items = getCartItems();
  const index = items.findIndex(item => 
    item.id === productId && item.size === size && item.customKey === customKey
  );
  
  if (index > -1) {
    items[index].quantity = Math.max(1, parseInt(quantity));
    saveCartItems(items);
  }
}

// Limpa todo o carrinho (após compra)
export function clearCart() {
  saveCartItems([]);
}

// Retorna totais do carrinho
export function getCartTotals() {
  const items = getCartItems();
  let count = 0;
  let subtotal = 0;
  
  for (const item of items) {
    count += item.quantity;
    subtotal += item.price * item.quantity;
  }
  
  return {
    count,
    subtotal
  };
}
