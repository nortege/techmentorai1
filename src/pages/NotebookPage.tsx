import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useNotebook } from '@/hooks/useNotebook';
import { Lightbulb, Cpu, Heart, ArrowRight, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

export default function NotebookPage() {
  const { t } = useTranslation();
  const { notebook } = useNotebook();

  const calcSectionProgress = (fields: string[]) => {
    const filled = fields.filter((f) => f.length > 10).length;
    return Math.round((filled / fields.length) * 100);
  };

  const sections = [
    { to: '/notebook/innovation', label: t('notebook.innovation'), desc: t('notebook.innovation_desc'), icon: Lightbulb, color: 'text-primary', bgColor: 'bg-primary/10', progress: calcSectionProgress(Object.values(notebook.innovation)) },
    { to: '/notebook/research', label: t('notebook.research_section'), desc: t('notebook.research_section_desc'), icon: BarChart3, color: 'text-warning', bgColor: 'bg-warning/10', progress: calcSectionProgress(Object.values(notebook.research)) },
    { to: '/notebook/robot', label: t('notebook.robot'), desc: t('notebook.robot_desc'), icon: Cpu, color: 'text-accent', bgColor: 'bg-accent/10', progress: calcSectionProgress(Object.values(notebook.robot)) },
    { to: '/notebook/corevalues', label: t('notebook.corevalues'), desc: t('notebook.corevalues_desc'), icon: Heart, color: 'text-success', bgColor: 'bg-success/10', progress: calcSectionProgress(Object.values(notebook.coreValues)) },
  ];

  return (
    <AppLayout>
      <div className="container px-4 py-8">
        <h1 className="font-heading text-3xl font-bold mb-2">{t('notebook.title')}</h1>
        <p className="text-muted-foreground mb-8">{t('notebook.subtitle')}</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sections.map((s, i) => (
            <motion.div key={s.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link to={s.to} className="group block rounded-xl border bg-card p-6 shadow-card hover:border-primary/30 transition-all h-full">
                <div className={`h-12 w-12 rounded-lg ${s.bgColor} flex items-center justify-center mb-4`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{s.label}</h3>
                <p className="text-sm text-muted-foreground mb-4">{s.desc}</p>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{t('dashboard.progress')}</span>
                    <span>{s.progress}%</span>
                  </div>
                  <Progress value={s.progress} className="h-2" />
                </div>
                <span className="text-sm font-medium text-primary flex items-center gap-1 mt-3 group-hover:gap-2 transition-all">
                  {t('common.next')} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
