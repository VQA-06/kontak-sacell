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
import { Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import danaLogo from "@/assets/ewallet-dana.webp";
import shopeepayLogo from "@/assets/ewallet-shopeepay.png";
import gopayLogo from "@/assets/ewallet-gopay.webp";
import ovoLogo from "@/assets/ewallet-ovo.webp";

const EWALLET_OPTIONS = [
  { id: "dana", label: "DANA", color: "#108ee9", logo: danaLogo },
  { id: "gopay", label: "GoPay", color: "#00aa13", logo: gopayLogo },
  { id: "ovo", label: "OVO", color: "#4c3494", logo: ovoLogo },
  { id: "shopeepay", label: "ShopeePay", color: "#ee4d2d", logo: shopeepayLogo },
] as const;

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  ewallet: string[];
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
  const [ewallet, setEwallet] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [duplicateName, setDuplicateName] = useState<string | null>(null);

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setPhone(contact.phone || "");
      setEwallet(contact.ewallet || []);
    } else {
      setName("");
      setPhone("");
      setEwallet([]);
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
        if (contact && data[0].id === contact.id) return;
        setDuplicateName(data[0].name);
      }
    }
  };

  const toggleEwallet = (id: string) => {
    setEwallet((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
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
        ewallet,
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
          <DialogTitle className="text-xl font-bold">
            {contact ? "Edit Kontak" : "Tambah Kontak Baru"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold">Nama</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama..."
              required
              className="h-12 rounded-xl bg-muted/50 border-0 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base font-semibold">Nomor HP</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="Masukkan nomor HP..."
              className="h-12 rounded-xl bg-muted/50 border-0 text-base"
            />
            {isDuplicate && (
              <p className="text-sm text-destructive font-medium">
                Nomor tersebut sudah tersimpan atas nama {duplicateName}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">E-wallet terdaftar:</p>
            <div className="flex flex-wrap gap-2">
              {EWALLET_OPTIONS.map((ew) => {
                const active = ewallet.includes(ew.id);
                return (
                  <button
                    key={ew.id}
                    type="button"
                    onClick={() => toggleEwallet(ew.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${
                      active
                        ? "border-transparent text-white shadow-md"
                        : "border-border bg-muted/50 text-foreground hover:bg-muted"
                    }`}
                    style={active ? { backgroundColor: ew.color } : {}}
                  >
                    {'logo' in ew && ew.logo ? (
                      <img src={ew.logo} alt={ew.label} className="h-4 w-4 object-contain" />
                    ) : (
                      <span
                        className="flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold text-white"
                        style={{ backgroundColor: ew.color }}
                      >
                        {ew.label[0]}
                      </span>
                    )}
                    {ew.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-xl text-base"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || isDuplicate}
              className="flex-1 h-12 rounded-xl text-base"
              style={{ backgroundColor: "hsl(207, 70%, 55%)" }}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <UserPlus className="mr-2 h-4 w-4" />
              {contact ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormDialog;
