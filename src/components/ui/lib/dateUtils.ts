import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// date formating
export const formatDate = (date: Date | string): string => {
  if (!date) return ''; 

  const d = new Date(date); 

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0'); 
  const year = d.getFullYear();

  return `${day}-${month}-${year}`; 
};
