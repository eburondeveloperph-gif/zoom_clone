import React from 'react';

const Loader = () => {
  return (
    <div className="flex-center h-screen w-full bg-orbit-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orbit-brand border-t-transparent" />
        <p className="text-sm font-medium text-orbit-muted">Loading...</p>
      </div>
    </div>
  );
};

export default Loader;
