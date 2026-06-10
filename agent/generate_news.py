#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
AGENTE DE INTELIGÊNCIA COMERCIAL - ITAÚNA NEGÓCIOS
Busca notícias locais, realiza web scraping, analisa impactos com a IA Google Gemini
e salva os dados estruturados no banco de dados estático JSON do site.
"""

import os
import sys
import json
import uuid
import argparse
import datetime
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Carregar variáveis do arquivo .env
load_dotenv()

# Configuração de caminhos
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(BASE_DIR, 'src', 'data', 'news')

# Garantir que a pasta de destino exista
os.makedirs(DATA_DIR, exist_ok=True)

# Headers para evitar bloqueio nos portais de scraping
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# ==========================================================================
# RASPAGEM DE DADOS (WEB SCRAPING)
# ==========================================================================

def scrape_santana_fm():
    """Raspagem de notícias recentes do Portal Santana FM (Itaúna)"""
    url = "https://santanafm.com.br/"
    print(f"[*] Raspando notícias de: {url}")
    articles = []
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        if response.status_code != 200:
            print(f"[!] Erro ao acessar Santana FM: Código {response.status_code}")
            return []
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Estrutura comum de posts no WordPress do portal Santana FM
        # Busca por blocos de artigos (geralmente tags <article> ou classes post/entry)
        post_elements = soup.find_all(['article', 'div'], class_=['post', 'type-post', 'td_module_wrap'])[:8]
        
        for elem in post_elements:
            title_tag = elem.find(['h1', 'h2', 'h3', 'h4'], class_=['entry-title', 'td-module-title'])
            if not title_tag:
                title_tag = elem.find('a')
                
            summary_tag = elem.find(['div', 'p'], class_=['entry-summary', 'td-excerpt'])
            
            if title_tag and title_tag.text.strip():
                title = title_tag.text.strip()
                link = title_tag.find('a')['href'] if title_tag.find('a') else url
                summary = summary_tag.text.strip() if summary_tag else ""
                articles.append({
                    'source': 'Santana FM',
                    'title': title,
                    'summary': summary,
                    'link': link
                })
                
        print(f"[+] Santana FM: {len(articles)} notícias encontradas.")
    except Exception as e:
        print(f"[!] Falha na raspagem da Santana FM: {e}")
        
    return articles


def scrape_jornal_de_itauna():
    """Raspagem de notícias recentes do Jornal de Itaúna"""
    url = "https://jornaldeitauna.com.br/"
    print(f"[*] Raspando notícias de: {url}")
    articles = []
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        if response.status_code != 200:
            print(f"[!] Erro ao acessar Jornal de Itaúna: Código {response.status_code}")
            return []
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Busca por títulos e artigos baseados em tags comuns de notícias
        posts = soup.find_all(['article', 'div', 'section'], class_=['post', 'hentry', 'entry', 'ast-archive-post'])[:8]
        if not posts:
            # Fallback para links com títulos em blocos de manchete
            posts = soup.find_all('h2', class_=['entry-title'])[:8]
            
        for post in posts:
            link_tag = post.find('a') if post.name != 'a' else post
            if link_tag and link_tag.text.strip():
                title = link_tag.text.strip()
                link = link_tag['href']
                
                # Tenta pegar um resumo próximo
                summary = ""
                parent = post.parent
                summary_tag = post.find_next(['p', 'div'], class_=['entry-content', 'post-excerpt'])
                if summary_tag:
                    summary = summary_tag.text.strip()
                    
                articles.append({
                    'source': 'Jornal de Itaúna',
                    'title': title,
                    'summary': summary,
                    'link': link
                })
                
        print(f"[+] Jornal de Itaúna: {len(articles)} notícias encontradas.")
    except Exception as e:
        print(f"[!] Falha na raspagem do Jornal de Itaúna: {e}")
        
    return articles


# ==========================================================================
# INTEGRAÇÃO GOOGLE GEMINI (INTELIGÊNCIA ARTIFICIAL)
# ==========================================================================

def analyze_with_gemini(raw_articles, api_key, target_date):
    """Envia as notícias para o Google Gemini processar e formatar em JSON analítico"""
    print("[*] Iniciando análise de impacto com a IA Google Gemini...")
    
    try:
        import google.generativeai as genai
    except ImportError:
        print("[!] Erro: A biblioteca 'google-generativeai' não está instalada.")
        print("    Rode: pip install google-generativeai")
        return None
        
    # Configurar API
    genai.configure(api_key=api_key)
    
    # Preparar dados coletados para o prompt
    formatted_input = ""
    for idx, art in enumerate(raw_articles):
        formatted_input += f"Notícia #{idx+1} ({art['source']}):\n"
        formatted_input += f"Título: {art['title']}\n"
        if art['summary']:
            formatted_input += f"Resumo: {art['summary']}\n"
        formatted_input += f"Link: {art['link']}\n"
        formatted_input += "-" * 30 + "\n"
        
    # Prompt do Sistema e Instruções
    prompt = f"""
Você é um analista de inteligência de mercado experiente, focado exclusivamente na economia e no comércio da cidade de Itaúna, Minas Gerais (Brasil).

Abaixo estão notícias recentes sobre Itaúna coletadas de portais locais para o dia {target_date}:
{formatted_input}

Sua tarefa é filtrar as informações mais relevantes para o comércio, prestadores de serviços, lojistas e empreendedores locais de Itaúna (como novos concorrentes, eventos públicos que atraiam pessoas, obras na cidade, mudanças de tarifas, abertura de novos nichos, venda de empresas).

Para cada notícia importante selecionada (máximo 4 notícias), crie uma análise estruturada contendo exatamente estes campos:
1. id: Um UUID aleatório novo.
2. title: Título focado no ângulo comercial (Ex: 'Revitalização de rua abre espaço para novos negócios' em vez de apenas 'Obras na rua X').
3. category: Uma destas categorias exatas: 'Eventos' | 'Concorrência' | 'Economia Local' | 'Infraestrutura' | 'Oportunidades'.
4. executiveSummary: Resumo executivo de até 2 frases curtas e diretas sobre o fato.
5. impactLevel: Nível de impacto no comércio: 'Alto' | 'Médio' | 'Baixo'.
6. investigativeAnalysis: Análise investigativa detalhada explicando os desdobramentos de mercado na cidade. (Ex: aumento de tráfego de pessoas, alteração de hábitos de consumo, atração de clientes de Divinópolis/Pará de Minas/Mateus Leme, etc).
7. howToAct: Lista numerada prática com 2 ou 3 ações que os lojistas/comerciantes de Itaúna devem tomar para se preparar ou se proteger.
8. howToProfit: Ideias criativas e insights práticos sobre como faturar ou lucrar com essa notícia (criação de promoções, parcerias, novos serviços temporários).

ATENÇÃO IMPORTANTE:
- Caso os portais raspados estejam vazios ou não contenham notícias com relevância comercial direta, utilize seu próprio conhecimento interno avançado sobre a economia e geografia de Itaúna para criar de 2 a 3 relatórios de negócios fictícios, porém extremamente plausíveis e úteis, para a data de {target_date}. Foco no comércio local, varejo, bairros como Centro, Jove Soares (Prainha), Santanense, Padre Eustáquio e Garcias.
- O retorno deve ser exclusivamente uma lista em formato JSON contendo os objetos de notícia. Não inclua nenhuma introdução ou formatação Markdown (como ```json).

Gere a resposta em formato JSON válido estruturado de acordo com o esquema acima.
"""

    try:
        # Usando o modelo recomendado para tarefas gerais rápidas
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Configurar para retornar JSON diretamente (nativo da API Gemini)
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Validar e converter para dicionário Python
        news_data = json.loads(response.text)
        return news_data
        
    except Exception as e:
        print(f"[!] Erro ao comunicar com a API do Gemini ou processar o JSON: {e}")
        return None


# ==========================================================================
# MODO DE SIMULAÇÃO (MOCK) - CASO NÃO HÁ CHAVE DE API
# ==========================================================================

def generate_mock_data(target_date):
    """Gera dados simulados realistas para Itaúna na data fornecida"""
    print(f"[*] Gerando dados simulados (Mock Mode) para a data {target_date}...")
    
    # Formata a data para exibição amigável
    date_obj = datetime.datetime.strptime(target_date, "%Y-%m-%d")
    date_str = date_obj.strftime("%d/%m/%Y")
    weekday_names = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"]
    weekday = weekday_names[date_obj.weekday()]
    
    mock_data = [
        {
            "id": str(uuid.uuid4()),
            "title": f"Criação do 'Roteiro da Prainha' reúne bares e promete movimentar noites de Itaúna neste fim de semana",
            "category": "Eventos",
            "executiveSummary": f"A associação comercial de Itaúna lança um roteiro gastronômico integrado na Avenida Jove Soares para atrair turistas regionais neste fim de semana.",
            "impactLevel": "Alto",
            "investigativeAnalysis": f"O projeto une 12 estabelecimentos de alimentação da principal avenida de Itaúna (Jove Soares). Estimativas apontam para um acréscimo de 35% no fluxo de consumidores à noite, atraindo moradores de Pará de Minas e Mateus Leme. Lojas de roupas e postos de combustível do entorno também sentirão um efeito positivo de movimentação indireta durante o evento.",
            "howToAct": "1. Bares participantes devem treinar equipes de garçons para atendimento ágil e garantir estoque de bebidas geladas.\n2. Lojistas do entorno devem manter iluminação de fachada ativa para aproveitar a visibilidade da marca.\n3. Taxistas e motoristas de aplicativo locais devem focar na avenida nos horários de pico (20h às 01h).",
            "howToProfit": "Crie uma promoção integrada: ao consumir em um bar parceiro, o cliente ganha 10% de desconto no almoço de domingo em outro estabelecimento da lista. Bares podem criar drinks autorais batizados com pontos turísticos de Itaúna (como 'Drink Barragem' ou 'Mistura do Córrego do Soldado') para gerar buzz nas redes sociais."
        },
        {
            "id": str(uuid.uuid4()),
            "title": f"Inauguração de centro de distribuição logística sela avanço de e-commerce regional em Itaúna",
            "category": "Oportunidades",
            "executiveSummary": f"Um novo hub de entregas expressas de um grande marketplace nacional está iniciando operações nas margens da MG-050.",
            "impactLevel": "Médio",
            "investigativeAnalysis": f"A escolha de Itaúna como hub logístico se deve à sua localização estratégica próxima a BH, Divinópolis e Pará de Minas pela rodovia MG-050. A operação agilizará as entregas na cidade (muitas passando a ser feitas no mesmo dia ou dia útil seguinte), o que beneficia os consumidores, mas exige que lojistas físicos locais ofereçam retiradas imediatas no balcão como diferencial competitivo de velocidade.",
            "howToAct": "1. Lojistas locais que vendem online devem se cadastrar na plataforma para utilizar o centro de distribuição para suas entregas.\n2. Fortalecer o canal de vendas pelo WhatsApp com entregas de moto táxi local em até 2 horas.\n3. Capacitar os funcionários de vendas físicas para focar na experiência de compra imersiva.",
            "howToProfit": "Ofereça o serviço 'Retire na Loja em 15 minutos': o cliente compra online no seu site/WhatsApp e pega o produto instantaneamente no centro, sem esperar frete. Para prestadores de serviço automotivo (oficinas, borracharias) há oportunidade de fechar contratos de manutenção preventiva da frota de vans e motos de entrega do hub."
        },
        {
            "id": str(uuid.uuid4()),
            "title": f"Obras de escoamento no centro de Itaúna alteram rotas de trânsito e exigem adaptação",
            "category": "Infraestrutura",
            "executiveSummary": f"Intervenções da prefeitura para mitigar inundações na região da Praça Dr. Augusto Gonçalves causam desvios temporários.",
            "impactLevel": "Médio",
            "investigativeAnalysis": f"As obras são cruciais para a segurança das lojas do Centro na época das chuvas, porém reduzem as vagas de estacionamento imediatas e geram poeira/barulho na Praça Dr. Augusto Gonçalves. Comerciantes locais relatam queda de 15% no movimento espontâneo de pedestres no quarteirão afetado durante a semana, exigindo estratégias de atração digital de clientes.",
            "howToAct": "1. Divulgar ativamente em canais digitais que a loja continua funcionando normalmente e indicar rotas alternativas de pedestres.\n2. Oferecer entrega grátis em toda a cidade para compras acima de R$ 50 como compensação para o cliente não precisar ir até a obra.\n3. Cobrir produtos expostos para evitar acúmulo de poeira da obra.",
            "howToProfit": "Faça a campanha 'Desconto da Obra': dê um cupom de desconto especial para compensar o 'desafio' de ir até a loja. Estabeleça uma parceria com estacionamentos privados de ruas paralelas para dar 1 hora gratuita aos seus clientes que apresentarem o cupom de compra da sua loja."
        }
    ]
    
    return mock_data


def push_to_github():
    """Tenta enviar as atualizações automaticamente para o repositório remoto do GitHub"""
    import subprocess
    git_dir = os.path.join(BASE_DIR, '.git')
    if not os.path.exists(git_dir):
        return
        
    print("[*] Repositório Git detectado. Iniciando envio automático para o GitHub...")
    try:
        subprocess.run(["git", "add", "."], cwd=BASE_DIR, check=True)
        today_str = datetime.date.today().isoformat()
        commit_msg = f"Relatório diário do comércio de Itaúna: {today_str}"
        result = subprocess.run(["git", "commit", "-m", commit_msg], cwd=BASE_DIR, capture_output=True, text=True)
        if "nothing to commit" in result.stdout or "nada para comitar" in result.stdout or "no changes added" in result.stdout:
            print("[*] Nenhuma mudança detectada para comitar.")
            return
            
        subprocess.run(["git", "push"], cwd=BASE_DIR, check=True)
        print("[SUCCESS] Mudanças enviadas e site atualizado no GitHub Pages!")
    except Exception as e:
        print(f"[!] Erro ao realizar deploy automático para o GitHub: {e}")
        print("[!] Verifique se você configurou o repositório remoto (git remote add origin) e se autenticou no GitHub.")

# ==========================================================================
# EXECUÇÃO DO SCRIPT
# ==========================================================================

def main():
    parser = argparse.ArgumentParser(description="Agente de Análise Comercial de Itaúna-MG")
    parser.add_argument('--date', type=str, help="Data alvo no formato YYYY-MM-DD (Padrão: data de hoje)")
    parser.add_argument('--mock', action='store_true', help="Forçar execução em Modo Simulação (Mock) sem chamar APIs")
    args = parser.parse_args()
    
    # Determinar a data de execução
    if args.date:
        try:
            datetime.datetime.strptime(args.date, "%Y-%m-%d")
            target_date = args.date
        except ValueError:
            print("[!] Erro: Formato de data inválido. Use YYYY-MM-DD.")
            sys.exit(1)
    else:
        target_date = datetime.date.today().isoformat()
        
    print("=" * 60)
    print(f"[*] Roteiro do Agente Comercial - Data Alvo: {target_date}")
    print("=" * 60)
    
    # Verificar chave de API do Gemini
    gemini_key = os.getenv("GEMINI_API_KEY")
    is_mock = args.mock or not gemini_key or gemini_key == "SUA_CHAVE_AQUI"
    
    news_result = None
    
    if is_mock:
        if not gemini_key or gemini_key == "SUA_CHAVE_AQUI":
            print("[!] GEMINI_API_KEY não configurada ou inválida no arquivo .env.")
            print("[!] Entrando automaticamente em MODO SIMULAÇÃO (MOCK).")
        else:
            print("[*] Modo Simulação (Mock) ativado manualmente via flag.")
            
        news_result = generate_mock_data(target_date)
    else:
        print("[*] Chave do Gemini encontrada! Iniciando coleta real de notícias...")
        # 1. Scraping dos portais locais
        articles_santana = scrape_santana_fm()
        articles_jornal = scrape_jornal_de_itauna()
        
        all_articles = articles_santana + articles_jornal
        
        # 2. Enviar para análise do Gemini
        print(f"[+] Total de matérias coletadas para análise: {len(all_articles)}")
        news_result = analyze_with_gemini(all_articles, gemini_key, target_date)
        
        # Fallback de segurança se a chamada falhar
        if not news_result:
            print("[!] Falha na geração com IA. Usando Mock como plano de contingência.")
            news_result = generate_mock_data(target_date)
            
    # Salvar o arquivo JSON final
    if news_result:
        filename = f"news_{target_date}.json"
        filepath = os.path.join(DATA_DIR, filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(news_result, f, ensure_ascii=False, indent=2)
            
            print("=" * 60)
            print(f"[SUCCESS] Relatório diário de negócios salvo com sucesso!")
            print(f"[SUCCESS] Caminho: {filepath}")
            print(f"[SUCCESS] Total de análises de impacto geradas: {len(news_result)}")
            print("=" * 60)
            
            # Enviar atualizações para o GitHub se for um repositório git
            push_to_github()
        except Exception as e:
            print(f"[!] Erro ao salvar arquivo JSON: {e}")
            sys.exit(1)
    else:
        print("[!] Erro crítico: Nenhum dado foi gerado.")
        sys.exit(1)

if __name__ == '__main__':
    main()
