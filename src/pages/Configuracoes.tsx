import { useState, useEffect } from 'react'
import { Save, Building2, User, Wallet, Lock, Loader2 } from 'lucide-react'
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
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function Configuracoes() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [empresa, setEmpresa] = useState<any>({})
  const [perfil, setPerfil] = useState<any>({})
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [perfilErrors, setPerfilErrors] = useState<Record<string, string>>({})
  const [isSavingPerfil, setIsSavingPerfil] = useState(false)

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    password: '',
    passwordConfirm: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setPerfil({ name: user.name, email: user.email })
      if (user.avatar) {
        setAvatarPreview(pb.files.getURL(user, user.avatar))
      }
      if (user.empresa_id) {
        pb.collection('empresas').getOne(user.empresa_id).then(setEmpresa).catch(console.error)
      }
    }
  }, [user])

  useEffect(() => {
    if (avatarFile) {
      const objectUrl = URL.createObjectURL(avatarFile)
      setAvatarPreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else if (user?.avatar) {
      setAvatarPreview(pb.files.getURL(user, user.avatar))
    }
  }, [avatarFile, user])

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

    setPerfilErrors({})
    setIsSavingPerfil(true)
    try {
      const formData = new FormData()
      formData.append('name', perfil.name || '')
      formData.append('email', perfil.email || '')

      if (avatarFile) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!validTypes.includes(avatarFile.type)) {
          setPerfilErrors({ avatar: 'Formato inválido. Use JPG, PNG ou WEBP.' })
          setIsSavingPerfil(false)
          return
        }
        if (avatarFile.size > 5242880) {
          // 5MB limit
          setPerfilErrors({ avatar: 'A imagem deve ter no máximo 5MB.' })
          setIsSavingPerfil(false)
          return
        }
        formData.append('avatar', avatarFile)
      }

      const updatedUser = await pb.collection('users').update(user.id, formData)

      if (updatedUser.avatar) {
        setAvatarPreview(`${pb.files.getURL(updatedUser, updatedUser.avatar)}?t=${Date.now()}`)
      }
      setAvatarFile(null)

      pb.authStore.save(pb.authStore.token, updatedUser)

      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso!',
        className: 'bg-emerald-600 text-white border-none',
      })
    } catch (err: any) {
      const errors = extractFieldErrors(err)
      if (Object.keys(errors).length > 0) {
        setPerfilErrors(errors)
        toast({
          title: 'Erro de validação',
          description: 'Verifique os campos destacados.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erro',
          description: getErrorMessage(err) || 'Não foi possível salvar o perfil.',
          variant: 'destructive',
        })
      }
    } finally {
      setIsSavingPerfil(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (passwordData.password !== passwordData.passwordConfirm) {
      return toast({
        title: 'Erro',
        description: 'As senhas não conferem.',
        variant: 'destructive',
      })
    }
    if (passwordData.password.length < 8) {
      return toast({
        title: 'Erro',
        description: 'A nova senha deve ter no mínimo 8 caracteres.',
        variant: 'destructive',
      })
    }

    setIsChangingPassword(true)
    try {
      await pb.collection('users').update(user.id, {
        oldPassword: passwordData.oldPassword,
        password: passwordData.password,
        passwordConfirm: passwordData.passwordConfirm,
        trocar_senha_proximo_acesso: false,
      })
      toast({
        title: 'Sucesso',
        description: 'Senha atualizada com sucesso',
        className: 'bg-emerald-600 text-white border-none',
      })
      setPasswordData({ oldPassword: '', password: '', passwordConfirm: '' })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar senha. Verifique sua senha atual.',
        variant: 'destructive',
      })
    } finally {
      setIsChangingPassword(false)
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

          {user?.perfil === 'admin' && (
            <Card className="mt-6 shadow-sm border-t-4 border-t-[#268C83]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" /> Configurações Financeiras
                </CardTitle>
                <CardDescription>
                  Ajuste os saldos iniciais das contas bancárias para o fluxo de caixa.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to="/configuracoes/saldo-inicial">Configurar Saldos Iniciais</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="perfil" className="space-y-6">
          <Card className="mt-4 shadow-sm border-t-4 border-t-secondary">
            <form onSubmit={handleSavePerfil}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Configurações Pessoais
                </CardTitle>
                <CardDescription>Atualize seu nome e foto de perfil.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                  <Avatar className="h-20 w-20 border-2 border-muted shrink-0">
                    <AvatarImage
                      src={avatarPreview || undefined}
                      alt={perfil.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl">
                      {perfil.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2 flex-1 w-full">
                    <Label>Foto de Perfil (Avatar)</Label>
                    <Input
                      key={avatarFile ? 'file-selected' : 'file-empty'}
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      className={perfilErrors.avatar ? 'border-red-500' : ''}
                    />
                    {perfilErrors.avatar && (
                      <p className="text-sm text-red-500">{perfilErrors.avatar}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Recomendado: 256x256px. Máx: 5MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Nome Completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      required
                      value={perfil.name || ''}
                      onChange={(e) => setPerfil({ ...perfil, name: e.target.value })}
                      className={perfilErrors.name ? 'border-red-500' : ''}
                    />
                    {perfilErrors.name && (
                      <p className="text-sm text-red-500">{perfilErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      E-mail <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      required
                      value={perfil.email || ''}
                      onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                      className={perfilErrors.email ? 'border-red-500' : ''}
                    />
                    {perfilErrors.email && (
                      <p className="text-sm text-red-500">{perfilErrors.email}</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 dark:bg-slate-900 px-6 py-4 justify-end">
                <Button type="submit" disabled={isSavingPerfil}>
                  {isSavingPerfil ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Atualizar Perfil
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="shadow-sm border-t-4 border-t-[#268C83]">
            <form onSubmit={handleUpdatePassword}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" /> Alterar Senha
                </CardTitle>
                <CardDescription>
                  Mantenha sua conta segura atualizando sua senha regularmente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 max-w-sm">
                  <div className="space-y-2">
                    <Label>
                      Senha Atual <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="password"
                      required
                      value={passwordData.oldPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, oldPassword: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Nova Senha <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="password"
                      required
                      minLength={8}
                      value={passwordData.password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, password: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Confirmar Nova Senha <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="password"
                      required
                      minLength={8}
                      value={passwordData.passwordConfirm}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, passwordConfirm: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 dark:bg-slate-900 px-6 py-4 justify-end">
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-[#268C83] hover:bg-[#1f736b] h-[44px]"
                >
                  {isChangingPassword ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Atualizar Senha
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
