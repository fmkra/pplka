"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { api } from "~/trpc/react";
import { Spinner } from "~/components/ui/spinner";
import { conjugate } from "~/lib/utils";

interface LicenseFilterProps {
  selectedLicenses: number[];
  onLicensesChange: (licenses: number[]) => void;
}

export function LicenseFilter({
  selectedLicenses,
  onLicensesChange,
}: LicenseFilterProps) {
  const [open, setOpen] = useState(false);

  const { data: licenses, isLoading } =
    api.questionDatabase.getLicenses.useQuery();

  const handleLicenseToggle = (licenseId: number) => {
    const newSelected = selectedLicenses.includes(licenseId)
      ? selectedLicenses.filter((id) => id !== licenseId)
      : [...selectedLicenses, licenseId];
    onLicensesChange(newSelected);
  };

  const handleSelectAll = () => {
    if (licenses) {
      onLicensesChange(licenses.map((license) => license.id));
    }
  };

  const handleClearAll = () => {
    onLicensesChange([]);
  };

  const selectedCount = selectedLicenses.length;
  const totalCount = licenses?.length ?? 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between">
          <span>
            {selectedCount == 0 || selectedCount == totalCount
              ? "Wszystkie licencje"
              : selectedCount +
                " " +
                conjugate(selectedCount, "licencja", "licencje", "licencji")}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Filtruj według licencji</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Spinner size="sm" />
          </div>
        ) : (
          <>
            <DropdownMenuCheckboxItem
              checked={selectedCount === totalCount}
              onCheckedChange={() => {
                if (selectedCount === totalCount) {
                  handleClearAll();
                } else {
                  handleSelectAll();
                }
              }}
            >
              Wszystkie licencje
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />

            {licenses?.map((license) => (
              <DropdownMenuCheckboxItem
                key={license.id}
                checked={selectedLicenses.includes(license.id)}
                onCheckedChange={() => handleLicenseToggle(license.id)}
                className="flex items-center gap-2"
              >
                {license.name}
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
