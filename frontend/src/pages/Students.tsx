import { useState, useMemo } from 'react';
import { useStudentStore } from '@/store/studentStore';
import { useAuthStore } from '@/store/authStore';
import type { Student } from '@/types';
import { Plus, Search, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_CLASSES } from '@/components/StudentFilter';

const SECTIONS = ['A', 'B', 'C', 'D'];

type SortOption = 'name-asc' | 'name-desc' | 'roll-asc' | 'roll-desc';

const emptyForm = { name: '', class: '', section: '', rollNumber: '', contactNumber: '', address: '', totalFee: 0, photo: '' };

export default function Students() {
  const { students, addStudent, updateStudent, deleteStudent } = useStudentStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [sort, setSort] = useState<SortOption>('name-asc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [collapsedClasses, setCollapsedClasses] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let result = students.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNumber.includes(search);
      const matchClass = filterClass === 'all' || s.class === filterClass;
      return matchSearch && matchClass;
    });
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
  }, [students, search, filterClass, sort]);

  // Group by class
  const groupedStudents = useMemo(() => {
    const groups = new Map<string, Student[]>();
    filtered.forEach((s) => {
      if (!groups.has(s.class)) groups.set(s.class, []);
      groups.get(s.class)!.push(s);
    });
    return ALL_CLASSES
      .filter((c) => groups.has(c))
      .map((c) => ({ className: c, students: groups.get(c)! }));
  }, [filtered]);

  const toggleCollapse = (className: string) => {
    setCollapsedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(className)) next.delete(className);
      else next.add(className);
      return next;
    });
  };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({ name: s.name, class: s.class, section: s.section, rollNumber: s.rollNumber, contactNumber: s.contactNumber, address: s.address, totalFee: s.totalFee, photo: s.photo || '' });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.class || !form.section || !form.rollNumber.trim()) return;
    if (editing) {
      updateStudent(editing.id, form);
    } else {
      addStudent(form);
    }
    setDialogOpen(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, photo: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">{students.length} students registered</p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add Student
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or roll number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" maxLength={100} />
        </div>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {ALL_CLASSES.map((c) => {
              const count = students.filter((s) => s.class === c).length;
              return <SelectItem key={c} value={c}>{c} ({count})</SelectItem>;
            })}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-44">
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

      {/* Grouped Tables */}
      {groupedStudents.map(({ className, students: classStudents }) => {
        const isCollapsed = collapsedClasses.has(className);
        return (
          <div key={className} className="bg-card rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
            <button
              onClick={() => toggleCollapse(className)}
              className="w-full flex items-center gap-3 px-6 py-4 border-b border-border hover:bg-muted/30 transition-colors text-left"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              <h2 className="text-base font-semibold font-display text-foreground">{className}</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{classStudents.length} students</span>
            </button>
            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Section</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Roll No</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Contact</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fee</th>
                      {isAdmin && <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium flex items-center gap-3">
                          {s.photo ? (
                            <img src={s.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {s.name.charAt(0)}
                            </div>
                          )}
                          {s.name}
                        </td>
                        <td className="px-4 py-3">{s.section}</td>
                        <td className="px-4 py-3">{s.rollNumber}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{s.contactNumber}</td>
                        <td className="px-4 py-3">₹{s.totalFee.toLocaleString()}</td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteStudent(s.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {groupedStudents.length === 0 && (
        <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-8 text-center text-muted-foreground">
          No students found
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? 'Edit Student' : 'Add Student'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={form.class} onValueChange={(v) => setForm({ ...form, class: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{ALL_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section *</Label>
                <Select value={form.section} onValueChange={(v) => setForm({ ...form, section: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Roll Number *</Label>
                <Input value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} required maxLength={20} />
              </div>
              <div className="space-y-2">
                <Label>Total Fee (₹)</Label>
                <Input type="number" value={form.totalFee} onChange={(e) => setForm({ ...form, totalFee: Number(e.target.value) })} min={0} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <Input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} maxLength={15} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>Student Photo</Label>
              <Input type="file" accept="image/*" onChange={handlePhotoUpload} />
              {form.photo && <img src={form.photo} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Update' : 'Add Student'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
