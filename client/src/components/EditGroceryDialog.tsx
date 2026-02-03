import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GroceryItem } from "@/lib/store";

interface EditGroceryDialogProps {
  item: GroceryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<GroceryItem>) => void;
}

const UNITS = [
  { value: "", label: "- Ingen -" },
  { value: "st", label: "st (styck)" },
  { value: "pkt", label: "pkt (paket)" },
  { value: "kg", label: "kg (kilogram)" },
  { value: "g", label: "g (gram)" },
  { value: "l", label: "l (liter)" },
  { value: "dl", label: "dl (deciliter)" },
  { value: "ml", label: "ml (milliliter)" },
  { value: "msk", label: "msk (matsked)" },
  { value: "tsk", label: "tsk (tesked)" },
  { value: "krm", label: "krm (kryddmått)" },
];

const CATEGORIES = [
  { value: "produce", label: "Frukt & Grönt" },
  { value: "meat", label: "Kött & Fisk" },
  { value: "dairy", label: "Mejeri" },
  { value: "pantry", label: "Skafferi" },
  { value: "frozen", label: "Fryst" },
  { value: "bakery", label: "Bröd & Bakverk" },
  { value: "beverages", label: "Drycker" },
  { value: "snacks", label: "Snacks" },
  { value: "other", label: "Övrigt" },
];

export function EditGroceryDialog({ item, open, onOpenChange, onSave }: EditGroceryDialogProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("other");

  // Reset form when dialog opens with new item
  useEffect(() => {
    if (open && item) {
      console.log('EditGroceryDialog: Opening with item:', item);
      setName(item.name || "");
      setQuantity(item.quantity?.toString() || "1");
      setUnit(item.unit || "");
      setCategory(item.category || "other");
    }
  }, [open, item]);

  const handleSave = () => {
    if (!item) return;
    
    onSave({
      name,
      quantity: parseFloat(quantity) || 1,
      unit,
      category,
    });
    
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Redigera ingrediens</DialogTitle>
          <DialogDescription>
            Ändra kvantitet, enhet eller namn på ingrediensen.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Namn
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Antal
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">
              Enhet
            </Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Välj enhet" />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Kategori
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Välj kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave}>
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditGroceryDialog;
