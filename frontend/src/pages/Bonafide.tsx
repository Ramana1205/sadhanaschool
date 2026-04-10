import { useEffect, useMemo, useState } from 'react';
import { useStudentStore } from '@/store/studentStore';
import StudentFilter from '@/components/StudentFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Award } from 'lucide-react';
import { studentsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type Gender = 'male' | 'female';

export default function Bonafide() {
  const { students, loadStudents } = useStudentStore();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [parentName, setParentName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [penNumber, setPenNumber] = useState('');
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState(new Date().getFullYear().toString());
  const [dateOfAdmission, setDateOfAdmission] = useState('');
  const [className, setClassName] = useState('');
  const [saving, setSaving] = useState(false);

  const student = useMemo(
    () => students.find((s) => s.id === selectedStudent),
    [students, selectedStudent]
  );

  useEffect(() => {
    if (!student) {
      setGender('male');
      setParentName('');
      setDateOfBirth('');
      setAdmissionNumber('');
      setAadharNumber('');
      setPenNumber('');
      setFromYear('');
      setToYear(new Date().getFullYear().toString());
      setDateOfAdmission('');
      setClassName('');
      return;
    }

    if (student.motherName) {
      setGender('female');
      setParentName(student.motherName);
    } else if (student.fatherName) {
      setGender('male');
      setParentName(student.fatherName);
    } else {
      setGender('male');
      setParentName('');
    }

    setDateOfBirth(student.dateOfBirth || '');
    setAdmissionNumber(student.admissionNumber || '');
    setAadharNumber(student.aadharNumber || '');
    setPenNumber('');
    setDateOfAdmission(student.dateOfAdmission || '');
    setFromYear(student.dateOfAdmission ? new Date(student.dateOfAdmission).getFullYear().toString() : '');
    setToYear(new Date().getFullYear().toString());
  }, [student]);

  const honorific = gender === 'male' ? 'Mr' : 'Ms';
  const pronoun = gender === 'male' ? 'He' : 'She';
  const pronounLower = gender === 'male' ? 'he' : 'she';
  const possessive = gender === 'male' ? 'His' : 'Her';
  const currentDate = formatDate(new Date());

  const handleSave = async () => {
    if (!student) return;
    setSaving(true);

    try {
      await studentsApi.update(student.id, {
        admissionNumber: admissionNumber || undefined,
        dateOfBirth: dateOfBirth || undefined,
        fatherName: gender === 'male' ? parentName || undefined : undefined,
        motherName: gender === 'female' ? parentName || undefined : undefined,
        dateOfAdmission: dateOfAdmission || undefined,
        aadharNumber: aadharNumber || undefined,
      });
      await loadStudents();
      alert('Bonafide fields saved successfully');
    } catch (error) {
      console.error('Save failed', error);
      alert('Unable to save bonafide fields');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header no-print">
        <div className="flex items-center gap-3">
          <Award className="h-6 w-6 text-primary" />
          <div>
            <h1 className="page-title">Bonafide Certificate</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select a class and student, then edit the certificate fields below.
            </p>
          </div>
        </div>
      </div>

      <div className="no-print">
        <StudentFilter selectedStudent={selectedStudent} onSelectStudent={setSelectedStudent} label="Select Student" />
      </div>

      {student && (
        <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-6 no-print">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bonafide-gender">Gender</Label>
              <Select name="gender" value={gender} onValueChange={(v) => setGender(v as Gender)}>
                <SelectTrigger id="bonafide-gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonafide-parent-name">Parent Name</Label>
              <Input
                id="bonafide-parent-name"
                name="parentName"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Father/Mother name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonafide-date-of-birth">Date of Birth</Label>
              <Input
                id="bonafide-date-of-birth"
                name="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonafide-admission-number">Admission Number</Label>
              <Input
                id="bonafide-admission-number"
                name="admissionNumber"
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                placeholder="Admission No."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonafide-aadhar-number">Aadhar Number</Label>
              <Input
                id="bonafide-aadhar-number"
                name="aadharNumber"
                value={aadharNumber}
                onChange={(e) => setAadharNumber(e.target.value)}
                placeholder="Aadhar No."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonafide-date-of-admission">Date of Admission</Label>
              <Input
                id="bonafide-date-of-admission"
                name="dateOfAdmission"
                type="date"
                value={dateOfAdmission}
                onChange={(e) => {
                  setDateOfAdmission(e.target.value);
                  setFromYear(e.target.value ? new Date(e.target.value).getFullYear().toString() : '');
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonafide-class-name">Class Name</Label>
              <Input
                id="bonafide-class-name"
                name="className"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Enter class name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonafide-from-year">From Year</Label>
              <Input
                id="bonafide-from-year"
                name="fromYear"
                value={fromYear}
                onChange={(e) => setFromYear(e.target.value)}
                placeholder="From year"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonafide-to-year">To Year</Label>
              <Input
                id="bonafide-to-year"
                name="toYear"
                value={toYear}
                onChange={(e) => setToYear(e.target.value)}
                placeholder="To year"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-end mt-4">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </div>
      )}

      {!student && (
        <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-8 text-center text-muted-foreground no-print">
          Select a class and student above to preview the certificate.
        </div>
      )}

      {student && (
        <div className="print-container bg-white rounded-none border border-border p-8 mx-auto shadow-none relative">
          {student.photo && (
            <img
              src={student.photo}
              alt={`${student.name} photo`}
              className="absolute right-8 top-8 h-28 w-28 rounded-lg border border-border object-cover"
            />
          )}
          <div className="text-center mb-8">
            <img src="/logo.png" alt="School logo" className="mx-auto mb-5 h-24 w-auto object-contain" />
            <p className="text-lg uppercase tracking-[0.35em] text-muted-foreground font-semibold">SADHANA MEMORIAL SCHOOL</p>
            <h1 className="text-3xl font-bold uppercase tracking-wide mt-3">Bonafide Certificate</h1>
          </div>

          <div className="mb-8 text-sm text-muted-foreground text-right">
            <span>Date: {currentDate}</span>
          </div>

          <div className="space-y-5 text-base leading-8 text-foreground">
            <p>
              This is to certify that <span className="font-semibold">{honorific} {student.name}</span> {gender === 'male' ? 'S/o' : 'D/o'}{' '}
              <span className="hidden print-inline">{parentName || '________________'}</span>
              <input
                id="bonafide-parent-name-inline"
                name="parentNameInline"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                aria-label="Parent name"
                className="inline-block min-w-[10rem] border-b border-border bg-transparent px-1 py-0.5 text-base text-foreground outline-none no-print"
                placeholder="Parent name"
              />
              {' '}is/was a bonafide student of SADHANA MEMORIAL SCHOOL.
            </p>

            <p>
              {pronoun} studied from Class <span className="hidden print-inline">{className || '____'}</span>
              <input
                id="bonafide-class-name-inline-1"
                name="classNameInline1"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                aria-label="Class name"
                className="inline-block min-w-[5rem] border-b border-border bg-transparent px-1 py-0.5 text-base text-foreground outline-none no-print"
                placeholder="Class"
              />
              {' '} (Year{' '}
              <span className="hidden print-inline">{fromYear || '____'}</span>
              <input
                id="bonafide-from-year-inline"
                name="fromYearInline"
                value={fromYear}
                onChange={(e) => setFromYear(e.target.value)}
                aria-label="From year"
                className="inline-block min-w-[5rem] border-b border-border bg-transparent px-1 py-0.5 text-base text-foreground outline-none no-print"
                placeholder="From year"
              />
              ) to Class <span className="hidden print-inline">{className || '____'}</span>
              <input
                id="bonafide-class-name-inline-2"
                name="classNameInline2"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                aria-label="Class name"
                className="inline-block min-w-[5rem] border-b border-border bg-transparent px-1 py-0.5 text-base text-foreground outline-none no-print"
                placeholder="Class"
              />
              {' '} (Year{' '}
              <span className="hidden print-inline">{toYear || '____'}</span>
              <input
                id="bonafide-to-year-inline"
                name="toYearInline"
                value={toYear}
                onChange={(e) => setToYear(e.target.value)}
                aria-label="To year"
                className="inline-block min-w-[5rem] border-b border-border bg-transparent px-1 py-0.5 text-base text-foreground outline-none no-print"
                placeholder="To year"
              />
              ).
            </p>

            <p>
              During the study period, {pronounLower} maintained good moral character. {pronoun} was obedient, sincere, and hardworking.
            </p>

            <p>
              {possessive} date of birth as per school records is{' '}
              <span className="hidden print-inline">{dateOfBirth || '__________'}</span>
              <input
                id="bonafide-dob-inline"
                name="dateOfBirthInline"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                aria-label="Date of birth"
                className="inline-block min-w-[10rem] border-b border-border bg-transparent px-1 py-0.5 text-base text-foreground outline-none no-print"
              />
              .
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Admission No.</p>
                <span className="hidden print-inline">{admissionNumber || '__________'}</span>
                <input
                  id="bonafide-admission-number-inline"
                  name="admissionNumberInline"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                  aria-label="Admission number"
                  className="w-full border-b border-border bg-transparent px-1 py-0.5 text-base text-foreground outline-none no-print"
                  placeholder="Admission No."
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aadhar No.</p>
                <span className="hidden print-inline">{aadharNumber || '__________'}</span>
                <input
                  id="bonafide-aadhar-number-inline"
                  name="aadharNumberInline"
                  value={aadharNumber}
                  onChange={(e) => setAadharNumber(e.target.value)}
                  aria-label="Aadhar number"
                  className="w-full border-b border-border bg-transparent px-1 py-0.5 text-base text-foreground outline-none no-print"
                  placeholder="Aadhar No."
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">PEN No.</p>
                <span className="hidden print-inline">{penNumber || '__________'}</span>
                <input
                  id="bonafide-pen-number-inline"
                  name="penNumberInline"
                  value={penNumber}
                  onChange={(e) => setPenNumber(e.target.value)}
                  aria-label="PEN number"
                  className="w-full border-b border-border bg-transparent px-1 py-0.5 text-base text-foreground outline-none no-print"
                  placeholder="PEN No."
                />
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-border text-sm text-muted-foreground flex items-end justify-between">
            <div>
              <p>SADHANA MEMORIAL SCHOOL</p>
            </div>
            <div className="text-right">
                <div className="mx-auto h-16 w-28 border-b border-border" />
                <p className="mt-1 font-semibold">Headmaster</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
