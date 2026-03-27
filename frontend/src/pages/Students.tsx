import { useState, useMemo, useEffect } from 'react';
import { useStudentStore } from '@/store/studentStore';
import { useAuthStore } from '@/store/authStore';
import { studentsApi } from '@/lib/api';
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

const emptyForm = {
  name: '',
  class: '',
  section: '',
  rollNumber: '',
  contactNumber: '',
  address: '',
  totalFee: 0,
  photo: '',
};

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

  // 🔥 FETCH STUDENTS FROM BACKEND
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await studentsApi.getAll();
        data.forEach((s: any) =>
          addStudent({
            ...s,
            id: s._id, // map backend _id to local id
          })
        );
      } catch (err) {
        console.error('Failed to load students', err);
      }
    };
    loadStudents();
  }, []);

  const filtered = useMemo(() => {
    let result = students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.rollNumber.includes(search);
      const matchClass = filterClass === 'all' || s.class === filterClass;
      return matchSearch && matchClass;
    });

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'roll-asc':
          return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
        case 'roll-desc':
          return b.rollNumber.localeCompare(a.rollNumber, undefined, { numeric: true });
        default:
          return 0;
      }
    });

    return result;
  }, [students, search, filterClass, sort]);

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
      next.has(className) ? next.delete(className) : next.add(className);
      return next;
    });
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      name: s.name,
      class: s.class,
      section: s.section,
      rollNumber: s.rollNumber,
      contactNumber: s.contactNumber,
      address: s.address,
      totalFee: s.totalFee,
      photo: s.photo || '',
    });
    setDialogOpen(true);
  };

  // 🔥 CREATE / UPDATE STUDENT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.class || !form.section || !form.rollNumber) return;

    try {
      if (editing) {
        await studentsApi.update(editing.id, form);
        updateStudent(editing.id, form);
      } else {
        const saved = await studentsApi.create(form);

        addStudent({
          ...saved,
          id: saved._id,
        });
      }

      setDialogOpen(false);
    } catch (err) {
      console.error('Student save failed', err);
    }
  };

  // 🔥 DELETE STUDENT
  const handleDelete = async (id: string) => {
    try {
      await studentsApi.delete(id);
      deleteStudent(id);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, photo: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-xl font-bold">Students</h1>
        {isAdmin && (
          <Button onClick={openAdd}>
            <Plus /> Add Student
          </Button>
        )}
      </div>

      <Input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {groupedStudents.map(({ className, students }) => (
        <div key={className}>
          <button onClick={() => toggleCollapse(className)}>
            {className}
          </button>

          {students.map((s) => (
            <div key={s.id} className="flex justify-between">
              <span>{s.name}</span>
              {isAdmin && (
                <div>
                  <Button onClick={() => openEdit(s)}>Edit</Button>
                  <Button onClick={() => handleDelete(s.id)}>Delete</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Student</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
            <Input value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} placeholder="Roll No" />

            <Button type="submit">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}