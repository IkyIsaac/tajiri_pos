"use client";

import { IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";
import type { Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";

type NavItem = {
  title: string;
  url: string;
  icon?: Icon;
  items?: { title: string; url: string }[];
};

function CollapsibleSection({ 
  children, 
  isOpen 
}: { 
  children: React.ReactNode; 
  isOpen: boolean 
}) {
  return (
    <div
      className={`overflow-hidden transition-all duration-200 ${
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

export function NavMain({ items }: { items: NavItem[] }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const router = useRouter();

  const toggleMenu = (title: string) => {
    setOpenMenu((prev) => (prev === title ? null : title));
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => (item.items ? toggleMenu(item.title) : router.push(item.url))}
                className="flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  {item.icon && <item.icon className="size-4" />}
                  <span>{item.title}</span>
                </div>

                {item.items && (
                  <IconChevronDown
                    className={`size-4 transition-transform ${
                      openMenu === item.title ? "rotate-180" : ""
                    }`}
                  />
                )}
              </SidebarMenuButton>

              {item.items && (
                <CollapsibleSection isOpen={openMenu === item.title}>
                  <div className="ml-6 mt-1 flex flex-col gap-1">
                    {item.items.map((sub) => (
                      <button
                        key={sub.title}
                        onClick={() => router.push(sub.url)}
                        className="text-sm text-muted-foreground hover:text-foreground transition px-2 py-1 rounded hover:bg-accent text-left"
                      >
                        {sub.title}
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}