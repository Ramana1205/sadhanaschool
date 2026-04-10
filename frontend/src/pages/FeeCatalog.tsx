import { useEffect, useState } from 'react';
import { ALL_CLASSES } from '@/components/StudentFilter';
import { feeCatalogApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';

type FeeEntry = {
  _id: string;
  class: string;
  annualFee: number;
};

export default function FeeCatalog() {
  const [fees, setFees] = useState<FeeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FeeEntry | null>(null);
  const [formClass, setFormClass] = useState('');
  const [formFee, setFormFee] = useState('0');
  const [error, setError] = useState('');

  const loadFees = async () => {
    setLoading(true);
    try {
      const data = await feeCatalogApi.getAll();
      setFees(data);
    } catch (err) {
      console.error('Failed to load fee catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFormClass('');
    setFormFee('0');
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (entry: FeeEntry) => {
    setEditing(entry);
    setFormClass(entry.class);
    setFormFee(String(entry.annualFee));
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const feeValue = Number(formFee || '0');
    if (!formClass) {
      setError('Select a class');
      return;
    }
    if (Number.isNaN(feeValue) || feeValue < 0) {
      setError('Annual fee must be a valid non-negative number');
      return;
    }

    try {
      if (editing) {
        await feeCatalogApi.update(editing._id, { class: formClass, annualFee: feeValue });
      } else {
        await feeCatalogApi.create({ class: formClass, annualFee: feeValue });
      }
      await loadFees();
      setDialogOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save fee');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this fee entry?')) return;
    try {
      await feeCatalogApi.delete(id);
      await loadFees();
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete fee entry');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">Define annual fees per class and manage class fee rules.</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Fee
        </Button>
      </div>

      <div className="bg-card rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Class</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Annual Fee</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((entry) => (
                <tr key={entry._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{entry.class}</td>
                  <td className="px-4 py-3">₹{entry.annualFee.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(entry._id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {fees.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No fee entries defined yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Fee Entry' : 'Add Fee Entry'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="feeClass">Class</Label>
              <Select value={formClass} onValueChange={setFormClass}>
                <SelectTrigger id="feeClass" className="w-full">
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
              <Label htmlFor="annualFee">Annual Fee</Label>
              <Input
                id="annualFee"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formFee}
                onChange={(e) => setFormFee(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? 'Save Changes' : 'Create Fee'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
