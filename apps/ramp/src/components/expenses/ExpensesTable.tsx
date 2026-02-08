'use client';

import Avatar from 'boring-avatars';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PaperclipIcon,
  PencilIcon,
  XIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Menu, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ExpenseWithRelations } from '@/lib/data/types';
import { formatCurrency, formatDate } from '@/lib/utils';

import { ExpenseStatusBadge } from './ExpenseStatusBadge';

const AVATAR_COLORS = ['#1F1F1F', '#E4F222', '#737373', '#A3A3A3', '#D4D4D4'];

type SortField = 'date' | 'amount' | 'employee' | 'category' | 'status';
type SortDirection = 'asc' | 'desc';

interface ExpensesTableProps {
  expenses: ExpenseWithRelations[];
  sortField: SortField;
  sortDir: SortDirection;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onSort: (field: SortField) => void;
  onPageChange: (page: number) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (expense: ExpenseWithRelations) => void;
}

export function ExpensesTable({
  expenses,
  sortField,
  sortDir,
  page,
  pageSize,
  total,
  totalPages,
  onSort,
  onPageChange,
  onApprove,
  onReject,
  onEdit,
}: ExpensesTableProps) {
  const router = useRouter();

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ArrowUpIcon className="inline size-3" />
    ) : (
      <ArrowDownIcon className="inline size-3" />
    );
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer select-none" onClick={() => onSort('date')}>
              Date {renderSortIcon('date')}
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => onSort('employee')}>
              Employee {renderSortIcon('employee')}
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => onSort('category')}>
              Category {renderSortIcon('category')}
            </TableHead>
            <TableHead className="hidden sm:table-cell">Description</TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
              onClick={() => onSort('amount')}
            >
              Amount {renderSortIcon('amount')}
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => onSort('status')}>
              Status {renderSortIcon('status')}
            </TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow
              key={expense.id}
              className="cursor-pointer"
              onClick={() => router.push(`/expenses/${expense.id}`)}
            >
              <TableCell className="text-muted-foreground">{formatDate(expense.date)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar
                    size={24}
                    name={expense.employee?.name ?? '?'}
                    variant="beam"
                    colors={AVATAR_COLORS}
                  />
                  <span className="truncate max-w-[120px]">{expense.employee?.name}</span>
                </div>
              </TableCell>
              <TableCell>{expense.category?.name}</TableCell>
              <TableCell className="hidden max-w-[200px] sm:table-cell text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  {expense.receiptUrl && (
                    <PaperclipIcon className="size-3 shrink-0 text-muted-foreground/60" />
                  )}
                  <span className="truncate">{expense.description}</span>
                </span>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(expense.amount)}
              </TableCell>
              <TableCell>
                <ExpenseStatusBadge status={expense.status} />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Menu>
                  <MenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
                    <MoreHorizontalIcon />
                  </MenuTrigger>
                  <MenuPopup align="end">
                    <MenuItem onClick={() => router.push(`/expenses/${expense.id}`)}>
                      <EyeIcon /> View
                    </MenuItem>
                    <MenuItem onClick={() => onEdit(expense)}>
                      <PencilIcon /> Edit
                    </MenuItem>
                    {expense.status === 'pending' && (
                      <>
                        <MenuItem onClick={() => onApprove(expense.id)}>
                          <CheckIcon /> Approve
                        </MenuItem>
                        <MenuItem onClick={() => onReject(expense.id)}>
                          <XIcon /> Reject
                        </MenuItem>
                      </>
                    )}
                  </MenuPopup>
                </Menu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
