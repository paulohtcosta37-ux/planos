// Javascript para o site Planos - Interações e Simulações

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. DASHBOARD INTERATIVO (GOOGLE MEU NEGÓCIO)
  // ==========================================
  const toggleAntes = document.getElementById('toggleAntes');
  const toggleDepois = document.getElementById('toggleDepois');
  
  const valViews = document.getElementById('valViews');
  const valActions = document.getElementById('valActions');
  const valReviews = document.getElementById('valReviews');
  
  const trendViews = document.getElementById('trendViews');
  const trendActions = document.getElementById('trendActions');
  const trendReviews = document.getElementById('trendReviews');
  
  const barViews = document.getElementById('barViews');
  const barActions = document.getElementById('barActions');
  const barReviews = document.getElementById('barReviews');
  
  const labelViews = document.getElementById('labelViews');
  const labelActions = document.getElementById('labelActions');
  const labelReviews = document.getElementById('labelReviews');

  const updateGMB = (type) => {
    if (type === 'antes') {
      toggleAntes.classList.add('active');
      toggleDepois.classList.remove('active');
      
      // Valores
      valViews.innerText = '1.240';
      valActions.innerText = '42';
      valReviews.innerText = '3.8 ★';
      
      // Tendências
      trendViews.innerHTML = '<span class="trend-down">↓ Estacionário</span>';
      trendActions.innerHTML = '<span class="trend-down">↓ Baixa Interação</span>';
      trendReviews.innerHTML = '<span class="trend-down">12 avaliações</span>';
      
      // Barras de Gráfico (Alturas)
      barViews.style.height = '25px';
      barActions.style.height = '15px';
      barReviews.style.height = '40px';
      
      // Labels de Texto nas Barras
      labelViews.innerText = '1.2k';
      labelActions.innerText = '42';
      labelReviews.innerText = '12';
    } else {
      toggleDepois.classList.add('active');
      toggleAntes.classList.remove('active');
      
      // Valores
      valViews.innerText = '6.850';
      valActions.innerText = '284';
      valReviews.innerText = '4.9 ★';
      
      // Tendências
      trendViews.innerHTML = '<span class="trend-up">↑ +452% Crescimento</span>';
      trendActions.innerHTML = '<span class="trend-up">↑ +576% Cliques/Ligações</span>';
      trendReviews.innerHTML = '<span class="trend-up">↑ 84 avaliações</span>';
      
      // Barras de Gráfico (Alturas)
      barViews.style.height = '140px';
      barActions.style.height = '110px';
      barReviews.style.height = '90px';
      
      // Labels de Texto nas Barras
      labelViews.innerText = '6.8k';
      labelActions.innerText = '284';
      labelReviews.innerText = '84';
    }
  };

  // Event Listeners
  if (toggleAntes && toggleDepois) {
    toggleAntes.addEventListener('click', () => updateGMB('antes'));
    toggleDepois.addEventListener('click', () => updateGMB('depois'));
  }


  // ==========================================
  // 2. SIMULADOR DE LEAD PAGES (CONVERSÃO)
  // ==========================================
  const visitorRange = document.getElementById('visitorRange');
  const visitorCountLabel = document.getElementById('visitorCountLabel');
  
  const leadsBad = document.getElementById('leadsBad');
  const leadsGood = document.getElementById('leadsGood');
  const extraLeadsNote = document.getElementById('extraLeadsNote');

  const calculateLeads = () => {
    const visitors = parseInt(visitorRange.value);
    
    // Atualiza label de visitantes
    visitorCountLabel.innerText = visitors.toLocaleString('pt-BR');
    
    // Site Comum: ~1.5% de conversão
    const badLeads = Math.round(visitors * 0.015);
    // Lead Page Planos: ~16.5% de conversão
    const goodLeads = Math.round(visitors * 0.165);
    const difference = goodLeads - badLeads;

    leadsBad.innerText = badLeads;
    leadsGood.innerText = goodLeads;
    extraLeadsNote.innerText = `+${difference} contatos qualificados e oportunidades de venda adicionais!`;
  };

  if (visitorRange) {
    visitorRange.addEventListener('input', calculateLeads);
    // Inicialização
    calculateLeads();
  }


  // ==========================================
  // 3. FORMULÁRIO DE CONTATO (SIMULAÇÃO DE SUCESSO)
  // ==========================================
  const contactForm = document.getElementById('planosContactForm');
  const successOverlay = document.getElementById('successOverlay');

  if (contactForm && successOverlay) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Simula envio
      const submitBtn = contactForm.querySelector('.form-submit-btn');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="material-symbols-rounded" style="animation: spin 1s linear infinite">autorenew</span> Enviando...';
      submitBtn.disabled = true;

      setTimeout(() => {
        // Exibe o overlay de sucesso
        successOverlay.classList.add('active');
        
        // Limpa o form
        contactForm.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Fecha o overlay após 4 segundos
        setTimeout(() => {
          successOverlay.classList.remove('active');
        }, 4000);

      }, 1500);
    });
  }


  // ==========================================
  // 4. ANIMAÇÕES DE REVELAÇÃO NO SCROLL
  // ==========================================
  const revealElements = document.querySelectorAll('.glass-panel');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => {
    // Estado inicial de animação se suportado
    el.style.opacity = '0';
    el.style.transform = 'translateY(25px)';
    el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(el);
  });

  // Inicializa o Dashboard com a visualização 'depois' (com otimização, persuasivo!)
  updateGMB('depois');
});
