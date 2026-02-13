import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ContactCard from "@/components/ContactCard";
import ContactFormDialog from "@/components/ContactFormDialog";
import AdminPanel from "@/components/AdminPanel";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Search, BookUser, Users, SlidersHorizontal } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  ewallet: string[];
}

const Index = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);

  const showAdminButton = search.toLowerCase() === "edit";

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from("contacts")
      .select("id, name, phone, ewallet")
      .order("name");
    if (error) {
      toast.error("Gagal memuat kontak");
      return;
    }
    setContacts(
      (data || []).map((c) => ({
        ...c,
        ewallet: (c.ewallet as string[]) || [],
      }))
    );
  };

  const handleSave = async (data: Omit<Contact, "id">) => {
    if (editContact) {
      const { error } = await supabase.from("contacts").update(data).eq("id", editContact.id);
      if (error) { toast.error("Gagal mengupdate kontak"); return; }
      toast.success("Kontak diperbarui!");
    } else {
      const { error } = await supabase.from("contacts").insert(data);
      if (error) { toast.error("Gagal menambah kontak"); return; }
      toast.success("Kontak ditambahkan!");
    }
    setEditContact(null);
    fetchContacts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) { toast.error("Gagal menghapus kontak"); return; }
    toast.success("Kontak dihapus!");
    fetchContacts();
  };

  const handleEdit = (contact: Contact) => {
    setEditContact(contact);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditContact(null);
    setDialogOpen(true);
  };

  const filtered = contacts.filter((c) => {
    if (!search || search.toLowerCase() === "edit") return true;
    const contactText = [c.name, c.phone, ...(c.ewallet || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const keywords = search.toLowerCase().split(/[\s,\/]+/).filter(Boolean);
    return keywords.every((kw) => contactText.includes(kw));
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 py-4 pb-24">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari kontak..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card" />
        </div>

        {showAdminButton ? (
          <div className="mb-4">
            <button
              onClick={() => {
                setAdminOpen(true);
                setSearch("");
              }}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-semibold text-base shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, hsl(207, 70%, 50%), hsl(207, 70%, 60%))" }}
            >
              <SlidersHorizontal className="h-5 w-5" />
              Buka Menu Admin
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{filtered.length} kontak</span>
          </div>
        )}

        {!showAdminButton && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <BookUser className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">{search ? "Kontak tidak ditemukan" : "Belum ada kontak"}</p>
            <p className="text-sm text-muted-foreground mt-1">{search ? "Coba kata kunci lain" : "Tap + untuk menambahkan kontak baru"}</p>
          </div>
        ) : !showAdminButton ? (
          <div className="space-y-3">
            {filtered.map((contact) => (
              <ContactCard key={contact.id} contact={contact} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        ) : null}
      </main>

      <button
        onClick={handleAdd}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 text-white"
        style={{ backgroundColor: "hsl(207, 70%, 55%)" }}
        aria-label="Tambah kontak"
      >
        <Plus className="h-6 w-6" />
      </button>

      <ContactFormDialog open={dialogOpen} onOpenChange={setDialogOpen} contact={editContact} onSave={handleSave} />
      <AdminPanel open={adminOpen} onOpenChange={setAdminOpen} contacts={contacts} onRefresh={fetchContacts} />
    </div>
  );
};

export default Index;
