import { MoreVertical, Phone, Mail, Building2, Copy, Check } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  notes: string | null;
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
    const info = [contact.name, contact.phone, contact.email, contact.company]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(info);
    setCopied(true);
    toast.success("Kontak disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="group flex items-center gap-3 rounded-xl bg-card p-3 sm:p-4 cursor-pointer select-none transition-all duration-200 hover:shadow-md hover:bg-accent/30 active:scale-[0.98] border border-border/50"
    >
      {/* Avatar */}
      <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm sm:text-base">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{contact.name}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
          {contact.phone && (
            <span className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground truncate">
              <Phone className="h-3 w-3 shrink-0" />
              {contact.phone}
            </span>
          )}
          {contact.email && (
            <span className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground truncate">
              <Mail className="h-3 w-3 shrink-0" />
              {contact.email}
            </span>
          )}
        </div>
        {contact.company && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Building2 className="h-3 w-3 shrink-0" />
            {contact.company}
          </span>
        )}
      </div>

      {/* Copy indicator */}
      {copied && (
        <div className="flex items-center gap-1 text-xs text-success font-medium">
          <Check className="h-3.5 w-3.5" />
        </div>
      )}

      {/* 3-dot menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleDoubleClick()}>
            <Copy className="mr-2 h-4 w-4" />
            Salin Kontak
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(contact)}>
            Edit Kontak
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(contact.id)}
            className="text-destructive focus:text-destructive"
          >
            Hapus Kontak
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ContactCard;
