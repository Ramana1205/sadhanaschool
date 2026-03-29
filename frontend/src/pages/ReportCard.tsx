import { useState, useEffect } from 'react';
import { useStudentStore } from '@/store/studentStore';
import { formatDate } from '@/lib/utils';
import type { Subject } from '@/types';
import { getGrade } from '@/types';
import { reportCardsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Plus, Trash2, GraduationCap } from 'lucide-react';
import StudentFilter from '@/components/StudentFilter';

const DEFAULT_SUBJECTS: Subject[] = [
  { name: 'Mathematics', maxMarks: 100, obtainedMarks: 0 },
  { name: 'Science', maxMarks: 100, obtainedMarks: 0 },
  { name: 'English', maxMarks: 100, obtainedMarks: 0 },
  { name: 'Social Studies', maxMarks: 100, obtainedMarks: 0 },
  { name: 'Hindi', maxMarks: 100, obtainedMarks: 0 },
];

export default function ReportCard() {
  const { students } = useStudentStore();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [term, setTerm] = useState<'Term 1' | 'Term 2' | 'Annual'>('Annual');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [remarks, setRemarks] = useState('');
  const [savedReportCards, setSavedReportCards] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const student = students.find((s) => s.id === selectedStudent);

  useEffect(() => {
    const loadReportCards = async () => {
      if (!selectedStudent) {
        setSavedReportCards([]);
        return;
      }
      try {
        const data = await reportCardsApi.getByStudent(selectedStudent);
        setSavedReportCards(data);
      } catch (error) {
        console.error('Failed to load saved report cards:', error);
      }
    };

    loadReportCards();
  }, [selectedStudent]);

  const totalObtained = subjects.reduce((sum, s) => sum + s.obtainedMarks, 0);
  const totalMax = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const grade = getGrade(percentage);
  const allSubjectsPassed = subjects.every((sub) => sub.maxMarks > 0 && (sub.obtainedMarks / sub.maxMarks) * 100 >= 50);

  const addSubject = () => setSubjects([...subjects, { name: '', maxMarks: 100, obtainedMarks: 0 }]);
  const removeSubject = (i: number) => setSubjects(subjects.filter((_, idx) => idx !== i));
  const updateSubject = (i: number, field: keyof Subject, value: string | number) => {
    const updated = [...subjects];
    (updated[i] as any)[field] = value;
    setSubjects(updated);
  };

  const handleSaveReportCard = async () => {
    if (!student) return;
    try {
      setIsSaving(true);
      const savedCard = await reportCardsApi.create({
        studentId: student.id,
        term,
        subjects,
      });
      setSavedReportCards([savedCard, ...savedReportCards]);
      alert('Report card saved successfully');
    } catch (error) {
      console.error('Failed to save report card:', error);
      alert('Error saving report card');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReportCard = async (id: string) => {
    if (!confirm('Delete this report card?')) return;
    try {
      await reportCardsApi.delete(id);
      setSavedReportCards(savedReportCards.filter((card) => card._id !== id));
    } catch (error) {
      console.error('Failed to delete report card:', error);
      alert('Error deleting report card');
    }
  };

  const handleLoadReportCard = (card: any) => {
    setTerm(card.term);
    setSubjects(card.subjects);
  };

  const canPreview = student && subjects.length > 0 && subjects.every((s) => s.name.trim());

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Report Card</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate student report cards</p>
        </div>
      </div>

      <div className="no-print">
        <StudentFilter selectedStudent={selectedStudent} onSelectStudent={setSelectedStudent} label="Select Student" />
      </div>

      {savedReportCards.length > 0 && (
        <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-6 no-print">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Saved Report Cards</h2>
              <p className="text-sm text-muted-foreground">Recent report cards for this student are stored in the database.</p>
            </div>
            <span className="text-sm text-muted-foreground">{savedReportCards.length} items</span>
          </div>
          <div className="space-y-3">
            {savedReportCards.map((card) => (
              <div key={card._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{card.term} • {formatDate(card.createdAt)}</p>
                  <p className="text-sm text-muted-foreground">{card.subjects.length} subjects</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleLoadReportCard(card)}>
                    Load
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteReportCard(card._id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-6 no-print space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Term</Label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value as 'Term 1' | 'Term 2' | 'Annual')}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Annual">Annual</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Academic Year</Label>
            <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} maxLength={20} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Subjects & Marks</Label>
            <Button type="button" variant="outline" size="sm" onClick={addSubject} className="gap-1">
              <Plus className="h-3 w-3" /> Add Subject
            </Button>
          </div>
          <div className="space-y-2">
            {subjects.map((sub, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input placeholder="Subject name" value={sub.name} onChange={(e) => updateSubject(i, 'name', e.target.value)} className="flex-1" maxLength={50} />
                <Input type="number" placeholder="Max" value={sub.maxMarks} onChange={(e) => updateSubject(i, 'maxMarks', Number(e.target.value))} className="w-20" min={0} />
                <Input type="number" placeholder="Got" value={sub.obtainedMarks} onChange={(e) => updateSubject(i, 'obtainedMarks', Math.min(Number(e.target.value), sub.maxMarks))} className="w-20" min={0} max={sub.maxMarks} />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeSubject(i)} className="shrink-0 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Remarks</Label>
          <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Teacher's remarks..." maxLength={200} />
        </div>
      </div>

      {canPreview && (
        <>
          <div className="flex justify-end gap-3 no-print">
            <Button onClick={handleSaveReportCard} className="gap-2" disabled={isSaving}>
              <Plus className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Report Card'}
            </Button>
            <Button onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> Print Report Card
            </Button>
          </div>

          <div className="print-container bg-card rounded-xl shadow-[var(--shadow-card)] p-8 max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <GraduationCap className="h-96 w-96" />
            </div>

            <div className="text-center mb-6 relative z-10">
              <img
                src="/logo.png"
                alt="School Logo"
                className="mx-auto mb-4 h-16 w-auto object-contain"
              />
              <h1 className="text-2xl font-bold font-display text-foreground">SADHANA MEMORIAL SCHOOL</h1>
              <p className="text-sm text-muted-foreground">Sanjay Gandhi Nagar, Shapur</p>
              <div className="mt-3 h-1 w-32 mx-auto bg-primary rounded-full" />
            </div>

            <h2 className="text-center text-lg font-bold mb-1 text-foreground uppercase tracking-wider">REPORT CARD</h2>
            <p className="text-center text-sm text-muted-foreground mb-6">Academic Year: {academicYear}</p>

            <div className="flex gap-6 mb-6 relative z-10">
              <div className="flex-1">
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        ['Student Name', student.name],
                        ['Class & Section', `${student.class}-${student.section}`],
                        ['Roll Number', student.rollNumber],
                      ].map(([label, value]) => (
                        <tr key={label} className="border-b border-border last:border-0">
                          <td className="px-4 py-2 bg-muted/50 font-medium text-muted-foreground w-40">{label}</td>
                          <td className="px-4 py-2 font-semibold">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="shrink-0">
                {student.photo ? (
                  <img src={student.photo} alt={student.name} className="h-28 w-24 object-cover rounded-lg border border-border" />
                ) : (
                  <div className="h-28 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">Photo</div>
                )}
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden mb-6 relative z-10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="text-left px-4 py-2 font-medium">Subject</th>
                    <th className="text-center px-4 py-2 font-medium">Max Marks</th>
                    <th className="text-center px-4 py-2 font-medium">Obtained</th>
                    <th className="text-center px-4 py-2 font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub, i) => {
                    const pct = sub.maxMarks > 0 ? (sub.obtainedMarks / sub.maxMarks) * 100 : 0;
                    return (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-2 font-medium">{sub.name}</td>
                        <td className="px-4 py-2 text-center">{sub.maxMarks}</td>
                        <td className="px-4 py-2 text-center font-semibold">{sub.obtainedMarks}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${pct >= 50 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{getGrade(pct)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-bold">
                    <td className="px-4 py-2">Total</td>
                    <td className="px-4 py-2 text-center">{totalMax}</td>
                    <td className="px-4 py-2 text-center">{totalObtained}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${percentage >= 50 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{grade}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 text-center relative z-10">
              <div className="border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Percentage</p>
                <p className="text-xl font-bold">{percentage.toFixed(1)}%</p>
              </div>
              <div className="border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Grade</p>
                <p className="text-xl font-bold">{grade}</p>
              </div>
              <div className="border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Result</p>
                <p className={`text-xl font-bold ${allSubjectsPassed ? 'text-success' : 'text-destructive'}`}>
                  {allSubjectsPassed ? 'PASS' : 'FAIL'}
                </p>
              </div>
            </div>

            {remarks && (
              <div className="border border-border rounded-lg p-4 mb-6 relative z-10">
                <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                <p className="text-sm">{remarks}</p>
              </div>
            )}

            <div className="mt-12 flex justify-between items-end text-sm relative z-10">
              <div className="text-center">
                <div className="w-40">
                  <div className="h-10 mb-1" />
                  <p className="font-medium">Class Teacher</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-40">
                  <img src="/sign.jpeg" alt="Principal Signature" className="mx-auto h-10 object-contain mb-1" style={{ WebkitPrintColorAdjust: 'exact' }} />
                  <p className="font-medium">Principal</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
