"use client";

import { createContext, useContext } from "react";

export type LicenseContextType = {
  name: string;
  id: number;
  description: string | null;
  url: string;
  icon: string | null;
};

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseContextProvider = ({
  children,
  license,
}: {
  license: LicenseContextType;
  children: React.ReactNode;
}) => {
  return (
    <LicenseContext.Provider value={license}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicenseContext = () => {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error(
      "useLicenseContext must be used within a LicenseContextProvider",
    );
  }
  return context;
};
