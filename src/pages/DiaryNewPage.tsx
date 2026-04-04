import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useDiaryEntries } from '@/hooks/useDiaryEntries';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Upload, Info, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const tagOptions = ['Robot', 'Innovation', 'Core Values', 'General'];

export default function DiaryNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addEntry } = useDiaryEntries();
  const { user } = useAuth();
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    setUploading(true);
    const newPhotos: string[] = [];
    for (const file of Array.from(e.target.files)) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('photos').upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from('photos').getPublicUrl(path);
        newPhotos.push(data.publicUrl);
      }
    }
    setPhotos((prev) => [...prev, ...newPhotos]);
    setUploading(false);
  };

  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!q1.trim()) return;
    setSaving(true);
    await addEntry({ date: new Date().toISOString(), q1, q2, q3, photos, tags });
    setSaving(false);
    toast.success(t('diary.save'));
    navigate('/diary');
  };

  return (
    <AppLayout>
      <div className="container px-4 py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate('/diary')}>
            <ArrowLeft className="h-4 w-4" />{t('common.back')}
          </Button>

          <h1 className="font-heading text-3xl font-bold mb-6">{t('diary.new_entry')}</h1>

          <div className="space-y-6">
            {/* Q1 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('diary.q1')}</label>
              <div className="flex items-start gap-2 text-xs text-muted-foreground mb-1">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />{t('diary.q1_desc')}
              </div>
              <Textarea value={q1} onChange={(e) => setQ1(e.target.value)} placeholder={t('diary.placeholder1')} rows={4} />
            </div>

            {/* Q2 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('diary.q2')}</label>
              <div className="flex items-start gap-2 text-xs text-muted-foreground mb-1">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />{t('diary.q2_desc')}
              </div>
              <Textarea value={q2} onChange={(e) => setQ2(e.target.value)} placeholder={t('diary.placeholder2')} rows={4} />
            </div>

            {/* Q3 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('diary.q3')}</label>
              <div className="flex items-start gap-2 text-xs text-muted-foreground mb-1">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />{t('diary.q3_desc')}
              </div>
              <Textarea value={q3} onChange={(e) => setQ3(e.target.value)} placeholder={t('diary.placeholder3')} rows={4} />
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('diary.photos_label')}</label>
              <div className="flex items-start gap-2 text-xs text-muted-foreground mb-2">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />{t('diary.q4_desc')}
              </div>
              <div className="flex flex-wrap gap-3">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative">
                    <img src={url} alt="" className="h-24 w-24 object-cover rounded-lg border" />
                    <button onClick={() => removePhoto(idx)} className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                  <span className="text-xs text-muted-foreground mt-1">{uploading ? t('diary.uploading') : t('diary.upload_photos')}</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('diary.tags_label')}</label>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${tags.includes(tag) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                  >
                    {t(`diary.tags.${tag.toLowerCase().replace(' ', '')}` as any) || tag}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={!q1.trim() || saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t('diary.save')}
            </Button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
