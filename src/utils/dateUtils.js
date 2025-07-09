// Utilitários para formatação de datas
// Centralizando a lógica de formatação para evitar duplicação e inconsistências

/**
 * Formata uma data para exibição, lidando com diferentes tipos de entrada
 * @param {Date|Timestamp|string|number} dateInput - Data a ser formatada
 * @param {Object} options - Opções de formatação (opcional)
 * @returns {string} Data formatada ou mensagem de erro
 */
export const formatDate = (dateInput, options = {}) => {
  if (!dateInput) {
    return 'Data não disponível';
  }

  try {
    let date;
    
    // Se for um Timestamp do Firestore
    if (dateInput && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    }
    // Se for um objeto Date
    else if (dateInput instanceof Date) {
      date = dateInput;
    }
    // Se for uma string ou número
    else {
      date = new Date(dateInput);
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('Data inválida recebida:', dateInput);
      return 'Data inválida';
    }

    // Opções padrão
    const defaultOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    const formatOptions = { ...defaultOptions, ...options };
    return date.toLocaleDateString('pt-BR', formatOptions);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Erro na data';
  }
};

/**
 * Formata uma data de forma detalhada para telas de detalhes
 * @param {Date|Timestamp|string|number} dateInput - Data a ser formatada
 * @returns {Object} Objeto com data e hora formatadas separadamente
 */
export const formatDetailedDate = (dateInput) => {
  if (!dateInput) {
    return { date: 'Data não disponível', time: 'Horário não disponível' };
  }

  try {
    let date;
    
    // Se for um Timestamp do Firestore
    if (dateInput && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    }
    // Se for um objeto Date
    else if (dateInput instanceof Date) {
      date = dateInput;
    }
    // Se for uma string ou número
    else {
      date = new Date(dateInput);
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('Data inválida recebida:', dateInput);
      return { date: 'Data inválida', time: 'Horário inválido' };
    }

    const dateOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };
    
    const dateFormatted = date.toLocaleDateString('pt-BR', dateOptions);
    const timeFormatted = date.toLocaleTimeString('pt-BR', timeOptions);
    
    return { date: dateFormatted, time: timeFormatted };
  } catch (error) {
    console.error('Erro ao formatar data detalhada:', error, 'Input:', dateInput);
    return { date: 'Erro na data', time: 'Erro no horário' };
  }
};

/**
 * Formata data de forma compacta para listas
 * @param {Date|Timestamp|string|number} dateInput - Data a ser formatada
 * @returns {string} Data formatada de forma compacta
 */
export const formatCompactDate = (dateInput) => {
  return formatDate(dateInput, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Verifica se uma data é válida
 * @param {any} dateInput - Entrada a ser verificada
 * @returns {boolean} True se a data for válida
 */
export const isValidDate = (dateInput) => {
  try {
    let date;
    
    if (dateInput && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      date = new Date(dateInput);
    }
    
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};

/**
 * Converte diferentes tipos de entrada de data para objeto Date
 * @param {Date|Timestamp|string|number} dateInput - Data a ser convertida
 * @returns {Date|null} Objeto Date ou null se inválido
 */
export const toDate = (dateInput) => {
  try {
    let date;
    
    if (dateInput && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      date = new Date(dateInput);
    }
    
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Erro ao converter para Date:', error);
    return null;
  }
};
