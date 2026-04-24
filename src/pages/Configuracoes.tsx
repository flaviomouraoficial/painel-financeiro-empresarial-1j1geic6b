import { useState, useEffect } from 'react'
import { Save, Building2, User } from 'lucide-react'
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
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export default function Configuracoes() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [empresa, setEmpresa] = useState<any>({})
  const [perfil, setPerfil] = useState<any>({})
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    if (user) {
      setPerfil({ name: user.name })
      if (user.empresa_id) {
        pb.collection('empresas').getOne(user.empresa_id).then(setEmpresa).catch(console.error)
      }
    }
  }, [user])

  const handleSaveEmpresa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.empresa_id || user.perfil !== 'admin') {
      return toast({
        title: 'Atenção',
        description: 'Apenas administradores podem alterar a empresa.',
        variant: 'destructive',
      })
    }
    try {
      await pb.collection('empresas').update(user.empresa_id, empresa)
      toast({ title: 'Sucesso', description: 'Dados da empresa atualizados.' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível salvar.', variant: 'destructive' })
    }
  }

  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const formData = new FormData()
      formData.append('name', perfil.name)
      if (avatarFile) formData.append('avatar', avatarFile)

      await pb.collection('users').update(user.id, formData)
      toast({ title: 'Sucesso', description: 'Perfil atualizado.' })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o perfil.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h1>
        <p className="text-muted-foreground text-sm">Ajuste preferências e dados da empresa</p>
      </div>

      <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="empresa">Dados da Empresa</TabsTrigger>
          <TabsTrigger value="perfil">Meu Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <Card className="mt-4 shadow-sm border-t-4 border-t-primary">
            <form onSubmit={handleSaveEmpresa}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Informações Empresariais
                </CardTitle>
                <CardDescription>Estes dados serão usados em relatórios e recibos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Razão Social <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      required
                      value={empresa.razao_social || ''}
                      onChange={(e) => setEmpresa({ ...empresa, razao_social: e.target.value })}
                      disabled={user?.perfil !== 'admin'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      CNPJ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      required
                      value={empresa.cnpj || ''}
                      onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })}
                      disabled={user?.perfil !== 'admin'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome Fantasia</Label>
                    <Input
                      value={empresa.nome_fantasia || ''}
                      onChange={(e) => setEmpresa({ ...empresa, nome_fantasia: e.target.value })}
                      disabled={user?.perfil !== 'admin'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={empresa.telefone || ''}
                      onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })}
                      disabled={user?.perfil !== 'admin'}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>E-mail de Contato</Label>
                    <Input
                      type="email"
                      value={empresa.email || ''}
                      onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })}
                      disabled={user?.perfil !== 'admin'}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Endereço</Label>
                    <Input
                      value={empresa.endereco || ''}
                      onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })}
                      disabled={user?.perfil !== 'admin'}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 dark:bg-slate-900 px-6 py-4 justify-end">
                <Button type="submit" disabled={user?.perfil !== 'admin'}>
                  <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="perfil">
          <Card className="mt-4 shadow-sm border-t-4 border-t-secondary">
            <form onSubmit={handleSavePerfil}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Configurações Pessoais
                </CardTitle>
                <CardDescription>Atualize seu nome e foto de perfil.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Nome Completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      required
                      value={perfil.name || ''}
                      onChange={(e) => setPerfil({ ...perfil, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Foto de Perfil (Avatar)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 dark:bg-slate-900 px-6 py-4 justify-end">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" /> Atualizar Perfil
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
