import { SignIn } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const SignInPage = () => {
  return (
    <main className="flex min-h-screen w-full bg-orbit-surface">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 flex items-center gap-2">
          <Image src="/icons/logo.svg" alt="Orbit" width={40} height={40} />
          <div className="flex flex-col leading-none">
            <span className="text-2xl font-semibold text-orbit-text">Orbit</span>
            <span className="text-sm font-medium text-orbit-muted">Meet</span>
          </div>
        </div>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-orbit-text">
            Sign in to Orbit
          </h1>
          <p className="mt-2 text-sm text-orbit-muted">
            Start or join meetings in seconds
          </p>
        </div>
        <SignIn />
        <p className="mt-6 text-sm text-orbit-muted">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="font-medium text-orbit-brand hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
};

export default SignInPage;
