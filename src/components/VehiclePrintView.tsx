import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import logoImg from "@/assets/logo.png";

interface VehiclePrintViewProps {
  vehicle: Record<string, any>;
  agentName: string;
}

const STATUS_LABELS: Record<string, string> = {
  available: "זמין", sold: "נמכר", reserved: "שמור", in_treatment: "בטיפול",
};
const DEAL_LABELS: Record<string, string> = {
  regular_sale: "מכירה רגילה", brokerage: "תיווך",
};

const fmt = (val: any) => (val == null || val === "" ? "—" : val);
const fmtPrice = (val: any) => (val == null ? "—" : `₪${Number(val).toLocaleString("he-IL")}`);
const fmtBool = (val: any) => (val == null ? "—" : val ? "כן" : "לא");

export default function VehiclePrintView({ vehicle, agentName }: VehiclePrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8" />
        <title>כרטיס רכב — ${vehicle.manufacturer ?? ""} ${vehicle.model ?? ""}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Heebo', Arial, sans-serif;
            direction: rtl;
            color: #1a1a1a;
            background: #fff;
            font-size: 13px;
          }
          .page { max-width: 800px; margin: 0 auto; padding: 28px 32px; }
          /* Header */
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #c9a84c;
            padding-bottom: 18px;
            margin-bottom: 22px;
          }
          .header img { height: 64px; object-fit: contain; }
          .header-info { text-align: left; }
          .header-info .title { font-size: 18px; font-weight: 600; color: #1a1a1a; }
          .header-info .subtitle { font-size: 12px; color: #6b6b6b; margin-top: 3px; }
          .header-info .plate {
            display: inline-block;
            margin-top: 6px;
            font-size: 14px;
            font-weight: 600;
            border: 2px solid #c9a84c;
            border-radius: 6px;
            padding: 2px 10px;
            color: #c9a84c;
            direction: ltr;
          }
          /* Sections */
          .section { margin-bottom: 20px; }
          .section-title {
            font-size: 12px;
            font-weight: 600;
            color: #c9a84c;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border-bottom: 1px solid #e8e0cd;
            padding-bottom: 5px;
            margin-bottom: 12px;
          }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px 14px; }
          .field { }
          .field .label { font-size: 10px; color: #888; margin-bottom: 2px; }
          .field .value { font-size: 13px; font-weight: 500; color: #1a1a1a; }
          /* Price box */
          .price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
          .price-box {
            border: 1px solid #e0d9cc;
            border-radius: 8px;
            padding: 10px 14px;
            text-align: center;
          }
          .price-box.accent { border-color: #c9a84c; background: #fdf9f0; }
          .price-box .plabel { font-size: 10px; color: #888; margin-bottom: 3px; }
          .price-box .pvalue { font-size: 16px; font-weight: 600; color: #1a1a1a; }
          .price-box.accent .pvalue { color: #c9a84c; }
          /* Notes */
          .notes-box {
            border: 1px solid #e8e0cd;
            border-radius: 6px;
            padding: 10px 14px;
            font-size: 13px;
            color: #444;
            min-height: 50px;
            white-space: pre-wrap;
          }
          /* Footer */
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #e8e0cd;
            padding-top: 14px;
            margin-top: 24px;
            font-size: 11px;
            color: #888;
          }
          .footer .agent { font-weight: 600; color: #1a1a1a; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { padding: 16px 20px; }
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const asking = vehicle.asking_price ?? 0;
  const expenses = 0; // loaded separately; passed via props if needed
  const cost = (vehicle.purchase_price ?? 0) + (vehicle.registration_fee ?? 0);
  const gross = asking - cost;

  const printDate = new Date().toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      {/* Print trigger button */}
      <Button type="button" variant="outline" size="sm" onClick={handlePrint}
        className="gap-2 font-polin-light text-sm h-9 border-border hover:bg-muted">
        <Printer className="h-4 w-4" />
        הדפס PDF
      </Button>

      {/* Hidden printable content */}
      <div className="hidden">
        <div ref={printRef}>
          <div className="page">
            {/* Header */}
            <div className="header">
              <img src={logoImg} alt="לוגו" />
              <div className="header-info">
                <div className="title">{fmt(vehicle.manufacturer)} {fmt(vehicle.model)}</div>
                <div className="subtitle">{fmt(vehicle.trim_level)} • {fmt(vehicle.year)}</div>
                {vehicle.license_plate && <div className="plate">{vehicle.license_plate}</div>}
              </div>
            </div>

            {/* Identity */}
            <div className="section">
              <div className="section-title">פרטי זיהוי</div>
              <div className="grid">
                <div className="field"><div className="label">לוחית רישוי</div><div className="value">{fmt(vehicle.license_plate)}</div></div>
                <div className="field"><div className="label">מספר שלדה</div><div className="value">{fmt(vehicle.chassis_number)}</div></div>
                <div className="field"><div className="label">מספר מנוע</div><div className="value">{fmt(vehicle.engine_number)}</div></div>
                <div className="field"><div className="label">קוד דגם</div><div className="value">{fmt(vehicle.model_code)}</div></div>
              </div>
            </div>

            {/* Specs */}
            <div className="section">
              <div className="section-title">מפרט טכני</div>
              <div className="grid">
                <div className="field"><div className="label">שנה</div><div className="value">{fmt(vehicle.year)}</div></div>
                <div className="field"><div className="label">צבע</div><div className="value">{fmt(vehicle.color)}</div></div>
                <div className="field"><div className="label">סוג מנוע</div><div className="value">{fmt(vehicle.engine_type)}</div></div>
                <div className="field"><div className="label">נפח מנוע</div><div className="value">{fmt(vehicle.engine_volume)}</div></div>
                <div className="field"><div className="label">כוח סוס</div><div className="value">{fmt(vehicle.horsepower)}</div></div>
                <div className="field"><div className="label">תיבת הילוכים</div><div className="value">{fmt(vehicle.transmission)}</div></div>
                <div className="field"><div className="label">ק"מ</div><div className="value">{vehicle.odometer ? Number(vehicle.odometer).toLocaleString() : "—"}</div></div>
                <div className="field"><div className="label">יד</div><div className="value">{fmt(vehicle.hand)}</div></div>
                <div className="field"><div className="label">מושבים</div><div className="value">{fmt(vehicle.seats)}</div></div>
                <div className="field"><div className="label">דלתות</div><div className="value">{fmt(vehicle.doors)}</div></div>
                <div className="field"><div className="label">סוג רכב</div><div className="value">{fmt(vehicle.vehicle_type)}</div></div>
                <div className="field"><div className="label">תאריך טסט</div><div className="value">{fmt(vehicle.test_date)}</div></div>
                <div className="field"><div className="label">מקורי</div><div className="value">{fmtBool(vehicle.is_original)}</div></div>
                <div className="field"><div className="label">עצור</div><div className="value">{fmtBool(vehicle.is_pledged)}</div></div>
                <div className="field"><div className="label">סטטוס</div><div className="value">{STATUS_LABELS[vehicle.status] ?? fmt(vehicle.status)}</div></div>
                <div className="field"><div className="label">סוג עסקה</div><div className="value">{DEAL_LABELS[vehicle.deal_type] ?? fmt(vehicle.deal_type)}</div></div>
              </div>
            </div>

            {/* Prices */}
            <div className="section">
              <div className="section-title">מחירים</div>
              <div className="price-grid">
                <div className="price-box accent">
                  <div className="plabel">מחיר מבוקש</div>
                  <div className="pvalue">{fmtPrice(vehicle.asking_price)}</div>
                </div>
                <div className="price-box">
                  <div className="plabel">מחיר מחירון</div>
                  <div className="pvalue">{fmtPrice(vehicle.list_price)}</div>
                </div>
                <div className="price-box">
                  <div className="plabel">מחירון משוקלל</div>
                  <div className="pvalue">{fmtPrice(vehicle.weighted_list_price)}</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {vehicle.notes && (
              <div className="section">
                <div className="section-title">הערות</div>
                <div className="notes-box">{vehicle.notes}</div>
              </div>
            )}

            {/* Footer */}
            <div className="footer">
              <div>תאריך הדפסה: {printDate}</div>
              <div>הודפס ע"י: <span className="agent">{agentName || "—"}</span></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
