
"use client"

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UserProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileSettings({ open, onOpenChange }: UserProfileSettingsProps) {
  const { user } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.displayName) setName(user.displayName);
  }, [user]);

  const handleUpdate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'user_profiles', user.uid), {
        displayName: name,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Perfil atualizado", description: "Seus dados foram salvos com sucesso." });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: "Tente novamente mais tarde." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !window.confirm("Tem certeza que deseja excluir sua conta? Esta ação é permanente.")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'user_profiles', user.uid));
      await deleteUser(user);
      toast({ title: "Conta excluída", description: "Seus dados foram removidos do nosso sistema." });
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast({ 
          variant: "destructive", 
          title: "Erro de segurança", 
          description: "Por favor, saia e entre novamente para realizar esta ação." 
        });
      } else {
        toast({ variant: "destructive", title: "Erro ao excluir conta" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Perfil do Usuário</DialogTitle>
          <DialogDescription>
            Gerencie suas informações e preferências de conta.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome de exibição</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
          <div className="grid gap-2">
            <Label>E-mail</Label>
            <Input value={user?.email || ''} disabled className="bg-muted" />
          </div>

          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Zona de Perigo</AlertTitle>
            <AlertDescription>
              A exclusão da conta removerá todo o seu histórico de buscas.
            </AlertDescription>
            <Button 
              variant="destructive" 
              size="sm" 
              className="mt-2 w-full gap-2" 
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
              Excluir Minha Conta
            </Button>
          </Alert>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleUpdate} disabled={loading}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
