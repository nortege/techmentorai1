import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useDiaryEntries } from '@/hooks/useDiaryEntries';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function DiaryPage() {
  const { t } = useTranslation();
  const { entries: diaryEntries, deleteEntry } = useDiaryEntries();

  return (
    <AppLayout>
      <div className="container px-4 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-heading text-3xl font-bold">{t('diary.title')}</h1>
          <Link to="/diary/new">
            <Button className="gap-2"><Plus className="h-4 w-4" />{t('diary.new_entry')}</Button>
          </Link>
        </div>
        <p className="text-muted-foreground mb-6">{t('diary.subtitle')}</p>

        {diaryEntries.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center shadow-card">
            <p className="text-muted-foreground mb-4">{t('diary.no_entries')}</p>
            <Link to="/diary/new">
              <Button className="gap-2"><Plus className="h-4 w-4" />{t('diary.new_entry')}</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {diaryEntries.map((entry, i) => (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-sm text-muted-foreground font-medium">
                      {new Date(entry.date).toLocaleDateString()} · {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex gap-1.5 mt-1">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteEntry(entry.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div><span className="text-xs font-medium text-muted-foreground">{t('diary.q1')}</span><p className="text-sm">{entry.q1}</p></div>
                  {entry.q2 && <div><span className="text-xs font-medium text-muted-foreground">{t('diary.q2')}</span><p className="text-sm">{entry.q2}</p></div>}
                  {entry.q3 && <div><span className="text-xs font-medium text-muted-foreground">{t('diary.q3')}</span><p className="text-sm">{entry.q3}</p></div>}
                </div>
                {entry.photos.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {entry.photos.map((url, idx) => (
                      <img key={idx} src={url} alt="" className="h-20 w-20 object-cover rounded-lg border" />
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
