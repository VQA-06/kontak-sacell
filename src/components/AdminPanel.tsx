import { useState, useRef } from "react";
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
  Clock,
  FileJson,
  FileSpreadsheet,
  Loader2,
  Shield,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  ewallet: string[];
}

interface AdminPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  onRefresh: () => void;
}

const AdminPanel = ({ open, onOpenChange, contacts, onRefresh }: AdminPanelProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFormat, setImportFormat] = useState<"csv" | "json">("csv");

  const handleBackupNow = async () => {
    setLoading("backup");
    try {
      const { data, error } = await supabase.functions.invoke("backup-contacts");
      if (error) throw error;
      if (data?.success) {
        toast.success(`Backup berhasil! ${data.count} kontak tersimpan.`);
      } else {
        throw new Error(data?.error || "Backup gagal");
      }
    } catch (err: any) {
      toast.error(err.message || "Backup gagal");
    } finally {
      setLoading(null);
    }
  };

  const exportCSV = () => {
    const headers = "Nama,Telepon,E-Wallet\n";
    const rows = contacts
      .map((c) => `"${c.name}","${c.phone || ""}","${(c.ewallet || []).join(";")}"`)
      .join("\n");
    downloadFile(headers + rows, "kontak.csv", "text/csv");
    toast.success("Export CSV berhasil!");
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

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = (format: "csv" | "json") => {
    setImportFormat(format);
    fileInputRef.current?.click();
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
        const lines = text.split("\n").filter((l) => l.trim());
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length >= 1 && cols[0].trim()) {
            parsed.push({
              name: cols[0].trim(),
              phone: cols[1]?.trim() || null,
              ewallet: cols[2] ? cols[2].split(";").filter(Boolean) : [],
            });
          }
        }
      }

      if (parsed.length === 0) {
        toast.error("Tidak ada data kontak ditemukan");
        return;
      }

      const { error } = await supabase.from("contacts").insert(
        parsed.map((c) => ({
          name: c.name,
          phone: c.phone,
          ewallet: c.ewallet,
        }))
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

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Shield className="h-5 w-5" />
            Admin Panel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Auto Backup */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Backup Otomatis
            </h3>
            <div className="rounded-xl bg-muted/50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Backup otomatis setiap hari jam 02:00</span>
              </div>
              <Button
                onClick={handleBackupNow}
                disabled={loading === "backup"}
                variant="outline"
                className="w-full"
              >
                {loading === "backup" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Backup Sekarang
              </Button>
            </div>
          </div>

          {/* Export */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Export Kontak
            </h3>
            <div className="flex gap-2">
              <Button onClick={exportCSV} variant="outline" className="flex-1">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button onClick={exportJSON} variant="outline" className="flex-1">
                <FileJson className="mr-2 h-4 w-4" />
                JSON
              </Button>
            </div>
          </div>

          {/* Import */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Import Kontak
            </h3>
            <div className="flex gap-2">
              <Button
                onClick={() => handleImportClick("csv")}
                variant="outline"
                className="flex-1"
                disabled={loading === "import"}
              >
                {loading === "import" && importFormat === "csv" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Import CSV
              </Button>
              <Button
                onClick={() => handleImportClick("json")}
                variant="outline"
                className="flex-1"
                disabled={loading === "import"}
              >
                {loading === "import" && importFormat === "json" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Import JSON
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Format CSV: Nama, Telepon, E-Wallet (pisahkan e-wallet dengan ;)
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          onChange={handleFileChange}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};

export default AdminPanel;
