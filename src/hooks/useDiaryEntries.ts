import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DiaryEntry {
  id: string;
  date: string;
  q1: string;
  q2: string;
  q3: string;
  photos: string[];
  tags: string[];
}

export function useDiaryEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from('diary_entries').select('*').eq('user_id', user.id).order('date', { ascending: false }).then(({ data }) => {
      if (data) {
        setEntries(data.map((d: any) => ({
          id: d.id, date: d.date, q1: d.q1 || '', q2: d.q2 || '', q3: d.q3 || '',
          photos: d.photos || [], tags: d.tags || [],
        })));
      }
      setLoading(false);
    });
  }, [user]);

  const addEntry = useCallback(async (entry: Omit<DiaryEntry, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('diary_entries').insert({
      user_id: user.id, date: entry.date, q1: entry.q1, q2: entry.q2, q3: entry.q3,
      photos: entry.photos, tags: entry.tags,
    }).select().single();
    if (data && !error) {
      setEntries((prev) => [{ id: data.id, date: data.date, q1: data.q1, q2: data.q2 || '', q3: data.q3 || '', photos: data.photos || [], tags: data.tags || [] }, ...prev]);
    }
    return { data, error };
  }, [user]);

  const deleteEntry = useCallback(async (id: string) => {
    await supabase.from('diary_entries').delete().eq('id', id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, addEntry, deleteEntry, loading };
}
