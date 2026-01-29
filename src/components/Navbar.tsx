'use client';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import MobileNav from './MobileNav';
import { SignedIn, UserButton } from '@clerk/nextjs';
import { navLinks } from '@/constants';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-between fixed z-50 w-full border-b border-orbit-border bg-orbit-panel/90 px-6 py-3 backdrop-blur lg:px-10">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icons/logo.svg"
            alt="Orbit"
            width={28}
            height={28}
            className="max-sm:size-9"
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
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.route;
            return (
              <Link
                key={link.route}
                href={link.route}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-orbit-surface text-orbit-text'
                    : 'text-orbit-muted hover:bg-orbit-surface hover:text-orbit-text'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <SignedIn>
          <UserButton />
        </SignedIn>
        <MobileNav />
      </div>
    </nav>
  );
};

export default Navbar;
