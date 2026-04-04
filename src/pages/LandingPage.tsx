import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, NotebookPen, CheckSquare, Download, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';

const features = [
  { key: 'feature1', icon: NotebookPen },
  { key: 'feature2', icon: BookOpen },
  { key: 'feature3', icon: CheckSquare },
  { key: 'feature4', icon: Download },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const randomColors = (count: number) =>
  new Array(count).fill(0).map(() => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));

export default function LandingPage() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<any>(null);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js' as any)
        .then((module: any) => {
          const TubesCursor = module.default;
          if (canvasRef.current) {
            const app = TubesCursor(canvasRef.current, {
              tubes: {
                colors: ['#5e72e4', '#8965e0', '#f5365c'],
                lights: { intensity: 200, colors: ['#21d4fd', '#b721ff', '#f4d03f', '#11cdef'] },
              },
            });
            appRef.current = app;
          }
        })
        .catch((err: any) => console.error('Failed to load TubesCursor:', err));
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (appRef.current && typeof appRef.current.dispose === 'function') {
        appRef.current.dispose();
      }
    };
  }, []);

  const handleClick = () => {
    if (appRef.current) {
      appRef.current.tubes.setColors(randomColors(3));
      appRef.current.tubes.setLightsColors(randomColors(4));
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2 font-heading font-bold text-lg">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            TechMentorAI
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero with Tubes animation */}
        <section className="relative overflow-hidden" onClick={handleClick} style={{ minHeight: '70vh' }}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 0 }}
          />
          <div className="container px-4 py-24 md:py-36 text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5" />
                FIRST Lego League
              </div>
              <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                {t('landing.title')}
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 backdrop-blur-sm bg-background/30 rounded-xl p-4">
                {t('landing.subtitle')}
              </p>
              <Link to="/auth">
                <Button size="lg" className="text-base px-8 h-12 gap-2">
                  {t('landing.cta')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="container px-4 py-20">
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <motion.div key={f.key} variants={item}>
                <div className="group rounded-xl border bg-card p-6 shadow-card hover:border-primary/30 transition-all duration-300 h-full">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{t(`landing.${f.key}_title`)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t(`landing.${f.key}_desc`)}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA */}
        <section className="container px-4 pb-20">
          <div className="rounded-2xl bg-primary p-10 md:p-16 text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground mb-4">{t('landing.title')}</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">{t('landing.subtitle')}</p>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="gap-2">
                {t('landing.cta')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 TechMentorAI — FIRST Lego League</p>
        </div>
      </footer>
    </div>
  );
}
