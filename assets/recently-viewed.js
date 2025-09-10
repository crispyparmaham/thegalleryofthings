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
    recentlyViewed = recentlyViewed.slice(0, 8);
    
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
      // Hole Produktdaten als JSON
      const response = await fetch(`/products/${handle}.js`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const product = await response.json();
      return product;
    } catch (error) {
      console.error(`Error fetching product ${handle}:`, error);
      return null;
    }
  }

  async renderProducts(products) {
    const grid = this.querySelector('.recently-viewed-grid');
    if (!grid) {
      console.error('Grid element not found');
      return;
    }

    console.log('Products to render:', products);

    // Verwende direkte HTML-Generierung mit renderFallbackCard
    const productCards = products.map(product => this.renderFallbackCard(product));
    
    const validCards = productCards.filter(card => card !== null);
    console.log('Valid cards count:', validCards.length);
    
    const finalHTML = validCards.map(cardHtml => 
      `<li class="grid__item">${cardHtml}</li>`
    ).join('');
    
    grid.innerHTML = finalHTML;
    
    console.log('Grid has content:', grid.children.length > 0);
  }

  renderFallbackCard(product) {
    const price = product.price ? (product.price / 100).toFixed(0) : '-';
    
    return `
      <div class="card-wrapper product-card-wrapper">
        <div class="card card--standard card--media">
          <div class="card__inner ratio" style="--ratio-percent: 100%;">
            <div class="card__media">
              <div class="media media--transparent">
                <img
                  src="${product.featured_image || ''}"
                  alt="${product.title || ''}"
                  loading="lazy"
                  width="300"
                  height="300"
                >
              </div>
            </div>
          </div>
          <div class="card__content">
            <div class="card__information">
              <h3 class="card__heading h5" style="margin-bottom:1rem;">
                <a href="/products/${product.handle}" class="full-unstyled-link">
                  ${product.title}
                </a>
              </h3>
              <div class="price">
                <span class="price-item">${price}€</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  showSection() {
    const container = this.querySelector('.recently-viewed-container');
    if (container) {
      console.log('Showing section container');
      container.style.display = 'block';
    } else {
      console.error('Container not found');
    }
  }
}

customElements.define('recently-viewed-products', RecentlyViewedProducts);