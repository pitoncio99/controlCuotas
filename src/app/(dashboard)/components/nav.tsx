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
  PiggyBank,
  ShoppingCart,
  Wallet,
} from 'lucide-react';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutGrid },
  { href: '/purchases', label: 'Compras', icon: Receipt },
  { href: '/cards', label: 'Tarjetas', icon: CreditCard },
  { href: '/people', label: 'Personas', icon: Users },
  { href: '/expenses', label: 'Gastos', icon: ShoppingCart },
  { href: '/budget', label: 'Presupuesto', icon: PiggyBank },
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
