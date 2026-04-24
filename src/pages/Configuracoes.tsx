import { Save, Building2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Configuracoes() {
  return (
    <div className="space-y-6 animate-fade-in-up max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h1>
        <p className="text-muted-foreground text-sm">Ajuste preferências e dados da empresa</p>
      </div>

      <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="empresa">Dados da Empresa</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <Card className="mt-4 shadow-sm border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações Empresariais
              </CardTitle>
              <CardDescription>Estes dados serão usados em relatórios e recibos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="razao">Razão Social</Label>
                  <Input id="razao" defaultValue="Trend Consultoria LTDA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" defaultValue="09.465.223/0001-07" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail de Contato</Label>
                  <Input id="email" type="email" defaultValue="contato@trendconsultoria.com.br" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" defaultValue="(11) 3456-7890" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 dark:bg-slate-900 px-6 py-4 justify-end">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preferencias">
          <Card className="mt-4 shadow-sm">
            <CardHeader>
              <CardTitle>Preferências de Sistema</CardTitle>
              <CardDescription>Ajuste formato de moeda, alertas e notificações.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground text-sm">
                Opções de configuração em desenvolvimento.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
