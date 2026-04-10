import { useState, useMemo, useEffect } from 'react';
import { useStudentStore } from '@/store/studentStore';
import { useAuthStore } from '@/store/authStore';
import type { Student } from '@/types';
import { Plus, Search, Pencil, Trash2, ChevronDown, ChevronRight, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_CLASSES } from '@/components/StudentFilter';
import { feeCatalogApi, studentsApi } from '@/lib/api';
import { toast } from '@/components/ui/sonner';

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

type StudentFormState = {
  name: string;
  class: string;
  section: string;
  rollNumber: string;
  contactNumber: string;
  address: string;
  previousBalance: string;
  presentBalance: string;
  discount: string;
  paid: string;
  photo: string;
  admissionNumber: string;
  dateOfBirth: string;
  fatherName: string;
  motherName: string;
  dateOfAdmission: string;
  aadharNumber: string;
};

const emptyForm: StudentFormState = {
  name: '',
  class: '',
  section: '',
  rollNumber: '',
  contactNumber: '',
  address: '',
  previousBalance: '0',
  presentBalance: '',
  discount: '0',
  paid: '0',
  photo: '',
  admissionNumber: '',
  dateOfBirth: '',
  fatherName: '',
  motherName: '',
  dateOfAdmission: '',
  aadharNumber: '',
};

export default function Students() {
  const { students, loadStudents } = useStudentStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const [form, setForm] = useState<StudentFormState>(emptyForm);
  const [editing, setEditing] = useState<Student | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [presentTouched, setPresentTouched] = useState(false);
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [switchTargetStudent, setSwitchTargetStudent] = useState<Student | null>(null);
  const [switchTargetClass, setSwitchTargetClass] = useState('');
  const [switchError, setSwitchError] = useState('');
  const [hasActivePromotion, setHasActivePromotion] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const loadPromotionStatus = async () => {
    try {
      const status = await studentsApi.getPromotionStatus();
      setHasActivePromotion(status.hasActivePromotion);
    } catch (error) {
      setHasActivePromotion(false);
    }
  };

  useEffect(() => {
    loadStudents();
    loadPromotionStatus();
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

  const computedTotalBalance = useMemo(() => {
    const previous = Number(form.previousBalance || 0);
    const present = Number(form.presentBalance || 0);
    const discount = Number(form.discount || 0);
    const paid = Number(form.paid || 0);
    return Math.max(
      0,
      (Number.isFinite(previous) ? previous : 0)
        + (Number.isFinite(present) ? present : 0)
        - (Number.isFinite(discount) ? discount : 0)
        - (Number.isFinite(paid) ? paid : 0)
    );
  }, [form.previousBalance, form.presentBalance, form.discount, form.paid]);

  const updateFormField = (field: keyof StudentFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleClassChange = async (value: string) => {
    setForm((prev) => ({ ...prev, class: value }));
    setFormError('');

    if (!presentTouched) {
      try {
        const feeData = await feeCatalogApi.getByClass(value);
        setForm((prev) => ({ ...prev, presentBalance: String(feeData.annualFee) }));
      } catch (error: any) {
        setForm((prev) => ({ ...prev, presentBalance: '0' }));
        setFormError(error?.message || `No fee catalog entry for ${value}`);
      }
    }
  };

  const updateNumericField = (field: 'previousBalance' | 'presentBalance' | 'discount' | 'paid', value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (field === 'presentBalance') setPresentTouched(true);
    setForm((prev) => ({ ...prev, [field]: cleaned }));
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setPresentTouched(false);
    setDialogOpen(false);
  };

  const handleSaveStudent = async () => {
    const parsedPreviousBalance = form.previousBalance === '' ? 0 : Number(form.previousBalance);
    const parsedPresentBalance = form.presentBalance === '' ? undefined : Number(form.presentBalance);
    const parsedDiscount = form.discount === '' ? 0 : Number(form.discount);

    if (!form.name.trim() || !form.class || !form.section || !form.rollNumber.trim() || !form.contactNumber.trim() || !form.address.trim()) {
      alert('Please fill in all required student details.');
      return;
    }

    const parsedPaid = form.paid === '' ? 0 : Number(form.paid);

    if (
      Number.isNaN(parsedPreviousBalance) ||
      parsedPreviousBalance < 0 ||
      (parsedPresentBalance !== undefined && (Number.isNaN(parsedPresentBalance) || parsedPresentBalance < 0)) ||
      Number.isNaN(parsedDiscount) ||
      parsedDiscount < 0 ||
      Number.isNaN(parsedPaid) ||
      parsedPaid < 0
    ) {
      alert('Balance and discount values must be valid non-negative numbers.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: form.name.trim(),
      class: form.class,
      section: form.section,
      rollNumber: form.rollNumber.trim(),
      contactNumber: form.contactNumber.trim(),
      address: form.address.trim(),
      previousBalance: parsedPreviousBalance,
      presentBalance: parsedPresentBalance,
      discount: parsedDiscount,
      paid: parsedPaid,
      photo: form.photo || undefined,
      admissionNumber: form.admissionNumber.trim() || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      fatherName: form.fatherName.trim() || undefined,
      motherName: form.motherName.trim() || undefined,
      dateOfAdmission: form.dateOfAdmission || undefined,
      aadharNumber: form.aadharNumber.trim() || undefined,
    };

    try {
      if (editing) {
        await studentsApi.update(editing.id, payload);
        alert('Student updated successfully');
      } else {
        await studentsApi.create(payload);
        alert('Student added successfully');
      }
      await loadStudents();
      resetForm();
    } catch (error) {
      console.error('Save failed', error);
      alert('Failed to save student. Please check the entered values and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAdd = () => {
    resetForm();
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
      previousBalance: String(s.previousBalance ?? 0),
      presentBalance: String(s.presentBalance ?? 0),
      discount: String(s.discount ?? 0),
      paid: String(s.paid ?? 0),
      photo: s.photo || '',
      admissionNumber: s.admissionNumber || '',
      dateOfBirth: s.dateOfBirth || '',
      fatherName: s.fatherName || '',
      motherName: s.motherName || '',
      dateOfAdmission: s.dateOfAdmission || '',
      aadharNumber: s.aadharNumber || '',
    });
    setFormError('');
    setPresentTouched(false);
    setDialogOpen(true);
  };

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

  const handlePromoteAll = async () => {
    if (!window.confirm('Promote all students to the next class?')) return;
    setIsSubmitting(true);
    try {
      await studentsApi.promoteAll();
      toast.success('All students promoted successfully');
      await loadStudents();
      await loadPromotionStatus();
    } catch (error: any) {
      console.error('Promote all failed', error);
      toast.error(error?.message || 'Failed to promote students');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndoPromotion = async () => {
    if (!window.confirm('Undo the last global promotion?')) return;
    setIsSubmitting(true);
    try {
      await studentsApi.undoPromoteAll();
      toast.success('Global promotion undone successfully');
      await loadStudents();
      await loadPromotionStatus();
    } catch (error: any) {
      console.error('Undo promotion failed', error);
      toast.error(error?.message || 'Failed to undo promotion');
    } finally {
      setIsSubmitting(false);
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

  const openSwitchClass = (student: Student) => {
    setSwitchTargetStudent(student);
    setSwitchTargetClass(ALL_CLASSES.find((c) => c !== student.class) || '');
    setSwitchError('');
    setSwitchModalOpen(true);
  };

  const closeSwitchModal = () => {
    setSwitchTargetStudent(null);
    setSwitchTargetClass('');
    setSwitchError('');
    setSwitchModalOpen(false);
  };

  const handleConfirmSwitch = async () => {
    if (!switchTargetStudent || !switchTargetClass) return;
    setIsSwitching(true);
    try {
      await studentsApi.switchClass(switchTargetStudent.id, { newClass: switchTargetClass });
      await loadStudents();
      closeSwitchModal();
      alert(`Class switched to ${switchTargetClass}`);
    } catch (error: any) {
      console.error('Switch class failed', error);
      setSwitchError(error?.message || 'Failed to switch class');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleUndoSwitch = async (studentId: string) => {
    if (!window.confirm('Undo the last class switch for this student?')) return;
    try {
      await studentsApi.undoSwitch(studentId);
      await loadStudents();
      alert('Class switch undone successfully');
    } catch (error: any) {
      console.error('Undo switch failed', error);
      alert(error?.message || 'Failed to undo class switch');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">{students.length} students registered</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <Button variant="secondary" onClick={handlePromoteAll} disabled={isSubmitting} className="gap-2">
                <ArrowRight className="h-4 w-4" /> Promote All
              </Button>
              <Button variant="secondary" onClick={handleUndoPromotion} disabled={isSubmitting || !hasActivePromotion} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Undo Promotion
              </Button>
              <Button onClick={openAdd} className="gap-2">
                <Plus className="h-4 w-4" /> Add Student
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <label htmlFor="student-search" className="sr-only">Search students</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="student-search"
            name="studentSearch"
            placeholder="Search by name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            maxLength={100}
          />
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
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Present Balance</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Previous Balance</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Paid</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Discount</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Remaining Balance</th>
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
                        <td className="px-4 py-3">₹{s.presentBalance.toLocaleString()}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">₹{s.previousBalance.toLocaleString()}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">₹{s.paid.toLocaleString()}</td>
                        <td className="px-4 py-3 hidden xl:table-cell">₹{s.discount.toLocaleString()}</td>
                        <td className="px-4 py-3 hidden xl:table-cell">₹{s.totalBalance.toLocaleString()}</td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openSwitchClass(s)} className="text-primary">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                              {s.switchHistory && (
                                <Button variant="ghost" size="icon" onClick={() => handleUndoSwitch(s.id)} className="text-foreground">
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Student' : 'Add Student'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Student Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateFormField('name', e.target.value)}
                  placeholder="Student name"
                />
              </div>
              <div>
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input
                  id="rollNumber"
                  value={form.rollNumber}
                  onChange={(e) => updateFormField('rollNumber', e.target.value)}
                  placeholder="Roll number"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="class">Class</Label>
                <Select value={form.class} onValueChange={handleClassChange}>
                  <SelectTrigger id="class" className="w-full">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CLASSES.map((className) => (
                      <SelectItem key={className} value={className}>{className}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="section">Section</Label>
                <Select value={form.section} onValueChange={(value) => updateFormField('section', value)}>
                  <SelectTrigger id="section" className="w-full">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map((sectionValue) => (
                      <SelectItem key={sectionValue} value={sectionValue}>{sectionValue}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="contactNumber">Contact</Label>
                <Input
                  id="contactNumber"
                  value={form.contactNumber}
                  onChange={(e) => updateFormField('contactNumber', e.target.value)}
                  placeholder="Contact number"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => updateFormField('address', e.target.value)}
                placeholder="Student address"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <Label htmlFor="presentBalance">Present Balance</Label>
                <Input
                  id="presentBalance"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.presentBalance}
                  onChange={(e) => updateNumericField('presentBalance', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="previousBalance">Previous Balance</Label>
                <Input
                  id="previousBalance"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.previousBalance}
                  onChange={(e) => updateNumericField('previousBalance', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="discount">Discount</Label>
                <Input
                  id="discount"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.discount}
                  onChange={(e) => updateNumericField('discount', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="paid">Paid</Label>
                <Input
                  id="paid"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.paid}
                  onChange={(e) => updateNumericField('paid', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="totalBalance">Remaining Balance</Label>
                <Input id="totalBalance" value={computedTotalBalance.toString()} readOnly />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="fatherName">Father Name</Label>
                <Input
                  id="fatherName"
                  value={form.fatherName}
                  onChange={(e) => updateFormField('fatherName', e.target.value)}
                  placeholder="Father's name"
                />
              </div>
              <div>
                <Label htmlFor="motherName">Mother Name</Label>
                <Input
                  id="motherName"
                  value={form.motherName}
                  onChange={(e) => updateFormField('motherName', e.target.value)}
                  placeholder="Mother's name"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="admissionNumber">Admission No.</Label>
                <Input
                  id="admissionNumber"
                  value={form.admissionNumber}
                  onChange={(e) => updateFormField('admissionNumber', e.target.value)}
                  placeholder="Admission number"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => updateFormField('dateOfBirth', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateOfAdmission">Date of Admission</Label>
                <Input
                  id="dateOfAdmission"
                  type="date"
                  value={form.dateOfAdmission}
                  onChange={(e) => updateFormField('dateOfAdmission', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="aadharNumber">Aadhar Number</Label>
              <Input
                id="aadharNumber"
                value={form.aadharNumber}
                onChange={(e) => updateFormField('aadharNumber', e.target.value)}
                placeholder="Aadhar number"
              />
            </div>
            <div>
              <Label htmlFor="photo">Photo</Label>
              <Input id="photo" type="file" accept="image/*" onChange={handlePhotoUpload} />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSaveStudent} disabled={isSubmitting} className="gap-2">
                {editing ? 'Update Student' : 'Add Student'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Security Key Modal */}
      <Dialog open={setKeyModalOpen} onOpenChange={setSetKeyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Security Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Set a security key to enable student deletion.</p>
            <div>
              <Label htmlFor="securityKey">Security Key</Label>
              <Input
                id="securityKey"
                type="password"
                value={securityKey}
                onChange={(e) => setSecurityKey(e.target.value)}
                placeholder="Enter security key"
              />
            </div>
            <div>
              <Label htmlFor="confirmKey">Confirm Key</Label>
              <Input
                id="confirmKey"
                type="password"
                value={confirmKey}
                onChange={(e) => setConfirmKey(e.target.value)}
                placeholder="Confirm security key"
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSetSecurityKey}>Save Key</Button>
              <Button variant="outline" className="flex-1" onClick={() => setSetKeyModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={switchModalOpen} onOpenChange={setSwitchModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Student Class</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <p>
              Switch <span className="font-semibold">{switchTargetStudent?.name}</span> from <span className="font-semibold">{switchTargetStudent?.class}</span> to a new class.
            </p>
            <div>
              <Label htmlFor="newClass">New Class</Label>
              <Select value={switchTargetClass} onValueChange={setSwitchTargetClass}>
                <SelectTrigger id="newClass" className="w-full">
                  <SelectValue placeholder="Select new class" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CLASSES.filter((className) => className !== switchTargetStudent?.class).map((className) => (
                    <SelectItem key={className} value={className}>{className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {switchError && <p className="text-sm text-destructive">{switchError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeSwitchModal}>Cancel</Button>
              <Button onClick={handleConfirmSwitch} disabled={isSwitching || !switchTargetClass}>
                Confirm Switch
              </Button>
            </div>
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
