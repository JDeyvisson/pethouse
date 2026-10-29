import { Link } from 'react-router-dom'
export default function Ajuda() {
  return <main className="min-h-screen p-6 bg-bg text-text"><article className="card max-w-2xl mx-auto p-6 space-y-5">
    <Link className="text-primary underline" to="/configuracoes">Voltar</Link>
    <h1 className="text-2xl font-bold">Ajuda e atendimento</h1>
    <p>Para dúvidas sobre hospedagem, acesso, correção de dados ou exclusão de conta, abra um pedido para a equipe do Pet House.</p>
    <a className="btn-primary inline-block" href="mailto:pet.house.digipet@gmail.com?subject=Atendimento%20Pet%20House">Abrir pedido no seu aplicativo de e-mail</a>
    <p className="text-sm text-muted">O pedido só é enviado quando você confirmar no seu aplicativo. Não inclua senhas, números de cartão ou fotos de documentos.</p>
    <h2 className="text-lg font-semibold">Pagamentos e e-mails</h2><p>Os fluxos atuais são demonstrativos, sem cobrança ou envio real de e-mail. As reservas de teste aparecem no histórico.</p>
    <h2 className="text-lg font-semibold">Excluir conta</h2><p>A exclusão automática ainda não está disponível. Solicite a análise pelo atendimento; a equipe deve informar o resultado e a situação dos registros vinculados. Abrir este pedido não remove nenhum dado.</p>
    <Link className="text-primary underline" to="/privacidade">Consultar Política de Privacidade</Link>
  </article></main>
}
