import { useState, useMemo } from 'react';
import { useStudentStore } from '@/store/studentStore';
import type { Student } from '@/types';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const ALL_CLASSES = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

type SortOption = 'name-asc' | 'name-desc' | 'roll-asc' | 'roll-desc';

interface StudentFilterProps {
  selectedStudent: string;
  onSelectStudent: (id: string) => void;
  label?: string;
}

export default function StudentFilter({ selectedStudent, onSelectStudent, label = 'Select Student' }: StudentFilterProps) {
  const { students } = useStudentStore();
  const [filterClass, setFilterClass] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('name-asc');

  const filteredStudents = useMemo(() => {
    let result = students;
    if (filterClass) {
      result = result.filter((s) => s.class === filterClass);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q) || s.rollNumber.includes(search));
    }
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'roll-asc': return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
        case 'roll-desc': return b.rollNumber.localeCompare(a.rollNumber, undefined, { numeric: true });
        default: return 0;
      }
    });
    return result;
  }, [students, filterClass, search, sort]);

  const classCount = filterClass ? filteredStudents.length : null;

  return (
    <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-6 space-y-4">
      <Label className="text-base font-semibold">{label}</Label>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Class Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Class</Label>
          <Select value={filterClass} onValueChange={(v) => { setFilterClass(v); onSelectStudent(''); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {ALL_CLASSES.map((c) => {
                const count = students.filter((s) => s.class === c).length;
                return (
                  <SelectItem key={c} value={c}>
                    {c} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Name or roll..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              maxLength={100}
            />
          </div>
        </div>

        {/* Sort */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sort By</Label>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A–Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z–A)</SelectItem>
              <SelectItem value="roll-asc">Roll No (Asc)</SelectItem>
              <SelectItem value="roll-desc">Roll No (Desc)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Student Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Student {classCount !== null && <span className="text-primary">({classCount} found)</span>}
          </Label>
          <Select value={selectedStudent} onValueChange={onSelectStudent} disabled={!filterClass}>
            <SelectTrigger>
              <SelectValue placeholder={filterClass ? 'Choose student' : 'Select class first'} />
            </SelectTrigger>
            <SelectContent>
              {filteredStudents.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} — {s.rollNumber}
                </SelectItem>
              ))}
              {filteredStudents.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">No students found</div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
