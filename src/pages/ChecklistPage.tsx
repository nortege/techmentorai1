import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useNotebook } from '@/hooks/useNotebook';
import { useDiaryEntries } from '@/hooks/useDiaryEntries';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface CheckItem {
  label: string;
  filled: boolean;
  recommendation: string;
  section: string;
}

export default function ChecklistPage() {
  const { t } = useTranslation();
  const { notebook } = useNotebook();
  const { entries: diaryEntries } = useDiaryEntries();

  const items: CheckItem[] = [
    { label: t('checklist.items.innovation_problem'), filled: notebook.innovation.problem.length > 10, recommendation: t('checklist.items.innovation_problem_rec'), section: '/notebook/innovation' },
    { label: t('checklist.items.innovation_research'), filled: notebook.innovation.research.length > 100, recommendation: t('checklist.items.innovation_research_rec'), section: '/notebook/innovation' },
    { label: t('checklist.items.innovation_solution'), filled: notebook.innovation.solution.length > 10, recommendation: t('checklist.items.innovation_solution_rec'), section: '/notebook/innovation' },
    { label: t('checklist.items.innovation_next'), filled: notebook.innovation.nextStep.length > 10, recommendation: t('checklist.items.innovation_next_rec'), section: '/notebook/innovation' },
    { label: t('checklist.items.robot_iterations'), filled: notebook.robot.iterations.length > 10, recommendation: t('checklist.items.robot_iterations_rec'), section: '/notebook/robot' },
    { label: t('checklist.items.robot_problem'), filled: notebook.robot.mainProblem.length > 10, recommendation: t('checklist.items.robot_problem_rec'), section: '/notebook/robot' },
    { label: t('checklist.items.robot_solved'), filled: notebook.robot.howSolved.length > 10, recommendation: t('checklist.items.robot_solved_rec'), section: '/notebook/robot' },
    { label: t('checklist.items.robot_reflection'), filled: notebook.robot.whatDifferent.length > 10, recommendation: t('checklist.items.robot_reflection_rec'), section: '/notebook/robot' },
    ...Object.entries(notebook.coreValues).map(([key, val]) => ({
      label: `${t('checklist.items.cv_item')}${key.charAt(0).toUpperCase() + key.slice(1)}`,
      filled: val.length > 10,
      recommendation: `${t('checklist.items.cv_item_rec')}${key}`,
      section: '/notebook/corevalues',
    })),
    { label: t('checklist.items.diary_entries'), filled: diaryEntries.length >= 5, recommendation: t('checklist.items.diary_entries_rec'), section: '/diary' },
  ];

  const filledCount = items.filter((i) => i.filled).length;
  const progress = Math.round((filledCount / items.length) * 100);
  const isReady = progress === 100;

  return (
    <AppLayout>
      <div className="container px-4 py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold mb-2">{t('checklist.title')}</h1>
          <p className="text-muted-foreground mb-8">{t('checklist.subtitle')}</p>

          <div className="rounded-xl border bg-card p-6 shadow-card mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="font-heading font-semibold">{t('checklist.overall')}</span>
              <span className="text-2xl font-bold font-heading">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3 mb-3" />
            <p className={`text-sm font-medium ${isReady ? 'text-success' : 'text-warning'}`}>
              {isReady ? t('checklist.ready') : t('checklist.not_ready')}
            </p>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <motion.div key={item.label + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="rounded-lg border bg-card p-4 flex items-start gap-3">
                {item.filled ? <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  {!item.filled && <p className="text-xs text-muted-foreground mt-1">{item.recommendation}</p>}
                </div>
                {!item.filled && (
                  <Link to={item.section}>
                    <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

          {isReady && (
            <div className="mt-8 text-center">
              <Link to="/export">
                <Button size="lg" className="gap-2">{t('export.generate')} <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
