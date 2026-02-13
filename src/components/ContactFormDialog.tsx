import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Contact {
  id: string;
  name: string;
  phone: string | null;
}

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  onSave: (data: Omit<Contact, "id">) => Promise<void>;
}

const ContactFormDialog = ({ open, onOpenChange, contact, onSave }: ContactFormDialogProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [duplicateName, setDuplicateName] = useState<string | null>(null);

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setPhone(contact.phone || "");
    } else {
      setName("");
      setPhone("");
    }
    setDuplicateName(null);
  }, [contact, open]);

  const cleanPhone = (value: string) => value.replace(/[\s\-\.\(\)\+]/g, "");

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanPhone(e.target.value);
    setPhone(cleaned);
    setDuplicateName(null);

    if (cleaned.length >= 4) {
      const { data } = await supabase
        .from("contacts")
        .select("id, name")
        .eq("phone", cleaned)
        .limit(1);

      if (data && data.length > 0) {
        // If editing, ignore if it's the same contact
        if (contact && data[0].id === contact.id) return;
        setDuplicateName(data[0].name);
      }
    }
  };

  const isDuplicate = !!duplicateName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicate) return;
    setLoading(true);
    try {
      await onSave({
        name,
        phone: cleanPhone(phone) || null,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit Kontak" : "Tambah Kontak"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telepon</Label>
            <Input id="phone" type="tel" value={phone} onChange={handlePhoneChange} placeholder="08xxxxxxxxxx" />
            {isDuplicate && (
              <p className="text-sm text-destructive font-medium">
                Nomor tersebut sudah tersimpan atas nama {duplicateName}
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || isDuplicate}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {contact ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormDialog;
