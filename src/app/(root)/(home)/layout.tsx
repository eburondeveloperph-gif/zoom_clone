import Navbar from "@/components/Navbar";
import React, { ReactNode } from "react";

const HomeLayout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="relative min-h-screen bg-orbit-surface text-orbit-text">
      <Navbar />
      <section className="flex min-h-screen flex-1 flex-col px-6 pb-10 pt-28 sm:px-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </section>
    </main>
  );
};

export default HomeLayout;
