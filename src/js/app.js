import { formatISODate, getWeekdayName, getMonthName, fetchNewsByDate } from './utils.js';

// ==========================================================================
// ESTADO DA APLICAÇÃO
// ==========================================================================
const state = {
  selectedDate: new Date(), // Inicialmente hoje
  datesList: [],            // Últimos 14 dias
  currentNews: []           // Notícias do dia selecionado
};

// Elementos do DOM
const dateTimeline = document.getElementById('dateTimeline');
const calendarBtn = document.getElementById('calendarBtn');
const hiddenDateInput = document.getElementById('hiddenDateInput');
const newsGrid = document.getElementById('newsGrid');
const loaderContainer = document.getElementById('loaderContainer');
const emptyState = document.getElementById('emptyState');
const emptyStateMessage = document.getElementById('emptyStateMessage');
const newsModal = document.getElementById('newsModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');

// ==========================================================================
// INICIALIZAÇÃO
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupDatesList();
  renderDateTimeline();
  setupEventListeners();
  
  // Carregar notícias para a data inicial (hoje)
  loadNewsForDate(state.selectedDate);
});

// ==========================================================================
// LÓGICA DE DATAS E LINHA DO TEMPO
// ==========================================================================

/**
 * Preenche a lista com os últimos 14 dias (a partir de hoje para trás)
 */
function setupDatesList() {
  state.datesList = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    state.datesList.push(d);
  }
}

/**
 * Renderiza o carrossel de datas no topo
 */
function renderDateTimeline() {
  dateTimeline.innerHTML = '';
  
  state.datesList.forEach((date) => {
    const isoString = formatISODate(date);
    const isSelected = formatISODate(state.selectedDate) === isoString;
    
    const dateItem = document.createElement('div');
    dateItem.className = `date-item ${isSelected ? 'active' : ''}`;
    dateItem.dataset.date = isoString;
    
    dateItem.innerHTML = `
      <span class="date-item-weekday">${getWeekdayName(date)}</span>
      <span class="date-item-day">${date.getDate()}</span>
      <span class="date-item-month">${getMonthName(date)}</span>
    `;
    
    dateItem.addEventListener('click', () => {
      selectDate(date);
      dateItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
    
    dateTimeline.appendChild(dateItem);
  });
}

/**
 * Modifica a data selecionada no estado e atualiza os componentes
 * @param {Date} date 
 */
function selectDate(date) {
  state.selectedDate = date;
  
  // Atualizar classe ativa na timeline
  const isoString = formatISODate(date);
  const items = dateTimeline.querySelectorAll('.date-item');
  let found = false;
  
  items.forEach(item => {
    if (item.dataset.date === isoString) {
      item.classList.add('active');
      found = true;
    } else {
      item.classList.remove('active');
    }
  });

  // Se a data selecionada não estiver na lista padrão (ex: escolhida via calendário)
  if (!found) {
    // Adiciona no início da lista para manter visível e renderiza novamente
    state.datesList.unshift(date);
    renderDateTimeline();
  }
  
  // Atualizar input do calendário invisível
  hiddenDateInput.value = isoString;
  
  // Carrega as notícias
  loadNewsForDate(date);
}

// ==========================================================================
// CARREGAMENTO E RENDERIZAÇÃO DE DADOS
// ==========================================================================

/**
 * Busca notícias no diretório local e as renderiza
 * @param {Date} date 
 */
async function loadNewsForDate(date) {
  const isoString = formatISODate(date);
  
  // Exibe o loader e limpa tela
  newsGrid.style.display = 'none';
  emptyState.style.display = 'none';
  loaderContainer.style.display = 'flex';
  
  const news = await fetchNewsByDate(isoString);
  
  loaderContainer.style.display = 'none';
  
  if (news && news.length > 0) {
    state.currentNews = news;
    renderNewsGrid(news);
    newsGrid.style.display = 'grid';
  } else {
    state.currentNews = [];
    showEmptyState(isoString);
  }
}

/**
 * Exibe a mensagem de ausência de notícias estilizada
 * @param {string} isoString 
 */
function showEmptyState(isoString) {
  // Ajuste de mensagem amigável com a data formatada em PT-BR
  const [year, month, day] = isoString.split('-');
  const formattedDateStr = `${day}/${month}/${year}`;
  
  emptyStateMessage.innerHTML = `Não há análises do comércio cadastradas para o dia <strong>${formattedDateStr}</strong>.<br>Para gerar relatórios diários de mercado, execute o agente de IA no terminal.`;
  emptyState.style.display = 'flex';
}

/**
 * Renderiza o Grid de Notícias no formato Bento Box
 * @param {Array} newsList 
 */
function renderNewsGrid(newsList) {
  newsGrid.innerHTML = '';
  
  newsList.forEach((newsItem) => {
    const card = document.createElement('article');
    
    // Classes de estilização base
    const impactClass = `impact-${newsItem.impactLevel.toLowerCase()}`;
    const bentoClass = newsItem.impactLevel === 'Alto' ? 'bento-high' : '';
    card.className = `news-card ${impactClass} ${bentoClass}`;
    
    // Conteúdo interno do card
    card.innerHTML = `
      <div class="card-header-tags">
        <span class="category-tag">${newsItem.category}</span>
        <span class="impact-badge" aria-label="Nível de impacto comercial: ${newsItem.impactLevel}">
          ${newsItem.impactLevel} Impacto
        </span>
      </div>
      
      <div class="card-body-content">
        <h3 class="card-title">${newsItem.title}</h3>
        <p class="card-summary">${newsItem.executiveSummary}</p>
      </div>
      
      <div class="card-footer">
        <span class="read-more-text">
          Ver análise investigativa <span class="material-symbols-rounded">arrow_right_alt</span>
        </span>
      </div>
    `;
    
    // Clique para abrir modal
    card.addEventListener('click', () => openModal(newsItem));
    
    newsGrid.appendChild(card);
  });
}

// ==========================================================================
// CONTROLE DO MODAL DE DETALHES
// ==========================================================================

/**
 * Preenche e abre o modal de detalhes estilo iOS
 * @param {Object} newsItem 
 */
function openModal(newsItem) {
  // Preencher textos do modal
  document.getElementById('modalCategory').innerText = newsItem.category;
  document.getElementById('modalTitle').innerText = newsItem.title;
  document.getElementById('modalSummary').innerText = newsItem.executiveSummary;
  
  // Formatar análise investigativa (processa quebras de linha para parágrafos)
  const analysisText = newsItem.investigativeAnalysis || "Nenhuma análise aprofundada fornecida.";
  document.getElementById('modalAnalysis').innerHTML = analysisText.split('\n').map(p => `<p style="margin-bottom:12px;">${p}</p>`).join('');
  
  // Formatar Como Agir e Como Lucrar
  document.getElementById('modalHowToAct').innerHTML = formatTextList(newsItem.howToAct || "Nenhuma recomendação registrada.");
  document.getElementById('modalHowToProfit').innerHTML = formatTextList(newsItem.howToProfit || "Nenhum insight de monetização registrado.");
  
  // Estilizar o badge de impacto no modal
  const modalImpact = document.getElementById('modalImpact');
  modalImpact.innerText = `${newsItem.impactLevel} Impacto`;
  
  // Limpar classes antigas de impacto e aplicar a correta
  modalImpact.className = 'modal-impact-badge';
  if (newsItem.impactLevel === 'Alto') {
    modalImpact.style.backgroundColor = 'var(--impact-high-bg)';
    modalImpact.style.color = 'var(--impact-high)';
    modalImpact.style.setProperty('--impact-color', 'var(--impact-high)');
  } else if (newsItem.impactLevel === 'Médio') {
    modalImpact.style.backgroundColor = 'var(--impact-medium-bg)';
    modalImpact.style.color = 'var(--impact-medium)';
    modalImpact.style.setProperty('--impact-color', 'var(--impact-medium)');
  } else {
    modalImpact.style.backgroundColor = 'var(--impact-low-bg)';
    modalImpact.style.color = 'var(--impact-low)';
    modalImpact.style.setProperty('--impact-color', 'var(--impact-low)');
  }
  
  // Injetar o ponto indicador colorido do badge usando folha de estilo inline dinâmica
  modalImpact.innerHTML = `<span class="material-symbols-rounded" style="font-size:12px; color:var(--impact-color);">fiber_manual_record</span> ${newsItem.impactLevel} Impacto`;

  // Exibir o modal
  newsModal.classList.add('active');
  newsModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // Trava scroll da página
}

/**
 * Fecha o modal
 */
function closeModal() {
  newsModal.classList.remove('active');
  newsModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = ''; // Destrava scroll da página
}

/**
 * Transforma parágrafos numerados em listas HTML ordenadas ou parágrafos
 * @param {string} text 
 */
function formatTextList(text) {
  if (text.includes('\n')) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    // Verifica se parece uma lista numerada (ex: "1. Item")
    if (/^\d+\./.test(lines[0])) {
      return `<ol>${lines.map(line => `<li>${line.replace(/^\d+\.\s*/, '')}</li>`).join('')}</ol>`;
    } else {
      return `<ul>${lines.map(line => `<li>${line.replace(/^-\s*/, '')}</li>`).join('')}</ul>`;
    }
  }
  return `<p>${text}</p>`;
}

// ==========================================================================
// CONFIGURAÇÃO DE EVENTOS
// ==========================================================================
function setupEventListeners() {
  // Configurar clique do botão de calendário para acionar o input hidden
  calendarBtn.addEventListener('click', () => {
    hiddenDateInput.showPicker ? hiddenDateInput.showPicker() : hiddenDateInput.click();
  });
  
  // Tratar alteração da data no calendário nativo
  hiddenDateInput.addEventListener('change', (e) => {
    if (e.target.value) {
      // Ajustar string de data UTC para fuso local para evitar problemas de fuso no Date
      const [year, month, day] = e.target.value.split('-');
      const selectedDateObj = new Date(year, month - 1, day);
      selectDate(selectedDateObj);
    }
  });

  // Fechar modal no botão fechar
  modalCloseBtn.addEventListener('click', closeModal);

  // Fechar modal ao clicar fora do card (no overlay)
  newsModal.addEventListener('click', (e) => {
    if (e.target === newsModal) {
      closeModal();
    }
  });

  // Fechar modal no teclado (ESC)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && newsModal.classList.contains('active')) {
      closeModal();
    }
  });
}
