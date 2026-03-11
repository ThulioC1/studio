
"use client"

import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCnpj } from '@/types/cnpj';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchHistoryProps {
  onSelect: (cnpj: string) => void;
}

export function SearchHistory({ onSelect }: SearchHistoryProps) {
  const { user } = useUser();
  const db = useFirestore();

  const historyQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, 'user_profiles', user.uid, 'history'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
  }, [user, db]);

  const { data: searches, isLoading } = useCollection(historyQuery);

  const handleDelete = async (searchId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'user_profiles', user.uid, 'history', searchId));
  };

  if (!user) return null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Buscas Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : searches && searches.length > 0 ? (
          <div className="space-y-3">
            {searches.map((search) => (
              <div 
                key={search.id} 
                className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-all"
              >
                <div 
                  className="flex-1 cursor-pointer" 
                  onClick={() => onSelect(search.cnpj)}
                >
                  <p className="text-sm font-bold truncate max-w-[180px]">
                    {search.razaoSocial}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCnpj(search.cnpj)}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(search.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhuma busca recente.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
