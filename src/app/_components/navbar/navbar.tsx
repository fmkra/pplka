import Navigation from "./navigation";
import NavbarUser from "./user";
import { getLicenses } from "~/app/_queries/cached";

export default async function Navbar() {
  const licenseList = await getLicenses();

  const options = licenseList.map((license) => ({
    value: license.url,
    label: license.name,
  }));

  return (
    <nav className="relative border-b">
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 absolute inset-0 -z-10 backdrop-blur" />
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Navigation options={options} />
          <NavbarUser />
        </div>
      </div>
    </nav>
  );
}
