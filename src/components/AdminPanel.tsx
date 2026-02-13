import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Download,
  Upload,
  FileJson,
  CloudUpload,
  Loader2,
  Trash2,
  HardDrive,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  ewallet: string[];
}

interface BackupFile {
  name: string;
  created_at: string;
  metadata?: { size?: number };
}

interface AdminPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  onRefresh: () => void;
}

const AdminPanel = ({ open, onOpenChange, contacts, onRefresh }: AdminPanelProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [backupOpen, setBackupOpen] = useState(false);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFormat, setImportFormat] = useState<"json" | "vcf">("json");

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const { data, error } = await supabase.storage.from("backups").list("", {
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error) throw error;
      setBackups(data || []);
    } catch {
      toast.error("Gagal memuat daftar backup");
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    if (backupOpen) fetchBackups();
  }, [backupOpen]);

  const handleBackupNow = async () => {
    setLoading("backup");
    try {
      const { data, error } = await supabase.functions.invoke("backup-contacts");
      if (error) throw error;
      if (data?.success) {
        toast.success(`Backup berhasil! ${data.count} kontak tersimpan.`);
        fetchBackups();
      } else {
        throw new Error(data?.error || "Backup gagal");
      }
    } catch (err: any) {
      toast.error(err.message || "Backup gagal");
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadBackup = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from("backups").download(fileName);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Gagal mendownload backup");
    }
  };

  const handleDeleteBackup = async (fileName: string) => {
    try {
      const { error } = await supabase.storage.from("backups").remove([fileName]);
      if (error) throw error;
      toast.success("Backup dihapus");
      fetchBackups();
    } catch {
      toast.error("Gagal menghapus backup");
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "baru saja";
    if (hours < 24) return `sekitar ${hours} jam yang lalu`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "1 hari yang lalu";
    return `${days} hari yang lalu`;
  };

  const exportJSON = () => {
    const data = contacts.map((c) => ({
      name: c.name,
      phone: c.phone,
      ewallet: c.ewallet || [],
    }));
    downloadFile(JSON.stringify(data, null, 2), "kontak.json", "application/json");
    toast.success("Export JSON berhasil!");
  };

  const exportVCard = () => {
    const vcards = contacts.map((c) => {
      const parts = c.name.split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";
      let vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nN:${lastName};${firstName};;;\n`;
      if (c.phone) vcard += `TEL;TYPE=CELL:${c.phone}\n`;
      vcard += `END:VCARD`;
      return vcard;
    });
    downloadFile(vcards.join("\n"), "kontak.vcf", "text/vcard");
    toast.success("Export vCard berhasil!");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = (format: "json" | "vcf") => {
    setImportFormat(format);
    fileInputRef.current?.click();
  };

  const parseVCard = (text: string): { name: string; phone: string | null }[] => {
    const cards: { name: string; phone: string | null }[] = [];
    const entries = text.split("BEGIN:VCARD").filter((s) => s.trim());
    for (const entry of entries) {
      const fnMatch = entry.match(/FN:(.*)/);
      const telMatch = entry.match(/TEL[^:]*:(.*)/);
      if (fnMatch) {
        cards.push({
          name: fnMatch[1].trim(),
          phone: telMatch ? telMatch[1].trim().replace(/[\s\-\.\(\)\+]/g, "") : null,
        });
      }
    }
    return cards;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading("import");

    try {
      const text = await file.text();
      let parsed: { name: string; phone: string | null; ewallet: string[] }[] = [];

      if (importFormat === "json") {
        const json = JSON.parse(text);
        if (!Array.isArray(json)) throw new Error("Format JSON tidak valid");
        parsed = json.map((item: any) => ({
          name: item.name || "",
          phone: item.phone || null,
          ewallet: Array.isArray(item.ewallet) ? item.ewallet : [],
        }));
      } else {
        const vcards = parseVCard(text);
        parsed = vcards.map((v) => ({ ...v, ewallet: [] }));
      }

      if (parsed.length === 0) {
        toast.error("Tidak ada data kontak ditemukan");
        return;
      }

      const { error } = await supabase.from("contacts").insert(
        parsed.map((c) => ({ name: c.name, phone: c.phone, ewallet: c.ewallet }))
      );
      if (error) throw error;
      toast.success(`${parsed.length} kontak berhasil diimport!`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Import gagal");
    } finally {
      setLoading(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const MenuRow = ({
    icon: Icon,
    iconBg,
    title,
    subtitle,
    onClick,
  }: {
    icon: any;
    iconBg: string;
    title: string;
    subtitle?: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full rounded-xl border border-border/50 p-3 text-left hover:bg-muted/50 transition-colors"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-sm text-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </button>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Menu Admin</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Kelola kontak dengan fitur ekspor dan impor
            </p>
          </DialogHeader>

          <div className="space-y-5">
            {/* EKSPOR */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ekspor
              </p>
              <div className="space-y-2">
                <MenuRow
                  icon={FileJson}
                  iconBg="hsl(174, 60%, 51%)"
                  title="Ekspor ke JSON"
                  subtitle={`Simpan ${contacts.length} kontak ke file JSON`}
                  onClick={exportJSON}
                />
                <MenuRow
                  icon={Download}
                  iconBg="hsl(174, 60%, 51%)"
                  title="Ekspor ke vCard"
                  subtitle={`Simpan ${contacts.length} kontak ke file .vcf`}
                  onClick={exportVCard}
                />
              </div>
            </div>

            {/* BACKUP */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Backup
              </p>
              <MenuRow
                icon={HardDrive}
                iconBg="#64748b"
                title="Auto-Backup"
                onClick={() => setBackupOpen(true)}
              />
            </div>

            {/* IMPOR */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Impor
              </p>
              <div className="space-y-2">
                <MenuRow
                  icon={Upload}
                  iconBg="hsl(174, 60%, 51%)"
                  title="Impor dari JSON"
                  subtitle="Tambahkan kontak dari file JSON"
                  onClick={() => handleImportClick("json")}
                />
                <MenuRow
                  icon={Download}
                  iconBg="hsl(174, 60%, 51%)"
                  title="Impor dari vCard"
                  subtitle="Tambahkan kontak dari file .vcf"
                  onClick={() => handleImportClick("vcf")}
                />
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.vcf"
            onChange={handleFileChange}
            className="hidden"
          />
        </DialogContent>
      </Dialog>

      {/* Backup Manager Sub-Dialog */}
      <Dialog open={backupOpen} onOpenChange={setBackupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Backup Manager</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              onClick={handleBackupNow}
              disabled={loading === "backup"}
              className="w-full h-12 rounded-xl text-base font-semibold"
              style={{ backgroundColor: "hsl(174, 60%, 51%)" }}
            >
              {loading === "backup" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CloudUpload className="mr-2 h-5 w-5" />
              )}
              Backup Sekarang
            </Button>

            {loadingBackups ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : backups.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                Belum ada backup
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {backups.map((b) => (
                  <div
                    key={b.name}
                    className="flex items-center gap-3 rounded-xl border border-border/50 p-3"
                  >
                    <button
                      onClick={() => handleDownloadBackup(b.name)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <Download className="h-5 w-5 shrink-0" style={{ color: "hsl(174, 60%, 51%)" }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {b.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getRelativeTime(b.created_at)}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(b.name)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminPanel;
