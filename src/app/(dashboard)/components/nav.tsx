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
  { href: '/purchases', label: 'Purchases', icon: Receipt },
  { href: '/cards', label: 'Cards', icon: CreditCard },
  { href: '/people', label: 'People', icon: Users },
  { href: '/expenses', label: 'Expenses', icon: ShoppingCart },
  { href: '/budget', label: 'Budget', icon: PiggyBank },
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
              <Link href={href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === href}
                  tooltip={label}
                >
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
