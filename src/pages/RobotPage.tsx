import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useNotebook } from '@/hooks/useNotebook';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Info, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useState } from 'react';

export default function RobotPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notebook, updateNotebook, saveNotebook } = useNotebook();
  const data = notebook.robot;
  const [saving, setSaving] = useState(false);

  const fields = [
    { key: 'iterations' as const, label: t('notebook.iterations'), hint: t('notebook.iterations_hint') },
    { key: 'mainProblem' as const, label: t('notebook.main_problem'), hint: t('notebook.main_problem_hint') },
    { key: 'howSolved' as const, label: t('notebook.how_solved'), hint: t('notebook.how_solved_hint') },
    { key: 'whatDifferent' as const, label: t('notebook.what_different'), hint: t('notebook.what_different_hint') },
  ];

  const handleSave = async () => {
    setSaving(true);
    await saveNotebook();
    setSaving(false);
    toast.success(t('notebook.saved'));
    navigate('/notebook');
  };

  return (
    <AppLayout>
      <div className="container px-4 py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate('/notebook')}>
            <ArrowLeft className="h-4 w-4" />{t('notebook.back')}
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <span className="text-accent font-bold">RD</span>
            </div>
            <h1 className="font-heading text-2xl font-bold">{t('notebook.robot')}</h1>
          </div>

          <div className="space-y-6">
            {fields.map((f) => (
              <div key={f.key} className="space-y-2">
                <label className="text-sm font-medium">{f.label}</label>
                <div className="flex items-start gap-2 text-xs text-muted-foreground mb-1 p-3 rounded-lg bg-muted/50">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{f.hint}</span>
                </div>
                <Textarea
                  value={data[f.key]}
                  onChange={(e) => updateNotebook('robot', { [f.key]: e.target.value })}
                  rows={5}
                />
              </div>
            ))}
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t('notebook.save')}
            </Button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
