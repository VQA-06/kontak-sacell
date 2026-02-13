import { MoreVertical, Check } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import danaLogo from "@/assets/ewallet-dana.webp";

const EWALLET_META: Record<string, { label: string; color: string; logo?: string }> = {
  dana: { label: "DANA", color: "#108ee9", logo: danaLogo },
  gopay: { label: "GoPay", color: "#00aa13" },
  ovo: { label: "OVO", color: "#4c3494" },
  shopeepay: { label: "ShopeePay", color: "#ee4d2d" },
};

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  ewallet: string[];
}

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

const ContactCard = ({ contact, onEdit, onDelete }: ContactCardProps) => {
  const [copied, setCopied] = useState(false);

  const initials = contact.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleDoubleClick = () => {
    if (!contact.phone) return;
    navigator.clipboard.writeText(contact.phone);
    setCopied(true);
    toast.success("Nomor disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPhone = (phone: string) => {
    // Format: 0821 3613 8339
    const digits = phone.replace(/\D/g, "");
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="group flex items-center gap-3 rounded-2xl bg-card p-4 cursor-pointer select-none transition-all duration-200 hover:shadow-md border border-border/40"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-base">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-base text-foreground truncate">
          {contact.name}
        </h3>
        {contact.phone && (
          <span className="block text-[15px] text-foreground/80 font-semibold mt-0.5 tracking-wide drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.15)]">
            {formatPhone(contact.phone)}
          </span>
        )}
        {contact.ewallet && contact.ewallet.length > 0 && (
          <div className="flex gap-1.5 mt-1.5">
            {contact.ewallet.map((ew) => {
              const meta = EWALLET_META[ew];
              if (!meta) return null;
              return meta.logo ? (
                <img
                  key={ew}
                  src={meta.logo}
                  alt={meta.label}
                  className="h-6 w-6 object-contain"
                  title={meta.label}
                />
              ) : (
                <span
                  key={ew}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ backgroundColor: meta.color }}
                  title={meta.label}
                >
                  {meta.label[0]}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {copied && (
        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
          <Check className="h-3.5 w-3.5" />
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <MoreVertical className="h-5 w-5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(contact)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(contact.id)}
            className="text-destructive focus:text-destructive"
          >
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ContactCard;
