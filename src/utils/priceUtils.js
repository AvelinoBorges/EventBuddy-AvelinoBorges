/**
 * Utilitário para formatação de preços
 * Garante consistência na exibição de preços em toda a aplicação
 */

/**
 * Formata um preço para exibição
 * @param {number|string} price - O preço a ser formatado
 * @returns {string} - O preço formatado ou "Gratuito" se for 0
 */
export const formatPrice = (price) => {
  // Se o preço é null, undefined, 0, "0" ou string vazia
  if (!price || price === 0 || price === '0' || price === '') {
    return 'Gratuito';
  }
  
  // Se já é uma string que contém "Gratuito"
  if (typeof price === 'string' && price.toLowerCase().includes('gratuito')) {
    return 'Gratuito';
  }
  
  // Se é um número ou string numérica
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return 'Gratuito';
  }
  
  // Formatar como moeda (€ para euros)
  return `€${numericPrice.toFixed(2).replace('.00', '')}`;
};

/**
 * Verifica se um evento é gratuito
 * @param {number|string} price - O preço a ser verificado
 * @returns {boolean} - true se o evento for gratuito
 */
export const isFreeEvent = (price) => {
  if (!price || price === 0 || price === '0' || price === '') {
    return true;
  }
  
  if (typeof price === 'string' && price.toLowerCase().includes('gratuito')) {
    return true;
  }
  
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numericPrice) || numericPrice <= 0;
};

/**
 * Obtém o label do preço (para usar em labels)
 * @param {number|string} price - O preço
 * @returns {string} - "Gratuito" ou "Preço"
 */
export const getPriceLabel = (price) => {
  return isFreeEvent(price) ? 'Gratuito' : 'Preço';
};

/**
 * Obtém o valor do preço formatado (para exibir o valor)
 * @param {number|string} price - O preço
 * @returns {string|null} - O preço formatado ou null se for gratuito
 */
export const getPriceValue = (price) => {
  return isFreeEvent(price) ? null : formatPrice(price);
};
