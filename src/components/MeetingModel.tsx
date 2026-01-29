import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface ModelProp {
  isOpen: boolean;
  onClose: () => void;
  handleClick?: () => void;
  title: string;
  className?: string;
  buttonText?: string;
  children?: React.ReactNode;
  image?: string;
  buttonIcon?: string;
}

const MeetingModel = ({
  isOpen,
  onClose,
  title,
  className,
  buttonText,
  children,
  image,
  handleClick,
  buttonIcon,
}: ModelProp) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex w-full max-w-[520px] flex-col gap-6 border border-orbit-border bg-orbit-panel px-6 py-8 text-orbit-text shadow-lg">
        <div className="flex flex-col gap-6 ">
          {image && (
            <div className="flex justify-center">
              <Image src={image} alt="image" width={72} height={72} />
            </div>
          )}
          <h1 className={cn('text-2xl font-semibold leading-[34px]', className)}>
            {' '}
            {title}
          </h1>
          {children}
          <Button
            className="bg-orbit-brand text-white focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={handleClick}
          >
            {buttonIcon && (
              <Image src={buttonIcon} alt="icon" width={13} height={13} />
            )}
            &nbsp;
            {buttonText || 'Schedule Meeting'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingModel;
