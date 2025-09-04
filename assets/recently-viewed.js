class RecentlyViewedProducts extends HTMLElement {
  constructor() {
    super();
    this.sectionId = this.dataset.sectionId;
    this.limit = parseInt(this.dataset.limit) || 4;
    this.storageKey = 'shopify-recently-viewed';
    
    this.init();
  }

  init() {
    this.addCurrentProduct();
    this.loadRecentlyViewed();
  }

  addCurrentProduct() {
    if (!window.location.pathname.includes('/products/')) return;
    
    const currentProductHandle = window.location.pathname.split('/products/')[1].split('?')[0];
    if (!currentProductHandle) return;

    let recentlyViewed = this.getRecentlyViewed();
    recentlyViewed = recentlyViewed.filter(handle => handle !== currentProductHandle);
    recentlyViewed.unshift(currentProductHandle);
    recentlyViewed = recentlyViewed.slice(0, 20);
    
    sessionStorage.setItem(this.storageKey, JSON.stringify(recentlyViewed));
  }

  getRecentlyViewed() {
    const stored = sessionStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  async loadRecentlyViewed() {
    const recentlyViewed = this.getRecentlyViewed();
    if (recentlyViewed.length === 0) return;

    const currentProductHandle = window.location.pathname.includes('/products/') 
      ? window.location.pathname.split('/products/')[1].split('?')[0]
      : null;
    
    const productsToShow = recentlyViewed
      .filter(handle => handle !== currentProductHandle)
      .slice(0, this.limit);

    if (productsToShow.length === 0) return;

    try {
      const productPromises = productsToShow.map(handle => this.fetchProduct(handle));
      const products = await Promise.all(productPromises);
      
      const validProducts = products.filter(product => product !== null);
      
      if (validProducts.length > 0) {
        await this.renderProducts(validProducts);
        this.showSection();
      }
    } catch (error) {
      console.error('Error loading recently viewed products:', error);
    }
  }

  async fetchProduct(handle) {
    try {
      // Direkt die recently-viewed-products Section mit dem spezifischen Produkt aufrufen
      const response = await fetch(`/products/${handle}?section_id=recently-viewed-products`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const html = await response.text();
      
      // Extrahiere nur den card-product Teil aus der Response
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Finde das erste list item mit der product card
      const cardElement = tempDiv.querySelector('.grid__item');
      
      return cardElement ? { handle, html: cardElement.innerHTML } : null;
    } catch (error) {
      console.error(`Error fetching product ${handle}:`, error);
      return null;
    }
  }

  async renderProducts(products) {
    const grid = this.querySelector('.recently-viewed-grid');
    if (!grid) return;

    grid.innerHTML = products.map(product => 
      `<li class="grid__item">${product.html}</li>`
    ).join('');
  }

  showSection() {
    const container = this.querySelector('.recently-viewed-container');
    if (container) {
      container.style.display = 'block';
    }
  }
}

customElements.define('recently-viewed-products', RecentlyViewedProducts);