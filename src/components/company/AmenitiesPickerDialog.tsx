import { useState } from 'react';
import { turkishIncludes } from '@/lib/utils';
import { TreePine, Lamp, Check, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getIcon } from '@/components/AmenitiesViewAllDialog';
import { useTranslation } from "react-i18next";

interface AmenitiesPickerDialogProps {
  interiorOptions: string[];
  exteriorOptions: string[];
  selectedInterior: string[];
  selectedExterior: string[];
  onToggleInterior: (v: string) => void;
  onToggleExterior: (v: string) => void;
  trigger?: React.ReactNode;
}

export default function AmenitiesPickerDialog({
  interiorOptions,
  exteriorOptions,
  selectedInterior,
  selectedExterior,
  onToggleInterior,
  onToggleExterior,
  trigger,
}: AmenitiesPickerDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<string>('exterior');

  const totalSelected = selectedInterior.length + selectedExterior.length;

  const currentOptions = tab === 'exterior' ? exteriorOptions : interiorOptions;
  const currentSelected = tab === 'exterior' ? selectedExterior : selectedInterior;
  const currentToggle = tab === 'exterior' ? onToggleExterior : onToggleInterior;
  

  const filtered = search
    ? currentOptions.filter(o => turkishIncludes(o, search))
    : currentOptions;

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between h-11"
          onClick={() => setOpen(true)}
        >
          <span className="flex items-center gap-2">
            <TreePine className="h-4 w-4 text-primary" />
            Select Amenities
          </span>
          {totalSelected > 0 && (
            <Badge variant="default" className="ml-2">{totalSelected} selected</Badge>
          )}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TreePine className="h-5 w-5 text-primary" />
              Amenities
              {totalSelected > 0 && (
                <Badge variant="default" className="ml-2">{totalSelected} selected</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => { setTab(v); setSearch(''); }} className="flex flex-col flex-1 min-h-0">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="exterior" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <TreePine className="h-3.5 w-3.5" />
                Exterior
                {selectedExterior.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-[10px] data-[state=active]:bg-primary-foreground data-[state=active]:text-primary">{selectedExterior.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="interior" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Lamp className="h-3.5 w-3.5" />
                Interior
                {selectedInterior.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-[10px] data-[state=active]:bg-primary-foreground data-[state=active]:text-primary">{selectedInterior.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="relative my-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${tab} amenities...`}
                className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>

            <TabsContent value="exterior" className="flex-1 min-h-0 mt-0">
              <AmenityGrid
                items={filtered}
                selected={currentSelected}
                onToggle={currentToggle}
                type="exterior"
              />
            </TabsContent>
            <TabsContent value="interior" className="flex-1 min-h-0 mt-0">
              <AmenityGrid
                items={filtered}
                selected={currentSelected}
                onToggle={currentToggle}
                type="interior"
              />
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-primary">{totalSelected}</span> total selected
            </p>
            <Button onClick={() => setOpen(false)}>
              <Check className="h-4 w-4 mr-1.5" />
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AmenityGrid({
  items,
  selected,
  onToggle,
  type,
}: {
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
  type: 'exterior' | 'interior';
}) {
  return (
    <div
      className="overflow-y-auto max-h-[40vh] -mx-1 px-1"
      onWheel={(e) => {
        const el = e.currentTarget;
        if (el.scrollHeight <= el.clientHeight) return;
        e.stopPropagation();
        el.scrollTop += e.deltaY;
      }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground text-center py-8">{t("companyDashboard.noAmenitiesFound")}</p>
        )}
        {items.map((opt) => {
          const IconComp = getIcon(opt, type);
          const isChecked = selected.includes(opt);
          return (
            <label
              key={opt}
              className={`flex items-center gap-2.5 cursor-pointer py-2.5 px-3 rounded-lg border transition-all duration-150 ${
                isChecked
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border hover:border-primary/20 hover:bg-muted/40'
              }`}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggle(opt)}
              />
              <IconComp className={`h-4 w-4 shrink-0 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm leading-tight ${isChecked ? 'text-foreground font-medium' : 'text-foreground'}`}>
                {opt}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
