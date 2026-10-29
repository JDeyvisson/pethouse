// Disposable QA server. No external email/payment calls and no production database.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:qa_local_only@localhost:55432/pethouse_qa'
if (!new URL(process.env.DATABASE_URL).pathname.endsWith('_qa')) throw new Error('Use banco com sufixo _qa')
process.env.JWT_SECRET = 'qa-only-secret-not-for-production-0123456789'
process.env.MOCK_SERVICES = 'true'
process.env.NODE_ENV = 'test'
process.env.CEP_API_URL = 'http://127.0.0.1:3301/test-cep'
const app = require('../dist/app').default
app.get('/test-cep/:cep/json', (req, res) => res.json(req.params.cep === '12345678' ? { erro: true } : { localidade: 'São Paulo', logradouro: 'Avenida Paulista', uf: 'SP', bairro: 'Bela Vista' }))
app.listen(3301, '127.0.0.1', () => console.log('QA API ready on 3301'))
