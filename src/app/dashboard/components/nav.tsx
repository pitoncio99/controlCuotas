'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
} from '@/components/ui/sidebar';
import {
  LayoutGrid,
  CreditCard,
  Users,
  Receipt,
  ShoppingCart,
  Wallet,
  AreaChart,
} from 'lucide-react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/dashboard/purchases', label: 'Compras', icon: Receipt },
  { href: '/dashboard/cards', label: 'Tarjetas', icon: CreditCard },
  { href: '/dashboard/people', label: 'Personas', icon: Users },
  { href: '/dashboard/expenses', label: 'Gastos', icon: ShoppingCart },
  { href: '/dashboard/system', label: 'Sistema', icon: AreaChart },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Wallet className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-headline font-semibold">CuotaControl</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map(({ href, label, icon: Icon }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === href}
                tooltip={label}
              >
                <Link href={href}>
                  <Icon />
                  <span>{label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
