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
import { studentsApi } from '@/lib/api';
import { useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getPhotoSrc = (photo?: string) => {
  if (!photo) return undefined;
  if (photo.startsWith('data:') || photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('/')) {
    return photo;
  }
  // if backend returns relative path like 'uploads/abc.jpg'
  return `${API_BASE_URL}/${photo}`;
};

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
  admissionNumber: '',
  dateOfBirth: '',
  fatherName: '',
  motherName: '',
  dateOfAdmission: '',
  aadharNumber: '',
};

export default function Students() {
  const { students, addStudent, updateStudent, deleteStudent } = useStudentStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const loadStudents = async () => {
    try {
      const data = await studentsApi.getAll();

      const mapped = data.map((s: any) => ({
        ...s,
        id: s._id,
      }));

      useStudentStore.setState({ students: mapped });
    } catch (err) {
      console.error('Failed to fetch students', err);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [sort, setSort] = useState<SortOption>('name-asc');
  const [collapsedClasses, setCollapsedClasses] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [setKeyModalOpen, setSetKeyModalOpen] = useState(false);
  const [securityKey, setSecurityKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

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
    setForm({
      name: s.name,
      class: s.class,
      section: s.section,
      rollNumber: s.rollNumber,
      contactNumber: s.contactNumber,
      address: s.address,
      totalFee: s.totalFee,
      photo: s.photo || '',
      admissionNumber: s.admissionNumber || '',
      dateOfBirth: s.dateOfBirth || '',
      fatherName: s.fatherName || '',
      motherName: s.motherName || '',
      dateOfAdmission: s.dateOfAdmission || '',
      aadharNumber: s.aadharNumber || '',
    });
    setDialogOpen(true);
  };

const handleDeleteStudent = (studentId: string) => {
    const storedKey = localStorage.getItem('deleteSecurityKey');
    if (!storedKey) {
      setSetKeyModalOpen(true);
      setStudentToDelete(studentId);
    } else {
      setStudentToDelete(studentId);
      setDeleteModalOpen(true);
    }
  };

  const handleSetSecurityKey = () => {
    if (securityKey.length < 4) {
      alert('Security key must be at least 4 characters');
      return;
    }
    if (securityKey !== confirmKey) {
      alert('Keys do not match');
      return;
    }
    localStorage.setItem('deleteSecurityKey', securityKey);
    setSetKeyModalOpen(false);
    setSecurityKey('');
    setConfirmKey('');
    if (studentToDelete) {
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    const storedKey = localStorage.getItem('deleteSecurityKey');
    if (securityKey !== storedKey) {
      alert('Invalid security key');
      return;
    }
    if (!studentToDelete) return;

    try {
      await studentsApi.delete(studentToDelete);
      await loadStudents();
      alert('Student deleted successfully');
    } catch (error) {
      console.error('Delete failed', error);
      alert('Failed to delete student');
    } finally {
      setDeleteModalOpen(false);
      setStudentToDelete(null);
      setSecurityKey('');
  }
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
                            <img src={getPhotoSrc(s.photo)} alt={s.name} className="h-8 w-8 rounded-full object-cover" />
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteStudent(s.id)}
                                className="text-destructive hover:text-destructive"
                              >
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

      {/* Set Security Key Modal */}
      <Dialog open={setKeyModalOpen} onOpenChange={setSetKeyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Delete Security Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="securityKey">Security Key</Label>
              <Input
                id="securityKey"
                type="password"
                value={securityKey}
                onChange={(e) => setSecurityKey(e.target.value)}
                placeholder="Enter a secure key"
              />
            </div>
            <div>
              <Label htmlFor="confirmKey">Confirm Security Key</Label>
              <Input
                id="confirmKey"
                type="password"
                value={confirmKey}
                onChange={(e) => setConfirmKey(e.target.value)}
                placeholder="Confirm the key"
              />
            </div>
            <Button onClick={handleSetSecurityKey} className="w-full">
              Set Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Enter your security key to confirm deletion of this student.</p>
            <div>
              <Label htmlFor="deleteKey">Security Key</Label>
              <Input
                id="deleteKey"
                type="password"
                value={securityKey}
                onChange={(e) => setSecurityKey(e.target.value)}
                placeholder="Enter security key"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleConfirmDelete} className="flex-1">
                Delete
              </Button>
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
