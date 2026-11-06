# Fees Tracker (MERN)

## Run
```bash
# 1) API
cd server && cp .env.example .env && npm i && npm run dev     # http://localhost:5000
# 2) Client (new terminal)
cd client && npm i && npm run dev                              # http://localhost:5173 (proxies /api)
```
Needs MongoDB (local or Atlas). Set `MONGO_URI` in `server/.env`.

## API
| Method | Route | Purpose |
|---|---|---|
| GET | /api/students?q=&filter=all/pending/paid/month/ending | list + search |
| GET | /api/students/summary | dashboard totals |
| POST | /api/students | add student |
| PUT | /api/students/:id | edit |
| DELETE | /api/students/:id | delete |
| POST | /api/students/:id/payments | add payment |
| DELETE | /api/students/:id/payments/:pid | remove payment |

Next steps: JWT auth (this version is open), multi-branch, Atlas deploy.
