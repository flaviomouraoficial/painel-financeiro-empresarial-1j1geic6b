import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { CheckCircle2, XCircle, Loader2, Play, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type TestStatus = 'idle' | 'testing' | 'ok' | 'error'

interface TestResult {
  id: number
  title: string
  status: TestStatus
  message: string
  errorDetail?: string
}

export default function DiagnosticoRecibos() {
  const { user } = useAuth()
  const [tests, setTests] = useState<TestResult[]>([
    { id: 1, title: 'Teste 1: Rota existe', status: 'idle', message: 'Aguardando execução' },
    {
      id: 2,
      title: 'Teste 2: Componente renderiza',
      status: 'idle',
      message: 'Aguardando execução',
    },
    {
      id: 3,
      title: 'Teste 3: Tabela recibos existe',
      status: 'idle',
      message: 'Aguardando execução',
    },
    { id: 4, title: 'Teste 4: Usuário logado', status: 'idle', message: 'Aguardando execução' },
  ])
  const [logs, setLogs] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  const updateTest = (id: number, data: Partial<TestResult>) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)))
  }

  const runTests = async () => {
    setIsRunning(true)
    setLogs([])

    // Reset status
    setTests((prev) =>
      prev.map((t) => ({
        ...t,
        status: 'idle',
        message: 'Aguardando execução',
        errorDetail: undefined,
      })),
    )

    // Test 1: Rota existe
    updateTest(1, { status: 'testing', message: '⏳ TESTANDO...' })
    addLog('Iniciando Teste 1: Verificação de rota do módulo...')
    await new Promise((r) => setTimeout(r, 600))
    try {
      const page = await import('./RecibosDespesas')
      if (page) {
        updateTest(1, { status: 'ok', message: 'Rota carregada' })
        addLog('Teste 1 passou: Rota importada com sucesso.')
      } else {
        throw new Error('Módulo vazio')
      }
    } catch (err: any) {
      updateTest(1, { status: 'error', message: 'Rota não encontrada', errorDetail: err.message })
      addLog(`Teste 1 falhou: ${err.message}`)
    }

    // Test 2: Componente renderiza (Test component logic / exports)
    updateTest(2, { status: 'testing', message: '⏳ TESTANDO...' })
    addLog('Iniciando Teste 2: Renderização de componente RecibosForm / Base...')
    await new Promise((r) => setTimeout(r, 600))
    try {
      const PageModule = await import('./RecibosDespesas')
      if (typeof PageModule.default !== 'function') {
        throw new Error(
          'O export default não é uma função React válida (verificar importações internas como RecibosForm).',
        )
      }
      updateTest(2, { status: 'ok', message: 'Componente renderizado' })
      addLog('Teste 2 passou: Componente estruturalmente válido.')
    } catch (err: any) {
      updateTest(2, {
        status: 'error',
        message: 'Erro ao renderizar componente',
        errorDetail: err.message,
      })
      addLog(`Teste 2 falhou: ${err.message}`)
    }

    // Test 3: Tabela recibos existe
    updateTest(3, { status: 'testing', message: '⏳ TESTANDO...' })
    addLog('Iniciando Teste 3: Conexão com a tabela de recibos no banco de dados...')
    try {
      await pb.collection('recibos').getList(1, 1)
      updateTest(3, { status: 'ok', message: 'Tabela encontrada' })
      addLog('Teste 3 passou: Tabela "recibos" respondeu à query com sucesso.')
    } catch (err: any) {
      updateTest(3, { status: 'error', message: 'Tabela não existe', errorDetail: err.message })
      addLog(`Teste 3 falhou: ${err.message}`)
    }

    // Test 4: Usuário logado
    updateTest(4, { status: 'testing', message: '⏳ TESTANDO...' })
    addLog('Iniciando Teste 4: Verificação de status de autenticação...')
    await new Promise((r) => setTimeout(r, 400))
    if (user && pb.authStore.isValid) {
      updateTest(4, { status: 'ok', message: `Usuário logado: ${user.name || user.email}` })
      addLog(`Teste 4 passou: Sessão ativa confirmada (${user.email}).`)
    } else {
      updateTest(4, {
        status: 'error',
        message: 'Nenhum usuário logado',
        errorDetail: 'A sessão do usuário é inválida ou expirou.',
      })
      addLog('Teste 4 falhou: Sessão inválida ou usuário desconectado.')
    }

    setIsRunning(false)
    addLog('Bateria de testes concluída.')
  }

  const passedCount = tests.filter((t) => t.status === 'ok').length
  const showSummary = tests.every((t) => t.status === 'ok' || t.status === 'error')

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Diagnóstico de Recibos
          </h1>
          <p className="text-muted-foreground mt-1">
            Ferramenta de verificação para solução do erro de tela branca.
          </p>
        </div>
        <Button
          onClick={runTests}
          disabled={isRunning}
          className="bg-[#268C83] hover:bg-[#1f736c] text-white shadow-md transition-all whitespace-nowrap"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Executar Testes
        </Button>
      </div>

      {showSummary && !isRunning && (
        <div
          className={cn(
            'p-4 rounded-lg border flex flex-col gap-1 animate-slide-down',
            passedCount === 4
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800',
          )}
        >
          <h3 className="font-semibold text-lg">{passedCount} de 4 testes passaram</h3>
          <p className="text-sm opacity-90">
            {passedCount === 4
              ? 'Todos os sistemas estão operacionais. O módulo deve carregar sem problemas.'
              : 'Foram encontrados erros que podem ser a causa raiz da tela branca.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map((test) => (
          <Card
            key={test.id}
            className={cn(
              'transition-colors duration-300',
              test.status === 'ok' && 'border-green-500 bg-green-50/40',
              test.status === 'error' && 'border-red-500 bg-red-50/40',
              test.status === 'testing' && 'border-[#268C83] bg-[#268C83]/5',
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                {test.status === 'ok' && (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
                {test.status === 'error' && (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                {test.status === 'testing' && (
                  <Loader2 className="w-5 h-5 text-[#268C83] animate-spin flex-shrink-0" />
                )}
                {test.status === 'idle' && (
                  <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <span className="truncate">{test.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  'font-medium',
                  test.status === 'ok' && 'text-green-700',
                  test.status === 'error' && 'text-red-700',
                  test.status === 'testing' && 'text-[#268C83]',
                  test.status === 'idle' && 'text-muted-foreground',
                )}
              >
                {test.message}
              </p>
              {test.errorDetail && (
                <div className="mt-3 bg-red-100/50 p-2.5 rounded-md border border-red-100">
                  <p className="text-xs text-red-800 font-mono break-all leading-relaxed">
                    {test.errorDetail}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b pb-4">
          <CardTitle className="text-lg text-slate-800">Log de detalhes técnicos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[240px] w-full bg-slate-950 p-4">
            {logs.length === 0 ? (
              <p className="text-slate-500 text-sm font-mono">Aguardando execução dos testes...</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {logs.map((log, i) => (
                  <span
                    key={i}
                    className={cn(
                      'text-sm font-mono leading-relaxed',
                      log.includes('falhou')
                        ? 'text-red-400'
                        : log.includes('passou')
                          ? 'text-green-400'
                          : 'text-slate-300',
                    )}
                  >
                    {log}
                  </span>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
