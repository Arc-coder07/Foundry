import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Map,
  Calendar as CalendarIcon,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Plus,
  Flame,
  AlertCircle,
  X,
  Trash2,
  Edit2
} from 'lucide-react';
import { WorkspaceItem, Milestone, WorkspaceItemStatus, WorkspaceItemType } from '../types';

interface ForgeTimelineProps {
  items: WorkspaceItem[];
  milestones: Milestone[];
  onSelectItem: (id: string) => void;
  onCreateMilestone: (milestone: Omit<Milestone, 'id'>) => void;
  onUpdateMilestone: (milestone: Milestone) => void;
  onDeleteMilestone: (id: string) => void;
}

const JOURNEY_STAGES: WorkspaceItemStatus[] = [
  'Captured',
  'Expanded',
  'Validated',
  'Planning',
  'Building',
  'Released'
];

const TYPE_COLORS: Record<WorkspaceItemType, string> = {
  Idea: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Research: 'bg-green-500/10 text-green-500 border-green-500/20',
  PRD: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  Architecture: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  Experiment: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  Task: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  Launch: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

const MILESTONE_COLORS: Record<Milestone['type'], string> = {
  deadline: 'bg-red-500',
  review: 'bg-amber-500',
  launch: 'bg-green-500',
  custom: 'bg-blue-500'
};

export default function ForgeTimeline({
  items,
  milestones,
  onSelectItem,
  onCreateMilestone,
  onUpdateMilestone,
  onDeleteMilestone
}: ForgeTimelineProps) {
  const [activeTab, setActiveTab] = useState<'journey' | 'calendar' | 'dashboard'>('journey');

  return (
    <div className="flex flex-col h-full bg-surface-container text-on-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant shrink-0">
        <h1 className="font-headline text-2xl tracking-tight text-on-surface">Timeline & Pipeline</h1>
        
        {/* Tab Switcher */}
        <div className="flex items-center bg-surface-container-low p-1 rounded-full border border-outline-variant/50">
          <TabButton
            active={activeTab === 'journey'}
            onClick={() => setActiveTab('journey')}
            icon={<Map size={14} />}
            label="JOURNEY MAP"
          />
          <TabButton
            active={activeTab === 'calendar'}
            onClick={() => setActiveTab('calendar')}
            icon={<CalendarIcon size={14} />}
            label="CALENDAR"
          />
          <TabButton
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard size={14} />}
            label="DASHBOARD"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'journey' && (
            <motion.div
              key="journey"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-x-auto overflow-y-hidden"
            >
              <JourneyMapTab items={items} onSelectItem={onSelectItem} />
            </motion.div>
          )}
          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-y-auto"
            >
              <CalendarTab 
                items={items} 
                milestones={milestones}
                onCreateMilestone={onCreateMilestone}
                onUpdateMilestone={onUpdateMilestone}
                onDeleteMilestone={onDeleteMilestone}
                onSelectItem={onSelectItem}
              />
            </motion.div>
          )}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-y-auto"
            >
              <DashboardTab items={items} onSelectItem={onSelectItem} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full font-label-caps text-xs transition-colors z-10 ${
        active ? 'text-surface-container' : 'text-text-muted hover:text-on-surface'
      }`}
    >
      {active && (
        <motion.div
          layoutId="active-tab"
          className="absolute inset-0 bg-on-surface rounded-full -z-10"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ----------------------------------------------------------------------
// JOURNEY MAP TAB
// ----------------------------------------------------------------------
function JourneyMapTab({ items, onSelectItem }: { items: WorkspaceItem[], onSelectItem: (id: string) => void }) {
  return (
    <div className="flex h-full p-6 gap-6 min-w-max">
      {JOURNEY_STAGES.map((stage, index) => {
        const stageItems = items.filter(i => i.status === stage);
        return (
          <div key={stage} className="flex flex-col w-72 shrink-0">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-label-caps text-sm text-text-muted">{stage}</h3>
              <span className="bg-surface-container-low px-2 py-0.5 rounded font-mono text-xs text-text-muted border border-outline-variant/50">
                {stageItems.length}
              </span>
            </div>

            {/* Column Content */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-6 no-scrollbar relative">
              {stageItems.length === 0 ? (
                <div className="flex-1 border-2 border-dashed border-outline-variant/30 rounded-xl flex items-center justify-center">
                  <span className="text-text-muted text-sm italic">Empty</span>
                </div>
              ) : (
                stageItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onSelectItem(item.id)}
                    className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-4 text-left hover:border-primary-accent/50 transition-colors flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${TYPE_COLORS[item.type]}`}>
                        {item.type}
                      </span>
                      {item.confidence && (
                        <span className="font-mono text-[10px] text-text-muted">{item.confidence}</span>
                      )}
                    </div>
                    <h4 className="font-headline text-sm text-on-surface leading-tight line-clamp-2">
                      {item.title}
                    </h4>
                  </button>
                ))
              )}
            </div>
            
            {/* Connecting Arrow */}
            {index < JOURNEY_STAGES.length - 1 && (
              <div className="absolute top-1/2 -right-4 w-4 border-t border-dashed border-outline-variant transform -translate-y-1/2 hidden md:block" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------
// CALENDAR TAB
// ----------------------------------------------------------------------
function CalendarTab({ 
  items, 
  milestones, 
  onCreateMilestone, 
  onUpdateMilestone, 
  onDeleteMilestone,
  onSelectItem
}: { 
  items: WorkspaceItem[];
  milestones: Milestone[];
  onCreateMilestone: (m: Omit<Milestone, 'id'>) => void;
  onUpdateMilestone: (m: Milestone) => void;
  onDeleteMilestone: (id: string) => void;
  onSelectItem: (id: string) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Month navigation
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  // Calendar generation
  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, currentDate.getMonth(), 1).getDay();
  const blanks = Array.from({ length: firstDayOfWeek }).map((_, i) => i);
  const days = Array.from({ length: daysInMonth }).map((_, i) => i + 1);

  const todayStr = new Date().toISOString().split('T')[0];

  const getDayString = (day: number) => {
    const d = new Date(year, currentDate.getMonth(), day);
    // adjust for local timezone offset when getting ISO string
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  const getMilestonesForDay = (dateStr: string) => {
    return milestones.filter(m => m.date.startsWith(dateStr));
  };
  
  const getItemsCreatedOnDay = (dateStr: string) => {
    return items.filter(i => i.createdAt.startsWith(dateStr));
  };

  return (
    <div className="flex h-full">
      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="font-headline text-2xl text-on-surface">
              {monthName} <span className="text-text-muted">{year}</span>
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1 hover:bg-surface-container-low rounded-full text-text-muted hover:text-on-surface">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-1 hover:bg-surface-container-low rounded-full text-text-muted hover:text-on-surface">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-on-surface text-surface-container px-4 py-2 rounded-lg font-label-caps text-xs hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> Add Milestone
          </button>
        </div>

        {/* Inline Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
                <MilestoneForm 
                  items={items}
                  onSave={(m) => {
                    onCreateMilestone(m);
                    setShowAddForm(false);
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 flex-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-label-caps text-xs text-text-muted py-2">
              {day}
            </div>
          ))}

          {/* Blank Days */}
          {blanks.map(i => (
            <div key={`blank-${i}`} className="min-h-[100px] bg-surface-container-low/30 rounded-xl border border-outline-variant/20" />
          ))}

          {/* Days */}
          {days.map(day => {
            const dateStr = getDayString(day);
            const dayMilestones = getMilestonesForDay(dateStr);
            const createdItems = getItemsCreatedOnDay(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = selectedDay === dateStr;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(dateStr === selectedDay ? null : dateStr)}
                className={`min-h-[100px] flex flex-col items-start p-2 rounded-xl border transition-all ${
                  isToday 
                    ? 'border-primary-accent bg-primary-accent/5' 
                    : isSelected 
                      ? 'border-on-surface bg-surface-container-low' 
                      : 'border-outline-variant/30 bg-surface-container hover:border-outline-variant'
                }`}
              >
                <span className={`font-mono text-sm mb-2 ${isToday ? 'text-primary-accent font-bold' : 'text-text-muted'}`}>
                  {day}
                </span>
                
                {/* Milestone Dots */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {dayMilestones.map(m => (
                    <div
                      key={m.id}
                      className={`w-2 h-2 rounded-full ${MILESTONE_COLORS[m.type]}`}
                      title={m.title}
                    />
                  ))}
                </div>

                {/* Faint Markers for Items Created */}
                {createdItems.length > 0 && (
                  <div className="mt-auto w-full flex justify-end">
                    <span className="text-[9px] font-mono text-text-muted/50 border border-text-muted/20 px-1 rounded-sm">
                      +{createdItems.length}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Side Panel for Selected Day */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-outline-variant bg-surface-container-low flex flex-col"
          >
            <div className="p-4 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-headline text-lg">
                {new Date(selectedDay).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="text-text-muted hover:text-on-surface">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
              {(() => {
                const dayMilestones = getMilestonesForDay(selectedDay);
                const createdItems = getItemsCreatedOnDay(selectedDay);
                
                if (dayMilestones.length === 0 && createdItems.length === 0) {
                  return <p className="text-text-muted text-sm italic">No activity or milestones on this day.</p>;
                }

                return (
                  <>
                    {dayMilestones.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <h4 className="font-label-caps text-xs text-text-muted">Milestones</h4>
                        {dayMilestones.map(m => (
                          <div key={m.id} className="bg-surface-container border border-outline-variant rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${MILESTONE_COLORS[m.type]}`} />
                                <h5 className="font-headline text-sm font-bold text-on-surface">{m.title}</h5>
                              </div>
                              <button onClick={() => onDeleteMilestone(m.id)} className="text-text-muted hover:text-red-400">
                                <Trash2 size={14} />
                              </button>
                            </div>
                            {m.note && <p className="text-xs text-text-muted mb-2">{m.note}</p>}
                            {m.itemId && (
                              <button 
                                onClick={() => onSelectItem(m.itemId!)}
                                className="text-[10px] bg-surface-container-low border border-outline-variant px-2 py-1 rounded hover:bg-surface-container text-text-muted block text-left"
                              >
                                View Linked Item ↗
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {createdItems.length > 0 && (
                      <div className="flex flex-col gap-3 mt-4">
                        <h4 className="font-label-caps text-xs text-text-muted">Created Items</h4>
                        {createdItems.map(item => (
                          <button
                            key={item.id}
                            onClick={() => onSelectItem(item.id)}
                            className="bg-surface-container border border-outline-variant rounded-lg p-2 text-left hover:border-primary-accent/50 text-sm"
                          >
                            <span className="truncate block text-on-surface">{item.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MilestoneForm({ 
  items, 
  onSave, 
  onCancel 
}: { 
  items: WorkspaceItem[], 
  onSave: (m: Omit<Milestone, 'id'>) => void, 
  onCancel: () => void 
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<Milestone['type']>('deadline');
  const [note, setNote] = useState('');
  const [itemId, setItemId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;
    onSave({ title, date, type, note, itemId: itemId || undefined, completed: false });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <input 
          type="text" 
          placeholder="Milestone Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-accent text-on-surface"
          autoFocus
          required
        />
        <input 
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-accent text-on-surface [color-scheme:dark]"
          required
        />
        <select 
          value={type}
          onChange={e => setType(e.target.value as Milestone['type'])}
          className="bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-accent text-on-surface"
        >
          <option value="deadline">Deadline</option>
          <option value="review">Review</option>
          <option value="launch">Launch</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      
      <div className="flex items-center gap-4">
        <input 
          type="text" 
          placeholder="Optional note..."
          value={note}
          onChange={e => setNote(e.target.value)}
          className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-accent text-on-surface"
        />
        <select
          value={itemId}
          onChange={e => setItemId(e.target.value)}
          className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-accent text-on-surface"
        >
          <option value="">No linked item (Optional)</option>
          {items.map(i => (
            <option key={i.id} value={i.id}>{i.title}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-1.5 text-sm font-label-caps text-text-muted hover:text-on-surface">Cancel</button>
        <button type="submit" className="px-4 py-1.5 text-sm font-label-caps bg-on-surface text-surface-container rounded-lg">Save</button>
      </div>
    </form>
  );
}

// ----------------------------------------------------------------------
// DASHBOARD TAB
// ----------------------------------------------------------------------
function DashboardTab({ items, onSelectItem }: { items: WorkspaceItem[], onSelectItem: (id: string) => void }) {
  const stats = useMemo(() => {
    const nonArchived = items.filter(i => i.status !== 'Archived');
    const activeItems = items.filter(i => i.status !== 'Captured' && i.status !== 'Archived');
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = items.filter(i => new Date(i.createdAt) >= oneWeekAgo).length;

    let totalConf = 0;
    let confCount = 0;
    items.forEach(i => {
      const match = i.confidence?.match(/(\d+)/);
      if (match) {
        totalConf += parseInt(match[1], 10);
        confCount++;
      }
    });
    const avgConfidence = confCount > 0 ? Math.round(totalConf / confCount) : 0;

    return { total: nonArchived.length, active: activeItems.length, thisWeek, avgConfidence };
  }, [items]);

  // Streak logic
  const { currentStreak, longestStreak } = useMemo(() => {
    const dates = new Set<string>();
    items.forEach(i => {
      dates.add(i.createdAt.split('T')[0]);
      dates.add(i.updatedAt.split('T')[0]);
    });

    const sortedDates = Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let current = 0;
    let max = 0;
    let tempMax = 0;
    let checkDate = new Date();

    if (sortedDates.includes(todayStr) || sortedDates.includes(yesterdayStr)) {
      // User is on a streak
      for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        if (sortedDates.includes(dStr)) {
          current++;
        } else if (i !== 0) { // allow missing today if yesterday exists
          break;
        }
      }
    }

    // calculate longest (rough estimate)
    let curSeq = 0;
    const sortedAsc = Array.from(dates).sort();
    for (let i = 0; i < sortedAsc.length; i++) {
      if (i === 0) {
        curSeq = 1;
        max = 1;
        continue;
      }
      const prev = new Date(sortedAsc[i-1]);
      const curr = new Date(sortedAsc[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 3600 * 24);
      
      if (diff === 1) {
        curSeq++;
      } else {
        curSeq = 1;
      }
      if (curSeq > max) max = curSeq;
    }

    return { currentStreak: current, longestStreak: max };
  }, [items]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    const total = items.length || 1; // prevent div by zero
    items.forEach(i => counts[i.status] = (counts[i.status] || 0) + 1);
    
    return JOURNEY_STAGES.map(status => ({
      status,
      count: counts[status] || 0,
      percentage: ((counts[status] || 0) / total) * 100
    }));
  }, [items]);

  const staleItems = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return items.filter(i => 
      new Date(i.updatedAt) < oneWeekAgo && 
      i.status !== 'Archived' && 
      i.status !== 'Released'
    );
  }, [items]);

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-8 h-full pb-20">
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Items" value={stats.total} />
        <StatCard title="Active Items" value={stats.active} />
        <StatCard title="This Week" value={`+${stats.thisWeek}`} />
        <StatCard title="Avg Confidence" value={`${stats.avgConfidence}%`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="md:col-span-2 flex flex-col gap-8">
          
          {/* Status Distribution */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6">
            <h3 className="font-label-caps text-xs text-text-muted mb-4">Pipeline Distribution</h3>
            <div className="flex h-6 rounded-full overflow-hidden mb-4 bg-surface-container border border-outline-variant/30">
              {statusDistribution.map(sd => (
                sd.count > 0 && (
                  <div 
                    key={sd.status} 
                    style={{ width: `${sd.percentage}%` }}
                    className="h-full border-r border-surface-container bg-primary/40 last:border-0"
                    title={`${sd.status}: ${sd.count}`}
                  />
                )
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-text-muted">
              {statusDistribution.map(sd => sd.count > 0 && (
                <div key={sd.status} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/40" />
                  <span>{sd.status} ({sd.count})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6">
            <h3 className="font-label-caps text-xs text-text-muted mb-4">Activity (Last 12 Weeks)</h3>
            <ActivityHeatmap items={items} />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-8">
          
          {/* Streak Counter */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Flame size={120} />
            </div>
            <div className="flex items-center gap-3 mb-2 z-10">
              <Flame className="text-amber-500" size={32} />
              <span className="font-display text-5xl font-bold tracking-tighter text-on-surface">
                {currentStreak}
              </span>
            </div>
            <span className="font-label-caps text-sm text-text-muted z-10">Day Streak</span>
            <div className="mt-4 pt-4 border-t border-outline-variant/50 w-full text-center z-10">
              <span className="font-mono text-xs text-text-muted">Longest: {longestStreak} days</span>
            </div>
          </div>

          {/* Needs Attention */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-label-caps text-xs text-text-muted">Needs Attention</h3>
              <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded text-[10px] font-bold">
                <AlertCircle size={12} /> Stale &gt;7d
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2">
              {staleItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-text-muted italic">
                  All active items are up to date!
                </div>
              ) : (
                staleItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onSelectItem(item.id)}
                    className="bg-surface-container border border-outline-variant p-3 rounded-lg text-left hover:border-amber-500/50 transition-colors"
                  >
                    <h4 className="font-headline text-sm text-on-surface truncate mb-1">{item.title}</h4>
                    <div className="flex items-center justify-between font-mono text-[10px] text-text-muted">
                      <span>{item.status}</span>
                      <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: string | number }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex flex-col gap-2">
      <span className="font-label-caps text-xs text-text-muted">{title}</span>
      <span className="font-display text-3xl font-bold tracking-tight text-on-surface">{value}</span>
    </div>
  );
}

function ActivityHeatmap({ items }: { items: WorkspaceItem[] }) {
  const heatmapData = useMemo(() => {
    // Last 84 days (12 weeks)
    const days = 84;
    const today = new Date();
    const data: { date: string, count: number }[] = [];
    
    const counts: Record<string, number> = {};
    items.forEach(i => {
      const cDate = i.createdAt.split('T')[0];
      const uDate = i.updatedAt.split('T')[0];
      counts[cDate] = (counts[cDate] || 0) + 1;
      if (cDate !== uDate) {
        counts[uDate] = (counts[uDate] || 0) + 1;
      }
    });

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      data.push({ date: dStr, count: counts[dStr] || 0 });
    }
    return data;
  }, [items]);

  // Group into weeks for column layout
  const weeks = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  const getOpacity = (count: number) => {
    if (count === 0) return 'bg-surface-container border-outline-variant/30';
    if (count === 1) return 'bg-primary/30 border-primary/20';
    if (count <= 3) return 'bg-primary/60 border-primary/40';
    return 'bg-primary border-primary';
  };

  return (
    <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar">
      {weeks.map((week, wIdx) => (
        <div key={wIdx} className="flex flex-col gap-1">
          {week.map(day => (
            <div
              key={day.date}
              title={`${day.date}: ${day.count} activities`}
              className={`w-3 h-3 rounded-sm border ${getOpacity(day.count)}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
