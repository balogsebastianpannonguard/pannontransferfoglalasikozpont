import Link from "next/link";

export const metadata = {
  title: "Schaeffler | Pannon Transfer",
  description: "Schaeffler dedikált partnerportál.",
};

export default function SchaefflerPortalPage() {
  return (
    <section className="min-h-screen bg-[#0a3d2a] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,154,68,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(0,115,53,0.18),transparent_30%),linear-gradient(180deg,#072d1f_0%,#0a3d2a_100%)]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-white/10 backdrop-blur-xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
          <div className="p-8 sm:p-12">
            <div className="inline-flex items-center gap-2 bg-white rounded-[1.5rem] px-6 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] mb-10">
              <span className="text-[2rem] font-black tracking-tight text-[#009A44]">Schaeffler</span>
              <span className="text-lg font-extrabold tracking-tight text-[#007335]">Partner</span>
            </div>

            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-200/20 bg-green-300/10 px-4 py-2 text-[11px] font-black tracking-[0.25em] uppercase text-green-100 mb-6">
                Dedikált partnerportál
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                Schaeffler vállalati hozzáférés
              </h1>
              <p className="text-lg text-green-50/90 leading-relaxed mb-8">
                A Schaeffler dedikált portálja és meghívási folyamata most már külön kezelhető az adminban. A vizuális portáloldal elkészült, az aktiválási link ide tér vissza.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/admin"
                  className="h-12 px-6 rounded-2xl bg-white text-[#0a3d2a] text-sm font-black tracking-widest uppercase inline-flex items-center justify-center"
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
