import Link from "next/link";

export const metadata = {
  title: "EcoPro BM Hungary | Pannon Transfer",
  description: "EcoPro BM Hungary dedikált partnerportál.",
};

export default function EcoproPortalPage() {
  return (
    <section className="min-h-screen bg-[#061A3A] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,180,216,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(242,140,40,0.18),transparent_30%),linear-gradient(180deg,#07142F_0%,#0B1F47_100%)]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-white/10 backdrop-blur-xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
          <div className="p-8 sm:p-12">
            <div className="inline-flex items-center gap-2 bg-white rounded-[1.5rem] px-6 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] mb-10">
              <span className="text-[2rem] font-black tracking-tight text-[#0096D6]">EcoPro</span>
              <span className="text-lg font-extrabold tracking-tight text-[#F28C28]">BM Hungary</span>
            </div>

            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/20 bg-sky-300/10 px-4 py-2 text-[11px] font-black tracking-[0.25em] uppercase text-sky-100 mb-6">
                Dedikált partnerportál
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                EcoPro vállalati hozzáférés
              </h1>
              <p className="text-lg text-sky-50/90 leading-relaxed mb-8">
                Az EcoPro BM Hungary külön portálja és meghívási folyamata most már külön kezelhető az adminban. A vizuális portáloldal elkészült, az aktiválási link ide tér vissza.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/admin"
                  className="h-12 px-6 rounded-2xl bg-white text-[#0B1F47] text-sm font-black tracking-widest uppercase inline-flex items-center justify-center"
                >
                  Vissza az adminhoz
                </Link>
                <Link
                  href="/admin"
                  className="h-12 px-6 rounded-2xl border border-white/20 bg-white/5 text-white text-sm font-black tracking-widest uppercase inline-flex items-center justify-center"
                >
                  Meghívók kezelése
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
