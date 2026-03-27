import { useState, useEffect } from 'react';
import { useStudentStore } from '@/store/studentStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Plus, Trash2, Save, History } from 'lucide-react';
import StudentFilter from '@/components/StudentFilter';

// logo file placed in public folder
const logoUrl = '/logo.jpg';

// All available classes
const ALL_CLASSES = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
const SECTIONS = ['A', 'B', 'C', 'D'];

interface Subject {
  id: string;
  name: string;
  date: string;
}

interface SavedHallTicket {
  _id: string;
  className: string;
  section: string;
  examName: string;
  academicYear: string;
  subjects: Subject[];
  generationType: 'single' | 'class';
  createdAt: string;
  updatedAt: string;
}

type GenerationType = 'single' | 'class';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function HallTicket() {
  const { students } = useStudentStore();
  const [generationType, setGenerationType] = useState<GenerationType>('single');
  
  // Single student mode
  const [selectedStudent, setSelectedStudent] = useState('');
  
  // Class mode
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  // Common fields
  const [examName, setExamName] = useState('');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [numSubjects, setNumSubjects] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  
  // History state
  const [savedTickets, setSavedTickets] = useState<SavedHallTicket[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const student = students.find((s) => s.id === selectedStudent);
  const classStudents = selectedClass && selectedSection 
    ? students.filter((s) => s.class === selectedClass && s.section === selectedSection)
    : [];

  const expectedSubjectCount = Number(numSubjects) || 0;
  const hasRequiredSubjects = expectedSubjectCount > 0 && subjects.length === expectedSubjectCount;

  const canPreviewSingle = Boolean(student && examName.trim() && hasRequiredSubjects);
  const canPreviewClass = Boolean(selectedClass && selectedSection && examName.trim() && hasRequiredSubjects && classStudents.length > 0);
  const canPreview = generationType === 'single' ? canPreviewSingle : canPreviewClass;

  // Load history when class is selected
  useEffect(() => {
    if (generationType === 'class' && selectedClass && selectedSection) {
      loadHistory();
    }
  }, [selectedClass, selectedSection, generationType]);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_BASE_URL}/hall-tickets/class/${selectedClass}/${selectedSection}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSavedTickets(data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddSubject = (subjectName: string, subjectDate: string) => {
    if (!subjectName.trim() || !subjectDate) return;

    const currentCount = subjects.length;
    const requestedCount = Number(numSubjects);
    if (requestedCount > 0 && currentCount >= requestedCount) return;

    const nextSubjects = [...subjects, { id: Date.now().toString(), name: subjectName, date: subjectDate }];
    setSubjects(nextSubjects);

    // Hide subject form once expected count is reached
    if (requestedCount > 0 && nextSubjects.length >= requestedCount) {
      setShowSubjectForm(false);
    }
  };

  const handleRemoveSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const handleNumSubjectsChange = (num: string) => {
    setNumSubjects(num);
    const count = Number(num);
    if (!num || count <= 0) {
      setSubjects([]);
      setShowSubjectForm(false);
      return;
    }

    if (subjects.length >= count) {
      setShowSubjectForm(false);
    } else {
      setShowSubjectForm(true);
    }
  };

  const handleSaveTicket = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('authToken');
      
      const studentIds = generationType === 'class' 
        ? classStudents.map(s => s.id)
        : [];

      const response = await fetch(`${API_BASE_URL}/hall-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          className: generationType === 'class' ? selectedClass : student?.class,
          section: generationType === 'class' ? selectedSection : student?.section,
          examName,
          academicYear,
          subjects,
          generationType,
          studentIds,
        }),
      });

      if (response.ok) {
        const savedTicket = await response.json();
        setSavedTickets([savedTicket, ...savedTickets]);
        alert('Hall ticket saved successfully!');
        // Reset form
        setExamName('');
        setNumSubjects('');
        setSubjects([]);
        setShowSubjectForm(false);
      } else {
        alert('Failed to save hall ticket');
      }
    } catch (error) {
      console.error('Error saving hall ticket:', error);
      alert('Error saving hall ticket');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (confirm('Are you sure you want to delete this hall ticket?')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/hall-tickets/${ticketId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setSavedTickets(savedTickets.filter(t => t._id !== ticketId));
          alert('Hall ticket deleted successfully');
        } else {
          alert('Failed to delete hall ticket');
        }
      } catch (error) {
        console.error('Error deleting hall ticket:', error);
        alert('Error deleting hall ticket');
      }
    }
  };

  const handleLoadTicket = (ticket: SavedHallTicket) => {
    setExamName(ticket.examName);
    setAcademicYear(ticket.academicYear);
    setNumSubjects(ticket.subjects.length.toString());
    setSubjects(ticket.subjects.map((s, idx) => ({ ...s, id: idx.toString() })));
    setShowSubjectForm(true);
    setShowHistory(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Hall Ticket</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate exam hall tickets</p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-6 no-print">
        <Label className="text-base font-semibold mb-3 block">Generation Mode</Label>
        <div className="flex gap-3">
          <Button
            variant={generationType === 'single' ? 'default' : 'outline'}
            onClick={() => {
              setGenerationType('single');
              setSelectedStudent('');
              setSelectedClass('');
              setSelectedSection('');
              setSavedTickets([]);
              setShowHistory(false);
            }}
            className="flex-1"
          >
            Single Student
          </Button>
          <Button
            variant={generationType === 'class' ? 'default' : 'outline'}
            onClick={() => {
              setGenerationType('class');
              setSelectedStudent('');
              setSelectedClass('');
              setSelectedSection('');
              setShowHistory(false);
            }}
            className="flex-1"
          >
            Entire Class
          </Button>
        </div>
      </div>

      {/* Student/Class Selection */}
      <div className="no-print">
        {generationType === 'single' ? (
          <StudentFilter selectedStudent={selectedStudent} onSelectStudent={setSelectedStudent} label="Select Student" />
        ) : (
          <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Class</Label>
                <select 
                  value={selectedClass} 
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedSection('');
                  }}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="">Choose a class...</option>
                  {ALL_CLASSES.map((className) => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Select Section</Label>
                <select 
                  value={selectedSection} 
                  onChange={(e) => setSelectedSection(e.target.value)}
                  disabled={!selectedClass}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground disabled:opacity-50"
                >
                  <option value="">Choose a section...</option>
                  {SECTIONS.map((section) => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>
            </div>
            {selectedClass && selectedSection && classStudents.length > 0 && (
              <p className="text-sm text-muted-foreground mt-3">
                Found <span className="font-semibold">{classStudents.length}</span> student(s) in {selectedClass}-{selectedSection}
              </p>
            )}
            {selectedClass && selectedSection && classStudents.length === 0 && (
              <p className="text-sm text-destructive mt-3">
                No students found in {selectedClass}-{selectedSection}
              </p>
            )}
          </div>
        )}
      </div>

      {/* History Section for Class Mode */}
      {generationType === 'class' && selectedClass && selectedSection && (
        <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-6 no-print">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-base font-semibold text-foreground hover:text-primary transition-colors"
          >
            <History className="h-5 w-5" />
            Hall Ticket History ({savedTickets.length})
            <span className="text-sm">{showHistory ? '▼' : '▶'}</span>
          </button>
          
          {showHistory && (
            <div className="mt-4 space-y-2">
              {loadingHistory ? (
                <p className="text-sm text-muted-foreground">Loading history...</p>
              ) : savedTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved hall tickets for this class yet</p>
              ) : (
                savedTickets.map((ticket) => (
                  <div key={ticket._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{ticket.examName}</p>
                      <p className="text-sm text-muted-foreground">
                        {ticket.subjects.length} subject(s) • {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoadTicket(ticket)}
                        className="text-primary hover:text-primary"
                      >
                        Load
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTicket(ticket._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-6 no-print">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Exam Name</Label>
              <Input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="e.g. Mid-Term Examination" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} maxLength={20} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Number of Subjects</Label>
            <Input 
              type="number" 
              min="0" 
              max="10"
              value={numSubjects} 
              onChange={(e) => handleNumSubjectsChange(e.target.value)} 
              placeholder="Enter number of subjects" 
            />
          </div>
        </div>
      </div>

      {showSubjectForm && (
        <SubjectForm 
          expectedCount={parseInt(numSubjects) || 0} 
          addedCount={subjects.length} 
          onAddSubject={handleAddSubject}
        />
      )}

      {subjects.length > 0 && (
        <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-6 no-print">
          <h3 className="font-semibold mb-4 text-foreground">Added Subjects ({subjects.length})</h3>
          <div className="space-y-2">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{subject.name}</p>
                  <p className="text-sm text-muted-foreground">Date: {subject.date}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveSubject(subject.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {canPreview && (
        <>
          <div className="flex justify-end gap-3 no-print">
            <Button 
              onClick={handleSaveTicket} 
              variant="outline"
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Hall Ticket'}
            </Button>
            <Button onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> Print {generationType === 'class' ? `Hall Tickets (${classStudents.length})` : 'Hall Ticket'}
            </Button>
          </div>

          {/* Render tickets based on mode */}
          {generationType === 'single' && student && (
            <HallTicketItem student={student} examName={examName} academicYear={academicYear} subjects={subjects} />
          )}

          {generationType === 'class' && (
            <div className="space-y-8">
              {classStudents.map((classStudent) => (
                <HallTicketItem key={classStudent.id} student={classStudent} examName={examName} academicYear={academicYear} subjects={subjects} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface SubjectFormProps {
  expectedCount: number;
  addedCount: number;
  onAddSubject: (name: string, date: string) => void;
}

function SubjectForm({ expectedCount, addedCount, onAddSubject }: SubjectFormProps) {
  const [subjectName, setSubjectName] = useState('');
  const [subjectDate, setSubjectDate] = useState('');

  const handleAdd = () => {
    onAddSubject(subjectName, subjectDate);
    setSubjectName('');
    setSubjectDate('');
  };

  return (
    <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-6 no-print">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Add Subjects</h3>
        <span className="text-sm text-muted-foreground">{addedCount} of {expectedCount} added</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <Label>Subject Name</Label>
          <Input 
            value={subjectName} 
            onChange={(e) => setSubjectName(e.target.value)} 
            placeholder="e.g. Mathematics"
            maxLength={100}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div className="space-y-2">
          <Label>Exam Date</Label>
          <Input 
            type="date" 
            value={subjectDate} 
            onChange={(e) => setSubjectDate(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <Button 
          onClick={handleAdd} 
          variant="default"
          disabled={!subjectName.trim() || !subjectDate}
          className="gap-2 w-full"
        >
          <Plus className="h-4 w-4" /> Add Subject
        </Button>
      </div>
      {addedCount < expectedCount && (
        <p className="text-sm text-muted-foreground mt-3">Add {expectedCount - addedCount} more subject(s) to generate hall ticket</p>
      )}
    </div>
  );
}

interface HallTicketItemProps {
  student: any;
  examName: string;
  academicYear: string;
  subjects: Subject[];
}

function HallTicketItem({ student, examName, academicYear, subjects }: HallTicketItemProps) {
  return (
    <div className="bg-white text-black p-8 rounded-lg shadow-lg print:shadow-none print:rounded-none print:p-0 print:m-0 page-break-after">
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <img
          src={logoUrl}
          alt="Watermark"
          className="h-96 w-96 object-contain"
          style={{ WebkitPrintColorAdjust: 'exact' }}
        />
      </div>

      <div className="text-center mb-6 relative z-10">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary mb-2">
          <img
            src={logoUrl}
            alt="School Logo"
            className="h-8 w-8 object-contain"
            style={{ WebkitPrintColorAdjust: 'exact' }}
          />
        </div>
        <h1 className="text-2xl font-bold font-display text-foreground">Sadhana Memorial School</h1>
        <p className="text-sm text-muted-foreground">123 Education Lane, Knowledge City</p>
        <div className="mt-3 h-1 w-32 mx-auto bg-primary rounded-full" />
      </div>

      <h2 className="text-center text-lg font-bold mb-1 text-foreground uppercase tracking-wider">HALL TICKET</h2>
      <p className="text-center text-sm text-muted-foreground mb-6">Academic Year: {academicYear}</p>

      <div className="flex gap-6 mb-6 relative z-10">
        <div className="flex-1 space-y-3">
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Student Name', student.name],
                  ['Class & Section', `${student.class}-${student.section}`],
                  ['Roll Number', student.rollNumber],
                  ['Exam', examName],
                ].map(([label, value]) => (
                  <tr key={label} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 bg-muted/50 font-medium text-muted-foreground w-40">{label}</td>
                    <td className="px-4 py-2 font-semibold">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 border-t pt-4">
            <h3 className="font-semibold text-foreground mb-3">Subjects & Exam Dates</h3>
            <div className="border border-border rounded overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/50 border-b border-border">
                <div className="px-3 py-2 font-medium text-sm">Subject</div>
                <div className="px-3 py-2 font-medium text-sm">Exam Date</div>
                <div className="px-3 py-2 font-medium text-sm">Signature</div>
              </div>
              {subjects.map((subject) => (
                <div key={subject.id} className="grid grid-cols-3 border-b border-border last:border-0">
                  <div className="px-3 py-3 text-sm font-medium">{subject.name}</div>
                  <div className="px-3 py-3 text-sm text-muted-foreground">{subject.date}</div>
                  <div className="px-3 py-3 min-h-12 border-l border-border"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="shrink-0">
          {student.photo ? (
            <img src={student.photo} alt={student.name} className="h-32 w-28 object-cover rounded-lg border border-border" />
          ) : (
            <div className="h-32 w-28 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
              Photo
            </div>
          )}
        </div>
      </div>

      <div className="mt-16 flex justify-between items-end text-sm relative z-10">
        <div className="text-center">
          <div className="w-40 border-t border-foreground pt-2">
            <img src="/sign.jpeg" alt="Invigilator Signature" className="mx-auto h-10 object-contain" style={{ WebkitPrintColorAdjust: 'exact' }} />
            <p className="font-medium">Invigilator</p>
          </div>
        </div>
        <div className="text-center">
          <div className="w-40 border-t border-foreground pt-2">
            <img src="/sign.jpeg" alt="Principal Signature" className="mx-auto h-10 object-contain" style={{ WebkitPrintColorAdjust: 'exact' }} />
            <p className="font-medium">Principal</p>
          </div>
        </div>
      </div>
    </div>
  );
}
