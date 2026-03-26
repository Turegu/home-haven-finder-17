import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Mail, Phone, MessageSquare, Calendar, Reply, ExternalLink, MapPin, DollarSign, User, Clock,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface ListingMeta {
  title: string;
  listing_id?: string;
  images?: string[] | null;
  price?: number | null;
  currency?: string | null;
  location?: string | null;
}

interface InboxItem {
  id: string;
  inbox_type: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  budget: string | null;
  property_id: string | null;
  project_id: string | null;
  is_seen: boolean;
  created_at: string;
  listing_meta?: ListingMeta | null;
}

interface InboxMessageDialogProps {
  item: InboxItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName?: string;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getListingLink = (item: InboxItem) => {
  if (item.property_id) return `/property/${item.property_id}`;
  if (item.project_id) return `/projects/${item.project_id}`;
  return null;
};

const formatPrice = (price: number, currency?: string | null) => {
  if (currency === "USD") return `$ ${price.toLocaleString()}`;
  if (currency === "EUR") return `€ ${price.toLocaleString()}`;
  if (currency === "TRY") return `₺ ${price.toLocaleString()}`;
  return `${currency || ""} ${price.toLocaleString()}`;
};

/** Parse the structured message format: [Topic]\n\nmessage body\n\n[Preferred contact: X] */
const parseMessage = (raw: string | null) => {
  if (!raw) return { subject: null, body: null, preferredContact: null };

  let subject: string | null = null;
  let preferredContact: string | null = null;
  let body = raw;

  // Extract topic from first line bracket
  const topicMatch = body.match(/^\[(.+?)\]\s*/);
  if (topicMatch) {
    subject = topicMatch[1];
    body = body.slice(topicMatch[0].length);
  }

  // Extract preferred contact from end
  const prefMatch = body.match(/\[Preferred contact:\s*(.+?)\]\s*$/i);
  if (prefMatch) {
    preferredContact = prefMatch[1];
    body = body.slice(0, prefMatch.index).trim();
  }

  return { subject: subject || null, body: body.trim() || null, preferredContact };
};

const InboxTypeBadge = ({ type }: { type: string }) => {
  const labels: Record<string, { label: string; className: string }> = {
    inquiry: { label: "Listing Inquiry", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    message: { label: "Direct Message", className: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300" },
    property_request: { label: "Property Request", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  };
  const info = labels[type] || { label: type, className: "bg-muted text-muted-foreground" };
  return <Badge variant="secondary" className={info.className}>{info.label}</Badge>;
};

const InboxMessageDialog = ({ item, open, onOpenChange, companyName }: InboxMessageDialogProps) => {
  if (!item) return null;

  const { subject, body, preferredContact } = parseMessage(item.message);
  const listingLink = getListingLink(item);
  const meta = item.listing_meta;
  const sentDate = new Date(item.created_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* ── Email-style header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-border bg-muted/30">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border-2 border-primary/20 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {getInitials(item.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-foreground">{item.full_name}</h3>
                <InboxTypeBadge type={item.inbox_type} />
              </div>
              {subject && (
                <p className="text-base font-semibold text-foreground mt-1">
                  {subject}
                </p>
              )}
            </div>
          </div>

          {/* From / To / Date meta */}
          <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground w-12">From:</span>
              <span>{item.full_name} &lt;{item.email}&gt;</span>
            </div>
            {companyName && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground w-12">To:</span>
                <span>{companyName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(sentDate, "EEEE, do MMMM yyyy 'at' hh:mm a")}</span>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Message body */}
          {body ? (
            <div className="bg-background border border-border rounded-lg p-5">
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{body}</p>
            </div>
          ) : (
            <div className="bg-muted/30 border border-border rounded-lg p-5 text-center">
              <p className="text-sm text-muted-foreground italic">No message body</p>
            </div>
          )}

          {/* Listing card (for inquiries) */}
          {meta && listingLink && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Related Listing
              </p>
              <Link
                to={listingLink}
                className="block border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-card"
              >
                <div className="flex gap-3 p-3">
                  {meta.images?.[0] && (
                    <img
                      src={meta.images[0]}
                      alt={meta.title}
                      className="w-24 h-20 rounded-md object-cover flex-shrink-0 bg-muted"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{meta.title}</p>
                    {meta.listing_id && (
                      <p className="text-xs text-muted-foreground">Ref: {meta.listing_id}</p>
                    )}
                    {meta.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{meta.location}</span>
                      </p>
                    )}
                    {meta.price != null && meta.price > 0 && (
                      <p className="text-xs font-medium text-primary flex items-center gap-1 mt-0.5">
                        <DollarSign className="h-3 w-3" />
                        {formatPrice(meta.price, meta.currency)}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </Link>
            </div>
          )}

          {/* Budget (property requests) */}
          {item.budget && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">Budget:</span>
              <span className="text-foreground">${item.budget}</span>
            </div>
          )}

          <Separator />

          {/* Contact details card */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Sender Contact Details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Email */}
              <a
                href={`mailto:${item.email}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group"
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {item.email}
                  </p>
                </div>
              </a>

              {/* Phone */}
              {item.phone ? (
                <a
                  href={`tel:${item.phone}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group"
                >
                  <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {item.phone}
                    </p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm text-muted-foreground">Not provided</p>
                  </div>
                </div>
              )}
            </div>

            {/* Preferred contact method */}
            {preferredContact && (
              <div className="flex items-center gap-2 mt-3 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Preferred contact:</span>
                <Badge variant="outline" className="capitalize text-xs">{preferredContact}</Badge>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Received {format(sentDate, "dd/MM/yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${item.email}?subject=Re: ${subject || "Your inquiry"}`}>
                <Reply className="h-4 w-4 mr-1.5" />
                Reply via Email
              </a>
            </Button>
            {item.phone && (
              <Button variant="outline" size="sm" asChild className="text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                <a href={`https://wa.me/${item.phone.replace(/[^0-9+]/g, "")}`} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InboxMessageDialog;
