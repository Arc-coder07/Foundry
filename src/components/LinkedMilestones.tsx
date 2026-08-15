import React, { useState } from 'react';
import { Milestone } from '../types';
import { CheckCircle2, Circle, Plus, Trash2, Calendar, Target, Rocket } from 'lucide-react';

interface LinkedMilestonesProps {
  itemId: string;
  milestones: Milestone[];
  onCreateMilestone: (milestone: Omit<Milestone, 'id'>) => void;
  onUpdateMilestone: (milestone: Milestone) => void;
  onDeleteMilestone: (id: string) => void;
}

export function LinkedMilestones({
  itemId,
  milestones,
  onCreateMilestone,
  onUpdateMilestone,
  onDeleteMilestone
}: LinkedMilestonesProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState<'deadline' | 'review' | 'launch' | 'custom'>('deadline');

  const linkedMilestones = milestones.filter(m => m.itemId === itemId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    
    onCreateMilestone({
      title: newTitle.trim(),
      date: newDate,
      itemId,
      type: newType,
      completed: false,
      note: ''
    });
    
    setNewTitle('');
    setNewDate('');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'launch': return <Rocket className="w-3.5 h-3.5" />;
      case 'review': return <Target className="w-3.5 h-3.5" />;
      default: return <Calendar className="w-3.5 h-3.5" />;
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-semibold">Linked Milestones</label>
        <span className="font-mono text-[10px] text-text-muted uppercase">
          {linkedMilestones.filter(m => m.completed).length} / {linkedMilestones.length}
        </span>
      </div>

      {linkedMilestones.length > 0 ? (
        <div className="space-y-2">
          {linkedMilestones.map(milestone => (
            <div 
              key={milestone.id} 
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors group ${milestone.completed ? 'bg-surface-container-lowest/50 border-outline-variant/30 opacity-75' : 'bg-surface-container-low border-outline-variant/60 hover:border-primary/30'}`}
            >
              <button 
                onClick={() => onUpdateMilestone({ ...milestone, completed: !milestone.completed })}
                className="text-text-muted hover:scale-105 hover:text-on-surface transition-all flex-shrink-0 cursor-pointer"
              >
                {milestone.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </button>
              
              <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1 rounded bg-surface-container-highest/50 ${milestone.completed ? 'text-text-muted' : 'text-primary'}`}>
                    {getIcon(milestone.type)}
                  </div>
                  <span className={`text-sm font-medium truncate ${milestone.completed ? 'line-through text-text-muted' : 'text-on-surface'}`}>
                    {milestone.title}
                  </span>
                </div>
                
                <span className="text-[10px] font-mono text-text-muted bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant/50 whitespace-nowrap">
                  {new Date(milestone.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              
              <button 
                onClick={() => onDeleteMilestone(milestone.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-500 transition-all cursor-pointer flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted italic py-2">No milestones linked. Add one to track progress.</p>
      )}

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row items-center gap-2 pt-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New milestone..."
          className="flex-1 w-full bg-surface-container-lowest border border-outline-variant focus:border-primary/50 text-sm px-3 py-2 rounded outline-none text-on-surface placeholder-on-surface-variant/40"
        />
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="w-full sm:w-auto bg-surface-container-lowest border border-outline-variant focus:border-primary/50 text-sm px-3 py-2 rounded outline-none text-on-surface [color-scheme:dark]"
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as any)}
          className="w-full sm:w-auto bg-surface-container-lowest border border-outline-variant focus:border-primary/50 text-sm px-3 py-2 rounded outline-none text-on-surface cursor-pointer"
        >
          <option value="deadline">Deadline</option>
          <option value="review">Review</option>
          <option value="launch">Launch</option>
        </select>
        <button 
          type="submit"
          disabled={!newTitle.trim() || !newDate}
          className="w-full sm:w-auto px-4 py-2 bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high rounded text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ADD</span>
        </button>
      </form>
    </section>
  );
}
