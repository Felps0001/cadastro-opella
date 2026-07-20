# Formulário Opella :: Abrafarma RJ

Cadastro digital da Opella com geração de **QR Code único** para retirada de brinde e uma **tela de leitura** (tablet) para dar baixa nos brindes.

- **Frontend:** React + Vite (mobile-first, identidade Opella)
- **Backend:** Node + Express
- **Banco:** MongoDB (Atlas ou local)

## Estrutura

```
form-opella-abrafarma/
├── backend/          # API Express + MongoDB
│   ├── .env          # <- preencha aqui
│   └── src/
└── frontend/         # App React (Vite)
    ├── .env          # <- preencha aqui
    └── src/
```

## Fluxo

1. A pessoa acessa o formulário no celular (`/`) e preenche **Nome, E-mail\*, Telefone\*** + opt-in.
2. Ao enviar, é gerado um **código único** (`OPL-XXXXXXXX`) salvo no MongoDB e um **QR Code** é exibido (`/sucesso/:code`).
3. No estande, a equipe abre a **tela de leitura no tablet** (`/leitor`), escaneia o QR e o sistema **dá baixa** automaticamente.
4. Se o brinde já tiver sido retirado, a tela avisa.

## Páginas (Frontend)

| Rota              | Página              | Descrição                                                                 |
| ----------------- | ------------------- | ------------------------------------------------------------------------- |
| `/`               | `FormPage`          | Formulário público de cadastro (celular)                                  |
| `/sucesso/:code`  | `SuccessPage`       | Tela de sucesso com o QR Code gerado                                      |
| `/validar/:code`  | `ValidatePage`      | Página pública exibida ao escanear o link do QR                           |
| `/leitor`         | `ScannerPage`       | Leitura por **câmera** (tablet) — dá baixa no brinde                      |
| `/leitor-scanner` | `ScannerDevicePage` | Leitura por **scanner de dispositivo** (pistola/USB) — dá baixa no brinde |
| `/cadastros`      | `RegistrationsPage` | Gestão dos cadastros + exportação CSV (equipe)                            |

> As telas de leitura (`/leitor`, `/leitor-scanner`) e `/cadastros` são de uso da equipe e dependem do `VITE_STAFF_TOKEN`.
>
> O `/leitor-scanner` não usa câmera: basta manter a página aberta e disparar o scanner físico (funciona como teclado, envia o código + Enter).

## Configuração

Preencha os arquivos `.env` (já criados a partir dos `.env.example`):

**backend/.env**
| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta da API (padrão 4000) |
| `MONGODB_URI` | Conexão do MongoDB (Atlas ou local) |
| `MONGODB_DB_NAME` | Nome do banco |
| `CORS_ORIGIN` | URL do frontend permitida |
| `FRONTEND_URL` | URL pública do frontend (vai dentro do QR) |
| `STAFF_TOKEN` | Senha da tela de leitura do tablet |

**frontend/.env**
| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL da API |
| `VITE_STAFF_TOKEN` | Deve ser igual ao `STAFF_TOKEN` do backend |

## Como rodar

### 1. Backend

```powershell
cd backend
npm install
npm run dev
```

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Acesse:

- Formulário: `http://localhost:5173/`
- Leitor por câmera (tablet): `http://localhost:5173/leitor`
- Leitor por scanner de dispositivo: `http://localhost:5173/leitor-scanner`
- Cadastros (equipe): `http://localhost:5173/cadastros`

## Testar no celular / tablet (mesma rede)

O Vite já sobe com `host: true`. Descubra o IP da máquina (`ipconfig`) e acesse `http://SEU_IP:5173`.

> A câmera do leitor exige **HTTPS** ou `localhost`. Em produção, sirva o frontend por HTTPS (ex.: Vercel/Netlify) para o scanner funcionar no tablet.

## Rotas da API

| Método | Rota                       | Descrição                       |
| ------ | -------------------------- | ------------------------------- |
| `POST` | `/api/registrations`       | Cria cadastro e retorna QR      |
| `GET`  | `/api/registrations/:code` | Consulta pública do cadastro    |
| `GET`  | `/api/staff/lookup/:code`  | Consulta (equipe, requer token) |
| `POST` | `/api/staff/redeem/:code`  | Dá baixa no brinde (equipe)     |

Chamadas de equipe exigem o header `x-staff-token`.
