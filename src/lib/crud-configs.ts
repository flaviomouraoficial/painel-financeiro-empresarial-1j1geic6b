export const CRUD_CONFIGS: Record<string, any> = {
  clientes: {
    collection: 'clientes',
    title: 'Clientes',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      {
        name: 'tipo',
        label: 'Tipo',
        type: 'select',
        options: [
          { label: 'PF', value: 'pf' },
          { label: 'PJ', value: 'pj' },
        ],
      },
      { name: 'cpf_cnpj', label: 'CPF/CNPJ', type: 'text' },
      { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'telefone', label: 'Telefone', type: 'text' },
      { name: 'endereco', label: 'Endereço', type: 'text' },
    ],
    columns: [
      { key: 'nome', label: 'Nome' },
      { key: 'cpf_cnpj', label: 'Documento' },
      { key: 'telefone', label: 'Telefone' },
    ],
  },
  fornecedores: {
    collection: 'fornecedores',
    title: 'Fornecedores',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      {
        name: 'tipo',
        label: 'Tipo',
        type: 'select',
        options: [
          { label: 'PF', value: 'pf' },
          { label: 'PJ', value: 'pj' },
        ],
      },
      { name: 'cpf_cnpj', label: 'CPF/CNPJ', type: 'text' },
      { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'telefone', label: 'Telefone', type: 'text' },
      { name: 'endereco', label: 'Endereço', type: 'text' },
    ],
    columns: [
      { key: 'nome', label: 'Nome' },
      { key: 'cpf_cnpj', label: 'Documento' },
      { key: 'telefone', label: 'Telefone' },
    ],
  },
  produtos: {
    collection: 'produtos_servicos',
    title: 'Produtos / Serviços',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      {
        name: 'tipo',
        label: 'Tipo',
        type: 'select',
        options: [
          { label: 'Produto', value: 'produto' },
          { label: 'Serviço', value: 'servico' },
        ],
      },
      { name: 'preco_unitario', label: 'Preço Unitário', type: 'number' },
      { name: 'categoria', label: 'Categoria', type: 'text' },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: [
      { key: 'nome', label: 'Nome' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'preco_unitario', label: 'Preço', format: 'currency' },
      { key: 'ativo', label: 'Ativo', format: 'boolean' },
    ],
  },
  categorias: {
    collection: 'categorias',
    title: 'Categorias',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      {
        name: 'tipo',
        label: 'Tipo',
        type: 'select',
        options: [
          { label: 'Receita', value: 'receita' },
          { label: 'Despesa', value: 'despesa' },
        ],
      },
      { name: 'descricao', label: 'Descrição', type: 'text' },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: [
      { key: 'nome', label: 'Nome' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'ativo', label: 'Ativo', format: 'boolean' },
    ],
  },
  'centros-custo': {
    collection: 'centros_custo',
    title: 'Centros de Custo',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'descricao', label: 'Descrição', type: 'text' },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: [
      { key: 'nome', label: 'Nome' },
      { key: 'descricao', label: 'Descrição' },
      { key: 'ativo', label: 'Ativo', format: 'boolean' },
    ],
  },
  'contas-bancarias': {
    collection: 'contas_bancarias',
    title: 'Contas Bancárias',
    fields: [
      { name: 'banco', label: 'Banco', type: 'text', required: true },
      {
        name: 'tipo',
        label: 'Tipo',
        type: 'select',
        options: [
          { label: 'Corrente', value: 'corrente' },
          { label: 'Poupança', value: 'poupanca' },
        ],
      },
      { name: 'agencia', label: 'Agência', type: 'text' },
      { name: 'numero_conta', label: 'Número Conta', type: 'text' },
      { name: 'saldo_inicial', label: 'Saldo Inicial', type: 'number' },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: [
      { key: 'banco', label: 'Banco' },
      { key: 'numero_conta', label: 'Conta' },
      { key: 'ativo', label: 'Ativo', format: 'boolean' },
    ],
  },
  'cartoes-credito': {
    collection: 'cartoes_credito',
    title: 'Cartões de Crédito',
    fields: [
      { name: 'banco', label: 'Banco', type: 'text', required: true },
      { name: 'bandeira', label: 'Bandeira', type: 'text' },
      { name: 'limite', label: 'Limite', type: 'number' },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: [
      { key: 'banco', label: 'Banco' },
      { key: 'bandeira', label: 'Bandeira' },
      { key: 'limite', label: 'Limite', format: 'currency' },
      { key: 'ativo', label: 'Ativo', format: 'boolean' },
    ],
  },
}
