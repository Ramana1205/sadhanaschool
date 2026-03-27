import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2, Plus } from 'lucide-react';
import { authApi } from '@/lib/api';
import type { User } from '@/types';

export default function FacultyManagement() {
  const [faculties, setFaculties] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('name', formData.name);
      if (formData.picture) {
        formDataToSend.append('picture', formData.picture);
      }

      await authApi.createFaculty(formDataToSend);

      setFormData({ username: '', password: '', name: '', picture: null });
      loadFaculties();
    } catch (error: any) {
      setError(error.message || 'Failed to create faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, picture: file }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Faculty Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage faculty accounts and credentials</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Faculty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter faculty name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="picture">Profile Picture</Label>
                <Input
                  id="picture"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Faculty'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Faculties</CardTitle>
          </CardHeader>
          <CardContent>
            {faculties.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No faculties added yet</p>
            ) : (
              <div className="space-y-4">
                {faculties.map((faculty) => (
                  <div key={faculty.username} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={faculty.picture} alt={faculty.name} />
                        <AvatarFallback>{faculty.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{faculty.name}</p>
                        <p className="text-sm text-muted-foreground">@{faculty.username}</p>
                      </div>
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
    </div>
  );
}