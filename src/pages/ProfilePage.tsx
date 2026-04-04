import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Download, Trash2, FileText, Loader2, Mail, MapPin, Calendar, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ExportedPdf {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}


export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState({ display_name: '', team_name: '', season: '2024-2025', region: '' });
  const [pdfs, setPdfs] = useState<ExportedPdf[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) setProfile({ display_name: data.display_name || '', team_name: data.team_name || '', season: data.season || '2024-2025', region: data.region || '' });
    });
    supabase.from('exported_pdfs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setPdfs(data as ExportedPdf[]);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: profile.display_name,
      team_name: profile.team_name,
      season: profile.season,
      region: profile.region,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(t('common.save'));
  };

  const handleDeletePdf = async (pdf: ExportedPdf) => {
    if (!user) return;
    const path = `${user.id}/${pdf.file_name}`;
    await supabase.storage.from('pdfs').remove([path]);
    await supabase.from('exported_pdfs').delete().eq('id', pdf.id);
    setPdfs((prev) => prev.filter((p) => p.id !== pdf.id));
    toast.success(t('common.delete'));
  };

  return (
    <AppLayout>
      <div className="container px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold mb-2">{t('profile.title')}</h1>
          <p className="text-muted-foreground mb-8">{t('profile.subtitle')}</p>

          {/* User info card */}
          <div className="rounded-2xl border bg-card p-6 shadow-card mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-heading font-bold text-xl">{profile.display_name || user?.email}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  {profile.team_name && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      <Users className="h-3 w-3" />
                      {profile.team_name}
                    </div>
                  )}
                  {profile.region && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      <MapPin className="h-3 w-3" />
                      {profile.region}
                    </div>
                  )}
                  {profile.season && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      <Calendar className="h-3 w-3" />
                      {profile.season}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('profile.display_name')}</label>
                <Input value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('export.team_name')}</label>
                <Input value={profile.team_name} onChange={(e) => setProfile({ ...profile, team_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('export.season')}</label>
                <Input value={profile.season} onChange={(e) => setProfile({ ...profile, season: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('export.region')}</label>
                <Input value={profile.region} onChange={(e) => setProfile({ ...profile, region: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2 mt-4">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('common.save')}
            </Button>
          </div>


          {/* Exported PDFs */}
          <div className="rounded-2xl border bg-card p-6 shadow-card mb-6">
            <h2 className="font-heading font-semibold text-lg mb-4">{t('profile.my_pdfs')}</h2>
            {pdfs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t('profile.no_pdfs')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pdfs.map((pdf) => (
                  <div key={pdf.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{pdf.file_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(pdf.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <a href={pdf.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                      </a>
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePdf(pdf)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button variant="outline" className="w-full" onClick={signOut}>
            {t('auth.logout')}
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
