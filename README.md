# Retro-board

![Banner](public/assets/banner.png)

**Retro-board** é uma plataforma colaborativa moderna construída com **Next.js 15**, **Firebase** e **Tailwind CSS**. O projeto reúne diversas ferramentas essenciais para times ágeis e gestão pessoal em um único lugar, com suporte a múltiplos idiomas (Português, Inglês e Espanhol).

## 🚀 Funcionalidades

### 1. Retrospectiva
Crie salas de retrospectiva em tempo real para seu time.
*   **Colaboração Real-time**: Veja os cards e votos aparecendo instantaneamente (Firestore).
*   **Fases**: Well, Not So Well, New Ideas.
*   **Votação**: Sistema de votos para priorizar discussões.

### 2. Planning Poker
Ferramenta para estimativa de tarefas ágeis.
*   **Salas Compartilhadas**: Convide o time via link.
*   **Cartas**: Sistema de pontuação padrão (Fibonacci).
*   **Revelação**: Mostra as cartas apenas quando todos votaram.

### 3. Lista de Tarefas (Todo)
Uma lista de tarefas pessoal simples e elegante.
*   **Design Limpo**: Interface moderna estilo "shopping list".
*   **Persistência**: Seus dados ficam salvos no navegador (LocalStorage).
*   **Funcionalidades**: Adicionar, marcar como feito, excluir e "Limpar Tudo".

![Todo Mockup](public/assets/todo_mockup.png)

### 4. Gestão Financeira
Controle suas receitas e despesas com simplicidade.
*   **Autenticação**: Login seguro (Híbrido: Admin Mock + Firebase Auth).
*   **Dashboard**: Resumo mensal de saldo.
*   **Lançamentos**: Adicione receitas e despesas com data e status (pago/pendente).

![Finance Login](public/assets/finance_login.png)

---

## 🛠️ Tecnologias

*   **Frontend**: Next.js 15 (App Router), React, Tailwind CSS.
*   **Backend / DB**: Firebase (Firestore, Auth).
*   **Internacionalização**: `next-intl` (PT-BR, EN, ES).
*   **Ícones**: `react-icons`.

---

## 🏃‍♂️ Como Rodar o Projeto

### Pré-requisitos
*   Node.js instalado (v18+ recomendado).
*   Conta no Firebase e projeto configurado.

### Passo a Passo

1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/seu-usuario/Retro-board.git
    cd Retro-board
    ```

2.  **Instale as dependências**:
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente**:
    Crie um arquivo `.env.local` na raiz e adicione suas chaves do Firebase:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=seu_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_project.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_project.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=seu_measurement_id
    ```

4.  **Rode o servidor de desenvolvimento**:
    ```bash
    npm run dev
    ```
    Acesse `http://localhost:3000` no seu navegador.

---

## 📍 Rotas e Acesso

O projeto utiliza rotas internacionalizadas `/[locale]/...`.

*   **Home**: `/` (Redireciona para o idioma padrão, ex: `/pt`)
*   **Ferramentas**: `/pt/tools` (Menu principal)
*   **Retrospectiva**: `/pt/tools/retro`
*   **Planning Poker**: `/pt/tools/poker`
*   **Todo List**: `/pt/tools/todo`
*   **Financeiro (Login)**: `/pt/tools/finance/login`
*   **Financeiro (Dashboard)**: `/pt/tools/finance` (Requer login)

---

## 👤 Login Admin (Demo)

Para testar o módulo financeiro rapidamente:
*   **Usuário**: `admin@gmail.com`
*   **Senha**: `admin`

---

Desenvolvido com 💙 de forma Colaborativa.
