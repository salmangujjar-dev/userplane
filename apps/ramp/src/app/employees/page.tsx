'use client';

import BoringAvatar from 'boring-avatars';
import { SearchIcon, UsersIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardPanel } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmployees } from '@/hooks/useEmployees';
import { useExpenses } from '@/hooks/useExpenses';
import { formatCurrency } from '@/lib/utils';

const AVATAR_COLORS = ['#1F1F1F', '#E4F222', '#737373', '#A3A3A3', '#D4D4D4'];

const departments = ['All', 'Engineering', 'Sales', 'Marketing', 'Operations', 'Finance', 'HR'];

export default function EmployeesPage() {
  const router = useRouter();
  const { employees, isLoading: empLoading } = useEmployees();
  const { expenses, isLoading: expLoading } = useExpenses();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');

  const isLoading = empLoading || expLoading;

  const enrichedEmployees = useMemo(() => {
    return employees.map((emp) => {
      const empExpenses = expenses.filter((e) => e.employeeId === emp.id);
      const totalSpend = empExpenses
        .filter((e) => e.status === 'approved')
        .reduce((sum, e) => sum + e.amount, 0);
      const pendingCount = empExpenses.filter((e) => e.status === 'pending').length;
      return { ...emp, totalSpend, pendingCount };
    });
  }, [employees, expenses]);

  const filtered = useMemo(() => {
    let result = enrichedEmployees;
    if (department !== 'All') {
      result = result.filter((e) => e.department === department);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q)
      );
    }
    return result;
  }, [enrichedEmployees, department, search]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
            className="pl-9"
          />
        </div>
        <Select value={department} onValueChange={(val) => setDepartment(val as string)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Departments">
              {() => (department === 'All' ? 'All Departments' : department)}
            </SelectValue>
          </SelectTrigger>
          <SelectPopup>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept === 'All' ? 'All Departments' : dept}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No employees found</EmptyTitle>
            <EmptyDescription>Try adjusting your search or filter.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((emp) => (
            <Card
              key={emp.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/expenses?employeeId=${emp.id}`)}
              role="button"
              tabIndex={0}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <BoringAvatar size={40} name={emp.name} variant="beam" colors={AVATAR_COLORS} />
                  <div className="min-w-0 flex-1">
                    <p className="employee-name font-semibold text-sm truncate">{emp.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{emp.position}</p>
                  </div>
                  <Badge variant="secondary" size="sm">
                    {emp.department}
                  </Badge>
                </div>
              </CardHeader>
              <CardPanel>
                <div className="space-y-2 text-sm">
                  <p className="employee-email text-muted-foreground truncate">{emp.email}</p>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Spend</p>
                      <p className="expense-amount font-medium">{formatCurrency(emp.totalSpend)}</p>
                    </div>
                    {emp.pendingCount > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Pending</p>
                        <Badge variant="warning" size="sm">
                          {emp.pendingCount}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardPanel>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
