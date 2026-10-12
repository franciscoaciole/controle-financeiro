# Finan+

Aplicação web full stack de controle financeiro pessoal. Cadastre receitas e despesas, organize por categorias e acompanhe a evolução do saldo em um painel visual.

**Acesse:** https://meufinanmais.vercel.app

> O backend roda em um plano gratuito e pode demorar até cerca de 50 segundos para responder na primeira visita depois de um período sem uso.

## Funcionalidades

- Cadastro e login com autenticação JWT e senhas protegidas com hash (bcrypt)
- Categorias padrão criadas automaticamente no cadastro de cada usuário
- CRUD de transações e de categorias
- Sugestão automática de categoria a partir da descrição digitada (ex.: "Uber" sugere Transporte), sem sobrescrever a escolha manual
- Dashboard com saldo, gráfico de evolução do saldo acumulado e gráfico de gastos por categoria
- Filtro de transações por receitas e despesas
- Proteção contra envio duplicado ao salvar uma transação

## Tecnologias

**Frontend:** React, Vite, Tailwind CSS v4, React Router, Axios, Recharts, Lucide React

**Backend:** Node.js, Express, Prisma ORM v7 (driver adapter `pg`), JWT (jsonwebtoken) e bcryptjs

**Banco de dados:** PostgreSQL (Neon)

**Deploy:** Vercel (frontend) e Render (backend)

## Arquitetura

```
controle-financeiro/
├── backend/    API REST (Express + Prisma)
└── frontend/   Aplicação React (Vite)
```

O frontend consome a API REST do backend. A autenticação usa token JWT enviado no cabeçalho `Authorization`. O CORS do backend aceita apenas o domínio do frontend em produção (e o localhost, em desenvolvimento).

## Decisões técnicas

- **Autenticação própria:** JWT implementado manualmente, para entender o fluxo completo de registro, login e rotas protegidas.
- **Cadastro atômico:** o usuário e as categorias padrão são criados na mesma transação do banco, então ou os dois existem ou nenhum.
- **Sugestão de categoria local:** correspondência por palavras-chave, sem chamada externa, para resposta instantânea e custo zero.
- **Banco serverless:** Neon, que religa sozinho após inatividade, sem necessidade de restauração manual.

## Como rodar localmente

Pré-requisitos: Node.js e um banco PostgreSQL (por exemplo, um projeto gratuito no Neon).

### Backend

```bash
cd backend
npm install
```

Crie o arquivo `backend/.env`:

```
DATABASE_URL="sua-string-de-conexao-postgres"
JWT_SECRET="uma-chave-longa-e-aleatoria"
```

```bash
npx prisma generate
npx prisma migrate deploy
node src/server.js
```

A API sobe em `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
```

Crie o arquivo `frontend/.env`:

```
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev
```

O app abre em `http://localhost:5173`.

## Autor

Francisco Aciole dos Santos Júnior

- GitHub: [franciscoaciole](https://github.com/franciscoaciole)
- LinkedIn: [franciscoaciole](https://www.linkedin.com/in/franciscoaciole-/)