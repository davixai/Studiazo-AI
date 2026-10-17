/** Tranziție între pagini: șablonul se montează din nou la fiecare navigare, deci conținutul intră lin. */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
