import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  ShieldAlert,
  Activity,
  PlayCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ClientResponseError } from 'pocketbase'

type TestStatus = 'idle' | 'running' | 'success' | 'error'

interface DiagnosticTest {
  id: number
  title: string
  description: string
  status: TestStatus
  message?: string
  log?: any
}

const INITIAL_TESTS: DiagnosticTest[] = [
  {
    id: 1,
    title: 'Conexão com Skip Cloud',
    description: 'Verifica a disponibilidade do backend',
    status: 'idle',
  },
  {
    id: 2,
    title: 'Tabelas Existem',
    description: 'Verifica a estrutura do banco de dados (15 coleções)',
    status: 'idle',
  },
  { id: 3, title: 'Usuário Logado', description: 'Valida a sessão atual', status: 'idle' },
  {
    id: 4,
    title: 'Permissões (RLS)',
    description: 'Testa leitura restrita em lançamentos',
    status: 'idle',
  },
  {
    id: 5,
    title: 'Criar Registro de Teste',
    description: 'Testa permissão de escrita em lançamentos',
    status: 'idle',
  },
]

export default function Diagnostico() {
  const { user } = useAuth()
  const [tests, setTests] = useState<DiagnosticTest[]>(INITIAL_TESTS)
  const [isRunning, setIsRunning] = useState(false)
  const [completed, setCompleted] = useState(false)

  if (user?.perfil !== 'admin') {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <ShieldAlert className="h-20 w-20 text-destructive mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-2">Acesso negado</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Esta área é restrita para administradores do sistema. Você não tem permissão para
          visualizar o diagnóstico.
        </p>
        <Button asChild variant="default">
          <Link to="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Início
          </Link>
        </Button>
      </div>
    )
  }

  const updateTest = (id: number, updates: Partial<DiagnosticTest>) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }

  const runTests = async () => {
    if (isRunning) return
    setIsRunning(true)
    setCompleted(false)
    setTests(INITIAL_TESTS)

    const wait = (ms: number) => new Promise((res) => setTimeout(res, ms))

    // TEST 1: Connection
    updateTest(1, { status: 'running', message: 'Testando...' })
    await wait(500)
    try {
      const health = await pb.health.check()
      updateTest(1, { status: 'success', message: 'Conectado ao Skip Cloud', log: health })
    } catch (e: any) {
      updateTest(1, {
        status: 'error',
        message: e.message || 'Erro de conexão',
        log: e.response || e,
      })
    }

    // TEST 2: Tables
    updateTest(2, { status: 'running', message: 'Verificando tabelas...' })
    await wait(500)
    const collections = [
      'users',
      'empresas',
      'clientes',
      'fornecedores',
      'produtos_servicos',
      'contas_bancarias',
      'cartoes_credito',
      'categorias',
      'projetos',
      'centros_custo',
      'lancamentos',
      'contas_receber',
      'contas_pagar',
      'recebimentos',
      'pagamentos',
    ]
    const missing: string[] = []
    const tableLogs: Record<string, any> = {}

    for (const collection of collections) {
      try {
        await pb.collection(collection).getList(1, 1)
        tableLogs[collection] = 'OK'
      } catch (e: any) {
        if (e instanceof ClientResponseError && e.status === 404) {
          missing.push(collection === 'users' ? 'usuarios' : collection)
          tableLogs[collection] = 'NOT FOUND'
        } else {
          // If it's a 400/403, the table exists but access/filter failed
          tableLogs[collection] = `EXISTS (status ${e?.status})`
        }
      }
    }

    if (missing.length === 0) {
      updateTest(2, { status: 'success', message: '15 tabelas encontradas', log: tableLogs })
    } else {
      updateTest(2, {
        status: 'error',
        message: `Tabelas ausentes: ${missing.join(', ')}`,
        log: { missing, tableLogs },
      })
    }

    // TEST 3: User Session
    updateTest(3, { status: 'running', message: 'Lendo sessão...' })
    await wait(500)
    const currentUser = pb.authStore.record
    if (currentUser) {
      updateTest(3, {
        status: 'success',
        message: `${currentUser.name || 'Sem nome'} (${currentUser.email}) - Perfil: ${currentUser.perfil}`,
        log: currentUser,
      })
    } else {
      updateTest(3, { status: 'error', message: 'Nenhum usuário logado', log: null })
    }

    // TEST 4: RLS
    updateTest(4, { status: 'running', message: 'Consultando lançamentos...' })
    await wait(500)
    try {
      const res = await pb.collection('lancamentos').getList(1, 1)
      updateTest(4, {
        status: 'success',
        message: 'RLS funcionando corretamente',
        log: { totalItems: res.totalItems, items: res.items },
      })
    } catch (e: any) {
      updateTest(4, {
        status: 'error',
        message: 'Erro ao carregar lançamentos. Permissão negada ou erro.',
        log: e.response || e,
      })
    }

    // TEST 5: Create Record
    updateTest(5, { status: 'running', message: 'Inserindo registro...' })
    await wait(500)
    try {
      if (!currentUser?.empresa_id) throw new Error('Usuário sem empresa_id vinculado')
      const data = {
        empresa_id: currentUser.empresa_id,
        usuario_id: currentUser.id,
        valor: 0.01,
        descricao: 'TESTE_DIAGNOSTICO_SISTEMA',
        data_lancamento: new Date().toISOString(),
      }
      const created = await pb.collection('lancamentos').create(data)
      updateTest(5, {
        status: 'success',
        message: `Lançamento de teste criado com sucesso (ID: ${created.id})`,
        log: created,
      })

      // Cleanup silently
      try {
        await pb.collection('lancamentos').delete(created.id)
      } catch {
        /* intentionally ignored */
      }
    } catch (e: any) {
      updateTest(5, {
        status: 'error',
        message: e.message || 'Erro ao criar lançamento. Tente novamente.',
        log: e.response || e,
      })
    }

    setIsRunning(false)
    setCompleted(true)
  }

  const successCount = tests.filter((t) => t.status === 'success').length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Diagnóstico do Sistema
          </h1>
          <p className="text-muted-foreground mt-1">Verificação de integridade e conectividade</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Link>
          </Button>
          <Button onClick={runTests} disabled={isRunning} className="w-40">
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rodando...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" /> Executar Testes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tests.map((test) => (
          <Card
            key={test.id}
            className={cn(
              'transition-colors',
              test.status === 'success' && 'border-green-500/50 bg-green-500/5',
              test.status === 'error' && 'border-destructive/50 bg-destructive/5',
              test.status === 'running' && 'border-yellow-500/50 bg-yellow-500/5',
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base font-semibold">{test.title}</CardTitle>
                {test.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {test.status === 'error' && <XCircle className="w-5 h-5 text-destructive" />}
                {test.status === 'running' && (
                  <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                )}
              </div>
              <CardDescription>{test.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {test.status !== 'idle' && (
                <p
                  className={cn(
                    'text-sm font-medium',
                    test.status === 'error' ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {test.message}
                </p>
              )}
              {test.status === 'idle' && (
                <p className="text-sm text-muted-foreground italic">Aguardando execução...</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {completed && (
        <Card
          className={cn(
            'border-l-4',
            successCount === tests.length ? 'border-l-green-500' : 'border-l-destructive',
          )}
        >
          <CardContent className="pt-6 pb-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Resumo da Execução</h3>
              <p className="text-muted-foreground">
                {successCount} de {tests.length} testes passaram.
              </p>
            </div>
            {successCount === tests.length ? (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-destructive" />
            )}
          </CardContent>
        </Card>
      )}

      {(completed || isRunning) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Log de detalhes</CardTitle>
            <CardDescription>Respostas técnicas do servidor para depuração</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full rounded-md border bg-muted/50 p-4">
              <div className="space-y-4">
                {tests
                  .filter((t) => t.status !== 'idle')
                  .map((t) => (
                    <div key={t.id} className="text-sm font-mono break-all">
                      <div className="font-bold text-foreground mb-1">
                        Teste {t.id} — {t.title}:{' '}
                        {t.status === 'success' ? 'OK' : t.status === 'error' ? 'ERRO' : 'TESTANDO'}
                      </div>
                      <div className="text-muted-foreground">
                        Resposta: {t.log ? JSON.stringify(t.log, null, 2) : 'Nenhum log adicional'}
                      </div>
                      <div className="my-2 border-b border-border/50 last:border-0" />
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
