
"use client"

import { useUser, useAuth, useFirestore } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User as UserIcon, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfileSettings } from './user-profile-settings';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function AuthButton() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Salva/Atualiza perfil no Firestore
      await setDoc(doc(db, 'user_profiles', user.uid), {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        toast({
          variant: "destructive",
          title: "Provedor desativado",
          description: "O login com Google precisa ser ativado no Console do Firebase em Authentication > Sign-in method.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao fazer login",
          description: "Não foi possível completar a autenticação. Tente novamente.",
        });
      }
    }
  };

  const handleLogout = () => signOut(auth);

  if (isUserLoading) return <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />;

  if (!user) {
    return (
      <Button onClick={handleLogin} variant="outline" className="gap-2">
        <LogIn className="h-4 w-4" />
        Entrar com Google
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
              <AvatarFallback><UserIcon /></AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserProfileSettings 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </>
  );
}
