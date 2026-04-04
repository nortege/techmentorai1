import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useNotebook } from '@/hooks/useNotebook';
import { useDiaryEntries } from '@/hooks/useDiaryEntries';
import { useAuth } from '@/contexts/AuthContext';
import { NotebookPen, CheckSquare, ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notebook } = useNotebook();
  const { entries: diaryEntries } = useDiaryEntries();

  const calcProgress = () => {
    const fields = [
      notebook.innovation.problem, notebook.innovation.research,
      notebook.innovation.solution, notebook.innovation.nextStep,
      notebook.robot.iterations, notebook.robot.mainProblem,
      notebook.robot.howSolved, notebook.robot.whatDifferent,
      ...Object.values(notebook.coreValues),
    ];
    const filled = fields.filter((f) => f.length > 10).length;
    return Math.round((filled / fields.length) * 100);
  };

  const progress = calcProgress();

  const sections = [
    { to: '/notebook/innovation', label: t('notebook.innovation'), desc: t('notebook.innovation_desc'), color: 'bg-primary/10 text-primary' },
    { to: '/notebook/robot', label: t('notebook.robot'), desc: t('notebook.robot_desc'), color: 'bg-accent/10 text-accent' },
    { to: '/notebook/corevalues', label: t('notebook.corevalues'), desc: t('notebook.corevalues_desc'), color: 'bg-success/10 text-success' },
  ];

  return (
    <AppLayout>
      <div className="container px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold mb-1">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <NotebookPen className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{t('dashboard.entries')}</span>
            </div>
            <p className="text-3xl font-heading font-bold">{diaryEntries.length}</p>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">{t('dashboard.progress')}</span>
            </div>
            <p className="text-3xl font-heading font-bold mb-2">{progress}%</p>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-card flex flex-col justify-center items-center gap-3">
            <Link to="/diary/new">
              <Button className="gap-2"><Plus className="h-4 w-4" />{t('dashboard.quick_entry')}</Button>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="font-heading font-semibold text-lg mb-4">{t('dashboard.sections')}</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {sections.map((s) => (
              <Link key={s.to} to={s.to} className="group rounded-xl border bg-card p-5 shadow-card hover:border-primary/30 transition-all">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3 ${s.color}`}>{s.label}</div>
                <p className="text-sm text-muted-foreground mb-3">{s.desc}</p>
                <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  {t('common.next')} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-heading font-semibold text-lg mb-4">{t('dashboard.recent')}</h2>
          {diaryEntries.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center shadow-card">
              <p className="text-muted-foreground">{t('diary.no_entries')}</p>
              <Link to="/diary/new" className="mt-4 inline-block">
                <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" />{t('diary.new_entry')}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {diaryEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="rounded-xl border bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</span>
                    <div className="flex gap-1.5">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm line-clamp-2">{entry.q1}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
