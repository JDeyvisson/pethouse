import { Link } from 'react-router-dom'
import { TERMS_VERSION } from '../lib/validation'

export default function Legal({ privacy = false }: { privacy?: boolean }) {
  return <main className="min-h-screen bg-bg text-text p-6"><article className="max-w-3xl mx-auto card p-6 sm:p-10 space-y-5 leading-relaxed">
    <Link to="/" className="text-primary underline">Pet House</Link>
    <h1 className="text-3xl font-bold">{privacy ? 'Política de Privacidade' : 'Termos de Uso'}</h1>
    <p className="text-sm text-muted">Versão {TERMS_VERSION} · Ambiente de demonstração</p>
    <p>O Pet House conecta tutores e anfitriões para organizar hospedagens de pets. Nesta versão, pagamentos e mensagens de e-mail são simulações: não há cobrança, transferência de valores ou entrega de e-mail. Utilize dados fictícios durante os testes.</p>
    {privacy ? <>
      <h2 className="text-xl font-semibold">Dados e finalidades</h2>
      <p>O cadastro utiliza nome, e-mail, telefone e senha protegida por hash. Endereço, dados do pet, contatos de emergência, disponibilidade, reservas, mensagens e avaliações são usados para organizar a hospedagem e apresentar as informações necessárias aos participantes. O cadastro do anfitrião inclui CPF e, opcionalmente, imagem de documento. Não envie documentos reais no ambiente demonstrativo.</p>
      <h2 className="text-xl font-semibold">Visibilidade e serviços externos</h2>
      <p>Nome do anfitrião, cidade, descrição, fotos do espaço, preço, disponibilidade e avaliações aparecem no perfil público. CPF e documento não fazem parte do perfil público. Dados da reserva e do pet são apresentados aos participantes para os cuidados necessários. A consulta de endereço envia o CEP ao ViaCEP. Imagens externas carregadas pelo navegador podem transmitir o endereço IP ao respectivo serviço.</p>
      <h2 className="text-xl font-semibold">Armazenamento e escolhas</h2>
      <p>Dados de conta e hospedagem ficam no banco da aplicação; imagens ficam no armazenamento configurado. O navegador guarda a sessão, tema e marcações de leitura. Sair da conta remove a sessão local. O aceite é registrado com a versão do texto e data; não autoriza publicidade ou uso indiscriminado dos dados.</p>
      <h2 className="text-xl font-semibold">Acesso, correção e exclusão</h2>
      <p>Você pode editar seus dados no perfil. Para solicitar acesso, correção, exclusão ou informações sobre o tratamento, entre em contato com o Pet House pelo canal abaixo. Pedidos de exclusão devem considerar registros vinculados a reservas e eventuais obrigações de conservação, com informação sobre o resultado da análise. Consulte também as <a className="text-primary underline" href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares" target="_blank" rel="noopener noreferrer">orientações da ANPD sobre direitos dos titulares</a>.</p>
      <h2 className="text-xl font-semibold">Antes da operação comercial</h2>
      <p>Esta versão descreve o ambiente demonstrativo. A identificação formal do responsável pelo tratamento, prazos de retenção, bases legais por finalidade e fornecedores de produção serão informados na política antes da abertura comercial.</p>
    </> : <>
      <h2 className="text-xl font-semibold">Conta e informações</h2>
      <p>Cadastre informações corretas e mantenha sua senha em sigilo. O tutor deve informar necessidades de saúde, comportamento e contatos de emergência do pet. O anfitrião deve manter dados do espaço, capacidade e disponibilidade atualizados. Não publique informações de terceiros sem autorização ou fotos que violem direitos de outras pessoas.</p>
      <h2 className="text-xl font-semibold">Hospedagem e disponibilidade</h2>
      <p>A hospedagem é calculada por noite: o check-out deve ser posterior ao check-in. Todas as noites precisam estar disponíveis, e a reserva depende de capacidade e compatibilidade com espécie e porte. O total é calculado pelo sistema com base na diária do anfitrião. A capacidade indicada como quatro pets significa quatro vagas simultâneas.</p>
      <h2 className="text-xl font-semibold">Cancelamento e cuidados</h2>
      <p>No ambiente demonstrativo, o tutor pode cancelar reservas ainda não iniciadas. Reservas em andamento ou concluídas não podem ser canceladas pela interface. O anfitrião só pode iniciar dentro do período reservado e concluir a partir do check-out. Nenhum reembolso é executado, pois não há cobrança real. Para dúvidas ou situações excepcionais, utilize o canal de atendimento.</p>
      <h2 className="text-xl font-semibold">Limites da demonstração</h2>
      <p>Uma simulação de pagamento não comprova pagamento, e uma prévia de e-mail não comprova titularidade do endereço. O envio de CPF ou documento não representa verificação de identidade. Avaliações devem refletir reservas concluídas do próprio tutor. Não utilize esta versão para contratar serviços financeiros ou assumir que uma inspeção do espaço foi realizada.</p>
      <h2 className="text-xl font-semibold">Uso responsável e alterações</h2>
      <p>Não tente acessar contas ou documentos de terceiros, manipular preços ou vagas, ou publicar conteúdo ilícito. Alterações materiais destes termos serão identificadas por versão e comunicadas antes de novo aceite. Estes termos não afastam direitos previstos na legislação aplicável.</p>
    </>}
    <p>Contato: <a className="text-primary underline" href="mailto:pet.house.digipet@gmail.com">pet.house.digipet@gmail.com</a>. O link abre seu aplicativo de e-mail; o envio depende de você.</p>
    <Link className="text-primary underline" to={privacy ? '/termos' : '/privacidade'}>{privacy ? 'Termos de Uso' : 'Política de Privacidade'}</Link>
  </article></main>
}
