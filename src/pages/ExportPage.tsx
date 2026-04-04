import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/AppLayout';
import { useNotebook } from '@/hooks/useNotebook';
import { useDiaryEntries } from '@/hooks/useDiaryEntries';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, Loader2, Upload, CheckCircle2, Image, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function ExportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notebook } = useNotebook();
  const { entries: diaryEntries } = useDiaryEntries();
  const [generating, setGenerating] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [teamInfo, setTeamInfo] = useState({ name: '', season: '2024-2025', region: '' });
  const [criteriaFile, setCriteriaFile] = useState<string | null>(null);
  const [criteriaName, setCriteriaName] = useState('');
  const [exportPhotos, setExportPhotos] = useState<string[]>([]);
  const [examplePdf, setExamplePdf] = useState<string | null>(null);
  const [examplePdfName, setExamplePdfName] = useState('');
  const [uploadingCriteria, setUploadingCriteria] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingExample, setUploadingExample] = useState(false);
  const [aiSections, setAiSections] = useState<Record<string, string> | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('team_name, season, region').eq('id', user.id).single().then(({ data }) => {
      if (data) setTeamInfo({ name: data.team_name || '', season: data.season || '2024-2025', region: data.region || '' });
    });
  }, [user]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleCriteriaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user) return;
    setUploadingCriteria(true);
    const file = e.target.files[0];
    const path = `${user.id}/${crypto.randomUUID()}_${file.name}`;
    const { error } = await supabase.storage.from('criteria').upload(path, file, { upsert: true });
    if (error) {
      console.error('Criteria upload error:', error);
      toast.error(t('export.upload_error') + ': ' + error.message);
    } else {
      const { data } = supabase.storage.from('criteria').getPublicUrl(path);
      setCriteriaFile(data.publicUrl);
      setCriteriaName(file.name);
      toast.success(t('export.criteria_uploaded'));
    }
    setUploadingCriteria(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    setUploadingPhotos(true);
    const newPhotos: string[] = [];
    for (const file of Array.from(e.target.files)) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('photos').upload(path, file, { upsert: true });
      if (error) {
        console.error('Photo upload error:', error);
        toast.error(t('export.upload_error') + ': ' + error.message);
      } else {
        const { data } = supabase.storage.from('photos').getPublicUrl(path);
        newPhotos.push(data.publicUrl);
      }
    }
    setExportPhotos((prev) => [...prev, ...newPhotos]);
    setUploadingPhotos(false);
  };

  const removePhoto = (idx: number) => setExportPhotos((prev) => prev.filter((_, i) => i !== idx));

  const handleExampleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user) return;
    setUploadingExample(true);
    const file = e.target.files[0];
    const path = `${user.id}/example_${crypto.randomUUID()}_${file.name}`;
    const { error } = await supabase.storage.from('criteria').upload(path, file, { upsert: true });
    if (error) {
      console.error('Example upload error:', error);
      toast.error(t('export.upload_error') + ': ' + error.message);
    } else {
      const { data } = supabase.storage.from('criteria').getPublicUrl(path);
      setExamplePdf(data.publicUrl);
      setExamplePdfName(file.name);
      toast.success(t('export.example_uploaded'));
    }
    setUploadingExample(false);
  };

  const handleAiGenerate = async () => {
    if (!user) return;
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: {
          notebook,
          diaryEntries,
          criteriaText: criteriaFile ? `Критерии загружены: ${criteriaName}` : null,
          teamInfo,
        },
      });
      if (error) throw error;
      if (data?.sections) {
        setAiSections(data.sections);
        // Auto-generate PDF and open in new tab
        await generatePdfFromSections(data.sections);
      } else {
        throw new Error('No sections returned');
      }
    } catch (err: any) {
      console.error('AI generation error:', err);
      toast.error(err.message || t('export.ai_error'));
    } finally {
      setAiGenerating(false);
    }
  };

  const buildPdf = (sections: Record<string, string> | null) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = margin;

    const addText = (text: string, fontSize: number, isBold = false) => {
      doc.setFontSize(fontSize);
      if (isBold) doc.setFont('helvetica', 'bold');
      else doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(text, contentW);
      for (const line of lines) {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += fontSize * 0.5;
      }
      y += 4;
    };

    const addSection = (title: string, content: string) => {
      if (y > 250) { doc.addPage(); y = margin; }
      addText(title, 14, true);
      if (content.trim()) addText(content, 10);
      else addText('—', 10);
      y += 4;
    };

    if (sections) {
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text(teamInfo.name || 'Project Document', pageW / 2, 60, { align: 'center' });
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Season: ${teamInfo.season || ''}`, pageW / 2, 80, { align: 'center' });
      if (teamInfo.region) doc.text(`Region: ${teamInfo.region}`, pageW / 2, 90, { align: 'center' });

      const sectionTitles: [string, string][] = [
        ['annotation', 'Annotation'], ['introduction', 'Introduction'],
        ['goals', 'Goals, Tasks and Hypothesis'], ['existing_solutions', 'Review of Existing Solutions'],
        ['theory', 'Theoretical Background'], ['construction', 'Construction'],
        ['methodology', 'Experiment Methodology'], ['results', 'Test Results'],
        ['error_analysis', 'Error Analysis'], ['evaluation', 'Evaluation'],
        ['pros_cons', 'Advantages and Disadvantages'], ['conclusion', 'Conclusion'],
        ['bibliography', 'Bibliography'],
      ];

      for (const [key, title] of sectionTitles) {
        const sectionText = sections[key];
        if (sectionText && typeof sectionText === 'string' && sectionText.trim()) {
          doc.addPage(); y = margin;
          addSection(title, sectionText);
        }
      }
    } else {
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('Engineering Notebook', pageW / 2, 60, { align: 'center' });
      doc.setFontSize(20);
      doc.text('TechMentorAI', pageW / 2, 75, { align: 'center' });
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      if (teamInfo.name) doc.text(`Team: ${teamInfo.name}`, pageW / 2, 95, { align: 'center' });
      doc.text(`Season: ${teamInfo.season || ''}`, pageW / 2, 105, { align: 'center' });
      if (teamInfo.region) doc.text(`Region: ${teamInfo.region}`, pageW / 2, 115, { align: 'center' });

      doc.addPage(); y = margin;
      addText('Table of Contents', 18, true); y += 4;
      addText('1. Innovation Project', 12);
      addText('2. Robot Design', 12);
      addText('3. Core Values', 12);
      addText('4. Training Diary', 12);
      addText('5. Photos', 12);

      doc.addPage(); y = margin;
      addText('1. Innovation Project', 18, true); y += 6;
      addSection('Problem Definition', notebook.innovation.problem || '');
      addSection('Research', notebook.innovation.research || '');
      addSection('Proposed Solution', notebook.innovation.solution || '');
      addSection('Next Steps', notebook.innovation.nextStep || '');

      doc.addPage(); y = margin;
      addText('2. Robot Design', 18, true); y += 6;
      addSection('Design Iterations', notebook.robot.iterations || '');
      addSection('Main Technical Problem', notebook.robot.mainProblem || '');
      addSection('How We Solved It', notebook.robot.howSolved || '');
      addSection('What We Would Do Differently', notebook.robot.whatDifferent || '');

      doc.addPage(); y = margin;
      addText('3. Core Values', 18, true); y += 6;
      addSection('Discovery', notebook.coreValues.discovery || '');
      addSection('Innovation', notebook.coreValues.innovation || '');
      addSection('Impact', notebook.coreValues.impact || '');
      addSection('Inclusion', notebook.coreValues.inclusion || '');
      addSection('Teamwork', notebook.coreValues.teamwork || '');
      addSection('Fun', notebook.coreValues.fun || '');

      doc.addPage(); y = margin;
      addText('4. Training Diary', 18, true); y += 6;
      if (diaryEntries && diaryEntries.length > 0) {
        for (const entry of diaryEntries) {
          if (y > 240) { doc.addPage(); y = margin; }
          const tags = Array.isArray(entry.tags) ? entry.tags.join(', ') : '';
          addText(`Date: ${new Date(entry.date).toLocaleDateString()}  |  Tags: ${tags}`, 10, true);
          addText(`Q: What did we try? A: ${entry.q1 || ''}`, 10);
          if (entry.q2) addText(`Q: What worked? A: ${entry.q2}`, 10);
          if (entry.q3) addText(`Q: Next steps? A: ${entry.q3}`, 10);
          y += 6;
        }
      } else {
        addText('No diary entries yet.', 10);
      }

      doc.addPage(); y = margin;
      addText('5. Robot & Project Photos', 18, true); y += 6;
      addText('Photos are attached separately.', 10);
    }

    return doc;
  };

  const updatePdfPreview = (pdfBlob: Blob, fileName: string) => {
    const nextPreviewUrl = URL.createObjectURL(pdfBlob);

    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
      return nextPreviewUrl;
    });
    setPreviewFileName(fileName);
  };

  const handleDownloadPreview = () => {
    if (!previewUrl) return;

    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = previewFileName || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveGeneratedPdf = async (pdfBlob: Blob, fileName: string) => {
    if (!user) return;

    const path = `${user.id}/${crypto.randomUUID()}_${fileName}`;
    const { error: uploadError } = await supabase.storage.from('pdfs').upload(path, pdfBlob, { contentType: 'application/pdf' });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(path);
    const { error: insertError } = await supabase.from('exported_pdfs').insert({
      user_id: user.id,
      file_name: fileName,
      file_url: urlData.publicUrl,
    });

    if (insertError) throw insertError;
  };

  const generatePdfPreview = async (sections: Record<string, string> | null) => {
    if (!user) return;

    const doc = buildPdf(sections);
    const pdfBlob = doc.output('blob');
    const fileName = `notebook_${teamInfo.name || 'team'}_${new Date().toISOString().slice(0, 10)}.pdf`;

    updatePdfPreview(pdfBlob, fileName);
    await saveGeneratedPdf(pdfBlob, fileName);
    toast.success(t('export.generated_success'));
  };

  const generatePdfFromSections = async (sections: Record<string, string>) => {
    try {
      await generatePdfPreview(sections);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      toast.error(err.message || 'Error generating PDF');
    }
  };

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      await generatePdfPreview(aiSections);
    } catch (err: any) {
      toast.error(err.message || 'Error generating PDF');
    } finally {
      setGenerating(false);
    }
  };

  const innovationFilled = Object.values(notebook.innovation).filter((v) => v.length > 0).length;
  const robotFilled = Object.values(notebook.robot).filter((v) => v.length > 0).length;
  const cvFilled = Object.values(notebook.coreValues).filter((v) => v.length > 0).length;

  return (
    <AppLayout>
      <div className="container px-4 py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold mb-2">{t('export.title')}</h1>
          <p className="text-muted-foreground mb-8">{t('export.subtitle')}</p>

          {/* Team info */}
          <div className="rounded-xl border bg-card p-6 shadow-card mb-6 space-y-4">
            <h2 className="font-heading font-semibold text-lg">{t('export.team_info')}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('export.team_name')}</label>
                <Input value={teamInfo.name} onChange={(e) => setTeamInfo({ ...teamInfo, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('export.season')}</label>
                <Input value={teamInfo.season} onChange={(e) => setTeamInfo({ ...teamInfo, season: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('export.region')}</label>
                <Input value={teamInfo.region} onChange={(e) => setTeamInfo({ ...teamInfo, region: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Criteria upload */}
          <div className="rounded-xl border bg-card p-6 shadow-card mb-6">
            <h2 className="font-heading font-semibold text-lg mb-2">{t('export.criteria_section')}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('export.criteria_desc')}</p>
            {criteriaFile ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">{t('export.criteria_uploaded')}: {criteriaName}</span>
                <button onClick={() => { setCriteriaFile(null); setCriteriaName(''); }} className="ml-auto"><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors">
                {uploadingCriteria ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                <span className="text-sm text-muted-foreground">{uploadingCriteria ? t('common.loading') : t('export.criteria_upload')}</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt" className="hidden" onChange={handleCriteriaUpload} disabled={uploadingCriteria} />
              </label>
            )}
          </div>

          {/* Photos & documents upload */}
          <div className="rounded-xl border bg-card p-6 shadow-card mb-6">
            <h2 className="font-heading font-semibold text-lg mb-2">{t('export.photos_section')}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('export.photos_desc')}</p>
            <div className="flex flex-wrap gap-3">
              {exportPhotos.map((url, idx) => {
                const isPdf = url.toLowerCase().endsWith('.pdf');
                return (
                  <div key={idx} className="relative">
                    {isPdf ? (
                      <div className="h-24 w-24 rounded-lg border bg-muted flex flex-col items-center justify-center">
                        <FileText className="h-8 w-8 text-primary" />
                        <span className="text-xs text-muted-foreground mt-1">PDF</span>
                      </div>
                    ) : (
                      <img src={url} alt="" className="h-24 w-24 object-cover rounded-lg border" />
                    )}
                    <button onClick={() => removePhoto(idx)} className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"><X className="h-3 w-3" /></button>
                  </div>
                );
              })}
              <label className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                {uploadingPhotos ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                <span className="text-xs text-muted-foreground mt-1">{t('export.photos_upload')}</span>
                <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhotos} />
              </label>
            </div>
          </div>

          {/* Optional example PDF */}
          <div className="rounded-xl border bg-card p-6 shadow-card mb-6">
            <h2 className="font-heading font-semibold text-lg mb-2">{t('export.example_section')}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('export.example_desc')}</p>
            {examplePdf ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{examplePdfName}</span>
                <button onClick={() => { setExamplePdf(null); setExamplePdfName(''); }} className="ml-auto"><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors">
                {uploadingExample ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                <span className="text-sm text-muted-foreground">{uploadingExample ? t('common.loading') : t('export.example_upload')}</span>
                <input type="file" accept=".pdf" className="hidden" onChange={handleExampleUpload} disabled={uploadingExample} />
              </label>
            )}
          </div>

          {/* Content summary */}
          <div className="rounded-xl border bg-card p-6 shadow-card mb-6">
            <h2 className="font-heading font-semibold text-lg mb-4">{t('export.content_summary')}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-primary" />
                <div><p className="font-medium">Innovation Project</p><p className="text-muted-foreground">{innovationFilled}/4 {t('export.fields_filled')}</p></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-accent" />
                <div><p className="font-medium">Robot Design</p><p className="text-muted-foreground">{robotFilled}/4 {t('export.fields_filled')}</p></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-success" />
                <div><p className="font-medium">Core Values</p><p className="text-muted-foreground">{cvFilled}/6 {t('export.fields_filled')}</p></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div><p className="font-medium">{t('diary.title')}</p><p className="text-muted-foreground">{diaryEntries.length} {t('export.diary_count')}</p></div>
              </div>
            </div>
          </div>

          {/* AI Generate button */}
          {aiSections && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <Sparkles className="h-4 w-4" />
                {t('export.ai_ready')}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button size="lg" variant="outline" className="w-full gap-2" onClick={handleAiGenerate} disabled={aiGenerating}>
              {aiGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />{t('export.ai_generating')}</> : <><Sparkles className="h-4 w-4" />{t('export.ai_generate')}</>}
            </Button>
            <Button size="lg" className="w-full gap-2" onClick={handleGenerate} disabled={generating}>
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" />{t('export.generating')}</> : <><Download className="h-4 w-4" />{t('export.generate')}</>}
            </Button>
          </div>

          {previewUrl && (
            <div className="mt-6 rounded-xl border bg-card p-4 shadow-card space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-heading text-lg font-semibold">{t('export.preview')}</h2>
                  <p className="break-all text-sm text-muted-foreground">{previewFileName}</p>
                </div>
                <Button type="button" variant="outline" className="gap-2 sm:w-auto" onClick={handleDownloadPreview}>
                  <Download className="h-4 w-4" />
                  {t('export.download')}
                </Button>
              </div>

              <div className="overflow-hidden rounded-lg border bg-muted">
                <iframe
                  title={previewFileName || t('export.preview')}
                  src={`${previewUrl}#toolbar=1&navpanes=0`}
                  className="h-[70vh] w-full"
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
