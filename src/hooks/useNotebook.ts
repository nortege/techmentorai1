import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NotebookData {
  innovation: { problem: string; research: string; solution: string; nextStep: string };
  robot: { iterations: string; mainProblem: string; howSolved: string; whatDifferent: string };
  coreValues: { discovery: string; innovation: string; impact: string; inclusion: string; teamwork: string; fun: string };
  research: { data: string; graphs: string; relevance: string };
}

const emptyNotebook: NotebookData = {
  innovation: { problem: '', research: '', solution: '', nextStep: '' },
  robot: { iterations: '', mainProblem: '', howSolved: '', whatDifferent: '' },
  coreValues: { discovery: '', innovation: '', impact: '', inclusion: '', teamwork: '', fun: '' },
  research: { data: '', graphs: '', relevance: '' },
};

export function useNotebook() {
  const { user } = useAuth();
  const [notebook, setNotebook] = useState<NotebookData>(emptyNotebook);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from('notebooks').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setNotebook({
          innovation: { problem: data.innovation_problem || '', research: data.innovation_research || '', solution: data.innovation_solution || '', nextStep: data.innovation_next_step || '' },
          robot: { iterations: data.robot_iterations || '', mainProblem: data.robot_main_problem || '', howSolved: data.robot_how_solved || '', whatDifferent: data.robot_what_different || '' },
          coreValues: { discovery: data.cv_discovery || '', innovation: data.cv_innovation || '', impact: data.cv_impact || '', inclusion: data.cv_inclusion || '', teamwork: data.cv_teamwork || '', fun: data.cv_fun || '' },
          research: { data: (data as any).research_data || '', graphs: (data as any).research_graphs || '', relevance: (data as any).research_relevance || '' },
        });
      }
      setLoading(false);
    });
  }, [user]);

  const updateNotebook = useCallback(async (section: keyof NotebookData, data: Partial<NotebookData[keyof NotebookData]>) => {
    setNotebook((prev) => ({ ...prev, [section]: { ...prev[section], ...data } }));
  }, []);

  const saveNotebook = useCallback(async () => {
    if (!user) return;
    const row: any = {
      user_id: user.id,
      innovation_problem: notebook.innovation.problem,
      innovation_research: notebook.innovation.research,
      innovation_solution: notebook.innovation.solution,
      innovation_next_step: notebook.innovation.nextStep,
      robot_iterations: notebook.robot.iterations,
      robot_main_problem: notebook.robot.mainProblem,
      robot_how_solved: notebook.robot.howSolved,
      robot_what_different: notebook.robot.whatDifferent,
      cv_discovery: notebook.coreValues.discovery,
      cv_innovation: notebook.coreValues.innovation,
      cv_impact: notebook.coreValues.impact,
      cv_inclusion: notebook.coreValues.inclusion,
      cv_teamwork: notebook.coreValues.teamwork,
      cv_fun: notebook.coreValues.fun,
      research_data: notebook.research.data,
      research_graphs: notebook.research.graphs,
      research_relevance: notebook.research.relevance,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('notebooks').upsert(row, { onConflict: 'user_id' });
  }, [user, notebook]);

  return { notebook, updateNotebook, saveNotebook, loading };
}
