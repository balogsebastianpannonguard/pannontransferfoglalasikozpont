import Link from "next/link";

export const metadata = {
  title: "Krones | Pannon Transfer",
  description: "Krones dedikált partnerportál.",
};

export default function KronesPortalPage() {
  return (
    <section className="min-h-screen bg-[#001a36] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,63,138,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(0,46,95,0.18),transparent_30%),linear-gradient(180deg,#000f1f_0%,#001a36_100%)]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-white/10 backdrop-blur-xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
          <div className="p-8 sm:p-12">
            <div className="inline-flex items-center gap-2 bg-white rounded-[1.5rem] px-6 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] mb-10">
              <span className="text-[2rem] font-black tracking-tight text-[#003F8A]">Krones</span>
              <span className="text-lg font-extrabold tracking-tight text-[#002E5F]">Group</span>
            </div>

            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/20 bg-blue-300/10 px-4 py-2 text-[11px] font-black tracking-[0.25em] uppercase text-blue-100 mb-6">
                Dedikált partnerportál
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                Krones vállalati hozzáférés
              </h1>
              <p className="text-lg text-blue-50/90 leading-relaxed mb-8">
                A Krones dedikált portálja mostmár külön kezelhető az adminban. A meghívási folyamat és az árstruktúra teljes mértékben testreszabott.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/admin"
                  className="h-12 px-6 rounded-2xl bg-white text-[#001a36] text-sm font-black tracking-widest uppercase inline-flex items-center justify-center"
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
