"use client";
import React from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { navLinks } from "@/constants";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

const MobileNav = () => {
  const pathname = usePathname();
  return (
    <section className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button className="rounded-full p-2 hover:bg-orbit-surface">
            <Menu className="h-6 w-6 text-orbit-text" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="border-none bg-orbit-panel">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icons/logo.svg"
              alt="Orbit"
              width={28}
              height={28}
            />
            <div className="flex flex-col leading-none">
              <span className="text-[18px] font-semibold text-orbit-text">
                Orbit
              </span>
              <span className="text-[11px] font-medium text-orbit-muted">
                Meet
              </span>
            </div>
          </Link>
          <div className="mt-8 flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.route;
              return (
                <SheetClose asChild key={link.route}>
                  <Link
                    href={link.route}
                    className={cn(
                      "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-orbit-surface text-orbit-text"
                        : "text-orbit-muted hover:bg-orbit-surface hover:text-orbit-text"
                    )}
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default MobileNav;
