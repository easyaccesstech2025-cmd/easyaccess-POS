"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const DropdownContext = React.createContext<{ 
  isOpen: boolean; 
  setIsOpen: (val: boolean) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
}>({
  isOpen: false,
  setIsOpen: () => {},
  triggerRef: { current: null },
});

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, triggerRef: dropdownRef }}>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ asChild, children }: any) {
  const { isOpen, setIsOpen } = React.useContext(DropdownContext);
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
        const child = children as React.ReactElement<any>;
        if (child.props && child.props.onClick) child.props.onClick(e);
      },
    });
  }
  return <div onClick={() => setIsOpen(!isOpen)}>{children}</div>;
}

export function DropdownMenuContent({ children, className, align = "left", widthClass = "w-56" }: any) {
  const { isOpen, setIsOpen, triggerRef } = React.useContext(DropdownContext);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setCoords({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
          });
        }
      };

      updatePosition();
      
      // Update on scroll (use capture phase to catch all scrolls)
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen, triggerRef]);

  React.useEffect(() => {
    if (!isOpen) return;
    
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Close if click is outside both the trigger and the portal content
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        contentRef.current && !contentRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen, triggerRef]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      ref={contentRef}
      className={cn(
        "absolute z-[9999] mt-2 origin-top rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none", 
        widthClass,
        className
      )}
      style={{
        top: coords.top,
        ...(align === "end" 
          ? { right: document.documentElement.clientWidth - (coords.left + coords.width) } 
          : { left: coords.left }
        )
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        {children}
      </div>
    </div>,
    document.body
  );
}

export function DropdownMenuItem({ children, onClick, className, disabled }: any) {
  const { setIsOpen } = React.useContext(DropdownContext);
  return (
    <button
      type="button"
      onClick={(e) => {
        if (disabled) return;
        if (onClick) onClick(e);
        setIsOpen(false);
      }}
      disabled={disabled}
      className={cn(
        "flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator({ className, ...props }: any) {
  return <div className={cn("h-px bg-gray-100 my-1", className)} {...props} />;
}
