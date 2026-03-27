import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2, UserPlus } from 'lucide-react';
import { authApi } from '@/lib/api';
import type { User } from '@/types';

export default function AdminSettings() {
  const [faculties, setFaculties] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    subject: '',
    qualification: '',
    classes: '',
    picture: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFaculties();
  }, []);

  const loadFaculties = async () => {
    try {
      const response = await authApi.getFaculties();
      setFaculties(response.faculties);
    } catch (error) {
      console.error('Failed to load faculties:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, picture: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    // ✅ Create FormData correctly
    const createForm = new FormData();
    createForm.append('username', formData.username.trim());
    createForm.append('password', formData.password.trim());
    createForm.append('name', formData.name.trim()); // ✅ must be "name"
    createForm.append('subject', formData.subject.trim());
    createForm.append('qualification', formData.qualification.trim());
    createForm.append('classes', formData.classes.trim()); // string is OK

    // ✅ File upload (must be "picture")
    if (formData.picture) {
      createForm.append('picture', formData.picture);
    }

    console.log("Sending faculty data..."); // debug

    await authApi.createFaculty(createForm);

    // ✅ Reset form after success
    setFormData({
      username: '',
      password: '',
      name: '',
      subject: '',
      qualification: '',
      classes: '',
      picture: null,
    });

    await loadFaculties();

  } catch (error: any) {
    console.error(error);
    setError(error.message || 'Unable to create faculty');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">Add and manage faculty accounts here.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Add Faculty
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                value={formData.qualification}
                onChange={(e) => setFormData((prev) => ({ ...prev, qualification: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classes">Classes (comma separated)</Label>
              <Input
                id="classes"
                value={formData.classes}
                onChange={(e) => setFormData((prev) => ({ ...prev, classes: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="picture">Profile Picture</Label>
              <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg md:col-span-2">{error}</p>
            )}

            <div className="md:col-span-2">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Faculty'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Faculty List</CardTitle>
        </CardHeader>
        <CardContent>
          {faculties.length === 0 ? (
            <p className="text-sm text-muted-foreground">No faculty members have been created yet.</p>
          ) : (
            <div className="space-y-3">
              {faculties.map((faculty) => (
                <div key={faculty.username} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Avatar>
                    <AvatarImage src={faculty.picture || '/placeholder.svg'} alt={faculty.name} />
                    <AvatarFallback>{faculty.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{faculty.name} (@{faculty.username})</p>
                    <p className="text-sm text-muted-foreground">Subject: {faculty.subject || '-'} | Qualification: {faculty.qualification || '-'}</p>
                    <p className="text-sm text-muted-foreground">Classes: {(faculty as any).classes?.join(', ') || '-'}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
