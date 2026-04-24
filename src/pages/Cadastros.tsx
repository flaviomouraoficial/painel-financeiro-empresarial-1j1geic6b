import { useParams } from 'react-router-dom'
import ClientesList from './cadastros/Clientes'
import FornecedoresList from './cadastros/Fornecedores'
import ProdutosList from './cadastros/Produtos'
import ContasBancariasList from './cadastros/ContasBancarias'
import CartoesCreditoList from './cadastros/CartoesCredito'
import CategoriasList from './cadastros/Categorias'
import ProjetosList from './cadastros/Projetos'
import CentrosCustoList from './cadastros/CentrosCusto'
import GenericList from './cadastros/GenericList'

export default function Cadastros() {
  const { tipo } = useParams<{ tipo: string }>()

  switch (tipo) {
    case 'clientes':
      return <ClientesList />
    case 'fornecedores':
      return <FornecedoresList />
    case 'produtos':
      return <ProdutosList />
    case 'contas-bancarias':
      return <ContasBancariasList />
    case 'cartoes-credito':
      return <CartoesCreditoList />
    case 'categorias':
      return <CategoriasList />
    case 'projetos':
      return <ProjetosList />
    case 'centros-custo':
      return <CentrosCustoList />
    default:
      return <GenericList tipo={tipo || ''} />
  }
}
