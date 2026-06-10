# Itaúna Negócios - Inteligência Comercial Diária

Um portal moderno e translúcido de notícias e análises de impacto comercial para comerciantes, prestadores de serviço e empreendedores da cidade de Itaúna-MG.

O projeto consiste em duas partes principais:
1. **Frontend (Site)**: Uma interface estilo Apple (Light Glassmorphism, tons de azul) com um carrossel horizontal de datas e layout Bento Box, exibindo as notícias diárias e suas respectivas dicas práticas e oportunidades de monetização.
2. **Agente de IA (Python)**: Um script que faz web scraping nos portais de notícias de Itaúna (Santana FM e Jornal de Itaúna) e utiliza a API do Google Gemini para analisar os impactos econômicos e gerar os relatórios formatados em JSON.

---

## 🚀 Como Rodar o Site Localmente

Como o projeto foi construído usando tecnologias web modernas nativas (ES Modules e CSS Vanilla), você não precisa instalar o Node.js. 

Para rodar o servidor local e ver o site em funcionamento:
1. Abra um terminal na pasta do projeto.
2. Execute o servidor embutido do Python:
   ```bash
   py -m http.server 8000
   ```
3. Abra o seu navegador e acesse:
   [http://localhost:8000](http://localhost:8000)

---

## 🤖 Como Executar o Agente de IA para Gerar Notícias

O agente pesquisa notícias, analisa impactos e salva tudo em um arquivo JSON diário (ex: `src/data/news/news_2026-06-10.json`) que o site lê automaticamente ao selecionar a data correspondente.

### 1. Configurar Chave do Gemini (Opcional)
Se você deseja que o agente faça análises reais com inteligência artificial, você precisará de uma chave de API do Google Gemini (gratuita).
1. Obtenha sua chave no [Google AI Studio](https://aistudio.google.com/).
2. Duplique o arquivo `agent/.env.example` e renomeie-o para `agent/.env`.
3. Insira sua chave de API na variável `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   ```

*Nota: Se você não configurar a chave, o agente entrará automaticamente em **Modo Simulação (Mock)** e continuará gerando relatórios de negócios diários plausíveis e detalhados de Itaúna para você testar o site.*

### 2. Rodar o Agente
Com o terminal na pasta do projeto, execute o script do agente:

```bash
# Execução padrão (para a data de hoje)
py agent/generate_news.py

# Para forçar o Modo Simulação (mesmo se tiver chave configurada)
py agent/generate_news.py --mock

# Para gerar notícias de uma data retroativa específica (formato AAAA-MM-DD)
py agent/generate_news.py --date 2026-06-05
```

---

## 📁 Estrutura de Pastas do Projeto

* `index.html` - Página principal do site.
* `src/css/style.css` - Estilização visual (Glassmorphism, Bento Grid e Fontes).
* `src/js/app.js` - Controladora principal (renderização e controle de eventos do Modal e do Carrossel).
* `src/js/utils.js` - Funções utilitárias de formatação de datas e busca de JSONs.
* `src/data/news/` - Pasta contendo os arquivos JSON gerados pelo agente para cada dia.
* `agent/` - Contém o script Python do agente, requisitos e configurações de API.
