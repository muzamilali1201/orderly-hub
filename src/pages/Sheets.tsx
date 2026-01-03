import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { NotificationBell } from '@/components/NotificationBell';
import { useToast } from '@/hooks/use-toast';
import { getSheets, createSheet, deleteSheet, Sheet } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Sheets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newSheetName, setNewSheetName] = useState('');

  const { data: sheetsData, isLoading } = useQuery({
    queryKey: ['sheets'],
    queryFn: async () => {
      const res = await getSheets();
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createSheet(name),
    onSuccess: () => {
      toast({ title: 'Sheet created successfully!' });
      setNewSheetName('');
      queryClient.invalidateQueries({ queryKey: ['sheets'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to create sheet',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (sheetId: string) => deleteSheet(sheetId),
    onSuccess: () => {
      toast({ title: 'Sheet deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['sheets'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to delete sheet',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetName.trim()) return;
    createMutation.mutate(newSheetName.trim());
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 ml-8 md:ml-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-foreground">Sheets</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">
                  Manage your order sheets
                </p>
              </div>
            </div>
            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {/* Create Sheet Form */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Create New Sheet</h2>
          <form onSubmit={handleCreateSheet} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Enter sheet name..."
              value={newSheetName}
              onChange={(e) => setNewSheetName(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={createMutation.isPending || !newSheetName.trim()}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span className="ml-2">Create Sheet</span>
            </Button>
          </form>
        </Card>

        {/* Sheets Listing */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">All Sheets</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !sheetsData?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No sheets created yet</p>
              <p className="text-sm">Create your first sheet above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sheetsData.map((sheet: Sheet) => (
                <div
                  key={sheet._id}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{sheet.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created by {sheet.createdBy?.username || 'Unknown'} • {new Date(sheet.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Sheet</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{sheet.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(sheet._id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
