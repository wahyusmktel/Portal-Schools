import { API_URL, getSchoolProfile } from "@/lib/api";
import { EmployeeShowcase } from "@/components/EmployeeShowcase";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function EmployeePage() {
  const res = await fetch(`${API_URL}/employees`, {
    next: { revalidate: 60 }
  });
  
  const [profile, employeesData] = await Promise.all([
    getSchoolProfile(),
    res.ok ? res.json() : Promise.resolve([])
  ]);
  
  return (
    <>
      <Header logoUrl={profile.headerLogo} />
      <main className="min-h-screen pt-20">
        <EmployeeShowcase employees={employeesData || []} />
      </main>
      <Footer profile={profile} />
    </>
  );
}
